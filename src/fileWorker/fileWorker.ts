import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { getMarkdownFile} from "../markdown/converter"
import { collectFiles, getHandle, isFileHandle } from "./fileRW"
import { makeFileRegexChecker } from "../utils/appUtils"
import { getFileFromTree, updateFileOfTree } from "../fileTree/FileTree"
import { ScanTreeFolderType } from "../fileTree/ScanTree"

function getFileStamp(fp:File):string {
    return `lastModified=${fp.lastModified}:size=${fp.size}`
}

async function isFileUpdated(rootStampTree:ScanTreeFolderType, fileName:string, handle:FileSystemFileHandle):Promise<boolean> {
    const prev = getFileFromTree(rootStampTree, fileName)    
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
                    cssFile: {
                        type: "css",
                        fileStamp: getFileStamp(blob),
                        css: e.target.result
                    }
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
                    dataFile: {
                        type: "data",
                        fileStamp: getFileStamp(blob),
                        mime: blob.type,
                        buffer: e.target.result
                    }
                })
            }
        }
        reader.readAsArrayBuffer(blob)
    })
}

async function updateDataFileList(rootHandle:FileSystemDirectoryHandle, fileNameList:string[], rootScanTree:ScanTreeFolderType, postEvent:PostEvent<WorkerMessageType>) {
    for (const fileName of fileNameList) {
        const handle = await getHandle(rootHandle, fileName)
        if ((handle !== undefined) && isFileHandle(handle)) {
            const prevData = getFileFromTree(rootScanTree, fileName)
            const currentFile = await handle.getFile()
            const currentFileStamp = getFileStamp(currentFile)
            if ((prevData === undefined) || (prevData.type === "folder") || (currentFileStamp !== prevData.fileStamp)) {              
                const dataFile = await readDataFile(handle as FileSystemFileHandle, fileName)
                postEvent.send("updateDataFile", dataFile, [dataFile.dataFile.buffer])
            }
            updateFileOfTree(rootScanTree, fileName, {
                type: 'data',
                fileStamp: currentFileStamp,
                status: 'found'
            })
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

export async function scanDirectoryWorkerCallback(payload:WorkerMessageType['scanDirectory']['request'], postEvent:PostEvent<WorkerMessageType>){                
    const rootHandle = payload.handle
    const rootScanTree = payload.rootScanTree    
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)    

    try {
        const dataFileList:Set<string> = new Set([])
        for (const [fileName, handle] of Object.entries(await collectFiles(rootHandle, isMarkdownFile))) {
            const fileData = await readMarkdownFile(handle, isMarkdownFile, fileName)
            if (await isFileUpdated(rootScanTree, fileName, handle)) {                
                postEvent.send("updateMarkdownFile", fileData)
            }
            updateFileOfTree(rootScanTree, fileName, {
                type: 'markdown',
                fileStamp: fileData.markdownFile.fileStamp,
                status: 'found'
            })

            fileData.markdownFile.imageList.forEach(dataFileList.add, dataFileList)
            fileData.markdownFile.linkList.forEach(dataFileList.add, dataFileList)
        }        
        await updateDataFileList(rootHandle, Array.from(dataFileList.values()), rootScanTree, postEvent)
    }
    finally {
        postEvent.send("scanDirectoryDone", { handle: rootHandle })
    }
}

export async function readCssFileWorkerCallback(payload:WorkerMessageType['readCssFile']['request'], postEvent:PostEvent<WorkerMessageType>){
    const handle = await getHandle(payload.handle, payload.fileName)
    if ((handle !== undefined) && isFileHandle(handle)) {
        const fileData = await readCssFile(handle, payload.fileName)
        postEvent.send("updateCssFile", fileData)
    }
}