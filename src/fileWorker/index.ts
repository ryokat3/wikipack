import { FileWorkerMessageMap } from "../fileWorker/FileWorkerInvoke"
import { WorkerThreadHandler } from "../utils/WorkerInvoke"

self.onmessage = new WorkerThreadHandler<FileWorkerMessageMap>()
    .addCallHandler("openFile",
        async (payload) => {                        
            const prom = new Promise<{ fileName:string, markdown:string }>(async (resolve/*, reject*/)=>{
                const blob = await payload.handle.getFile()
                const reader = new FileReader()
                reader.onload = (e: ProgressEvent<FileReader>) => {        
                    if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {
                        resolve({
                            fileName: blob.name,
                            markdown: e.target.result
                        })
                    }
                }
                reader.readAsText(blob, "utf-8")  
            })
            return await prom
        }
    )
    .build(self.postMessage)    

/*    
self.onmessage = async (e: MessageEvent<{ id:number, type:string, SelectObject<FileWorkerMessageMap, > ) => {
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
*/
