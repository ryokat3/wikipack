export type FileWorkerMessageMap = {
    openFile : {
        request: {
            handle: FileSystemFileHandle
        }
    },
    openDirectory: {
        request: {
            handle: FileSystemDirectoryHandle
        },
        response: void
    },
    updateMarkdown: {
        response: {
            fileName: string,
            markdown: string
        }
    }
}