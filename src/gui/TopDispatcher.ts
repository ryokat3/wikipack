import { Dispatcher, DispatcherType } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"


export const topDispatcher = new Dispatcher<TopFdt>()
    .addParameterAction("updateHtml")
    .addParameterAction("updateHeading")
    .addParameterAction("updatePackFileName")    
    .addParameterAction("updateSeq")    
    .addParameterAction("updateDiffId")    

export type TopDispatcherType = DispatcherType<typeof topDispatcher>

