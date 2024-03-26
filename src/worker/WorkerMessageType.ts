import { MarkdownFileType, CssFileType, DataFileType} from "../fileTree/FileTreeType"
import { ScanTreeFolderType } from "../fileTree/ScanTree"

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
            rootScanTree: ScanTreeFolderType,
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
            rootScanTree: ScanTreeFolderType,
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