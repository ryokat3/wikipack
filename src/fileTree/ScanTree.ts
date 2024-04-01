import { FileTreeFolderType, convertFileTree } from "./FileTree"
import { FolderType, FileType } from "./FileTreeType"

export type ScanTreeFileType = {
    file: {
        type: keyof FileType,
        fileStamp: string,
        status: boolean
    }
}

export type ScanTreeFolderType = FileTreeFolderType<ScanTreeFileType>

function convertToScanTreeFile(fileData:FileType[keyof FileType]):ScanTreeFileType[keyof ScanTreeFileType] {
    return {
        type: fileData.type,
        fileStamp: fileData.fileStamp,
        status: false
    }
}

export function convertToScanTreeFolder(folder:FolderType):ScanTreeFolderType {
    return convertFileTree(folder, convertToScanTreeFile)
}