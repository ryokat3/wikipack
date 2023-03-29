import { Reducer } from "../utils/FdtFlux"
import { AppConfig, defaultAppConfig } from "../AppConfig"
import { TopFdt } from "./TopFdt"

export type GripType = "left" | "right" | "none"

export const initialTopState = {
    appConfig: defaultAppConfig,
    markdown: undefined
}

export type TopStateType = {
    appConfig: AppConfig,
    markdown?: string    
}
// typeof initialTopState


export const topReducer = new Reducer<TopFdt, TopStateType>()
    .add("markdownUpdate", (state, markdown)=>{
        return {
            ...state,
            markdown: markdown
        }
    })
    .build()
