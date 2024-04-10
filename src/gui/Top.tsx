import React from "react"
import { topDispatcher } from "./TopDispatcher"
import { createContext, useEffect } from "react"
import { topReducer, TopStateType } from "./TopReducer"
import { PageView } from "./PageView"
import { PageTreeView } from "./PageTreeView"
import { HeadingListView } from "./HeadingListView"
import { Mediator, MediatorProxy } from "../Mediator"
import { SearchAppBar } from "./SearchAppBar"
import { WorkerInvoke } from "../utils/WorkerMessage"
import { WorkerMessageType } from "../worker/WorkerMessageType"
import { ConfigType } from "../config"
import { createPack } from "../fileIO/saveAsHtml"
import { extract } from "../fileIO/extract"
import Grid from "@mui/material/Grid"
// import { styled } from "@mui/material/styles"

export interface TopContextType {
    mediator: Mediator
}

export const TopContext = createContext<TopContextType>(Object.create(null))

export interface TopProps {
    worker: WorkerInvoke<WorkerMessageType>
    config: ConfigType,
    templateHtml: string,
    initialState: TopStateType,    
}

// const Offset = styled('div')(({ theme }) => theme.mixins.toolbar)

/*
const StickyGrid = styled(Grid)(({})=>({     
    position: "sticky",
    top: 0    
}))
*/

export const Top: React.FunctionComponent<TopProps> = (props:TopProps) => {

    const [state, dispatch] = React.useReducer(topReducer, props.initialState)
    const dispatcher = topDispatcher.build(dispatch)
    const mediator = new MediatorProxy(props.worker, props.config, dispatcher)   
    const rootFolder = mediator.rootFolder    
    const context:TopContextType = {
        mediator: mediator
    }
    
    // Call once
    useEffect(() => {
        mediator.onGuiInitialized()       
    }, [])

    return <TopContext.Provider value={context}>
        <SearchAppBar
            title={state.title}
            packFileName={state.packFileName}
            pack={async () => await createPack(props.templateHtml, mediator)}
            unpack={async () => extract(rootFolder)}
        ></SearchAppBar>        
        <Grid container spacing={2}>
            <Grid item xs={3}>
                <PageTreeView root={state.pageTree}></PageTreeView>
            </Grid>
            <Grid item xs={6}>
                <PageView html={state.html}></PageView>
            </Grid>            
            <Grid item xs={3}>                
                <HeadingListView headingList={state.headingList}></HeadingListView>                
            </Grid>            
        </Grid>
    </TopContext.Provider>
}