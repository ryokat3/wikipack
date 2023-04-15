import { Reducer } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"
import { getEmbeddedFile } from "../fs/embeddedFileFS"
import { createRootFolder, getOrCreateDataFile, getOrCreateMarkdownFile, getFile, getAnyMarkdownFile } from "../markdown/FileTree"
import { CONFIG_ID } from "../constant"

const defaultConfig = {
    extension: [ ".md", ".markdown" ],
    topPage: "index.md"
}

type ConfigType = typeof defaultConfig

const embedded = getEmbeddedFile(CONFIG_ID)
const config:ConfigType = (embedded !== undefined) ? JSON.parse(embedded) : defaultConfig

// TODO: validate config 

export const initialTopState = {
    config: config,
    rootFolder: createRootFolder(),
    currentPage: config.topPage,
    seq: 0
}

export type TopStateType = typeof initialTopState


export const topReducer = new Reducer<TopFdt, TopStateType>()
    .add("updateMarkdownFile", (state, payload)=>{
        getOrCreateMarkdownFile(state.rootFolder, payload.fileName).markdown = payload.markdown
        return (payload.fileName === state.currentPage) ? {
            ...state,
            seq: state.seq + 1
        } : state
    })
    .add("updateDataFile", (state, payload)=>{
        getOrCreateDataFile(state.rootFolder, payload.fileName).data = payload.data
        return state                
    })
    .add("updateRootFolder", (state, payload)=>{
        if (getFile(payload.rootFolder, state.currentPage) === undefined) {
            const result = getAnyMarkdownFile(payload.rootFolder)
            if (result !== undefined) {
                return {
                    ...state,
                    currentPage: result[0],
                    rootFolder: payload.rootFolder
                }
            }
        }
        return {
            ...state,
            rootFolder: payload.rootFolder
        }
    })
    .build()
