import { MarkdownFileType, CssFileType, WorkerDataFileType, FileSrcType, TextFileSrcType, BinaryFileSrcType } from "../fileTree/WikiFile"
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
    updateMarkdownFile: {
        response: {
            fileName: string,
            fileSrc: FileSrcType,
            markdownFile: MarkdownFileType
        }
    },
    updateCssFile: {
        response: {
            fileName: string,
            fileSrc: FileSrcType,
            cssFile: CssFileType
        }
    },
    updateDataFile: {
        response: {
            fileName: string, 
            fileSrc: FileSrcType,
            dataFile: WorkerDataFileType
        }
    },
    deleteFile: {
        response: {
            fileName: string  
        }
    }
}