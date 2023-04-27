import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { getFile, updateFile, createRootFolder } from "../data/FileTree"
import { Folder } from "../data/FileTreeType"
import { normalizePath } from "../utils/appUtils"
import { ConfigType } from "../config"


export type TopStateType = {
    config: ConfigType
    rootFolder: Folder
    currentPage: string,
    currentCss: { [fileName:string]:number }, // entry for fileName and seq
    seq: number
}

export const topReducer = new Reducer<TopFdt, TopStateType>()
    .add("updateMarkdownFile", (state, payload)=>{
        const fileName = normalizePath(payload.fileName)
        updateFile(state.rootFolder, fileName, payload.markdownFile)        
        return {
            ...state,
            currentPage: getFile(state.rootFolder, state.currentPage) === undefined ? fileName : state.currentPage,
            seq: state.seq + 1
        }
    })
    .add("updateCssFile", (state, payload)=>{
        const fileName = normalizePath(payload.fileName)
        updateFile(state.rootFolder, fileName, {
            type: "css",
            timestamp: payload.timestamp,
            css: payload.data
        })
        return {
            ...state,
            currentCss: { ...state.currentCss, [fileName]: state.seq + 1 },
            seq: state.seq + 1
        }
    })
    .add("updateDataFile", (state, payload)=>{        
        const fileName = normalizePath(payload.fileName)
        const blob = new Blob( [payload.data], { type: payload.mime })
        const dataRef = URL.createObjectURL(blob)        
        updateFile(state.rootFolder, fileName, {
            type: "data",
            dataRef: dataRef,
            buffer: payload.data,
            mime: payload.mime,
            timestamp: payload.timestamp
        })
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
