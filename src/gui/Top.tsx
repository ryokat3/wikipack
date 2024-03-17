import React from "react"
import { topDispatcher, TopDispatcherType } from "./TopDispatcher"
import { createContext, useEffect　} from "react"
import { topReducer, TopStateType } from "./TopReducer"
import { MarkdownView } from "./MarkdownView"
import { MarkdownMenuView } from "./MarkdownMenuView"
import { WorkerAgent } from "../worker/WorkerAgent"
import { SearchAppBar } from "./SearchAppBar"
import { setupDragAndDrop } from "../fileIO/dragAndDrop"
import { WorkerInvoke } from "../utils/WorkerMessage"
import { WorkerMessageType } from "../worker/WorkerMessageType"
import { getMarkdownMenu, MarkdownMenuFileType } from "../fileTree/MarkdownMenu"
import { createRootFolder } from "../fileTree/FileTree"
import { ConfigType } from "../config"
import { createPack } from "../fileIO/saveAsHtml"
import { extract } from "../fileIO/extract"
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
    workerAgent: WorkerAgent
}

export const Top: React.FunctionComponent<TopProps> = (props:TopProps) => {

    const [state, dispatch] = React.useReducer(topReducer, props.initialState)
    const dispatcher = topDispatcher.build(dispatch)    
    const rootFolder = props.workerAgent.rootFolder
    const context:TopContextType = {
        dispatcher: dispatcher,
        worker: props.worker
    }

    // Call once
    useEffect(() => {        
        props.workerAgent.setDispatcher(dispatcher)    
        props.workerAgent.updateSeq()
        
        setupDragAndDrop(props.workerAgent, dispatcher)
        _open_markdown = function(name:string) {
            props.workerAgent.updateCurrentPage(name)
        }
        
    }, [])
    
    return <TopContext.Provider value={context}>
        <SearchAppBar
            title={state.title}
            packFileName={state.packFileName}
            pack={async () => await createPack(props.templateHtml, props.workerAgent)}
            unpack={async () => extract(rootFolder)}            
        ></SearchAppBar>
        <Grid container spacing={2}>
            <Grid item xs={3}>
                <MarkdownMenuView root={getMarkdownMenu(rootFolder) || createRootFolder<MarkdownMenuFileType>()}></MarkdownMenuView>
            </Grid>
            <Grid item xs={6}>
                <MarkdownView html={state.html}></MarkdownView>
            </Grid>
            <Grid item xs={3}>                
            </Grid>
        </Grid>
    </TopContext.Provider>
}