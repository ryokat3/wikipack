export type FileWorkerMessageMap = {
    openFile : {
        request: {
            handle: FileSystemFileHandle
        },
        response: {
            fileName: string,
            markdown: string            
        }
    },
    openDirectory: {
        request: {
            handle: FileSystemDirectoryHandle
        },
        response: void
    }
}