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
        data: string
    },
    updateCurrentPage: {
        name: string
    },
    resetRootFolder: void
}
