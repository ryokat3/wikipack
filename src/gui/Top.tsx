import React from "react"
import { topDispatcher, TopDispatcherType } from "./TopDispatcher"
import { createContext, useEffect/*, useLayoutEffect */} from "react"
import { topReducer, TopStateType } from "./TopReducer"
import { MarkdownView } from "./MarkdownView"
import { MarkdownMenuView } from "./MarkdownMenuView"
import { WorkerAgent } from "../worker/WorkerAgent"
import { SearchAppBar } from "./SearchAppBar"
import { setupDragAndDrop } from "../fileIO/dragAndDrop"
import { WorkerInvoke } from "../utils/WorkerMessage"
import { WorkerMessageType } from "../worker/WorkerMessageType"
import { getFile } from "../fileTree/FileTree"
import { getMarkdownMenu, MarkdownMenuFileType } from "../fileTree/MarkdownMenu"
import { createRootFolder } from "../fileTree/FileTree"
import { makeFileRegexChecker } from "../utils/appUtils"
import { ConfigType } from "../config"
import { createPack } from "../fileIO/saveAsHtml"
import { extract } from "../fileIO/extract"
import { getCurrentCssElement, addCssElement } from "../dataElement/styleElement"
import { FILE_NAME_ATTR, SEQ_NUMBER_ATTR } from "../constant"
import Grid from "@mui/material/Grid"


export interface TopContextType {
    dispatcher: TopDispatcherType,
    worker: WorkerInvoke<WorkerMessageType>       
}

export const TopContext = createContext<TopContextType>(Object.create(null))

export interface TopProps {
    worker: WorkerInvoke<WorkerMessageType>
    config: ConfigType,
    templateHtml: string,
    initialState: TopStateType,
    searchState: WorkerAgent
}

export const Top: React.FunctionComponent<TopProps> = (props:TopProps) => {

    const [state, dispatch] = React.useReducer(topReducer, props.initialState)
    const dispatcher = topDispatcher.build(dispatch)    
    const context:TopContextType = {
        dispatcher: dispatcher,
        worker: props.worker
    }

    // Call once
    useEffect(() => {        
        props.worker.addEventHandler("updateMarkdownFile", (payload)=>dispatcher.updateMarkdownFile(payload))
        props.worker.addEventHandler("updateCssFile", (payload)=>dispatcher.updateCssFile(payload))
        props.worker.addEventHandler("updateDataFile", (payload)=>dispatcher.updateDataFile(payload))
        props.worker.addEventHandler("deleteFile", (payload)=>dispatcher.deleteFile(payload))

        setupDragAndDrop(props.searchState, dispatcher)
        _open_markdown = function(name:string) {
            dispatcher.updateCurrentPage({ name:name })
        }
    }, [])

    useEffect(() => {
        const cssElementNameList = Object.keys(state.currentCss)
        const cssList:string[] =  []
        getCurrentCssElement().forEach((elem)=>{
            const cssFileName = elem.getAttribute(FILE_NAME_ATTR)
            const seq = Number.parseInt(elem.getAttribute(SEQ_NUMBER_ATTR) || "-1")

            if ((cssFileName === null) || !(cssFileName in cssElementNameList)) {
                elem.remove()                
            }
            else if ((seq < 0) || state.currentCss[cssFileName] > seq) {
                elem.remove()
            }
            else {
                cssList.push(cssFileName)
            }
        })
        Object.entries(state.currentCss).forEach(([cssFileName, _])=>{
            if (!(cssFileName in cssList)) {   
                const result = getFile(state.rootFolder, cssFileName)
                if ((result !== undefined) && (result.type === "css")) {
                    addCssElement(cssFileName, result.css, state.currentCss[cssFileName])
                }
            }
        })     
    }, [ state.currentCss ])
    

    const currentFile = getFile(state.rootFolder, state.currentPage)    

    const [title, markdown] = ((currentFile !== undefined) && (currentFile.type === "markdown")) ? [ state.currentPage, currentFile.markdown] : [ "ERROR", `${state.currentPage} not found`]

    return <TopContext.Provider value={context}>
        <SearchAppBar
            title={title}
            packFileName={state.packFileName}
            pack={async () => await createPack(props.templateHtml, state)}
            unpack={async () => extract(state.rootFolder)}            
        ></SearchAppBar>
        <Grid container spacing={2}>
            <Grid item xs={3}>
                <MarkdownMenuView root={getMarkdownMenu(state.rootFolder) || createRootFolder<MarkdownMenuFileType>()}></MarkdownMenuView>
            </Grid>
            <Grid item xs={6}>
                <MarkdownView
                    markdownData={markdown}
                    rootFolder={state.rootFolder}
                    filePath={state.currentPage}
                    isMarkdown={makeFileRegexChecker(state.config.markdownFileRegex)}
                ></MarkdownView>
            </Grid>
            <Grid item xs={3}>                
            </Grid>
        </Grid>
    </TopContext.Provider>
}