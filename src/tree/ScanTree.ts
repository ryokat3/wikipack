import { FileTreeFolderType, convertFileTree } from "./FileTree"
import { FolderType, WikiFileType } from "./WikiFile"

export type ScanTreeItemType = {
    file: {
        type: keyof WikiFileType,
        fileStamp: string,
        status: boolean
    }
}

export type ScanTreeFolderType = FileTreeFolderType<ScanTreeItemType>

function convertToScanTreeItem(fileData:WikiFileType[keyof WikiFileType]):ScanTreeItemType[keyof ScanTreeItemType] {
    return {
        type: fileData.type,
        fileStamp: fileData.fileStamp,
        status: false
    }
}

export function convertToScanTreeFolder(folder:FolderType):ScanTreeFolderType {
    return convertFileTree(folder, convertToScanTreeItem)
}