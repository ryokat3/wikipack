import { MarkdownFile } from "../data/FileTree"

export type FileWorkerMessageType = {
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
            mime: string,
            data: ArrayBuffer
        }
    },
}