import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"

export async function scanUrlWorkerCallback(payload:WorkerMessageType['scanUrl']['request'], postEvent:PostEvent<WorkerMessageType>){                
    console.log(payload.url)

    const response = await fetch(payload.url + payload.topPage)
    const body = await response.text()

    postEvent.send("updateMarkdownFile", {
        fileName: payload.topPage,
        fileStamp: "dummy",
        markdownFile: {
            type: "markdown",
            markdown: body,
            fileStamp: "dummy",
            imageList: [],
            linkList: []
        }
    })
}