import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { getFile, updateDataFile, updateMarkdownFile, Folder, createRootFolder } from "../markdown/FileTree"
import { ConfigType } from "../config"


export type TopStateType = {
    config: ConfigType
    rootFolder: Folder
    currentPage: string,
    seq: number
}

export const topReducer = new Reducer<TopFdt, TopStateType>()
    .add("updateMarkdownFile", (state, payload)=>{
        updateMarkdownFile(state.rootFolder, payload.fileName, payload.markdownFile)        
        return {
            ...state,
            currentPage: getFile(state.rootFolder, state.currentPage) === undefined ? payload.fileName : state.currentPage,
            seq: state.seq + 1
        }
    })
    .add("updateDataFile", (state, payload)=>{        
        updateDataFile(state.rootFolder, payload.fileName, payload.timestamp, payload.data)        
        const markdownFile = getFile(state.rootFolder, state.currentPage)
        if ((markdownFile !== undefined) && (markdownFile.type === "markdown") && (markdownFile.imageList.includes(payload.fileName) || markdownFile.linkList.includes(payload.fileName))) {            
            return {
                ...state,
                seq: state.seq + 1
            }
        }
        else {            
            return state
        }
    })
    .add("updateCurrentPage", (state, payload)=>{        
        return {
            ...state,
            currentPage: payload.name,            
        }
    })
    .add("resetRootFolder", (state) => {
        return {
            ...state,
            rootFolder: createRootFolder()
        }
    })
    .build()
