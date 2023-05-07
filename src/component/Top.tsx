import React from "react"
import { topDispatcher, TopDispatcherType } from "./TopDispatcher"
import { createContext, useEffect/*, useLayoutEffect */} from "react"
import { topReducer, TopStateType } from "./TopReducer"
import { MarkdownView } from "./MarkdownView"
import { MarkdownMenuView } from "./MarkdownMenuView"
import { SearchAppBar } from "./SearchAppBar"
import { setupDragAndDrop } from "../file/dragAndDrop"
import { WorkerInvoke } from "../utils/WorkerMessage"
import { FileWorkerMessageType } from "../localFile/FileWorkerMessageType"
import { getFile } from "../data/FileTree"
import { getMarkdownMenu, MarkdownMenuFileType } from "../data/MarkdownMenu"
import { createRootFolder } from "../data/FileTree"
import { makeFileRegexChecker } from "../utils/appUtils"
import { ConfigType } from "../config"
import { createPack, saveAsHtml } from "../file/saveAsHtml"
import { extract } from "../file/extract"
import { getCurrentCssElement, addCssElement } from "../element/styleElement"
import { FILE_NAME_ATTR, SEQ_NUMBER_ATTR } from "../constant"
import Grid from "@mui/material/Grid"


export interface TopContextType {
    dispatcher: TopDispatcherType,
    fileWorker: WorkerInvoke<FileWorkerMessageType>       
}

export const TopContext = createContext<TopContextType>(Object.create(null))

export interface TopProps {
    fileWorker: WorkerInvoke<FileWorkerMessageType>
    config: ConfigType,
    templateHtml: string,
    initialState: TopStateType
}

export const Top: React.FunctionComponent<TopProps> = (props:TopProps) => {

    const [state, dispatch] = React.useReducer(topReducer, props.initialState)
    const dispatcher = topDispatcher.build(dispatch)    
    const context = {
        dispatcher: dispatcher,
        fileWorker: props.fileWorker    
    }

    // Call once
    useEffect(() => {
        props.fileWorker.addEventHandler("updateMarkdownFile", (payload)=>dispatcher.updateMarkdownFile(payload))
        props.fileWorker.addEventHandler("updateCssFile", (payload)=>dispatcher.updateCssFile(payload))
        props.fileWorker.addEventHandler("updateDataFile", (payload)=>dispatcher.updateDataFile(payload))
        setupDragAndDrop(props.fileWorker, dispatcher, props.config)
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
            saveDocument={async () => saveAsHtml(state)}
            extract={async () => extract(state.rootFolder)}
            pack={async () => await createPack(props.templateHtml, state)}
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