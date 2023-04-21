import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { getFile, updateDataFile, updateMarkdownFile, Folder, createRootFolder } from "../markdown/FileTree"
import { normalizePath } from "../fs/localFileFS"
import { ConfigType } from "../config"


export type TopStateType = {
    config: ConfigType
    rootFolder: Folder
    currentPage: string,
    seq: number
}

export const topReducer = new Reducer<TopFdt, TopStateType>()
    .add("updateMarkdownFile", (state, payload)=>{
        const fileName = normalizePath(payload.fileName)
        updateMarkdownFile(state.rootFolder, fileName, payload.markdownFile)        
        return {
            ...state,
            currentPage: getFile(state.rootFolder, state.currentPage) === undefined ? fileName : state.currentPage,
            seq: state.seq + 1
        }
    })
    .add("updateDataFile", (state, payload)=>{        
        const fileName = normalizePath(payload.fileName)
        const blob = new Blob( [payload.data], { type: payload.mime })
        const dataRef = URL.createObjectURL(blob)
        updateDataFile(state.rootFolder, fileName, payload.timestamp, payload.mime, dataRef, payload.data)
        const markdownFile = getFile(state.rootFolder, state.currentPage)
        if ((markdownFile !== undefined) && (markdownFile.type === "markdown") && (markdownFile.imageList.includes(fileName) || markdownFile.linkList.includes(fileName))) {            
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
            currentPage: normalizePath(payload.name)
        }
    })
    .add("resetRootFolder", (state) => {
        return {
            ...state,
            rootFolder: createRootFolder()
        }
    })
    .build()
