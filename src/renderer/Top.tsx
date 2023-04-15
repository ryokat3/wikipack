import React from "react"
import { topDispatcher, TopDispatcherType } from "./TopDispatcher"
import { createContext, useEffect } from "react"
import { topReducer, initialTopState } from "./TopReducer"
import { MarkdownView } from "./MarkdownView"
import { SearchAppBar } from "./SearchAppBar"
import { getEmbeddedFile} from "../fs/embeddedFileFS"
import { setupDragAndDrop } from "../fs/dragAndDrop"
import { WorkerInvoke } from "../utils/WorkerInvoke"
import { FileWorkerMessageMap } from "../fileWorker/FileWorkerInvoke"
import { getFile } from "../markdown/FileTree"

export interface TopContextType {
    dispatcher: TopDispatcherType,
    fileWorker: WorkerInvoke<FileWorkerMessageMap>       
}

export const TopContext = createContext<TopContextType>(Object.create(null))

export interface TopProps {
    fileWorker: WorkerInvoke<FileWorkerMessageMap>
}

export const Top: React.FunctionComponent<TopProps> = (props:TopProps) => {
    const [state, dispatch] = React.useReducer(topReducer, initialTopState)
    const dispatcher = topDispatcher.build(dispatch)

    const currentFile = getFile(state.rootFolder, state.currentPage)
/*
    useEffect(() => {        
        if (currentFile === undefined) {            
            const content = getEmbeddedFile(state.config.topPage)
            if (content !== undefined) {                
                dispatcher.currentPageUpdate({
                    fileName: fileName,
                    markdown: content
                })
            }
            return
        }
        // No top markdown file
        // TODO: show something          
    }, [])
*/

    useEffect(() => {
        props.fileWorker.addEventHandler("updateMarkdownFile", (payload)=>dispatcher.updateMarkdownFile(payload))
        props.fileWorker.addEventHandler("updateRootFolder", (payload)=>dispatcher.updateRootFolder(payload))         
        setupDragAndDrop(props.fileWorker)
    }, [])
    
    const context = {
        dispatcher: dispatcher,
        fileWorker: props.fileWorker      
    }
    

    return <TopContext.Provider value={context}>
        <SearchAppBar topMarkdown={(currentFile !== undefined) && (currentFile.type === "markdown") ? state.currentPage : "Not defined"}></SearchAppBar>
        <MarkdownView markdownData={(currentFile !== undefined) && (currentFile.type === "markdown") ? currentFile.markdown : getEmbeddedFile("")}></MarkdownView>
    </TopContext.Provider>
}