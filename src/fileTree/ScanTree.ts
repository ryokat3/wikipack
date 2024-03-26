import { FileTreeFolderType, convertFileTree } from "./FileTree"
import { FolderType, FileType } from "./FileTreeType"

export type ScanTreeStatus = 'init' | 'found' | 'error'

export type ScanTreeFileType = {
    file: {
        type: keyof FileType,
        fileStamp: string,
        status: ScanTreeStatus
    }
}

export type ScanTreeFolderType = FileTreeFolderType<ScanTreeFileType>

function convertToScanTreeFile(fileData:FileType[keyof FileType]):ScanTreeFileType[keyof ScanTreeFileType] {
    return {
        type: fileData.type,
        fileStamp: fileData.fileStamp,
        status: 'init'
    }
}

export function convertToScanTreeFolder(folder:FolderType):ScanTreeFolderType {
    return convertFileTree(folder, convertToScanTreeFile)
}