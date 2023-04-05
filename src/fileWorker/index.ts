import { GetResponseMessageType, GetRequestMessageType } from "../utils/WorkerInvoke"
import { FileWorkerMessageMap } from "../fileWorker/FileWorkerInvoke"

self.onmessage = async (e: MessageEvent<GetRequestMessageType<FileWorkerMessageMap, keyof FileWorkerMessageMap>> ) => {
    if (e.data.type === "openFile") {
        const data = e.data as GetRequestMessageType<FileWorkerMessageMap, "openFile">
        const blob = await data.data.handle.getFile()

        const reader = new FileReader()
        reader.onload = (e2: ProgressEvent<FileReader>) => {        
            if ((e2.target !== null) && (e2.target.result !== null) && (typeof e2.target.result == 'string')) {
                const response:GetResponseMessageType<FileWorkerMessageMap, "openFile"> = {
                    id: data.id,
                    type: data.type,
                    data: {
                        fileName: blob.name,
                        markdown: e2.target.result                        
                    }
                }
                self.postMessage(response)          
            }
        }
        reader.readAsText(blob, "utf-8")    
    }
}
