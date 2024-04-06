import { MarkdownFileType, CssFileType, WorkerDataFileType} from "../fileTree/WikiFile"
import { ScanTreeFolderType } from "../fileTree/ScanTree"

// export type PartialDataFileType = Omit<Omit<DataFileType, 'dataRef'>, 'buffer'> & { buffer: ArrayBuffer}

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
            rootScanTree: ScanTreeFolderType,
            markdownFileRegex: string[]            
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
            rootScanTree: ScanTreeFolderType,
            markdownFileRegex: string[]            
        }
    }
    readCssFile: {
        request: {
            handle: FileSystemDirectoryHandle,
            fileName: string
        }
    }
    downloadCssFile: {
        request: {
            url: string,
            fileName: string,
            fileStamp: string | undefined,
            skipHead: boolean
        }
    }
    scanUrlDone: {
        response: {
            url: string     
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
            dataFile: WorkerDataFileType
        }
    },
    deleteFile: {
        response: {
            fileName: string  
        }
    }
}