import { Dispatcher, DispatcherType } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"


export const topDispatcher = new Dispatcher<TopFdt>()
    .addParameterAction("updateMarkdownFile")    
    .addParameterAction("updateCssFile")    
    .addParameterAction("updateDataFile")
    .addParameterAction("updateCurrentPage")
    .addParameterAction("deleteFile")
    .addAction("resetRootFolder")

export type TopDispatcherType = DispatcherType<typeof topDispatcher>

