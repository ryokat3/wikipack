import { FileWorkerMessageType } from "./FileWorkerMessageType"
import { WorkerThreadHandler } from "../utils/WorkerMessage"
import { getMarkdownFile} from "../markdown/converter"
import { collectFiles, getHandle } from "../file/localFile"
import { makeMarkdownFileRegexChecker } from "../utils/appUtils"


// Not used now...
/*
import database = require("mime-db")

const extToMime = new Map(Object.entries(database).filter((entry):entry is [string, { extensions:string[] }]=>'extensions' in entry[1] ).flatMap(([mimeType, mimeData])=> mimeData['extensions'].map((ext)=>[ext, mimeType])))

export function getMimeType(fileName:string, typeName:string="image") {
    const ext = fileName.split('.').pop()?.toLowerCase()
    return (ext !== undefined) ? (extToMime.get(ext) || `${typeName}/${ext}`) : `${typeName}/unknown` 

}
*/

async function updateMarkdownFile(handle: FileSystemFileHandle, fileName: string|undefined = undefined ): Promise<FileWorkerMessageType["updateMarkdownFile"]["response"]> {
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

async function updateDataFile(handle: FileSystemFileHandle, fileName: string): Promise<FileWorkerMessageType["updateDataFile"]["response"]> {
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
        const result = await updateMarkdownFile(payload.handle)
        postEvent.send("updateMarkdownFile",  result)        
    })
    .addRequestHandler("openDirectory", async (payload, postEvent)=>{                
        for (const [name, handle] of Object.entries(await collectFiles(payload.handle, makeMarkdownFileRegexChecker(payload.markdownFileRegex)))) {
            const result = await updateMarkdownFile(handle, name)
            console.log(name)
            console.log(result.markdownFile.markdown)
            postEvent.send("updateMarkdownFile", result)

            for (const name of result.markdownFile.imageList) {
                const handle = await getHandle(payload.handle, name)
                if ((handle !== undefined) && (handle.kind === "file")) {                    
                    const dataFile = await updateDataFile(handle as FileSystemFileHandle, name)
                    postEvent.send("updateDataFile", await updateDataFile(handle as FileSystemFileHandle, name), [ dataFile.data ])
                }
            }
        }
    })
    .build()    