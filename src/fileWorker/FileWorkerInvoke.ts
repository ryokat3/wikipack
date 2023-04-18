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
            timestamp: number,
            markdownFile: MarkdownFile
        }
    },
    updateDataFile: {
        response: {
            fileName: string,
            timestamp: number,
            data: string
        }
    },
}