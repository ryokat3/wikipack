import { FileTreeFolderType, convertFileTree } from "./FileTree"
import { FolderType, FileType } from "./FileTreeType"

export type FileTagFileType = {
    file: {
        type: 'file',
        timestamp: number
    }
}

export type FileTagFolderType = FileTreeFolderType<FileTagFileType>

function convertToFileTagType(fileData:FileType[keyof FileType]):FileTagFileType[keyof FileTagFileType] {
    return {
        type: 'file',
        timestamp: fileData.timestamp
    }
}

export function convertToFileTagFolder(folder:FolderType):FileTagFolderType {
    return convertFileTree(folder, convertToFileTagType)
}