import { MarkdownFile } from "../markdown/FileTree"

export type FileWorkerMessageMap = {
    openFile : {
        request: {
            handle: FileSystemFileHandle
        }
    },
    openDirectory: {
        request: {
            handle: FileSystemDirectoryHandle,
            markdownFileRegex: string[]
        }
    },
    updateMarkdownFile: {
        response: {
            fileName: string,
            markdownFile: MarkdownFile
        }
    },
    updateDataFile: {
        response: {
            fileName: string,
            data: string
        }
    },
}