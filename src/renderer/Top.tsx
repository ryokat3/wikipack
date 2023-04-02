import React from "react"
import { topDispatcher, TopDispatcherType } from "./TopDispatcher"
import { createContext, useEffect } from "react"
import { topReducer, initialTopState } from "./TopReducer"
import { MarkdownView } from "./MarkdownView"
import { SearchAppBar } from "./SearchAppBar"
import { getEmbeddedFile} from "../fs/embeddedFileFS"
import { setupDragAndDrop } from "../fs/dragAndDrop"


export interface TopContextType {
    dispatcher: TopDispatcherType        
}

export const TopContext = createContext<TopContextType>(Object.create(null))

export const Top: React.FunctionComponent<{}> = () => {
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
        setupDragAndDrop(dispatcher)
    }, [])

    const context = {
        dispatcher        
    }

    return <TopContext.Provider value={context}>
        <SearchAppBar topMarkdown={state.fileName !== undefined ? state.fileName : "Not defined"}></SearchAppBar>
        <MarkdownView markdownData={state.markdown}></MarkdownView>
    </TopContext.Provider>
}