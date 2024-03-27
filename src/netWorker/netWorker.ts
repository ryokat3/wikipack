import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { getMarkdownFile } from "../markdown/converter"
import { makeFileRegexChecker } from "../utils/appUtils"
import { MarkdownFileType } from "../fileTree/FileTreeType"
import { updateFileOfTree, getFileFromTree } from "../fileTree/FileTree"
import { ScanTreeFolderType } from "../fileTree/ScanTree"
import { getDir, addPath } from "../utils/appUtils"

function getFileStamp(header:Headers):string {
    const result = {
        etag: "",
        lastModified:""
    }

    function createFileStamp(data:typeof result):string {
        return (data.etag !== "" || data.lastModified !== "") ? `ETag=${data.etag};Last-Modified=${data.lastModified}` : new Date().toString()
    }

    header.forEach((key, value)=> {
        if (key.toLowerCase() === 'etag') {
            result.etag = value            
        }
        else if (key.toLowerCase() === 'last-modified') {
            result.lastModified = value            
        }
    })
    return createFileStamp(result)
}

function getPageUrl(url:string, page:string):string {
    return url + page
}


function isFileScanned(rootScanTree:ScanTreeFolderType, fileName:string):boolean {
    const result = getFileFromTree(rootScanTree, fileName)
    return (result !== undefined) && (result.type !== 'folder') && (result.status !== 'init')
}

async function fetchMarkdownFile(url:string, page:string, isMarkdownFile:(fileName:string)=>boolean):Promise<MarkdownFileType|undefined> {
    const response = await fetch(getPageUrl(url, page))
    if (response.ok) {
        const fileStamp = getFileStamp(response.headers)
        const markdown = await response.text()

        return getMarkdownFile(markdown, page, fileStamp, isMarkdownFile)
    }
    else {
        return undefined
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