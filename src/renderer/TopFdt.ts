import { FileWorkerMessageMap } from "../fileWorker/FileWorkerInvoke"

export type TopFdt = {
    updateMarkdownFile: FileWorkerMessageMap["updateMarkdownFile"]['response'],
    updateDataFile: FileWorkerMessageMap['updateDataFile']['response'],
    updateCurrentPage: {
        name: string
    },
    resetRootFolder: void
}
