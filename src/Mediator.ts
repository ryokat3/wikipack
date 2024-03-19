import { WorkerInvoke } from "./utils/WorkerMessage"
import { WorkerMessageType } from "./worker/WorkerMessageType"
import { ConfigType } from "./config"
import { TopDispatcherType } from "./gui/TopDispatcher"
import { FolderType, FileType } from "./fileTree/FileTreeType"
import { createRootFolder, getFileFromTree, updateFileOfTree, deleteFileFromTree } from "./fileTree/FileTree"
import { collectCssFiles, CssInfo, updateCssInfo, applyCssInfo } from "./dataElement/styleElement"
import { normalizePath } from "./utils/appUtils"
import { getRenderer } from "./markdown/converter"
import { makeFileRegexChecker } from "./utils/appUtils"
import { getProxyDataClass } from "./utils/proxyData"

const NO_CURRENT_PAGE = ""

function isSameFile(oldF:FolderType|FileType[keyof FileType], newF:FileType[keyof FileType]):boolean {         
    return (oldF.type == newF.type) && (oldF.timestamp == newF.timestamp)
}

class MediatorData {
    rootFolder: FolderType = createRootFolder<FileType>()
    currentPage: string = ""
    currentCss: CssInfo = {}
    mode: 'directory' | 'url' | undefined = undefined
    directory: FileSystemDirectoryHandle | undefined = undefined
    URL: string | undefined = undefined
    seq: number = 0
}

export class Mediator extends MediatorData {
    readonly worker: WorkerInvoke<WorkerMessageType>
    readonly config: ConfigType
    readonly dispatcher: TopDispatcherType
    readonly isMarkdown: (name:string)=>boolean

    constructor(worker:WorkerInvoke<WorkerMessageType>, config:ConfigType, dispatcher: TopDispatcherType) {
        super()

        this.worker = worker
        this.config = config
        this.dispatcher = dispatcher

        this.isMarkdown = makeFileRegexChecker(this.config.markdownFileRegex)

        this.worker.addEventHandler("searchDirectoryDone", (payload)=>this.searchDirectoryDone(payload))
        this.worker.addEventHandler("searchURLDone", (payload)=>this.searchURLDone(payload))
        this.worker.addEventHandler("updateMarkdownFile", (payload)=>this.updateMarkdownFile(payload))
        this.worker.addEventHandler("updateCssFile", (payload)=>this.updateCssFile(payload))
        this.worker.addEventHandler("updateDataFile", (payload)=>this.updateDataFile(payload))
        this.worker.addEventHandler("deleteFile", (payload)=>this.deleteFile(payload))        
    }

    convertToHtml(fileName:string):string|undefined {
        const currentFile = getFileFromTree(this.rootFolder, fileName)
        return (currentFile !== undefined && currentFile.type === "markdown") ? getRenderer(this.rootFolder, fileName, this.isMarkdown)(currentFile.markdown) : undefined
    }

    searchDirectory(handle:FileSystemDirectoryHandle):void {        
        this.mode = "directory"
        this.directory = handle
        this.worker.request("searchDirectory", { 
            handle: handle,
            markdownFileRegex: this.config.markdownFileRegex,
            cssFileRegex: this.config.cssFileRegex               
        })        
    }

    searchURL(url:string):void {
        this.mode = "url"
        this.URL = url
        this.worker.request("searchURL", { 
            url: url,
            markdownFileRegex: this.config.markdownFileRegex,
            cssFileRegex: this.config.cssFileRegex
        })        
    }

    openFile(handle:FileSystemFileHandle,):void {
        this.mode = undefined
        this.worker.request("openFile", { 
            handle: handle,
            markdownFileRegex: this.config.markdownFileRegex,
        }) 
    }

    updateCurrentPage(filePath:string):void {
        this.currentPage = normalizePath(filePath)
        this.currentCss = updateCssInfo(this.currentCss, collectCssFiles(this.rootFolder, this.currentPage))

        // Update HTML
        const html = this.convertToHtml(this.currentPage)        
        this.dispatcher.updateHtml({ title: this.currentPage, html: (html !== undefined) ? html : `${this.currentPage} not found`})
        
        // Update CSS
        applyCssInfo(this.rootFolder, this.currentCss)
    }

    updateSeq(): void {
        this.seq = this.seq + 1        
        this.dispatcher.updateSeq({ seq:this.seq })        
    }

    resetRootFolder():void {
        this.currentPage = NO_CURRENT_PAGE
        this.currentCss = Object.create(null)
        this.rootFolder = createRootFolder<FileType>()
    }

    searchDirectoryDone(_payload:WorkerMessageType['searchDirectoryDone']['response']):void {
        if (this.mode === "directory" && this.directory !== undefined) {
            this.searchDirectory(this.directory)
        }        
    }

    searchURLDone(_payload:WorkerMessageType['searchURLDone']['response']):void {
        if (this.mode === "url" && this.URL !== undefined) {
            this.searchURL(this.URL)                
        }        
    }

    updateMarkdownFile(payload:WorkerMessageType['updateMarkdownFile']['response']):void {        
        const fileName = normalizePath(payload.fileName)
        const isSame = updateFileOfTree(this.rootFolder, fileName, payload.markdownFile, isSameFile)
        const isCurrentPageExist = getFileFromTree(this.rootFolder, this.currentPage) !== undefined
        
        if ((this.currentPage === NO_CURRENT_PAGE) || (isCurrentPageExist && this.currentPage === fileName && !isSame)) {            
            this.currentPage = fileName            
            const html = this.convertToHtml(this.currentPage)
            if (html !== undefined) {                
                this.dispatcher.updateHtml({ title: this.currentPage, html: html})
            }
        }
    }

    updateCssFile(payload:WorkerMessageType['updateCssFile']['response']):void {
        const fileName = normalizePath(payload.fileName)
        const isSame = updateFileOfTree(this.rootFolder, fileName, {
            type: "css",
            timestamp: payload.timestamp,
            css: payload.data
        }, isSameFile)
        
        if (!isSame) {
            this.seq = this.seq + 1
            this.currentCss = updateCssInfo({ ...this.currentCss, [fileName]: this.seq }, collectCssFiles(this.rootFolder, this.currentPage))
            if (fileName in Object.keys(this.currentCss)) {
                this.dispatcher.updateSeq({ seq: this.seq })
            }
        }    
    }

    updateDataFile(payload:WorkerMessageType['updateDataFile']['response']):void {
        const fileName = normalizePath(payload.fileName)
        const blob = new Blob( [payload.data], { type: payload.mime })
        const dataRef = URL.createObjectURL(blob)        
        const isSame = updateFileOfTree(this.rootFolder, fileName, {
            type: "data",
            dataRef: dataRef,
            buffer: payload.data,
            mime: payload.mime,
            timestamp: payload.timestamp
        }, isSameFile)
        
        if (!isSame) {
            const markdownFile = getFileFromTree(this.rootFolder, this.currentPage)
            if ((markdownFile !== undefined) && (markdownFile.type === "markdown") && (markdownFile.imageList.includes(fileName) || markdownFile.linkList.includes(fileName))) {
                const html = this.convertToHtml(this.currentPage)
                if (html !== undefined) {
                    this.dispatcher.updateHtml({ title: this.currentPage, html: html })
                }
            }
        }
    }

    deleteFile(payload:WorkerMessageType['deleteFile']['response']):void {
        const filePath = normalizePath(payload.fileName)        
        deleteFileFromTree(this.rootFolder, filePath)        
    }    
}

export const mediatorData = new MediatorData()
export const MediatorProxy = getProxyDataClass(Mediator, mediatorData)