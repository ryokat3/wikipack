import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"

export async function scanUrlWorkerCallback(_payload:WorkerMessageType['scanUrl']['request'], _postEvent:PostEvent<WorkerMessageType>){                
    console.log(_payload.url)
}