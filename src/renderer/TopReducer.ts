import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { getEmbeddedFile } from "../fs/embeddedFileFS"
import { CONFIG_ID } from "../constant"

type ConfigType = {
    topMarkdown?: string
}

export type TopStateType = {    
    topMarkdown?: string
    fileName?: string
    markdown?: string    
}

export const initialTopState:TopStateType = {
    topMarkdown: undefined,
    fileName: undefined,
    markdown: undefined
}

const embedded = getEmbeddedFile(CONFIG_ID)
if (embedded !== undefined) {
    const config:ConfigType = JSON.parse(embedded)
    initialTopState.topMarkdown = config.topMarkdown
}

export const topReducer = new Reducer<TopFdt, TopStateType>()
    .add("currentPageUpdate", (state, pageInfo)=>{
        console.log("currentPageUpdate")
        return {
            ...state,
            fileName: pageInfo.fileName,
            markdown: pageInfo.markdown
        }
    })
    .build()