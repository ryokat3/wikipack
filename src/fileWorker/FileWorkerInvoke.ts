import { Folder } from "../markdown/FileTree"

export type FileWorkerMessageMap = {
    openFile : {
        request: {
            handle: FileSystemFileHandle
        }
    },
    openDirectory: {
        request: {
            handle: FileSystemDirectoryHandle
        }
    },
    updateMarkdownFile: {
        response: {
            fileName: string,
            markdown: string
        }
    },
    updateRootFolder: {
        response: {
            rootFolder: Folder
        }
    }
}