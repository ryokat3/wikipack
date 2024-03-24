import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { getMarkdownFile} from "../markdown/converter"
import { collectFiles, getHandle, isFileHandle } from "./fileRW"
import { makeFileRegexChecker } from "../utils/appUtils"
import { getFileFromTree } from "../fileTree/FileTree"
import { FileStampFolderType } from "../fileTree/FileStampTree"

function getFileStamp(fp:File):string {
    return `lastModified=${fp.lastModified}:size=${fp.size}`
}

async function isFileUpdated(rootTagTree:FileStampFolderType, fileName:string, handle:FileSystemFileHandle):Promise<boolean> {
    const prev = getFileFromTree(rootTagTree, fileName)    
    if (prev === undefined) {
        return true
    }
    else if (prev.type === "folder") {
        return true
    }
    else {
        const current = await handle.getFile()
        return  getFileStamp(current) !== prev.fileStamp
    }
}

async function readMarkdownFile(handle: FileSystemFileHandle, isMarkdownFile:(fileName:string)=>boolean, fileName: string|undefined = undefined ): Promise<WorkerMessageType["updateMarkdownFile"]["response"]> {
    return await new Promise<WorkerMessageType["updateMarkdownFile"]["response"]>(async (resolve) => {
        const blob = await handle.getFile()

        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {
                const markdownFileName = (fileName !== undefined) ? fileName : blob.name
                const markdownFile = getMarkdownFile(e.target.result, markdownFileName, getFileStamp(blob), isMarkdownFile)
                resolve({
                    fileName: markdownFileName,
                    fileStamp: getFileStamp(blob),
                    markdownFile: markdownFile
                })                
            }
        }
        reader.readAsText(blob, "utf-8")
    })    
}

async function readCssFile(handle: FileSystemFileHandle, fileName: string|undefined = undefined ): Promise<WorkerMessageType["updateCssFile"]["response"]> {
    return await new Promise<WorkerMessageType["updateCssFile"]["response"]>(async (resolve) => {
        const blob = await handle.getFile()

        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {                
                const cssFileName = (fileName !== undefined) ? fileName : blob.name                                
                resolve({
                    fileName: cssFileName,
                    fileStamp: getFileStamp(blob),
                    data: e.target.result
                })                
            }
        }
        reader.readAsText(blob, "utf-8")
    })    
}

async function readDataFile(handle: FileSystemFileHandle, fileName: string): Promise<WorkerMessageType["updateDataFile"]["response"]> {
    return await new Promise<WorkerMessageType["updateDataFile"]["response"]>(async (resolve) => {
        const blob = await handle.getFile()         
        
        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'object')) {                
                resolve({
                    fileName: fileName,
                    fileStamp: getFileStamp(blob),
                    mime: blob.type,
                    data: e.target.result
                })
            }
        }
        reader.readAsArrayBuffer(blob)
    })
}

async function updateDataFileList(rootHandle:FileSystemDirectoryHandle, fileNameList:string[], rootTagTree:FileStampFolderType, postEvent:PostEvent<WorkerMessageType>) {
    for (const fileName of fileNameList) {
        const handle = await getHandle(rootHandle, fileName)
        if ((handle !== undefined) && isFileHandle(handle)) {
            const prev = getFileFromTree(rootTagTree, fileName)
            const current = await handle.getFile()
            if ((prev === undefined) || (prev.type === "folder") || (getFileStamp(current) !== prev.fileStamp)) {              
                const dataFile = await readDataFile(handle as FileSystemFileHandle, fileName)
                postEvent.send("updateDataFile", dataFile, [dataFile.data])
            }
        }
    }
}

////////////////////////////////////////////////////////////////////////
// Worker
////////////////////////////////////////////////////////////////////////

export async function openFileWorkerCallback(payload:WorkerMessageType['openFile']['request'], postEvent:PostEvent<WorkerMessageType>) {
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)
    const result = await readMarkdownFile(payload.handle, isMarkdownFile)
    postEvent.send("updateMarkdownFile", result)
}

export async function searchDirectoryWorkerCallback(payload:WorkerMessageType['searchDirectory']['request'], postEvent:PostEvent<WorkerMessageType>){                
    const rootHandle = payload.handle
    const rootTagTree = payload.tagTree    
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)
    const isCssFile = makeFileRegexChecker(payload.cssFileRegex)

    try {
        const dataFileList:Set<string> = new Set([])
        for (const [name, handle] of Object.entries(await collectFiles(rootHandle, isMarkdownFile))) {
            const result = await readMarkdownFile(handle, isMarkdownFile, name)
            if (await isFileUpdated(rootTagTree, name, handle)) {                
                postEvent.send("updateMarkdownFile", result)
            }
            result.markdownFile.imageList.forEach(dataFileList.add, dataFileList)
            result.markdownFile.linkList.forEach(dataFileList.add, dataFileList)
        }        
        await updateDataFileList(rootHandle, Array.from(dataFileList.values()), rootTagTree, postEvent)

        for (const [name, handle] of Object.entries(await collectFiles(rootHandle, isCssFile))) {            
            if (await isFileUpdated(rootTagTree, name, handle)) {                
                const result = await readCssFile(handle, name)
                postEvent.send("updateCssFile", result)
            }
        }
        /*
        for await (const fileName of deletedFileGenerator(rootHandle, rootFolder)) {
            deleteFileFromTree(rootFolder, fileName)
            postEvent.send("deleteFile", { fileName: fileName })
        }
        */
    }
    finally {
        postEvent.send("searchDirectoryDone", { handle: rootHandle })
    }
}