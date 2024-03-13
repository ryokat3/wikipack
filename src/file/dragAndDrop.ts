import { WorkerInvoke } from "../utils/WorkerMessage"
import { WorkerMessageType } from "../worker/WorkerMessageType"
import { ConfigType } from "../config"
import { TopDispatcherType } from "../component/TopDispatcher"

async function ondropped(fileWorker:WorkerInvoke<WorkerMessageType>, dispatcher:TopDispatcherType, config:ConfigType, ev: Event) {    
    if (!(ev instanceof DragEvent)) {
        return
    }

    const items = ev.dataTransfer?.items
    if (items === undefined) {
        alert("No dropped item found")
        return
    }
    if (items.length > 1) {
        alert("Multiple items were dropped")
        return
    }
    
    const item = items[0]
    if (!('kind' in item)) {        
        console.log("item doesn't have kind property")        
    }
    else if (item.kind === 'file') {
        // TODO: 2024-03-10 Firefox doesn't support getAsFileSystemHandle
        //
        if (typeof item['getAsFileSystemHandle'] === 'function') {            
            const handle = await item.getAsFileSystemHandle()

            if (handle === null) {
                console.log("handle is null")
            }
            else if (!('kind' in handle)) {
                console.log("handle doesn't have kind property")
            }
            else if (handle.kind === 'file') {            
                dispatcher.resetRootFolder()
                fileWorker.request("openFile", {
                    handle: handle as FileSystemFileHandle,
                    markdownFileRegex: config.markdownFileRegex,
                })   
            }
            else if (handle.kind === 'directory') {            
                const rootHandle = handle as FileSystemDirectoryHandle            
                dispatcher.resetRootFolder()
                dispatcher.updatePackFileName({ name:rootHandle.name } )
                fileWorker.request("openDirectory", { 
                    handle: rootHandle,
                    markdownFileRegex: config.markdownFileRegex,
                    cssFileRegex: config.cssFileRegex
                })
            }
        }
        else {
            console.log(`"${navigator.userAgent}" not support getAsFileSystemHandle`)
            alert(`"${navigator.userAgent}" not support getAsFileSystemHandle`)
        }
    }
    else if (item.kind === 'string') {        
        item.getAsString((msg:string)=> {
            console.log(`string "${msg}" was dropped`)
            alert(`"${msg}" was dropped as string. Try again.`)
        })        
    }
    else {
        console.log("unknown object was dropped")
    }
}

export function setupDragAndDrop(fileWorker:WorkerInvoke<WorkerMessageType>, dispatcher:TopDispatcherType, config:ConfigType) {
    window.addEventListener('dragenter', function (e: Event) {
        e.stopPropagation()
        e.preventDefault()
    }, false)
    window.addEventListener('dragleave', function (e: Event) {
        e.stopPropagation()
        e.preventDefault()
    }, false)
    window.addEventListener('dragover', function (e: Event) {
        e.stopPropagation()
        e.preventDefault()
    }, false)
    window.addEventListener("drop", (e: Event) => {
        e.stopPropagation()
        e.preventDefault()
        ondropped(fileWorker, dispatcher, config, e)
    }, false)   
}