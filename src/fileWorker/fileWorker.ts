import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { collectFiles, getHandle, isFileHandle, WikiFileHandlerForFileHandle } from "./fileRW"
import { makeFileRegexChecker } from "../utils/appUtils"
import { getFileFromTree, updateFileOfTree } from "../fileTree/FileTree"
import { readMarkdownFile, readDataFile, readCssFile, isWikiFile, getFileSrcHandler, FileSrcType } from "../fileTree/WikiFile"
import { ScanTreeFolderType } from "../fileTree/ScanTree"

async function updateDataFileList(rootHandle:FileSystemDirectoryHandle, fileNameList:string[], rootScanTree:ScanTreeFolderType, postEvent:PostEvent<WorkerMessageType>) {
    for (const fileName of fileNameList) {
        const handle = await getHandle(rootHandle, fileName)
        if ((handle !== undefined) && isFileHandle(handle)) {
            const prevData = getFileFromTree(rootScanTree, fileName)
            const fileSrc:FileSrcType = { type: "fileHandle", fileHandle: handle}
            const handler = getFileSrcHandler(fileSrc)
            const dataFile = await readDataFile(handler, ((prevData !== undefined) && (prevData.type !== "folder")) ? prevData.fileStamp : undefined )
            if (isWikiFile(dataFile))  {
                postEvent.send("updateDataFile", { pagePath: fileName, fileSrc: fileSrc, dataFile: dataFile }, [dataFile.buffer])
            }
            updateFileOfTree(rootScanTree, fileName, {
                type: 'data',
                fileStamp: (isWikiFile(dataFile)) ? dataFile.fileStamp : "",
                status: true
            })
        }
    }
}

////////////////////////////////////////////////////////////////////////
// Worker
////////////////////////////////////////////////////////////////////////

export async function openFileWorkerCallback(payload:WorkerMessageType['openFile']['request'], postEvent:PostEvent<WorkerMessageType>) {
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)
    const fileSrc:FileSrcType = { type: "fileHandle", fileHandle: payload.handle}    
    const handler = new WikiFileHandlerForFileHandle(fileSrc)
    const blob = await handler.getBlob()
    const result = await readMarkdownFile(handler, blob.name, undefined, isMarkdownFile)

    if ((result !== undefined) && (result !== "NO_UPDATE")) {
        postEvent.send("updateMarkdownFile", {            
            pagePath: blob.name,
            fileSrc: fileSrc,
            markdownFile: result
        })
    }
}

export async function scanDirectoryWorkerCallback(payload:WorkerMessageType['scanDirectory']['request'], postEvent:PostEvent<WorkerMessageType>){                
    const rootHandle = payload.handle
    const rootScanTree = payload.rootScanTree    
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)    

    try {
        const dataFileList:Set<string> = new Set([])
        for (const [fileName, handle] of Object.entries(await collectFiles(rootHandle, isMarkdownFile))) {
            const fileSrc:FileSrcType = { type: "fileHandle", fileHandle: handle }
            const handler = getFileSrcHandler(fileSrc)
            const prev = getFileFromTree(rootScanTree, fileName)
            const fileData = await readMarkdownFile(handler, fileName, (prev?.type === "markdown") ? prev.fileStamp : undefined, isMarkdownFile)            
            if (isWikiFile(fileData)) {
                postEvent.send("updateMarkdownFile", { pagePath:fileName, fileSrc:fileSrc, markdownFile:fileData})
            }
            updateFileOfTree(rootScanTree, fileName, {
                type: 'markdown',
                fileStamp: (isWikiFile(fileData)) ? fileData.fileStamp : "",
                status: true
            })
            if (isWikiFile(fileData)) {
                fileData.imageList.forEach(dataFileList.add, dataFileList)
                fileData.linkList.forEach(dataFileList.add, dataFileList)
            }
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
        const fileSrc:FileSrcType = { type:"fileHandle", fileHandle: handle}
        const cssFile = await readCssFile(getFileSrcHandler(fileSrc), payload.fileStamp)
        if (isWikiFile(cssFile)) {
            postEvent.send("updateCssFile", {
                pagePath: payload.fileName,
                fileSrc: fileSrc,
                cssFile: cssFile
            })
        }
    }
}