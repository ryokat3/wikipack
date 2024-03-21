import { Dispatcher, DispatcherType } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"


export const topDispatcher = new Dispatcher<TopFdt>()
    .addParameterAction("updateHtml")
    .addParameterAction("updatePackFileName")    
    .addParameterAction("updateSeq")    
    .addParameterAction("updateMenuRoot")

export type TopDispatcherType = DispatcherType<typeof topDispatcher>

