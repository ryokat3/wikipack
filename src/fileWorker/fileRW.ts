import { DirHandleSrcType, FileHandleSrcType, FileSrcHandler, BinaryFileSrcType, FileSrcData, TextFileSrcType } from "../tree/WikiFile"
import { splitPath } from "../utils/appUtils"

export async function getHandleMap(dirHandle:FileSystemDirectoryHandle):Promise<{ [name:string]:FileSystemHandle }> {
    let result = Object.create(null)
    for await (const [name, handle] of dirHandle.entries()) {
        result = {
            ...result,
            [name]:handle
        }
    }
    return result
}

export async function getHandle(dirHandle:FileSystemDirectoryHandle, pathName:string[]|string):Promise<FileSystemHandle|undefined> {
    if (typeof pathName === 'string') {
        return getHandle(dirHandle, splitPath(pathName))        
    }
    else {
        
        for await (const [name, handle] of dirHandle.entries()) {
            if (name === pathName[0]) {
                if (pathName.length == 1) {
                    return handle
                }
                else if (handle.kind == "directory") {
                    if (pathName.length > 1) {
                        return getHandle(handle, pathName.slice(1))
                    }
                }
                return undefined
            }
        }
        return undefined
    }
}

export async function collectFiles(dirHandle:FileSystemDirectoryHandle, pred:(fileName:string)=>boolean) {
    
    const result = Object.create(null) as { [name:string]: FileSystemFileHandle }
    for await (const [name, handle] of dirHandle.entries()) {
        if (pred(name) && isFileHandle(handle)) {
            result[name] = handle
        }
        else if (isDirectoryHandle(handle)) {
            Object.entries((await collectFiles(handle, pred))).forEach(([name1, handle1])=>{
                result[splitPath(name + "/" + name1).join("/")] = handle1
            })
        }
    }
    return result
}

export function isFileHandle(handle:FileSystemHandle):handle is FileSystemFileHandle {
    return handle.kind === "file"
}

export function isDirectoryHandle(handle:FileSystemHandle):handle is FileSystemDirectoryHandle {
    return handle.kind === "directory"
}

export function getFileStamp(blob:File):string {
    return `lastModified=${blob.lastModified}:size=${blob.size}`
}

export class WikiFileHandlerForFileHandle implements FileSrcHandler {
    readonly fileSrc:FileHandleSrcType
    private blob:File|undefined

    constructor(extFile:FileHandleSrcType) {        
        this.fileSrc = extFile
        this.blob = undefined
    }

    async getBlob():Promise<File> {        
        if (this.blob === undefined) {
            this.blob = await this.fileSrc.fileHandle.getFile()
        }
        return this.blob
    }

    async getFileData():Promise<FileSrcData> {
        const blob = await this.getBlob()
        return {
            fileSrc: this.fileSrc,            
            fileStamp: getFileStamp(blob),
            mime: blob.type            
        }
    }

    async getTextFile():Promise<TextFileSrcType|undefined> {
        
        return await new Promise<TextFileSrcType|undefined>(async (resolve) => {
            const blob = await this.getBlob()
            const reader = new FileReader()
        
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {                    
                    resolve({
                        fileSrc: this.fileSrc,
                        fileStamp: getFileStamp(blob),
                        mime: blob.type,
                        data: e.target.result
                    })               
                }
                else {                    
                    resolve(undefined)
                }
            }
            reader.onerror = (_e: ProgressEvent<FileReader>) => {
                resolve(undefined)
            }                        
            reader.readAsText(blob, "utf-8")
        })        
    }

    async getBinaryFile():Promise<BinaryFileSrcType|undefined> {
        return await new Promise<BinaryFileSrcType|undefined>(async (resolve) => {
            const blob = await this.getBlob()
            
            const reader = new FileReader()
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'object')) {                
                    resolve({
                        fileSrc: this.fileSrc,
                        fileStamp: getFileStamp(blob),
                        mime: blob.type,
                        data: e.target.result
                    })                    
                }
                else {
                    resolve(undefined)
                }
            }
            reader.onerror = (_e: ProgressEvent<FileReader>) => {
                resolve(undefined)
            }  
            reader.readAsArrayBuffer(blob)        
        })
    }
}

export class WikiFileHandlerForDirHandle implements FileSrcHandler  {
    readonly fileSrc:DirHandleSrcType
    private fileHandleReader: WikiFileHandlerForFileHandle | undefined

    constructor(extFile:DirHandleSrcType) {        
        this.fileSrc = extFile
        this.fileHandleReader = undefined
    }

    private async getFileHandleReader():Promise<WikiFileHandlerForFileHandle|undefined> {        
        const handle = await getHandle(this.fileSrc.dirHandle, this.fileSrc.fileName)
        this.fileHandleReader = (handle !== undefined && isFileHandle(handle)) ? new WikiFileHandlerForFileHandle( {            
            type: "fileHandle",
            fileHandle: handle
         }) : undefined
        return this.fileHandleReader
    }

    async getFileData():Promise<FileSrcData|undefined> {
        return await (await this.getFileHandleReader())?.getFileData()
    }

    async getTextFile():Promise<TextFileSrcType|undefined> {
        return await (await this.getFileHandleReader())?.getTextFile()
    }

    async getBinaryFile():Promise<BinaryFileSrcType|undefined> {
        return await (await this.getFileHandleReader())?.getBinaryFile()
    }
}
