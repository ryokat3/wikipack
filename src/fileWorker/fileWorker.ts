import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { getMarkdownFile} from "../markdown/converter"
import { collectFiles, getHandle, getHandleMap, isFileHandle } from "./fileRW"
import { addPath, makeFileRegexChecker } from "../utils/appUtils"
import { createRootFolder, FileTreeFolderType, getFileFromTree, updateFileOfTree, deleteFileFromTree } from "../fileTree/FileTree"

type FileWorkerFileType = {
    markdown: {
        type: "markdown",
        timestamp: number,
        handle: FileSystemFileHandle,
        imageList: string[],
        linkList: string[]
    },
    css: {
        type: "css",
        timestamp: number,
        handle: FileSystemFileHandle
    },
    data: {
        type: "data",
        timestamp: number,
        handle: FileSystemFileHandle
    }
}

async function isFileUpdated(root:FileTreeFolderType<FileWorkerFileType>, fileName:string, handle:FileSystemFileHandle):Promise<boolean> {
    const prev = getFileFromTree(root, fileName)    
    if (prev === undefined) {
        return true
    }
    else if (prev.type === "folder") {
        return true
    }
    else {
        const current = await handle.getFile()
        return  current.lastModified > prev.timestamp
    }
}

async function readMarkdownFile(handle: FileSystemFileHandle, isMarkdownFile:(fileName:string)=>boolean, fileName: string|undefined = undefined ): Promise<WorkerMessageType["updateMarkdownFile"]["response"]> {
    return await new Promise<WorkerMessageType["updateMarkdownFile"]["response"]>(async (resolve) => {
        const blob = await handle.getFile()

        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {
                const markdownFileName = (fileName !== undefined) ? fileName : blob.name
                const markdownFile = getMarkdownFile(e.target.result, markdownFileName, blob.lastModified, isMarkdownFile)
                resolve({
                    fileName: markdownFileName,
                    timestamp: blob.lastModified,
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
                    timestamp: blob.lastModified,
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
                    timestamp: blob.lastModified,
                    mime: blob.type,
                    data: e.target.result
                })
            }
        }
        reader.readAsArrayBuffer(blob)
    })
}

async function updateDataFileList(rootHandle:FileSystemDirectoryHandle, fileNameList:string[], rootFolder:FileTreeFolderType<FileWorkerFileType>, postEvent:PostEvent<WorkerMessageType>) {
    for (const fileName of fileNameList) {
        const handle = await getHandle(rootHandle, fileName)
        if ((handle !== undefined) && isFileHandle(handle)) {
            const prev = getFileFromTree(rootFolder, fileName)
            const current = await handle.getFile()
            if ((prev === undefined) || (prev.type === "folder") || (current.lastModified > prev.timestamp)) {
                updateFileOfTree(rootFolder, fileName, {
                    type: "data",
                    timestamp: current.lastModified,
                    handle: handle
                })              
                const dataFile = await readDataFile(handle as FileSystemFileHandle, fileName)
                postEvent.send("updateDataFile", dataFile, [dataFile.data])
            }
        }
        // TODO: handle the case of file deleted
    }
}

async function* deletedFileGenerator(dirHandle:FileSystemDirectoryHandle, folder:FileTreeFolderType<FileWorkerFileType>, folderPath:string=""):AsyncGenerator<string> {
    const currentChildren = await getHandleMap(dirHandle)    
    for (const [name, value] of Object.entries(folder.children)) {
        if (!(name in currentChildren)) {            
            yield addPath(folderPath, name)
        }
        else if ((currentChildren[name].kind === "directory") && (value.type === "folder")) {            
            yield* deletedFileGenerator(currentChildren[name] as FileSystemDirectoryHandle, value, addPath(folderPath, name))            
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

    const rootFolder = createRootFolder<FileWorkerFileType>()
    const rootHandle = payload.handle
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)
    const isCssFile = makeFileRegexChecker(payload.cssFileRegex)

    try {
        for (const [name, handle] of Object.entries(await collectFiles(rootHandle, isMarkdownFile))) {
            if (await isFileUpdated(rootFolder, name, handle)) {
                const result = await readMarkdownFile(handle, isMarkdownFile, name)
                const current = await handle.getFile()
                updateFileOfTree(rootFolder, name, {
                    type: "markdown",
                    timestamp: current.lastModified,
                    handle: handle,
                    imageList: result.markdownFile.imageList,
                    linkList: result.markdownFile.linkList
                })
                postEvent.send("updateMarkdownFile", result)
                await updateDataFileList(rootHandle, result.markdownFile.imageList, rootFolder, postEvent)
                await updateDataFileList(rootHandle, result.markdownFile.linkList, rootFolder, postEvent)
            }
            else {
                const current = getFileFromTree(rootFolder, name) as FileWorkerFileType['markdown']
                await updateDataFileList(rootHandle, current.imageList, rootFolder, postEvent)
                await updateDataFileList(rootHandle, current.linkList, rootFolder, postEvent)
            }
        }
        for (const [name, handle] of Object.entries(await collectFiles(rootHandle, isCssFile))) {
            const result = await readCssFile(handle, name)
            postEvent.send("updateCssFile", result)
        }
        for await (const fileName of deletedFileGenerator(rootHandle, rootFolder)) {
            deleteFileFromTree(rootFolder, fileName)
            postEvent.send("deleteFile", { fileName: fileName })
        }
    }
    finally {
        postEvent.send("searchDirectoryDone", { handle: rootHandle })
    }
}
