import { WorkerMessageType } from "./WorkerMessageType"
import { WorkerThreadHandler } from "../utils/WorkerMessage"
import { openFileWorkerCallback, scanDirectoryWorkerCallback, readCssFileWorkerCallback } from "../fileWorker/fileWorker"
import { scanUrlWorkerCallback, downloadCssFilelWorkerCallback } from "../netWorker/netWorker"
import { checkCurrentPageWorkerCallback } from "./workerCallback"

self.onmessage = new WorkerThreadHandler<WorkerMessageType>()
    .addRequestHandler("openFile", openFileWorkerCallback)
    .addRequestHandler("scanDirectory", scanDirectoryWorkerCallback)
    .addRequestHandler("scanUrl", scanUrlWorkerCallback)
    .addRequestHandler("downloadCssFile", downloadCssFilelWorkerCallback)
    .addRequestHandler("readCssFile", readCssFileWorkerCallback)    
    .addRequestHandler("checkCurrentPage", checkCurrentPageWorkerCallback)    
    .build()    