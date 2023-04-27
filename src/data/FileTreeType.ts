import { FolderBase } from "./FileTree"

export type FileType = {
    markdown: {
        type: "markdown",
        markdown: string,
        timestamp: number,
        imageList: string[],
        linkList: string[]
    },
    css: {
        type: "css",
        css: string,
        timestamp: number  
    },
    data: {
        type: "data",
        dataRef: string,
        buffer: ArrayBuffer | string,
        timestamp: number,
        mime: string        
    }
}

export type DataFile = FileType['data']
export type MarkdownFile = FileType['markdown']
export type CssFile = FileType['css']
export type Folder = FolderBase<FileType>
