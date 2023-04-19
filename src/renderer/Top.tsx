import React from "react"
import { topDispatcher, TopDispatcherType } from "./TopDispatcher"
import { createContext, useEffect } from "react"
import { topReducer, TopStateType } from "./TopReducer"
import { MarkdownView } from "./MarkdownView"
import { SearchAppBar } from "./SearchAppBar"
import { getEmbeddedFile} from "../fs/embeddedFileFS"
import { setupDragAndDrop } from "../fs/dragAndDrop"
import { WorkerInvoke } from "../utils/WorkerInvoke"
import { FileWorkerMessageMap } from "../fileWorker/FileWorkerInvoke"
import { getFile, createRootFolder } from "../markdown/FileTree"
import { ConfigType } from "../config"
import { saveThisDocument } from "../fs/localFileFS"

export interface TopContextType {
    dispatcher: TopDispatcherType,
    fileWorker: WorkerInvoke<FileWorkerMessageMap>       
}

export const TopContext = createContext<TopContextType>(Object.create(null))

export interface TopProps {
    fileWorker: WorkerInvoke<FileWorkerMessageMap>
    config: ConfigType
}

export const Top: React.FunctionComponent<TopProps> = (props:TopProps) => {
    const initialState:TopStateType = {
        config: props.config,
        rootFolder: createRootFolder(),
        currentPage: props.config.topPage,
        seq: 0
    }
    const [state, dispatch] = React.useReducer(topReducer, initialState)
    const dispatcher = topDispatcher.build(dispatch)    
    const context = {
        dispatcher: dispatcher,
        fileWorker: props.fileWorker      
    }

    // Call once
    useEffect(() => {
        props.fileWorker.addEventHandler("updateMarkdownFile", (payload)=>dispatcher.updateMarkdownFile(payload))
        props.fileWorker.addEventHandler("updateDataFile", (payload)=>dispatcher.updateDataFile(payload))
        setupDragAndDrop(props.fileWorker, dispatcher, props.config)
        _open_markdown = function(name:string) {
            dispatcher.updateCurrentPage({ name:name })
        }
    }, [])

    const currentFile = getFile(state.rootFolder, state.currentPage)    
    
    return <TopContext.Provider value={context}>
        <SearchAppBar
            topMarkdown={(currentFile !== undefined) && (currentFile.type === "markdown") ? state.currentPage : "Markdown not found   "}
            saveDocument={async ()=> saveThisDocument(state)}
        ></SearchAppBar>
        <MarkdownView
            markdownData={(currentFile !== undefined) && (currentFile.type === "markdown") ? currentFile.markdown : getEmbeddedFile(state.config.topPage) || "# 503: Markdown not found"}
            rootFolder={state.rootFolder}            
        ></MarkdownView>
    </TopContext.Provider>
}