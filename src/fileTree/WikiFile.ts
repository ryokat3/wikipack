import { FileTreeFolderType } from "./FileTree"
import { WikiFileHandlerForUrl } from "../netWorker/netWorker"
import { WikiFileHandlerForFileHandle, WikiFileHandlerForDirHandle }  from "../fileWorker/fileRW"
import { getTokenList }  from "../markdown/converter"
import { getDir } from "../utils/appUtils"

export type HeadingTokenType = {
    depth: number,
    text: string,
    id: string
}
export type TokenListType = {
    imageList: string[],
    linkList: string[],
    markdownList: string[]
    headingList: HeadingTokenType[]
}

export type WikiFileType = {
    markdown: {
        type: "markdown",
        markdown: string,
        fileStamp: string,
        fileSrc: FileSrcType,
    } & TokenListType,
    css: {
        type: "css",
        css: string,
        fileStamp: string,
        fileSrc: FileSrcType, 
    },
    data: {
        type: "data",
        dataRef: string,        
        buffer: ArrayBuffer,
        fileStamp: string,
        fileSrc: FileSrcType,
        mime: string        
    }
}

export type DataFileType = WikiFileType['data']
export type MarkdownFileType = WikiFileType['markdown']
export type CssFileType = WikiFileType['css']
export type WorkerDataFileType = Omit<DataFileType, 'dataRef'>

export type FolderType = FileTreeFolderType<WikiFileType>

/////////////////////////////////////////////////////////////////////////////////
// FileSrc
/////////////////////////////////////////////////////////////////////////////////

type FileSrcDefinition = {
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
    never: {
        type: "never",
    }
}

export type FileSrcType = FileSrcDefinition[keyof FileSrcDefinition]
export type UrlSrcType = FileSrcDefinition['url']
export type DirHandleSrcType = FileSrcDefinition['dirHandle']
export type FileHandleSrcType = FileSrcDefinition['fileHandle']
export type NeverSrcType = FileSrcDefinition['never']

////////////////////////////////////////////////////////////////////////////////
//                Success      Error
// ---------------------------------------
// init       =>  success      init
// error      =>  success      error
// success    =>  success      error
//
////////////////////////////////////////////////////////////////////////////////
export type FileSrcStatus = 'init' | 'success' | 'error'

export function updateWikiBlobStatus(status:FileSrcStatus, success:boolean):FileSrcStatus {
    switch (status) {
        case 'init':
            return (success) ? 'success' : 'init'
        case 'error':
        case 'success':
            return (success) ? 'success' : 'error'
    }
}

export type FileSrcData = {
    fileSrc: FileSrcType
    fileStamp: string
    mime: string
}

export type TextFileSrcType = FileSrcData & {
    data: string
}

export type BinaryFileSrcType = FileSrcData & {
    // TODO: data: ArrayBuffer | string
    data: ArrayBuffer
}

export type NO_UPDATE = 'NO_UPDATE'

export interface FileSrcHandler {
    getFileData(): Promise<FileSrcData | undefined>
    getTextFile(): Promise<TextFileSrcType | undefined>
    getBinaryFile(): Promise<BinaryFileSrcType | undefined>
}

export function getFileSrcHandler(fileSrc:FileSrcType) {
    switch (fileSrc.type) {
        case 'url':
            return new WikiFileHandlerForUrl(fileSrc)            
        case 'fileHandle':
            return new WikiFileHandlerForFileHandle(fileSrc)
        case 'dirHandle':
            return new WikiFileHandlerForDirHandle(fileSrc)
        case 'never':
            return new FileTreeSrcHandler(fileSrc)
    }
}

class FileTreeSrcHandler implements FileSrcHandler {
    constructor(_fileSrc:NeverSrcType) {        
    }
    getFileData():Promise<FileSrcData | undefined> {
        throw new Error()
    }
    getTextFile(): Promise<TextFileSrcType | undefined> {
        throw new Error()
    }
    getBinaryFile(): Promise<BinaryFileSrcType | undefined> {
        throw new Error()
    }

}

export class FileSrcReader {

    readonly handler:FileSrcHandler

    constructor(handler:FileSrcHandler) {
        this.handler = handler
    }

    async readTextFile(fileStamp:string|undefined = undefined):Promise<TextFileSrcType|NO_UPDATE|undefined> {
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

    async readBinaryFile(fileStamp:string|undefined = undefined):Promise<BinaryFileSrcType|NO_UPDATE|undefined> {
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

function convertToMarkdownFile(textFile:TextFileSrcType, dirPath:string, isMarkdownFile:(fileName:string)=>boolean):MarkdownFileType {
    return {
        ...getTokenList(textFile.data, dirPath, isMarkdownFile),
        type: "markdown",
        markdown: textFile.data,
        fileStamp: textFile.fileStamp,
        fileSrc: textFile.fileSrc   
    }
}

function convertToDataFile(binaryFile:BinaryFileSrcType):WorkerDataFileType {
    return {
        type: "data",
        fileStamp: binaryFile.fileStamp,
        fileSrc: binaryFile.fileSrc,
        mime: binaryFile.mime,
        buffer: binaryFile.data
    }
}

function convertToCssFile(textFile:TextFileSrcType):CssFileType {
    return {        
        type: "css",
        css: textFile.data,
        fileStamp: textFile.fileStamp,
        fileSrc: textFile.fileSrc   
    }
}

async function convertFromWikiText<T>(handler:FileSrcHandler, fileStamp:string|undefined, converter:(textFile:TextFileSrcType)=>T|NO_UPDATE|undefined) {
    const reader = new FileSrcReader(handler)
    const wikiText = await reader.readTextFile(fileStamp)
    return (isWikiFile(wikiText)) ? converter(wikiText) : wikiText
}

async function convertFromWikiBinary<T>(handler:FileSrcHandler, fileStamp:string|undefined, converter:(textFile:BinaryFileSrcType)=>T|NO_UPDATE|undefined) {
    const reader = new FileSrcReader(handler)
    const wikiBinary = await reader.readBinaryFile(fileStamp)
    return (isWikiFile(wikiBinary)) ? converter(wikiBinary) : wikiBinary
}

export async function readMarkdownFile(handler:FileSrcHandler, fileName:string, fileStamp:string|undefined, isMarkdownFile:(fileName:string)=>boolean):Promise<MarkdownFileType|NO_UPDATE|undefined> {
    return convertFromWikiText(handler, fileStamp, (textFile:TextFileSrcType)=>convertToMarkdownFile(textFile, getDir(fileName), isMarkdownFile))
}

export async function readDataFile(handler:FileSrcHandler, fileStamp:string|undefined):Promise<WorkerDataFileType|NO_UPDATE|undefined> {
    return convertFromWikiBinary(handler, fileStamp, convertToDataFile)
}

export async function readCssFile(handler:FileSrcHandler, fileStamp:string|undefined):Promise<CssFileType|NO_UPDATE|undefined> {
    return convertFromWikiText(handler, fileStamp, convertToCssFile)
}







