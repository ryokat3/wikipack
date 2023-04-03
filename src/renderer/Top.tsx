import React from "react"
import { topDispatcher, TopDispatcherType } from "./TopDispatcher"
import { createContext, useEffect } from "react"
import { topReducer, initialTopState } from "./TopReducer"
import { MarkdownView } from "./MarkdownView"
import { SearchAppBar } from "./SearchAppBar"
import { getEmbeddedFile} from "../fs/embeddedFileFS"
import { setupDragAndDrop } from "../fs/dragAndDrop"
import { FileWorkerResponseType, GetFileWorkerResponseType } from "../fileWorker/message"


export interface TopContextType {
    dispatcher: TopDispatcherType,
    fileWorker: Worker        
}

export const TopContext = createContext<TopContextType>(Object.create(null))

export interface TopProps {
    fileWorker: Worker
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

    useEffect(() => {
        props.fileWorker.onmessage = function (e:MessageEvent<FileWorkerResponseType>) {
            if (e.data.type === "markdownFile") {
                const response = e.data as GetFileWorkerResponseType<"markdownFile">
                dispatcher.currentPageUpdate({
                    fileName: response.payload.fileName,
                    markdown: response.payload.markdown
                })
            }
        }
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