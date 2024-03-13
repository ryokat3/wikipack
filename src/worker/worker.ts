import { WorkerMessageType } from "./WorkerMessageType"
import { WorkerThreadHandler } from "../utils/WorkerMessage"
import { openFileWorkerCallback, openDirectoryWorkerCallback } from "../localFile/fileWorker"

self.onmessage = new WorkerThreadHandler<WorkerMessageType>()
    .addRequestHandler("openFile", openFileWorkerCallback)
    .addRequestHandler("openDirectory", openDirectoryWorkerCallback)
    .build()    