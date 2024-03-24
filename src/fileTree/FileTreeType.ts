import { FileTreeFolderType } from "./FileTree"

export type FileType = {
    markdown: {
        type: "markdown",
        markdown: string,
        fileStamp: string,
        imageList: string[],
        linkList: string[]
    },
    css: {
        type: "css",
        css: string,
        fileStamp: string  
    },
    data: {
        type: "data",
        dataRef: string,
        buffer: ArrayBuffer | string,
        fileStamp: string,
        mime: string        
    }
}

export type DataFileType = FileType['data']
export type MarkdownFileType = FileType['markdown']
export type CssFileType = FileType['css']

export type FolderType = FileTreeFolderType<FileType>