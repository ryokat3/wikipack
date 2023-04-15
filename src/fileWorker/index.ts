import { FileWorkerMessageMap } from "../fileWorker/FileWorkerInvoke"
import { WorkerThreadHandler } from "../utils/WorkerInvoke"
import { Folder, createRootFolder, getOrCreateMarkdownFile } from "../markdown/FileTree"

self.onmessage = new WorkerThreadHandler<FileWorkerMessageMap>()
    .addRequestHandler("openFile",
        async (payload, postEvent) => {
            const blob = await payload.handle.getFile()

            const rootFolder:Folder = createRootFolder()
            getOrCreateMarkdownFile(rootFolder, blob.name)
            postEvent.send("updateRootFolder", {
                rootFolder: rootFolder
            })

            const reader = new FileReader()
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {                    
                    postEvent.send("updateMarkdownFile", {
                        fileName: blob.name,
                        markdown: e.target.result
                    })                    
                }
            }
            reader.readAsText(blob, "utf-8")
        }
    )
    .build()    