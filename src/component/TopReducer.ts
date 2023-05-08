import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { getFile, updateFile, createRootFolder, deleteFile } from "../data/FileTree"
import { FolderType } from "../data/FileTreeType"
import { normalizePath } from "../utils/appUtils"
import { ConfigType } from "../config"
import { collectCssFiles } from "../element/styleElement"


export type TopStateType = {
    config: ConfigType
    rootFolder: FolderType
    currentPage: string,
    currentCss: { [fileName:string]:number }, // entry for fileName and seq
    seq: number
}

function updateCurrentCss(currentCss: { [fileName:string]:number }, cssList:string[]): { [fileName:string]:number } {
    return cssList.reduce<{ [fileName:string]:number }>((acc, name) => (name in Object.keys(acc)) ? acc : {
        ...acc,
        [name]: 0        
    }, Object.fromEntries(Object.entries(currentCss).filter(([name, _]) => name in cssList)))
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
        const currentCss = updateCurrentCss({ ...state.currentCss, [fileName]: state.seq }, collectCssFiles(state.rootFolder, state.currentPage))
        return {
            ...state,
            currentCss: currentCss,
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
        const filePath = normalizePath(payload.name)
        const currentCss = updateCurrentCss(state.currentCss, collectCssFiles(state.rootFolder, filePath))
        return {
            ...state,
            currentCss: currentCss,
            currentPage: filePath
        }
    })
    .add("deleteFile", (state, payload)=>{
        const filePath = normalizePath(payload.fileName)
        console.log(`deleteFile: ${filePath}`)
        deleteFile(state.rootFolder, filePath)
        return {
            ...state,
            seq: state.seq + 1        
        }
    })
    .add("resetRootFolder", (state) => {
        return {
            ...state,
            rootFolder: createRootFolder()
        }
    })
    .build()
