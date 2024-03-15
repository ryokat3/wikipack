import { WorkerMessageType } from "./WorkerMessageType"
import { WorkerThreadHandler } from "../utils/WorkerMessage"
import { openFileWorkerCallback, searchDirectoryWorkerCallback } from "../fileWorker/fileWorker"

self.onmessage = new WorkerThreadHandler<WorkerMessageType>()
    .addRequestHandler("openFile", openFileWorkerCallback)
    .addRequestHandler("searchDirectory", searchDirectoryWorkerCallback)
    .build()    