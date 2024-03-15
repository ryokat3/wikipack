import { MarkdownFileType } from "../fileTree/FileTreeType"

export type WorkerMessageType = {
    openFile : {
        request: {
            handle: FileSystemFileHandle,
            markdownFileRegex: string[]
        }
    },
    searchDirectory: {
        request: {
            handle: FileSystemDirectoryHandle,
            markdownFileRegex: string[],
            cssFileRegex: string[]
        }
    },
    searchDirectoryDone: {
        response: {
            handle: FileSystemDirectoryHandle                        
        }
    },
    searchURL: {
        request: {
            url: string,
            markdownFileRegex: string[],
            cssFileRegex: string[]             
        }
    }
    searchURLDone: {
        response: {
            url: string         
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