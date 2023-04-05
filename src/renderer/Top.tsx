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
        
    useEffect(() => {        
        const fileName = state.fileName || state.topMarkdown
        if (fileName !== undefined) {
            console.log("fileName not null")
            const content = getEmbeddedFile(fileName)
            if (content !== undefined) {
                console.log("content not null")
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

    useEffect(() => {
        setupDragAndDrop(dispatcher, props.fileWorker)
    }, [])
    
    const context = {
        dispatcher: dispatcher,
        fileWorker: props.fileWorker      
    }

    return <TopContext.Provider value={context}>
        <SearchAppBar topMarkdown={state.fileName !== undefined ? state.fileName : "Not defined"}></SearchAppBar>
        <MarkdownView markdownData={state.markdown}></MarkdownView>
    </TopContext.Provider>
}