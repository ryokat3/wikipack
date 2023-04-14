import { FileWorkerMessageMap } from "../fileWorker/FileWorkerInvoke"
import { WorkerThreadHandler } from "../utils/WorkerInvoke"

self.onmessage = new WorkerThreadHandler<FileWorkerMessageMap>()
    .addRequestHandler("openFile",
        async (payload, postEvent) => {
            const blob = await payload.handle.getFile()
            const reader = new FileReader()
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {                    
                    postEvent.send("updateMarkdown", {
                        fileName: blob.name,
                        markdown: e.target.result
                    })                    
                }
            }
            reader.readAsText(blob, "utf-8")
        }
    )
    .build()    