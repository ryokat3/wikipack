import { FileTreeFolderType, convertFileTree } from "./FileTree"
import { FolderType, FileType } from "./FileTreeType"

export type FileStampFileType = {
    file: {
        type: 'file',
        fileStamp: string
    }
}

export type FileStampFolderType = FileTreeFolderType<FileStampFileType>

function convertToFileStampType(fileData:FileType[keyof FileType]):FileStampFileType[keyof FileStampFileType] {
    return {
        type: 'file',
        fileStamp: fileData.fileStamp
    }
}

export function convertToFileStampFolder(folder:FolderType):FileStampFolderType {
    return convertFileTree(folder, convertToFileStampType)
}