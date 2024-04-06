import { FileTreeFolderType } from "./FileTree"
import { ExtFileHandlerForUrl } from "../netWorker/netWorker"
import { ExtFileHandlerForFileHandle, ExtFileHandlerForDirHandle }  from "../fileWorker/fileRW"
import { getMarkdownLink }  from "../markdown/converter"
import { getDir } from "../utils/appUtils"

export type MarkdownLinkType = {
    imageList: string[],
    linkList: string[],
    markdownList: string[]

}

export type FileType = {
    markdown: {
        type: "markdown",
        markdown: string,
        fileStamp: string,
    } & MarkdownLinkType,
    css: {
        type: "css",
        css: string,
        fileStamp: string  
    },
    data: {
        type: "data",
        dataRef: string,
        buffer: ArrayBuffer | string,
        fileStamp: string,
        mime: string        
    }
}

export type DataFileType = FileType['data']
export type MarkdownFileType = FileType['markdown']
export type CssFileType = FileType['css']
export type WorkerDataFileType = Omit<Omit<DataFileType, 'dataRef'>, 'buffer'> & { buffer: ArrayBuffer}

export type FolderType = FileTreeFolderType<FileType>

/////////////////////////////////////////////////////////////////////////////////
// ExtFile
/////////////////////////////////////////////////////////////////////////////////

export type ExtFileType = {
    dirHandle: {
        type: "dirHandle"
        dirHandle: FileSystemDirectoryHandle
        fileName: string
    }
    fileHandle: {
        type: "fileHandle"
        fileHandle: FileSystemFileHandle
    }
    url: {
        type: "url"
        url: string
    }
}

////////////////////////////////////////////////////////////////////////////////
//                Success      Error
// ---------------------------------------
// init       =>  success      init
// error      =>  success      error
// success    =>  success      error
//
////////////////////////////////////////////////////////////////////////////////
export type ExtFileStatus = 'init' | 'success' | 'error'

export function updateExtFileStatus(status:ExtFileStatus, success:boolean):ExtFileStatus {
    switch (status) {
        case 'init':
            return (success) ? 'success' : 'init'
        case 'error':
        case 'success':
            return (success) ? 'success' : 'error'
    }
}

export type ExtFileData = {
    src: ExtFileType[keyof ExtFileType]
    fileStamp: string
    mime: string
}

export type ExtTextFileType = ExtFileData & {
    data: string
}

export type ExtBinaryFileType = ExtFileData & {
    data: ArrayBuffer
}

export type NO_UPDATE = 'NO_UPDATE'

export interface ExtFileHandler {
    getFileData(): Promise<ExtFileData | undefined>
    getTextFile(): Promise<ExtTextFileType | undefined>
    getBinaryFile(): Promise<ExtBinaryFileType | undefined>
}

export function getExtFileHandler(extFile: ExtFileType[keyof ExtFileType]) {
    switch (extFile.type) {
        case 'url':
            return new ExtFileHandlerForUrl(extFile)            
        case 'fileHandle':
            return new ExtFileHandlerForFileHandle(extFile)
        case 'dirHandle':
            return new ExtFileHandlerForDirHandle(extFile)
    }
}

export class ExtFileReader {

    readonly handler:ExtFileHandler

    constructor(handler:ExtFileHandler) {
        this.handler = handler
    }

    async readTextFile(fileStamp:string|undefined = undefined):Promise<ExtTextFileType|NO_UPDATE|undefined> {
        if (fileStamp !== undefined) {
            const fileData = await this.handler.getFileData()
            if (fileData === undefined) {
                return undefined
            }
            else if (fileData.fileStamp === fileStamp) {
                return 'NO_UPDATE'
            }
        }
        return await this.handler.getTextFile()
    }

    async readBinaryFile(fileStamp:string|undefined = undefined):Promise<ExtBinaryFileType|NO_UPDATE|undefined> {
        if (fileStamp !== undefined) {
            const fileData = await this.handler.getFileData()
            if (fileData === undefined) {
                return undefined
            }
            else if (fileData.fileStamp === fileStamp) {
                return 'NO_UPDATE'
            }
        }
        return await this.handler.getBinaryFile()
    }
}
export function isFileType<FT extends FileType[keyof FileType]>(target:FT|NO_UPDATE|undefined):target is FT {
    return (target !== undefined) && (target !== "NO_UPDATE")
}

export async function readMarkdownFile(handler:ExtFileHandler, fileName:string, fileStamp:string|undefined, isMarkdownFile:(fileName:string)=>boolean):Promise<MarkdownFileType|NO_UPDATE|undefined> {
    const reader = new ExtFileReader(handler)
    const markdown = await reader.readTextFile(fileStamp)

    if (markdown === undefined) {
        return undefined
    }
    else if (markdown == 'NO_UPDATE') {
        return 'NO_UPDATE'
    }
    else {
        const link = getMarkdownLink(markdown.data, getDir(fileName), isMarkdownFile)
        return {
            ...link,
            type: "markdown",
            markdown: markdown.data,
            fileStamp: markdown.fileStamp            
        }
    }
}







