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
            markdownFileRegex: string[],
            cssFileRegex: string[]
        }
    },
    updateMarkdownFile: {
        response: {
            fileName: string,
            timestamp: number,
            markdownFile: MarkdownFile
        }
    },
    updateCssFile: {
        response: {
            fileName: string,
            timestamp: number,
            data: string
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