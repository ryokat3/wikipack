import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { getMarkdownFile } from "../markdown/converter"
import { makeFileRegexChecker } from "../utils/appUtils"
import { MarkdownFileType } from "../fileTree/FileTreeType"

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

export async function scanUrlWorkerCallback(payload:WorkerMessageType['scanUrl']['request'], postEvent:PostEvent<WorkerMessageType>){                
    
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)
    const markdownFile = await fetchMarkdownFile(payload.url, payload.topPage, isMarkdownFile)

    if (markdownFile !== undefined) {
        postEvent.send("updateMarkdownFile", {
            fileName: payload.topPage,            
            markdownFile: markdownFile
        })
    }
}