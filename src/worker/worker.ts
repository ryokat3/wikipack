import { WorkerMessageType } from "./WorkerMessageType"
import { WorkerThreadHandler } from "../utils/WorkerMessage"
import { openFileWorkerCallback, scanDirectoryWorkerCallback } from "../fileWorker/fileWorker"
import { scanUrlWorkerCallback } from "../netWorker/netWorker"

self.onmessage = new WorkerThreadHandler<WorkerMessageType>()
    .addRequestHandler("openFile", openFileWorkerCallback)
    .addRequestHandler("scanDirectory", scanDirectoryWorkerCallback)
    .addRequestHandler("scanUrl", scanUrlWorkerCallback)
    .build()    