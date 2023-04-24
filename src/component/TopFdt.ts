import { FileWorkerMessageType } from "../localFile/FileWorkerMessageType"

export type TopFdt = {
    updateMarkdownFile: FileWorkerMessageType["updateMarkdownFile"]['response'],
    updateDataFile: FileWorkerMessageType['updateDataFile']['response'],
    updateCurrentPage: {
        name: string
    },
    resetRootFolder: void
}
