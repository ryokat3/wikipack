import { FileWorkerMessageType } from "./FileWorkerMessageType"
import { WorkerThreadHandler } from "../utils/WorkerMessage"
import { getMarkdownFile} from "../markdown/converter"
import { collectFiles, getHandle } from "./fileRW"
import { makeFileRegexChecker } from "../utils/appUtils"


// Not used now...
/*
import database = require("mime-db")

const extToMime = new Map(Object.entries(database).filter((entry):entry is [string, { extensions:string[] }]=>'extensions' in entry[1] ).flatMap(([mimeType, mimeData])=> mimeData['extensions'].map((ext)=>[ext, mimeType])))

export function getMimeType(fileName:string, typeName:string="image") {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return (ext !== undefined) ? (extToMime.get(ext) || `${typeName}/${ext}`) : `${typeName}/unknown` 

}
*/

async function readMarkdownFile(handle: FileSystemFileHandle, fileName: string|undefined = undefined ): Promise<FileWorkerMessageType["updateMarkdownFile"]["response"]> {
    return await new Promise<FileWorkerMessageType["updateMarkdownFile"]["response"]>(async (resolve) => {
        const blob = await handle.getFile()

        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {
                const markdownFileName = (fileName !== undefined) ? fileName : blob.name
                const markdownFile = getMarkdownFile(e.target.result, markdownFileName, blob.lastModified)
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

async function readCssFile(handle: FileSystemFileHandle, fileName: string|undefined = undefined ): Promise<FileWorkerMessageType["updateCssFile"]["response"]> {
    return await new Promise<FileWorkerMessageType["updateCssFile"]["response"]>(async (resolve) => {
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

async function readDataFile(handle: FileSystemFileHandle, fileName: string): Promise<FileWorkerMessageType["updateDataFile"]["response"]> {
    return await new Promise<FileWorkerMessageType["updateDataFile"]["response"]>(async (resolve) => {
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


self.onmessage = new WorkerThreadHandler<FileWorkerMessageType>()
    .addRequestHandler("openFile", async (payload, postEvent) => {
        const result = await readMarkdownFile(payload.handle)
        postEvent.send("updateMarkdownFile",  result)        
    })
    .addRequestHandler("openDirectory", async (payload, postEvent)=>{                
        for (const [name, handle] of Object.entries(await collectFiles(payload.handle, makeFileRegexChecker(payload.markdownFileRegex)))) {
            const result = await readMarkdownFile(handle, name)                        
            postEvent.send("updateMarkdownFile", result)

            for (const name of result.markdownFile.imageList) {
                const handle = await getHandle(payload.handle, name)
                if ((handle !== undefined) && (handle.kind === "file")) {                    
                    const dataFile = await readDataFile(handle as FileSystemFileHandle, name)
                    postEvent.send("updateDataFile", await readDataFile(handle as FileSystemFileHandle, name), [ dataFile.data ])
                }
            }
        }
        for (const [name, handle] of Object.entries(await collectFiles(payload.handle, makeFileRegexChecker(payload.cssFileRegex)))) {
            const result = await readCssFile(handle, name)                        
            postEvent.send("updateCssFile", result)
        }
    })
    .build()    