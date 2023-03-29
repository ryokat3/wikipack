import React from "react"
import { topDispatcher, TopDispatcherType } from "./TopDispatcher"
import { createContext, useEffect } from "react"
import { initialTopState, topReducer } from "./TopReducer"
import { MarkdownView } from "./MarkdownView"
import { AppConfig } from "../AppConfig"
import { getMarkdown } from "../fs/innerHtmlFS"

export interface TopContextType {
    dispatcher: TopDispatcherType    
    appConfig: AppConfig
}

export const TopContext = createContext<TopContextType>(Object.create(null))

export const Top: React.FunctionComponent<{}> = () => {
    const [state, dispatch] = React.useReducer(topReducer, initialTopState)
    const dispatcher = topDispatcher.build(dispatch)    
        
    useEffect(() => {
        // TODO: temporary solution.
        dispatcher.markdownUpdate(getMarkdown())
    }, [])

    const context = {
        dispatcher,        
        appConfig: state.appConfig
    }

    return <TopContext.Provider value={context}>        
        <MarkdownView markdownData={state.markdown}></MarkdownView>
    </TopContext.Provider>
}