import { MarkdownFileType, CssFileType, WorkerDataFileType, FileSrcType /*, TextFileSrcType, BinaryFileSrcType */} from "../tree/WikiFile"
import { ScanTreeFolderType } from "../tree/ScanTree"
import { ConfigType } from "../config"

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
    checkCurrentPage: {
        request: {
            pagePath: string,
            fileSrc:FileSrcType,            
            fileStamp: string | undefined
            markdownFileRegex: string[] 
        }
    }
    checkCurrentPageDone: {
        response: {
            updated: boolean
        }
    }
    checkConfigFile: {
        request: {
            fileSrc:FileSrcType,            
            fileStamp: string | undefined            
        }
    }
    updateConfigFile: {
        response: {
            config: ConfigType
            fileStamp: string | undefined            
        }
    }
    readCssFile: {
        request: {
            handle: FileSystemDirectoryHandle,
            fileName: string,
            fileStamp: string | undefined,
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
    /*
    updateTextFile: {
        response: {
            type: 'css',
            fileName: string,
            file: TextFileSrcType,
            fileSrc: FileSrcType,
        }
    },
    updateBinaryFile: {
        response: {
            type: 'data',
            fileName: string,
            fileSrc: FileSrcType,
            mime: string,
            file: BinaryFileSrcType            
        }
    },
    */
    updateMarkdownFile: {
        response: {
            pagePath: string,
            fileSrc: FileSrcType,
            markdownFile: MarkdownFileType
        }
    },
    updateCssFile: {
        response: {
            pagePath: string,
            fileSrc: FileSrcType,
            cssFile: CssFileType
        }
    },
    updateDataFile: {
        response: {
            pagePath: string, 
            fileSrc: FileSrcType,
            dataFile: WorkerDataFileType
        }
    },
    deleteFile: {
        response: {
            pagePath: string  
        }
    }
}