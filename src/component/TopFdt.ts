import { FileWorkerMessageType } from "../localFile/FileWorkerMessageType"

export type TopFdt = {
    updateMarkdownFile: FileWorkerMessageType["updateMarkdownFile"]['response'],
    updateCssFile: FileWorkerMessageType["updateCssFile"]['response'],
    updateDataFile: FileWorkerMessageType['updateDataFile']['response'],
    deleteFile: FileWorkerMessageType['deleteFile']['response'],
    updateCurrentPage: {
        name: string
    },
    updatePackFileName: {
        name: string
    },
    resetRootFolder: void
}
