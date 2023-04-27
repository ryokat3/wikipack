import { FileTreeFolderType } from "./FileTree"

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

export type DataFileType = FileType['data']
export type MarkdownFileType = FileType['markdown']
export type CssFileType = FileType['css']

export type FolderType = FileTreeFolderType<FileType>
