import { MarkdownFile } from "../markdown/FileTree"

export type TopFdt = {
    updateMarkdownFile: {
        fileName: string,
        markdownFile: MarkdownFile
    },
    updateDataFile: {
        fileName: string,
        data: string
    },
    updateCurrentPage: {
        name: string
    },
    resetRootFolder: void
}
