import { MarkdownFileType, CssFileType, DataFileType} from "../fileTree/FileTreeType"
import { FileStampFolderType } from "../fileTree/FileStampTree"

type PartialDataFileType = Omit<Omit<DataFileType, 'dataRef'>, 'buffer'> & { buffer: ArrayBuffer}

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
            topPage: string,
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
            markdownFile: MarkdownFileType
        }
    },
    updateCssFile: {
        response: {
            fileName: string,
            cssFile: CssFileType
        }
    },
    updateDataFile: {
        response: {
            fileName: string, 
            dataFile: PartialDataFileType
        }
    },
    deleteFile: {
        response: {
            fileName: string  
        }
    }
}