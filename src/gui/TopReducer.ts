import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { PageTreeFolderType } from "../fileTree/PageTree"
import { HeadingTokenType } from "../fileTree/WikiFile"

export type TopStateType = {
    title: string
    html: string
    headingList: HeadingTokenType[]
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
            pageTree: payload.menuRoot
        }
    })
    .add("updateHeadingList", (state, payload)=>{            
        return {
            ...state,
            headingList: payload.headingList
        }
    })
    .build()



