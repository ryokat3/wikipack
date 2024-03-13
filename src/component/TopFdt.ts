import { WorkerMessageType } from "../worker/WorkerMessageType"

export type TopFdt = {
    updateMarkdownFile: WorkerMessageType["updateMarkdownFile"]['response'],
    updateCssFile: WorkerMessageType["updateCssFile"]['response'],
    updateDataFile: WorkerMessageType['updateDataFile']['response'],
    deleteFile: WorkerMessageType['deleteFile']['response'],
    updateCurrentPage: {
        name: string
    },
    updatePackFileName: {
        name: string
    },
    resetRootFolder: void
}
