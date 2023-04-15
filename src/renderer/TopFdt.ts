import { Folder } from "../markdown/FileTree"

export type TopFdt = {
    updateMarkdownFile: {
        fileName: string,
        markdown: string
    },
    updateDataFile: {
        fileName: string,
        data: ArrayBuffer
    },
    updateRootFolder: {
        rootFolder: Folder
    }
}
