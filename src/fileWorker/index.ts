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

self.onmessage = new WorkerThreadHandler<FileWorkerMessageMap>()
    .addRequestHandler("openFile", async (payload, postEvent) => {
        const blob = await payload.handle.getFile()

        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {
                postEvent.send("updateMarkdownFile", {
                    fileName: blob.name,
                    markdownFile: getMarkdownFile(e.target.result)
                })
            }
        }
        reader.readAsText(blob, "utf-8")
    })
    .addRequestHandler("openDirectory", async (payload, postEvent)=>{                
        for (const [name, handle] of Object.entries(await collectFiles(payload.handle, makeMarkdownFileRegexChecker(payload.markdownFileRegex)))) {            
            const blob = await handle.getFile()

            const reader = new FileReader()
            reader.onload = async (e: ProgressEvent<FileReader>) => {
                if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {
                    const markdownFile = getMarkdownFile(e.target.result)                    
                    postEvent.send("updateMarkdownFile", {
                        fileName: name,
                        markdownFile: markdownFile
                    })                    
                    for (const name of markdownFile.imageList) {
                        const handle2 = await getHandle(payload.handle, name)
                        if ((handle2 !== undefined) && (handle2.kind === "file")) {
                            const blob2 = await (handle2 as FileSystemFileHandle).getFile()

                            const reader2 = new FileReader()
                            reader2.onload = () => {
                      
                                postEvent.send("updateDataFile", {
                                    fileName:name,
                                    data: reader2.result as string
                                })
                      
                      
                            }
                            reader2.readAsDataURL(blob2)
                        }                        
                    }
                }
            }
            reader.readAsText(blob, "utf-8")           
        }
    })
    .build()    