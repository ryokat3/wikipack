import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { getFile, updateFile, createRootFolder, deleteFile } from "../fileTree/FileTree"
import { FileType, FolderType } from "../fileTree/FileTreeType"
import { normalizePath } from "../utils/appUtils"
import { ConfigType } from "../config"
import { collectCssFiles } from "../dataElement/styleElement"



export type TopStateType = {
    config: ConfigType
    rootFolder: FolderType
    currentPage: string
    currentCss: { [fileName:string]:number } // entry for fileName and seq
    packFileName: string
    seq: number    
}

function updateCurrentCss(currentCss: { [fileName:string]:number }, cssList:string[]): { [fileName:string]:number } {
    return cssList.reduce<{ [fileName:string]:number }>((acc, name) => (name in Object.keys(acc)) ? acc : {
        ...acc,
        [name]: 0        
    }, Object.fromEntries(Object.entries(currentCss).filter(([name, _]) => name in cssList)))
}

function isSameFile(oldF:FolderType|FileType[keyof FileType], newF:FileType[keyof FileType]):boolean {         
    return (oldF.type == newF.type) && (oldF.timestamp == newF.timestamp)
}

export const topReducer = new Reducer<TopFdt, TopStateType>()
    .add("updateMarkdownFile", (state, payload)=>{
        const fileName = normalizePath(payload.fileName)
        const isSame = updateFile(state.rootFolder, fileName, payload.markdownFile, isSameFile) 
        const isCurrentPageExist = getFile(state.rootFolder, state.currentPage) !== undefined        

        if (!isCurrentPageExist) {
            return {
                ...state,
                currentPage: fileName,
                seq: state.seq + 1
            }
        }
        else if ((state.currentPage === fileName) && (!isSame)) {
            return {
                ...state,
                seq: state.seq + 1
            }
        }
        else {
            return state
        }
    })
    .add("updateCssFile", (state, payload)=>{
        const fileName = normalizePath(payload.fileName)
        const isSame = updateFile(state.rootFolder, fileName, {
            type: "css",
            timestamp: payload.timestamp,
            css: payload.data
        }, isSameFile)
        
        const currentCss = updateCurrentCss({ ...state.currentCss, [fileName]: state.seq }, collectCssFiles(state.rootFolder, state.currentPage))
        if (isSame) {
            return state
        }        
        else {
            return {
                ...state,
                currentCss: currentCss,
                seq: (fileName in currentCss && !isSame) ? state.seq + 1 : state.seq
            }
        }
    })
    .add("updateDataFile", (state, payload)=>{        
        const fileName = normalizePath(payload.fileName)
        const blob = new Blob( [payload.data], { type: payload.mime })
        const dataRef = URL.createObjectURL(blob)        
        const isSame = updateFile(state.rootFolder, fileName, {
            type: "data",
            dataRef: dataRef,
            buffer: payload.data,
            mime: payload.mime,
            timestamp: payload.timestamp
        }, isSameFile)
        
        const markdownFile = getFile(state.rootFolder, state.currentPage)
        if (isSame) {
            return state
        }
        else if ((markdownFile !== undefined) && (markdownFile.type === "markdown") && (markdownFile.imageList.includes(fileName) || markdownFile.linkList.includes(fileName))) {            
            return {
                ...state,
                seq: state.seq + 1
            }
        }
        else {            
            return state
        }
    })
    .add("deleteFile", (state, payload)=>{
        const filePath = normalizePath(payload.fileName)        
        deleteFile(state.rootFolder, filePath)
        return {
            ...state,
            seq: state.seq + 1        
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
    .add("updatePackFileName", (state, payload)=>{            
        return {
            ...state,
            packFileName: payload.name            
        }
    })
    .add("resetRootFolder", (state) => {
        return {
            ...state,
            rootFolder: createRootFolder()
        }
    })
    .build()
