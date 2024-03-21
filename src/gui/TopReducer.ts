import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { MarkdownMenuFolderType } from "../fileTree/MarkdownMenu"

export type TopStateType = {
    title: string
    html: string
    packFileName: string
    seq: number
    menuRoot: MarkdownMenuFolderType
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
            menuRoot: payload.menuRoot
        }
    })
    .build()



