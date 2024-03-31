import { WorkerMessageType, PartialDataFileType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { getMarkdownFile } from "../markdown/converter"
import { makeFileRegexChecker } from "../utils/appUtils"
import { MarkdownFileType } from "../fileTree/FileTreeType"
import { updateFileOfTree, getFileFromTree } from "../fileTree/FileTree"
import { ScanTreeFolderType } from "../fileTree/ScanTree"
import { getDir, addPath } from "../utils/appUtils"

function getFileStamp(headers:Headers):string {
    const fileStamp =  {
        etag: headers.get('ETag'),
        lastModified: headers.get('last-modified')
    }

    return Object.values(fileStamp).every((val)=>val === null) ? new Date().toString() : JSON.stringify(fileStamp)
}

function getPageUrl(url:string, page:string):string {
    return url + page
}

async function doFetch(url: string, method:'GET'|'HEAD', headers:HeadersInit|undefined=undefined): Promise<Response | undefined> {    
    try {
        return await fetch(url, { method:method, headers:(headers!==undefined) ? headers : {} })
    }
    catch (error) {
        console.log(`Failed to fetch ${url}: ${error}`)
        return undefined
    }
}

async function fetchFile(url: string, fileStamp: string|undefined, skipHead:boolean, headers:HeadersInit|undefined=undefined): Promise<Response | undefined> {
    if (skipHead || fileStamp === null) {
        return await doFetch(url, 'GET', headers)
    }
    else {
        const headResponse = await doFetch(url, 'HEAD', headers)
        if (headResponse === undefined) {
            return undefined
        }
        else if (getFileStamp(headResponse.headers) === fileStamp) {
            return undefined
        }
        else {
            return await doFetch(url, 'GET', headers)
        }        
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

async function fetchMarkdownFile(url:string, page:string, fileStamp:string|undefined, skipHead:boolean, isMarkdownFile:(fileName:string)=>boolean):Promise<MarkdownFileType|undefined> {
    const response = await fetchFile(getPageUrl(url, page), fileStamp, skipHead)
    if (response !== undefined) {
        const markdownText = await response.text()
        const fileStamp = getFileStamp(response.headers)

        if (response.ok) {
            return getMarkdownFile(markdownText, page, fileStamp, isMarkdownFile)
        }
        else {
            return undefined
        }
    }
    return undefined
}

async function fetchDataFile(url:string, page:string, fileStamp:string|undefined, skipHead:boolean):Promise<PartialDataFileType|undefined> {
    const response = await fetchFile(getPageUrl(url, page), fileStamp, skipHead)
    if ((response !== undefined) && (response.ok)) {
        const buffer = await response.arrayBuffer()
        const fileStamp = getFileStamp(response.headers)
        const mime = response.headers.get('Content-Type') || 'application/octet-stream'

        return {
            type: "data",
            fileStamp: fileStamp,
            mime: mime,
            buffer: buffer            
        }
    }
    return undefined
}

async function scanUrlMarkdownHandler(url:string, fileName:string, rootScanTree:ScanTreeFolderType, postEvent:PostEvent<WorkerMessageType>, isMarkdownFile:(fileName:string)=>boolean) {

    const result = getFileFromTree(rootScanTree, fileName)

    if ((result === undefined) || ((result.type !== 'folder') && (result.status === 'init'))) {                
        const markdownFile = await fetchMarkdownFile(url, fileName, result?.fileStamp, false, isMarkdownFile)

        if (markdownFile !== undefined) {
            updateMakedownFile(fileName, markdownFile, rootScanTree, postEvent);
            
            markdownFile.markdownList.forEach((link: string) => {
                scanUrlMarkdownHandler(url, addPath(getDir(fileName), link), rootScanTree, postEvent, isMarkdownFile)
            });
        
            [...markdownFile.imageList, ...markdownFile.linkList].forEach(async (link: string) => {
                const dataFileName = addPath(getDir(fileName), link)
                const dataFile = await fetchDataFile(url, dataFileName, result?.fileStamp, false)
                if (dataFile !== undefined) {
                    postEvent.send("updateDataFile", {
                        fileName: dataFileName,            
                        dataFile: dataFile
                    })                
                    updateFileOfTree(rootScanTree, fileName, {
                        type: "data",
                        fileStamp: dataFile.fileStamp,
                        status: 'found'
                    })
                }
            })
        }
    }    
}

export async function scanUrlWorkerCallback(payload:WorkerMessageType['scanUrl']['request'], postEvent:PostEvent<WorkerMessageType>){                
    const rootScanTree = payload.rootScanTree    
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)

    scanUrlMarkdownHandler(payload.url, payload.topPage, rootScanTree, postEvent, isMarkdownFile)
}

export async function downloadCssFilelWorkerCallback(payload: WorkerMessageType['downloadCssFile']['request'], postEvent: PostEvent<WorkerMessageType>) {    
    const response = await fetchFile(payload.url, payload.fileStamp, payload.skipHead)
    if (response !== undefined) {
        const css = await response.text()
        const fileStamp = getFileStamp(response.headers)
        if (payload.fileStamp !== fileStamp) {            
            postEvent.send('updateCssFile', {
                fileName: payload.fileName,
                cssFile: {
                    type: "css",
                    css: css,
                    fileStamp: fileStamp
                }
            })
        }
        else {
            console.log(`${payload.url} not changed`)
        }
    }
}