import { FileWorkerMessageMap } from "../fileWorker/FileWorkerInvoke"
import { WorkerThreadHandler } from "../utils/WorkerInvoke"
import { getMarkdownFile} from "../markdown/converter"
import { collectFiles, getHandle } from "../fs/localFileFS"

function makeMarkdownFileRegexChecker(regexList:string[]):(name:string)=>boolean {
    return function (name:string) {
        for (const regex of regexList.map((re:string)=>new RegExp(re, "i"))) {
            if (name.match(regex)) {
                return true
            }
        }
        return false
    }
}

async function updateMarkdownFile(handle: FileSystemFileHandle, fileName: string|undefined = undefined ): Promise<FileWorkerMessageMap["updateMarkdownFile"]["response"]> {
    return await new Promise<FileWorkerMessageMap["updateMarkdownFile"]["response"]>(async (resolve) => {
        const blob = await handle.getFile()

        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {
                const markdownFile = getMarkdownFile(e.target.result, blob.lastModified)
                resolve({
                    fileName: (fileName !== undefined) ? fileName : blob.name,
                    timestamp: blob.lastModified,
                    markdownFile: markdownFile
                })                
            }
        }
        reader.readAsText(blob, "utf-8")
    })    
}

async function updateDataFile(handle: FileSystemFileHandle, fileName: string): Promise<FileWorkerMessageMap["updateDataFile"]["response"]> {
    return await new Promise<FileWorkerMessageMap["updateDataFile"]["response"]>(async (resolve) => {
        const blob = await handle.getFile()

        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {
                resolve({
                    fileName: fileName,
                    timestamp: blob.lastModified,
                    data: e.target.result
                })
            }
        }
        reader.readAsDataURL(blob)
    })
}

self.onmessage = new WorkerThreadHandler<FileWorkerMessageMap>()
    .addRequestHandler("openFile", async (payload, postEvent) => {
        const result = await updateMarkdownFile(payload.handle)
        postEvent.send("updateMarkdownFile",  result)        
    })
    .addRequestHandler("openDirectory", async (payload, postEvent)=>{                
        for (const [name, handle] of Object.entries(await collectFiles(payload.handle, makeMarkdownFileRegexChecker(payload.markdownFileRegex)))) {
            const result = await updateMarkdownFile(handle, name)
            postEvent.send("updateMarkdownFile", result)

            for (const name of result.markdownFile.imageList) {
                const handle = await getHandle(payload.handle, name)
                if ((handle !== undefined) && (handle.kind === "file")) {
                    postEvent.send("updateDataFile", await updateDataFile(handle as FileSystemFileHandle, name))
                }
            }
        }
    })
    .build()    