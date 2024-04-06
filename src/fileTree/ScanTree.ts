import { FileTreeFolderType, convertFileTree } from "./FileTree"
import { FolderType, WikiFileType } from "./FileTreeType"

export type ScanTreeFileType = {
    file: {
        type: keyof WikiFileType,
        fileStamp: string,
        status: boolean
    }
}

export type ScanTreeFolderType = FileTreeFolderType<ScanTreeFileType>

function convertToScanTreeFile(fileData:WikiFileType[keyof WikiFileType]):ScanTreeFileType[keyof ScanTreeFileType] {
    return {
        type: fileData.type,
        fileStamp: fileData.fileStamp,
        status: false
    }
}

export function convertToScanTreeFolder(folder:FolderType):ScanTreeFolderType {
    return convertFileTree(folder, convertToScanTreeFile)
}