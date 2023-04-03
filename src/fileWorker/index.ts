import { FileWorkerMessageType, GetFileWorkerMessageType, GetFileWorkerResponseType } from "./message"

self.onmessage = async (e: MessageEvent<FileWorkerMessageType> ) => {
    if (e.data.type === "openFile") {
        const data = e.data as GetFileWorkerMessageType<"openFile">
        const blob = await data.payload.handle.getFile()

        const reader = new FileReader()
        reader.onload = (e2: ProgressEvent<FileReader>) => {        
            if ((e2.target !== null) && (e2.target.result !== null) && (typeof e2.target.result == 'string')) {
                const response:GetFileWorkerResponseType<"markdownFile"> = {
                    type: "markdownFile",
                    payload: {
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
