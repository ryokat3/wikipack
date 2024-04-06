import { FileTreeFolderType } from "./FileTree"
import { WikiFileHandlerForUrl } from "../netWorker/netWorker"
import { WikiFileHandlerForFileHandle, WikiFileHandlerForDirHandle }  from "../fileWorker/fileRW"
import { getMarkdownLink }  from "../markdown/converter"
import { getDir } from "../utils/appUtils"

export type MarkdownLinkType = {
    imageList: string[],
    linkList: string[],
    markdownList: string[]

}

export type WikiFileType = {
    markdown: {
        type: "markdown",
        markdown: string,
        fileStamp: string,
    } & MarkdownLinkType,
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

export type DataFileType = WikiFileType['data']
export type MarkdownFileType = WikiFileType['markdown']
export type CssFileType = WikiFileType['css']
export type WorkerDataFileType = Omit<Omit<DataFileType, 'dataRef'>, 'buffer'> & { buffer: ArrayBuffer}

export type FolderType = FileTreeFolderType<WikiFileType>

/////////////////////////////////////////////////////////////////////////////////
// ExtBlob
/////////////////////////////////////////////////////////////////////////////////

export type WikiBlobType = {
    dirHandle: {
        type: "dirHandle"
        dirHandle: FileSystemDirectoryHandle
        fileName: string
    }
    fileHandle: {
        type: "fileHandle"
        fileHandle: FileSystemFileHandle
    }
    url: {
        type: "url"
        url: string
    }
}

////////////////////////////////////////////////////////////////////////////////
//                Success      Error
// ---------------------------------------
// init       =>  success      init
// error      =>  success      error
// success    =>  success      error
//
////////////////////////////////////////////////////////////////////////////////
export type WikiBlobStatus = 'init' | 'success' | 'error'

export function updateWikiBlobStatus(status:WikiBlobStatus, success:boolean):WikiBlobStatus {
    switch (status) {
        case 'init':
            return (success) ? 'success' : 'init'
        case 'error':
        case 'success':
            return (success) ? 'success' : 'error'
    }
}

export type WikiBlobData = {
    src: WikiBlobType[keyof WikiBlobType]
    fileStamp: string
    mime: string
}

export type WikiTextFileType = WikiBlobData & {
    data: string
}

export type WikiBinaryFileType = WikiBlobData & {
    data: ArrayBuffer
}

export type NO_UPDATE = 'NO_UPDATE'

export interface WikiBlobHandler {
    getFileData(): Promise<WikiBlobData | undefined>
    getTextFile(): Promise<WikiTextFileType | undefined>
    getBinaryFile(): Promise<WikiBinaryFileType | undefined>
}

export function getWikiBlobHandler(wikiBlob: WikiBlobType[keyof WikiBlobType]) {
    switch (wikiBlob.type) {
        case 'url':
            return new WikiFileHandlerForUrl(wikiBlob)            
        case 'fileHandle':
            return new WikiFileHandlerForFileHandle(wikiBlob)
        case 'dirHandle':
            return new WikiFileHandlerForDirHandle(wikiBlob)
    }
}

export class WikiBlobReader {

    readonly handler:WikiBlobHandler

    constructor(handler:WikiBlobHandler) {
        this.handler = handler
    }

    async readTextFile(fileStamp:string|undefined = undefined):Promise<WikiTextFileType|NO_UPDATE|undefined> {
        if (fileStamp !== undefined) {
            const fileData = await this.handler.getFileData()
            if (fileData === undefined) {
                return undefined
            }
            else if (fileData.fileStamp === fileStamp) {
                return 'NO_UPDATE'
            }
        }
        return await this.handler.getTextFile()
    }

    async readBinaryFile(fileStamp:string|undefined = undefined):Promise<WikiBinaryFileType|NO_UPDATE|undefined> {
        if (fileStamp !== undefined) {
            const fileData = await this.handler.getFileData()
            if (fileData === undefined) {
                return undefined
            }
            else if (fileData.fileStamp === fileStamp) {
                return 'NO_UPDATE'
            }
        }
        return await this.handler.getBinaryFile()
    }
}

export function isWikiFile<T>(target:T):target is Exclude<Exclude<T, "NO_UPDATE">, undefined> {
    return (target !== undefined) && (target !== "NO_UPDATE")
}

function convertToMarkdownFile(textFile:WikiTextFileType, dirPath:string, isMarkdownFile:(fileName:string)=>boolean):MarkdownFileType {
    return {
        ...getMarkdownLink(textFile.data, dirPath, isMarkdownFile),
        type: "markdown",
        markdown: textFile.data,
        fileStamp: textFile.fileStamp   
    }
}

function convertToDataFile(binaryFile:WikiBinaryFileType):WorkerDataFileType {
    return {
        type: "data",
        fileStamp: binaryFile.fileStamp,
        mime: binaryFile.mime,
        buffer: binaryFile.data
    }
}

function convertToCssFile(textFile:WikiTextFileType):CssFileType {
    return {        
        type: "css",
        css: textFile.data,
        fileStamp: textFile.fileStamp   
    }
}

async function convertFromWikiText<T>(handler:WikiBlobHandler, fileStamp:string|undefined, converter:(textFile:WikiTextFileType)=>T|NO_UPDATE|undefined) {
    const reader = new WikiBlobReader(handler)
    const wikiText = await reader.readTextFile(fileStamp)
    return (isWikiFile(wikiText)) ? converter(wikiText) : wikiText
}

async function convertFromWikiBinary<T>(handler:WikiBlobHandler, fileStamp:string|undefined, converter:(textFile:WikiBinaryFileType)=>T|NO_UPDATE|undefined) {
    const reader = new WikiBlobReader(handler)
    const wikiBinary = await reader.readBinaryFile(fileStamp)
    return (isWikiFile(wikiBinary)) ? converter(wikiBinary) : wikiBinary
}

export async function readMarkdownFile(handler:WikiBlobHandler, fileName:string, fileStamp:string|undefined, isMarkdownFile:(fileName:string)=>boolean):Promise<MarkdownFileType|NO_UPDATE|undefined> {
    return convertFromWikiText(handler, fileStamp, (textFile:WikiTextFileType)=>convertToMarkdownFile(textFile, getDir(fileName), isMarkdownFile))
}

export async function readDataFile(handler:WikiBlobHandler, fileStamp:string|undefined):Promise<WorkerDataFileType|NO_UPDATE|undefined> {
    return convertFromWikiBinary(handler, fileStamp, convertToDataFile)
}

export async function readCssFile(handler:WikiBlobHandler, fileStamp:string|undefined):Promise<CssFileType|NO_UPDATE|undefined> {
    return convertFromWikiText(handler, fileStamp, convertToCssFile)
}







