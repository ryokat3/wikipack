import { MarkdownFileType } from "../data/FileTreeType"

export type FileWorkerMessageType = {
    openFile : {
        request: {
            handle: FileSystemFileHandle,
            markdownFileRegex: string[]
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
            markdownFile: MarkdownFileType
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
    deleteFile: {
        response: {
            fileName: string  
        }
    }
}