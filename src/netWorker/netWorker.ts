import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { getMarkdownFile } from "../markdown/converter"
import { makeFileRegexChecker } from "../utils/appUtils"
import { MarkdownFileType, CssFileType } from "../fileTree/FileTreeType"
import { updateFileOfTree, getFileFromTree } from "../fileTree/FileTree"
import { ScanTreeFolderType } from "../fileTree/ScanTree"
import { getDir, addPath } from "../utils/appUtils"


type FileStampType = {
    etag: string | null,
    lastModified: string | null    
}

function isFileStampType(target:any):target is FileStampType {
    return (typeof target === "object") && ('etag' in target) && ('lastModified' in target)
}

function convertToFileStamp(data:string|null):FileStampType|undefined {
    if (data === null) {
        return undefined
    }
    try {
        const fileStamp = JSON.parse(data)        
        if (isFileStampType(fileStamp)) {
            return fileStamp
        }
        return undefined
    }
    catch {
        return undefined
    }
}

function getFileStamp(header:Headers):string {

    const fileStampData:FileStampType = {        
        etag: null,
        lastModified: null
    }

    function createFileStamp(data:FileStampType):string {        
        return (data.etag !== null || data.lastModified !== null ) ? JSON.stringify(data) : new Date().toString()
    }

    header.forEach((value, key)=> {        
        if (key.toLowerCase() === 'etag') {            
            fileStampData.etag = value            
        }
        else if (key.toLowerCase() === 'last-modified') {            
            fileStampData.lastModified = value            
        }
    })
    return createFileStamp(fileStampData)
}

function getPageUrl(url:string, page:string):string {
    return url + page
}


function isFileScanned(rootScanTree:ScanTreeFolderType, fileName:string):boolean {
    const result = getFileFromTree(rootScanTree, fileName)
    return (result !== undefined) && (result.type !== 'folder') && (result.status !== 'init')
}

async function fetchMarkdownFile(url:string, page:string, isMarkdownFile:(fileName:string)=>boolean):Promise<MarkdownFileType|undefined> {
    const response = await fetch(getPageUrl(url, page), {
        mode: 'cors',
        headers: {
            'Access-Control-Request-Headers': 'Cache-Control'            
        }
    })
    if (response.ok) {
        const fileStamp = getFileStamp(response.headers)
        const markdown = await response.text()

        return getMarkdownFile(markdown, page, fileStamp, isMarkdownFile)
    }
    else {
        return undefined
    }    
}

async function convertResponseToCssFile(response:Response):Promise<CssFileType|undefined> {

    // TODO: delete
    response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`)
    })


    const fileStamp = getFileStamp(response.headers)
    const css = await response.text()

    return {
        type: "css",
        css: css,
        fileStamp: fileStamp
    }
}

function etagToHeader(etag:string|null): { 'If-None-Match'?: string } {
    return (etag !== null) ? { 'If-None-Match': etag } : {}
}

function lastModifiedToHeader(lastModified:string|null): { 'If-Modified-Since'?: string } {
    return (lastModified !== null) ? { 'If-Modified-Since': lastModified } : {}
}

function fileStampToHeader(fileStamp:FileStampType|undefined) {
    return (fileStamp !== undefined) ? { ...etagToHeader(fileStamp.etag), ...lastModifiedToHeader(fileStamp.lastModified) } : {}
}

async function fetchFile(url: string, fileStamp: FileStampType | undefined): Promise<Response | undefined> {
    try {
        const response = await fetch(url, (fileStamp !== undefined) ? {
            // mode: 'cors',        
            // headers: { ...fileStampToHeader(fileStamp), 'Cache-Control': 'no-cache' }            
            headers: fileStampToHeader(fileStamp)
        } : {})
        if (response.ok) {
            console.log(`fetch OK`)
            return response
        }
        else {
            console.log(`fetch Fail`)
            return undefined
        }
    }
    catch (error) {
        // Try simple request
        return (fileStamp !== undefined) ? fetchFile(url, undefined) : undefined        
    }
}

function updateMakedownFile(fileName:string, markdownFile:MarkdownFileType, rootScanTree:ScanTreeFolderType, postEvent:PostEvent<WorkerMessageType>) {
    postEvent.send("updateMarkdownFile", {
        fileName: fileName,            
        markdownFile: markdownFile
    })
    updateFileOfTree(rootScanTree, fileName, {
        type: 'markdown',
        fileStamp: markdownFile.fileStamp,
        status: 'found'
    })
}

async function scanUrlMarkdownHandler(url:string, fileName:string, rootScanTree:ScanTreeFolderType, postEvent:PostEvent<WorkerMessageType>, isMarkdownFile:(fileName:string)=>boolean) {

    if (!isFileScanned(rootScanTree, fileName)) {
        const markdownFile = await fetchMarkdownFile(url, fileName, isMarkdownFile)

        if (markdownFile !== undefined) {
            updateMakedownFile(fileName, markdownFile, rootScanTree, postEvent)
        }

        markdownFile?.markdownList.forEach((link:string)=>{            
            scanUrlMarkdownHandler(url, addPath(getDir(fileName), link), rootScanTree, postEvent, isMarkdownFile)
        })
    }
}

export async function scanUrlWorkerCallback(payload:WorkerMessageType['scanUrl']['request'], postEvent:PostEvent<WorkerMessageType>){                
    const rootScanTree = payload.rootScanTree    
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)

    scanUrlMarkdownHandler(payload.url, payload.topPage, rootScanTree, postEvent, isMarkdownFile)
}

export async function downloadCssFilelWorkerCallback(payload: WorkerMessageType['downloadCssFile']['request'], postEvent: PostEvent<WorkerMessageType>) {    
    const response = await fetchFile(payload.url, convertToFileStamp(payload.fileStamp))
    if (response !== undefined) {
        const cssFile = await convertResponseToCssFile(response)                
        if ((cssFile !== undefined) && (payload.fileStamp !== cssFile.fileStamp)) {            
            postEvent.send('updateCssFile', {
                fileName: payload.fileName,
                cssFile: cssFile
            })
        }
        else if ((cssFile !== undefined) && (payload.fileStamp === cssFile.fileStamp)) {
            console.log(`${payload.url} not changed`)
        }
    }
}