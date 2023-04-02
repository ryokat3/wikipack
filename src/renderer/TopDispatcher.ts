import { Dispatcher, DispatcherType } from "../utils/FdtFlux"
import { TopFdt } from "./TopFdt"


export const topDispatcher = new Dispatcher<TopFdt>()
    .addParameterAction("currentPageUpdate")
    .addParameterAction("rootHandleUpdate")
    

export type TopDispatcherType = DispatcherType<typeof topDispatcher>

