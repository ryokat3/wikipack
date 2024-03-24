import { MarkdownFileType } from "../fileTree/FileTreeType"
import { FileStampFolderType } from "../fileTree/FileStampTree"

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
            tagTree: FileStampFolderType,
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
            fileStamp: string,
            markdownFile: MarkdownFileType
        }
    },
    updateCssFile: {
        response: {
            fileName: string,
            fileStamp: string,
            data: string
        }
    },
    updateDataFile: {
        response: {
            fileName: string,
            fileStamp: string,
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