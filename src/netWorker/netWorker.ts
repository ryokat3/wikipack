import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
// import { getMarkdownFile } from "../markdown/converter"
import { makeFileRegexChecker } from "../utils/appUtils"
import { /* MarkdownFileType, WorkerDataFileType, CssFileType , */ UrlSrcType, FileSrcType, FileSrcHandler, BinaryFileSrcType, FileSrcData, TextFileSrcType, readMarkdownFile, isWikiFile, getFileSrcHandler, readDataFile, readCssFile } from "../fileTree/WikiFile"
import { updateFileOfTree, /* getFileFromTree,*/ reduceFileOfTree, getFileFromTree } from "../fileTree/FileTree"
import { ScanTreeFileType, ScanTreeFolderType } from "../fileTree/ScanTree"
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

export class WikiFileHandlerForUrl implements FileSrcHandler {
    static readonly DEFAULT_TEXT_FILE_MIME = 'text/plain'
    static readonly DEFAULT_BINARY_FILE_MIME = 'application/octet-stream'

    readonly fileSrc:UrlSrcType

    constructor(fileSrc:UrlSrcType) {        
        this.fileSrc = fileSrc
    }

    async getFileData():Promise<FileSrcData|undefined> {
        const response = await doFetch(this.fileSrc.url, 'HEAD', undefined)
        return (response !== undefined) ? {
                fileSrc: this.fileSrc,
                fileStamp: getFileStamp(response.headers),
                mime: response.headers.get('Content-Type') || ''
            } : undefined        
    }

    async getTextFile():Promise<TextFileSrcType|undefined> {
        const response = await doFetch(this.fileSrc.url, 'GET', undefined)
        return (response !== undefined) ? {
                fileSrc: this.fileSrc,
                fileStamp: getFileStamp(response.headers),
                mime: response.headers.get('Content-Type') || WikiFileHandlerForUrl.DEFAULT_TEXT_FILE_MIME,
                data: await response.text()
            } : undefined        
    }

    async getBinaryFile():Promise<BinaryFileSrcType|undefined> {
        const response = await doFetch(this.fileSrc.url, 'GET', undefined)
        return (response !== undefined) ? {
                fileSrc: this.fileSrc,
                fileStamp: getFileStamp(response.headers),
                mime: response.headers.get('Content-Type') || WikiFileHandlerForUrl.DEFAULT_BINARY_FILE_MIME,
                data: await response.arrayBuffer()
            } : undefined
    }    
}

async function scanUrlMarkdownHandler(url: string, fileName: string, fileData:ScanTreeFileType['file'], rootScanTree:ScanTreeFolderType, postEvent: PostEvent<WorkerMessageType>, isMarkdownFile: (fileName: string) => boolean):Promise<Set<string>> {
    
    if (fileData.status === false) {
        fileData.status = true
        const fileSrc:FileSrcType = { type: "url", url: getPageUrl(url, fileName) }    
        const handler = getFileSrcHandler(fileSrc)

        if (fileData.type === "markdown") {
           const markdownFile = await readMarkdownFile(handler, fileName, fileData.fileStamp, isMarkdownFile)
            
           
           if (isWikiFile(markdownFile)) {
                postEvent.send("updateMarkdownFile", {
                    fileName: fileName,
                    fileSrc: fileSrc,          
                    markdownFile: markdownFile
                })                

                return [...markdownFile.markdownList, ...markdownFile.imageList, ...markdownFile.linkList].reduce<Set<string>>((acc, link)=>{
                    const linkName = addPath(getDir(fileName), link)                    
                    return (getFileFromTree(rootScanTree, linkName) === undefined) ? acc.add(addPath(getDir(fileName), link)) : acc
                }, new Set<string>());
            }                                        
        }
        else {                                    
            const dataFile = await readDataFile(handler, fileData.fileStamp)
            if (isWikiFile(dataFile)) {            
                postEvent.send("updateDataFile", {
                    fileName: fileName,
                    fileSrc: fileSrc,            
                    dataFile: dataFile
                })                
            }
        }
    }
    return new Set<string>()
}

export async function scanUrlWorkerCallback(payload: WorkerMessageType['scanUrl']['request'], postEvent: PostEvent<WorkerMessageType>) {
    const rootScanTree = payload.rootScanTree
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)

    while (true) {
        const fileNameSet = await reduceFileOfTree(rootScanTree, "", async (fileName: string, fileData: ScanTreeFileType['file'], _acc: Promise<Set<string>>): Promise<Set<string>> => {            
            if (fileData.status == false) {
                const acc = Array.from(await _acc)
                const notInTree = Array.from(await scanUrlMarkdownHandler(payload.url, fileName, fileData, rootScanTree, postEvent, isMarkdownFile))                
                return new Set([...acc, ...notInTree])
            }
            else {
                return _acc
            }
        }, new Promise((resolv) => resolv(new Set<string>())));
        if (fileNameSet.size > 0) {
            for (const fileName of Array.from(fileNameSet)) {
                updateFileOfTree(rootScanTree, fileName, {
                    type: isMarkdownFile(fileName) ? "markdown" : "data",
                    fileStamp: "",
                    status: false
                })
            }
            continue
        }
        else {
            break
        }
    }
    postEvent.send("scanUrlDone", { url:payload.url })
}

export async function downloadCssFilelWorkerCallback(payload: WorkerMessageType['downloadCssFile']['request'], postEvent: PostEvent<WorkerMessageType>) {
    const fileSrc:FileSrcType = { type:'url', url:payload.url}
    const cssFile = await readCssFile(getFileSrcHandler(fileSrc), payload.fileStamp)
    if (isWikiFile(cssFile)) {
        postEvent.send('updateCssFile', {
            fileName: payload.fileName,
            fileSrc: fileSrc,
            cssFile: cssFile
        })        
    }
}