import { WorkerMessageType, PartialDataFileType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { getMarkdownFile } from "../markdown/converter"
import { makeFileRegexChecker } from "../utils/appUtils"
import { MarkdownFileType, CssFileType } from "../fileTree/FileTreeType"
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

async function doHeadAndGet(url: string, fileStamp: string|undefined, skipHead:boolean, headers:HeadersInit|undefined=undefined): Promise<Response | undefined> {
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

async function fetchFile<T>(url: string, fileStamp: string|undefined, converter:(response:Response)=>Promise<T>, skipHead:boolean, headers:HeadersInit|undefined=undefined): Promise<T | undefined> {
    const response = await doHeadAndGet(url, fileStamp, skipHead, headers)
    return ((response !== undefined) && response.ok) ? await converter(response) : undefined
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

function updateDataFile(fileName:string, dataFile:PartialDataFileType, rootScanTree:ScanTreeFolderType, postEvent:PostEvent<WorkerMessageType>) {
    postEvent.send("updateDataFile", {
        fileName: fileName,            
        dataFile: dataFile
    })                
    updateFileOfTree(rootScanTree, fileName, {
        type: "data",
        fileStamp: dataFile.fileStamp,
        status: 'found'
    })
}

// 
async function convertResponseToDataFile(response:Response):Promise<PartialDataFileType> {    
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

async function convertResponseToCssFile(response: Response): Promise<CssFileType> {
    const css = await response.text()
    const fileStamp = getFileStamp(response.headers)

    return {
        type: "css",
        css: css,
        fileStamp: fileStamp
    }
}

async function convertResponseToMarkdownFile(response:Response, page:string, isMarkdownFile:(fileName:string)=>boolean):Promise<MarkdownFileType> {
        const markdownText = await response.text()
    const fileStamp = getFileStamp(response.headers)
    return getMarkdownFile(markdownText, page, fileStamp, isMarkdownFile)
}

async function scanUrlMarkdownHandler(url: string, fileName: string, rootScanTree: ScanTreeFolderType, postEvent: PostEvent<WorkerMessageType>, isMarkdownFile: (fileName: string) => boolean) {

    const result = getFileFromTree(rootScanTree, fileName)

    if ((result === undefined) || ((result.type !== 'folder') && (result.status === 'init'))) {
        if (isMarkdownFile(fileName)) {
            const converter = (response: Response) => convertResponseToMarkdownFile(response, fileName, isMarkdownFile)
            const markdownFile = await fetchFile(getPageUrl(url, fileName), fileName, converter, false)

            if ((markdownFile !== undefined) && (markdownFile.fileStamp !== result?.fileStamp)) {
                updateMakedownFile(fileName, markdownFile, rootScanTree, postEvent)

                for (const link of [...markdownFile.markdownList, ...markdownFile.imageList, ...markdownFile.linkList]) {                    
                    await scanUrlMarkdownHandler(url, addPath(getDir(fileName), link), rootScanTree, postEvent, isMarkdownFile)
                }
            }
        }
        else {                        
            const dataFile = await fetchFile(getPageUrl(url, fileName), fileName, convertResponseToDataFile, false)
            if ((dataFile !== undefined) && (dataFile.fileStamp !== result?.fileStamp)) {
                updateDataFile(fileName, dataFile, rootScanTree, postEvent)
            }            
        }
    }
}

export async function scanUrlWorkerCallback(payload:WorkerMessageType['scanUrl']['request'], postEvent:PostEvent<WorkerMessageType>){                
    const rootScanTree = payload.rootScanTree    
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)

    await scanUrlMarkdownHandler(payload.url, payload.topPage, rootScanTree, postEvent, isMarkdownFile)

    postEvent.send("scanUrlDone", { url:payload.url })
}

export async function downloadCssFilelWorkerCallback(payload: WorkerMessageType['downloadCssFile']['request'], postEvent: PostEvent<WorkerMessageType>) {
    const cssFile = await fetchFile(payload.url, payload.fileStamp, convertResponseToCssFile, payload.skipHead)
    if ((cssFile !== undefined) && (cssFile?.fileStamp !== payload.fileStamp)) {
        postEvent.send('updateCssFile', {
            fileName: payload.fileName,
            cssFile: cssFile
        })
    }
}