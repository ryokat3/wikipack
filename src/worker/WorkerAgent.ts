import { WorkerInvoke } from "../utils/WorkerMessage"
import { WorkerMessageType } from "../worker/WorkerMessageType"
import { ConfigType } from "../config"


export class WorkerAgent {
    readonly worker: WorkerInvoke<WorkerMessageType>
    readonly config: ConfigType
       
    mode: 'directory' | 'url' | undefined = undefined
    directory: FileSystemDirectoryHandle | undefined = undefined
    URL: string | undefined  = undefined

    constructor(worker:WorkerInvoke<WorkerMessageType>, config:ConfigType) {
        this.worker = worker
        this.config = config

        this.worker.addEventHandler("searchDirectoryDone", (payload)=>this.searchDirectoryDone(payload))
        this.worker.addEventHandler("searchURLDone", (payload)=>this.searchURLDone(payload))
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
}