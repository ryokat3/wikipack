
declare interface DataTransferItem {
    getAsFileSystemHandle: ()=>Promise<FileSystemFileHandle|FileSystemDirectoryHandle>
}


declare interface FileSystemDirectoryHandle {
    entries: () => Promise<[string, FileSystemHandle]>[]
}
