import { MarkdownFile } from "../markdown/FileTree"

export type TopFdt = {
    updateMarkdownFile: {
        fileName: string,
        timestamp: number,
        markdownFile: MarkdownFile
    },
    updateDataFile: {
        fileName: string,
        timestamp: number,
        mime: string,
        data: ArrayBuffer
    },
    updateCurrentPage: {
        name: string
    },
    resetRootFolder: void
}
