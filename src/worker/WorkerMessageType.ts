import { MarkdownFileType } from "../fileTree/FileTreeType"
import { FileStampFolderType } from "../fileTree/FileStampTree"

export type WorkerMessageType = {
    openFile : {
        request: {
            handle: FileSystemFileHandle,
            markdownFileRegex: string[]
        }
    },
    scanDirectory: {
        request: {
            handle: FileSystemDirectoryHandle,
            rootStampTree: FileStampFolderType,
            markdownFileRegex: string[],
            cssFileRegex: string[]
        }
    },
    scanDirectoryDone: {
        response: {
            handle: FileSystemDirectoryHandle                        
        }
    },
    scanUrl: {
        request: {
            url: string,
            rootStampTree: FileStampFolderType,
            markdownFileRegex: string[],
            cssFileRegex: string[]             
        }
    }
    scanUrlDone: {
        response: {
            url: URL        
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