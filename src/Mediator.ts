import { WorkerInvoke } from "./utils/WorkerMessage"
import { WorkerMessageType } from "./worker/WorkerMessageType"
import { ConfigType } from "./config"
import { TopDispatcherType } from "./gui/TopDispatcher"
import { FolderType, WikiFileType, genHeadingTreeRoot } from "./tree/WikiFile"
import { createRootFolder, getFileFromTree, updateFileOfTree, deleteFileFromTree, FileTreeFolderType, walkThroughFileOfTree } from "./tree/FileTree"
import { updateCssElement } from "./dataElement/styleElement"
import { canonicalFileName, getDir, addPath } from "./utils/appUtils"
import { getRenderer } from "./markdown/converter"
import { makeFileRegexChecker, isURL, addPathToUrl } from "./utils/appUtils"
import { getProxyDataClass } from "./utils/proxyData"
import { PageTreeItemType, HtmlInfo } from "./tree/PageTree"
import { convertToScanTreeFolder } from "./tree/ScanTree"
import { setupDragAndDrop } from "./fileIO/dragAndDrop"
import { hasMarkdownFileElement } from "./dataElement/dataFromElement"
import { getNewCssList } from "./dataElement/styleElement"
import { HashInfo } from "./markdown/HashInfo"
import { CssRules } from "./css/CssRules"
import packageJson from "../package.json"

export const VERSION:string = packageJson.version

const NO_CURRENT_PAGE = ""

function isSameFile(oldF:FolderType|WikiFileType[keyof WikiFileType], newF:WikiFileType[keyof WikiFileType]):boolean {         
    return (oldF.type == newF.type) && (oldF.fileStamp == newF.fileStamp)
}

function getRootUrl():URL {
    const url: URL = new URL(window.location.href)
    url.hash = ""
    return url
}

class MediatorData {    
    readonly rootUrl: URL = getRootUrl()
    rootFolder: FolderType = createRootFolder<WikiFileType>()
    pageTreeRoot: FileTreeFolderType<PageTreeItemType> = createRootFolder<PageTreeItemType>()
    currentPage: string = NO_CURRENT_PAGE    
    mode: 'directory' | 'url' | undefined = undefined
    directory: FileSystemDirectoryHandle | undefined = undefined    
    seq: number = 0
    checkInterval: number = 1000
}

export class Mediator extends MediatorData {

    readonly worker: WorkerInvoke<WorkerMessageType>
    readonly config: ConfigType
    readonly dispatcher: TopDispatcherType
    readonly cssRules: CssRules
    readonly isMarkdown: (name:string)=>boolean

    constructor(worker:WorkerInvoke<WorkerMessageType>, config:ConfigType, dispatcher: TopDispatcherType) {
        super()

        this.worker = worker
        this.config = config
        this.dispatcher = dispatcher
        this.cssRules = new CssRules(config.cssRules)   

        this.isMarkdown = makeFileRegexChecker(this.config.markdownFileRegex)

        this.worker.addEventHandler("scanDirectoryDone", (payload)=>this.scanDirectoryDone(payload))
        this.worker.addEventHandler("scanUrlDone", (payload)=>this.scanUrlDone(payload))
        this.worker.addEventHandler("updateMarkdownFile", (payload)=>this.updateMarkdownFile(payload))
        this.worker.addEventHandler("updateCssFile", (payload)=>this.updateCssFile(payload))
        this.worker.addEventHandler("updateDataFile", (payload)=>this.updateDataFile(payload))
        this.worker.addEventHandler("deleteFile", (payload)=>this.deleteFile(payload))     
        this.worker.addEventHandler("checkCurrentPageDone", (payload)=>this.checkCurrentPageDone(payload))
    }
/*
    convertToHtml(fileName:string):HtmlInfo|undefined {
        const currentFile = getFileFromTree(this.rootFolder, fileName)
        const headingTree = genHeadingTreeRoot()
        const renderer = getRenderer(this.rootFolder, fileName, this.isMarkdown, headingTree)
        return (currentFile !== undefined && currentFile.type === "markdown") ? { html:`<div class="${this.config.markdownBodyClass}">${renderer(currentFile.markdown)}</div>`, heading: headingTree} : undefined
    }
*/
    convertToHtml(dirPath:string, markdownText:string):HtmlInfo {        
        const headingTree = genHeadingTreeRoot()
        const renderer = getRenderer(this.rootFolder, dirPath, this.isMarkdown, headingTree)
        return { html:`<div class="${this.config.markdownBodyClass}">${renderer(markdownText)}</div>`, heading: headingTree}
    }

    resetRootFolder():void {
        this.currentPage = NO_CURRENT_PAGE        
        this.rootFolder = createRootFolder<WikiFileType>()
        this.pageTreeRoot = createRootFolder<PageTreeItemType>()
    }

    scrollToElement(id:string):void {        
        const element = document.getElementById(id)
        if (element !== null) {            
            element.scrollIntoView({behavior:'smooth'})
        }
    }

    ////////////////////////////////////////////////////////////////////////
    // Handler for Application Setup
    ////////////////////////////////////////////////////////////////////////

    onGuiInitialized(): void {        
        const self = this        
        
        function gotoHashPage() {
            const hashInfo = HashInfo.fromURL(window.location.href)
                                                
            self.updateCurrentPage(hashInfo.fileName || self.config.topPage)    
            self.dispatcher.updateHeading({ heading: hashInfo.heading })        
        }
        window.addEventListener("hashchange", ()=>{            
            gotoHashPage()
        })

        this.updateSeq()        
        setupDragAndDrop(this)
    
        if (!hasMarkdownFileElement() && (this.rootUrl.protocol.toLowerCase() === 'http:' || this.rootUrl.protocol.toLowerCase() === 'https:')) {            
            this.scanUrl(this.rootUrl)            
        }        
        gotoHashPage()
    }

    ////////////////////////////////////////////////////////////////////////
    // Handler for React Dispatcher
    ////////////////////////////////////////////////////////////////////////

    updateCurrentPage(pagePath:string):void {
        
        this.currentPage = canonicalFileName(pagePath)        

        // Update HTML
        const htmlInfo = getFileFromTree(this.pageTreeRoot, this.currentPage)            
        if ((htmlInfo !== undefined) && (htmlInfo.type === "markdown")) {                                
            this.dispatcher.updateHtml({ title: this.currentPage, html: htmlInfo.html })            
        }
        else {
            this.dispatcher.updateHtml({ title: this.currentPage, html: `${this.currentPage} not found` })
        }
      
        // Update CSS
        const newCssList = getNewCssList(this.cssRules.getCssList(this.currentPage))        

        if (this.mode === undefined) {
            Object.entries(newCssList).forEach(([ fileName, fileStamp ])=>{
                if (isURL(fileName)) {
                    this.downloadCssFile(fileName, fileName, fileStamp)
                }
            })            
        }
        else if (this.mode === 'directory') {
            Object.entries(newCssList).forEach(([fileName, fileStamp])=>{
                if (isURL(fileName)) {
                    this.downloadCssFile(fileName, fileName, fileStamp)
                }
                else {
                    if (this.directory !== undefined) {
                        this.readCssFile(this.directory, addPath(getDir(this.currentPage), canonicalFileName(fileName)), undefined)
                    }
                }
            })             
        }
        else if (this.mode === 'url') {
            Object.entries(newCssList).forEach(([fileName, fileStamp])=>{
                if (isURL(fileName)) {
                    this.downloadCssFile(fileName, fileName, fileStamp)
                }
                else {
                    this.downloadCssFile(addPathToUrl(this.rootUrl.toString(), fileName, this.isMarkdown), canonicalFileName(fileName), fileStamp)
                }
            })
        }   
    }

    updateSeq():void {
        this.seq = this.seq + 1        
        this.dispatcher.updateSeq({ seq:this.seq })        
    }

    updatePackFileName(name:string):void {
        this.dispatcher.updatePackFileName({ name:name } )
    }

    ////////////////////////////////////////////////////////////////////////
    // Handler for Worker Message Requests
    ////////////////////////////////////////////////////////////////////////

    scanDirectory(handle:FileSystemDirectoryHandle):void {        
        this.mode = "directory"
        this.directory = handle
        this.worker.request("scanDirectory", { 
            handle: handle,
            rootScanTree: convertToScanTreeFolder(this.rootFolder),
            markdownFileRegex: this.config.markdownFileRegex            
        })        
    }

    scanDirectoryDone(payload:WorkerMessageType['scanDirectoryDone']['response']):void {
        console.log('scanDirectoryDone')
        if (this.mode === "directory" && this.directory !== undefined) {
            // TODO:
            window.setTimeout(()=>this.scanDirectory(payload.handle), 5000)
            // this.scanDirectory(this.directory)
        }
        this.checkCurrentPage()             
    }

    scanUrl(url:URL):void {
        this.mode = "url"        
        this.worker.request("scanUrl", { 
            url: url.href, // URL object is not cloned in Post,
            topPage: this.config.topPage,
            rootScanTree: convertToScanTreeFolder(this.rootFolder),
            markdownFileRegex: this.config.markdownFileRegex            
        })        
    }

    scanUrlDone(_payload:WorkerMessageType['scanUrlDone']['response']):void {        
        console.log('scanUrlDone')
        if (this.mode === "url") {
            // TODO:
            // window.setTimeout(()=>this.scanUrl(new URL(payload.url)), 5000)
        }
        this.checkCurrentPage()      
    }

    openFile(handle:FileSystemFileHandle,):void {
        this.mode = undefined
        this.worker.request("openFile", { 
            handle: handle,
            markdownFileRegex: this.config.markdownFileRegex,
        }) 
    }

    downloadCssFile(url:string, fileName:string, fileStamp:string|undefined, skipHead:boolean=false):void {        
        this.worker.request("downloadCssFile", {
            url: url,
            fileName: fileName,
            fileStamp: fileStamp,
            skipHead: skipHead
        })
    }

    readCssFile(handle:FileSystemDirectoryHandle, fileName:string, fileStamp:string|undefined):void {
        this.worker.request("readCssFile", {
            handle: handle,
            fileName: fileName,
            fileStamp: fileStamp
        })
    }

    checkCurrentPage(): void {
        if (this.currentPage !== undefined) {
            const currentFile = getFileFromTree(this.rootFolder, this.currentPage)
            if ((currentFile !== undefined) && (currentFile.type === 'markdown') && (currentFile.fileSrc.type !== 'never')) {
                this.worker.request("checkCurrentPage", {
                    fileSrc: currentFile.fileSrc,
                    pagePath: this.currentPage,
                    fileStamp: currentFile.fileStamp,
                    markdownFileRegex: this.config.markdownFileRegex                                
                })
                return
            }
        }
        this.checkInterval = Math.min(this.config.maxCheckInterval, this.checkInterval + 10)
        window.setTimeout(()=>this.checkCurrentPage(), this.checkInterval)
    }

    checkCurrentPageDone(payload:WorkerMessageType['checkCurrentPageDone']['response']):void {  
        this.checkInterval = (payload.updated) ? this.config.minCheckInterval : Math.min(this.config.maxCheckInterval, this.checkInterval + 10)
        window.setTimeout(()=>this.checkCurrentPage(), this.checkInterval)        
    }
    

    ////////////////////////////////////////////////////////////////////////
    // Handler for Worker Message Responses
    ////////////////////////////////////////////////////////////////////////

    updateMarkdownFile(payload:WorkerMessageType['updateMarkdownFile']['response']):void {      
        const pagePath = canonicalFileName(payload.pagePath)
        const isNewFile = getFileFromTree(this.rootFolder, pagePath) === undefined
        const isSame = updateFileOfTree(this.rootFolder, pagePath, payload.markdownFile, isSameFile)

        if (isNewFile || !isSame) {            
            const htmlInfo = this.convertToHtml(getDir(pagePath), payload.markdownFile.markdown)            
            updateFileOfTree(this.pageTreeRoot, pagePath, { ...htmlInfo, type: "markdown" })                            
            this.updateSeq()            
        }

        const markdownFile = getFileFromTree(this.rootFolder, this.currentPage)
        const isCurrentPageExist = markdownFile !== undefined
        
        if (this.currentPage === NO_CURRENT_PAGE) {
            window.location.hash = `#${pagePath}`            
        }
        else if (isCurrentPageExist && this.currentPage === pagePath && !isSame) {
            const htmlInfo = getFileFromTree(this.pageTreeRoot, this.currentPage)            
            if ((htmlInfo !== undefined) && (htmlInfo.type === "markdown")) {                
                this.dispatcher.updateHtml({ title: this.currentPage, html: htmlInfo.html})                
            }
        }          
    }

    updateCssFile(payload:WorkerMessageType['updateCssFile']['response']):void {        
        updateCssElement(payload.cssFile.css, canonicalFileName(payload.pagePath), payload.cssFile.fileStamp)  
    }

    updateDataFile(payload:WorkerMessageType['updateDataFile']['response']):void {
        
        const fileName = canonicalFileName(payload.pagePath)
        const blob = new Blob( [payload.dataFile.buffer], { type: payload.dataFile.mime })
        const dataRef = URL.createObjectURL(blob)        
        const isSame = updateFileOfTree(this.rootFolder, fileName, { ...payload.dataFile, dataRef: dataRef }, isSameFile)
        
        if (!isSame) {
            for (const [markdownFileName, fobj] of walkThroughFileOfTree(this.rootFolder)) {
                if ((fobj.type == "markdown") && (fobj.imageList.includes(fileName) || fobj.linkList.includes(fileName))) {
                    const htmlInfo = this.convertToHtml(getDir(markdownFileName), fobj.markdown)                    
                    updateFileOfTree(this.pageTreeRoot, markdownFileName, { ...htmlInfo, type: "markdown" })
                    if (markdownFileName === this.currentPage) {
                        this.dispatcher.updateHtml({ title: this.currentPage, html: htmlInfo.html })
                    }                    
                }
            }
        }
    }

    deleteFile(payload:WorkerMessageType['deleteFile']['response']):void {
        const filePath = canonicalFileName(payload.pagePath)        
        deleteFileFromTree(this.rootFolder, filePath)        
    }    
}

export const mediatorData = new MediatorData()
export const MediatorProxy = getProxyDataClass(Mediator, mediatorData)