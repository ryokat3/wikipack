//
type FileWorkerMessageMap = {
    openFile : {
        handle: FileSystemFileHandle
    },
    openDirectory: {
        handle: FileSystemDirectoryHandle
    }
}

export type GetFileWorkerMessageType<Key extends keyof FileWorkerMessageMap> = {
    type: Key,
    payload: FileWorkerMessageMap[Key]
}

export type FileWorkerMessageType = GetFileWorkerMessageType<keyof FileWorkerMessageMap>


//
type FileWorkerResponseMap = {
    markdownFile : {
        fileName: string,
        markdown: string
    }
}

export type GetFileWorkerResponseType<Key extends keyof FileWorkerResponseMap> = {
    type: Key,
    payload: FileWorkerResponseMap[Key]
}

export type FileWorkerResponseType = GetFileWorkerResponseType<keyof FileWorkerResponseMap>