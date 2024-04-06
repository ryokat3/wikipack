import { WorkerMessageType } from "../worker/WorkerMessageType"
import { PostEvent } from "../utils/WorkerMessage"
import { makeFileRegexChecker } from "../utils/appUtils"
import { readMarkdownFile, isWikiFile, getFileSrcHandler } from "../fileTree/WikiFile"

export async function checkCurrentPageWorkerCallback(payload: WorkerMessageType['checkCurrentPage']['request'], postEvent: PostEvent<WorkerMessageType>) {    
    const isMarkdownFile = makeFileRegexChecker(payload.markdownFileRegex)
    const markdownFile = await readMarkdownFile(getFileSrcHandler(payload.fileSrc), payload.fileName, payload.fileStamp, isMarkdownFile)
    
    let updated:boolean = false

    if (isWikiFile(markdownFile)) {        
        updated = true
        postEvent.send("updateMarkdownFile", {
            fileName: payload.fileName,
            fileSrc: markdownFile.fileSrc,          
            markdownFile: markdownFile
        })
    }
    postEvent.send("checkCurrentPageDone", { updated: updated} )    
}