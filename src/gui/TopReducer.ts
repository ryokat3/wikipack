import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { PageTreeFolderType } from "../tree/PageTree"
import { HeadingTreeType } from "../tree/WikiFile"

export type TopStateType = {
    title: string
    html: string
    heading: string|undefined
    headingTree: HeadingTreeType
    packFileName: string
    seq: number
    pageTree: PageTreeFolderType
}

export const topReducer = new Reducer<TopFdt, TopStateType>()
    .add("updateHtml", (state, payload)=>{
        return {
            ...state,
            title: payload.title,
            html: payload.html
        }
    })
    .add("updateHeading", (state, payload)=>{
        return {
            ...state,            
            heading: payload.heading
        }
    })
    .add("updatePackFileName", (state, payload)=>{            
        return {
            ...state,
            packFileName: payload.name            
        }
    })
    .add("updateSeq", (state, payload)=>{            
        return {
            ...state,
            seq: payload.seq
        }
    })
    .add("updateMenuRoot", (state, payload)=>{            
        return {
            ...state,
            pageTree: { ...payload.menuRoot }
        }
    })
    .add("updateHeadingList", (state, payload)=>{        
        return {
            ...state,
            headingTree: payload.headingTree
        }
    })
    .build()



