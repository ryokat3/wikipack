import * as TE from "fp-ts/TaskEither"
import { identity } from "fp-ts/lib/function"

type DEFAULT_SUCCESS_CALLBACK = "c5b93655-3f5d-4928-8782-39df4b168351"
type DEFAULT_FAILURE_CALLBACK = "4df8e939-7111-4125-a228-63fdc5122157"

export const DEFAULT_SUCCESS_CALLBACK:DEFAULT_SUCCESS_CALLBACK = "c5b93655-3f5d-4928-8782-39df4b168351"
export const DEFAULT_FAILURE_CALLBACK:DEFAULT_FAILURE_CALLBACK = "4df8e939-7111-4125-a228-63fdc5122157"

export const DEFAULT_ON_CALLBACK = {
    onsuccess: DEFAULT_SUCCESS_CALLBACK,
    oncomplete: DEFAULT_SUCCESS_CALLBACK,
    onerror: DEFAULT_FAILURE_CALLBACK,
    onfailure: DEFAULT_FAILURE_CALLBACK,
    onabort: DEFAULT_SUCCESS_CALLBACK
}

type GetValue<T, K> = T[K extends keyof T ? K : never]

const SUCCESS_TYPE = Symbol("SUCCESS_TYPE")
type SUCCESS_TYPE = typeof SUCCESS_TYPE

const FAILURE_TYPE = Symbol("FAILURE_TYPE")
type FAILURE_TYPE = typeof FAILURE_TYPE



type SUCCESS<T> = {
    _result: SUCCESS_TYPE,
    _value: T
}

type FAILURE<T> = {
    _result: FAILURE_TYPE,
    _value: T
}

export function isSuccess(target:any):target is SUCCESS<any> {
    return ((typeof target === 'object') && ('_result' in target) && ('_value' in target) && (target['_result'] === SUCCESS_TYPE))
}


export function isFailure(target:any):target is FAILURE<any> {
    return ((typeof target === 'object') && ('_result' in target) && ('_value' in target) && (target['_result'] === FAILURE_TYPE))
}

export function Success<T>(value:T):SUCCESS<T> {
    return {
        _result: SUCCESS_TYPE,
        _value: value
    }
}

export function Failure<T>(value:T):FAILURE<T> {
    return {
        _result: FAILURE_TYPE,
        _value: value
    }
}

export class OnCallbackResult<T> {

    constructor(
        readonly name:string,
        readonly value:T
    ) {}

    toString():string {
        return `[${this.name}] ${this.value}`
    }
}

export function isOnCallbackResult(target:any):target is OnCallbackResult<any> {
    return target instanceof OnCallbackResult
}

type CallbackReturnType<T, U, K> = GetValue<U,K> extends DEFAULT_SUCCESS_CALLBACK ? NonNullable<GetValue<T,K>> extends (ev:infer SEV)=>any ? SUCCESS<SEV> : never : 
                                        GetValue<U,K> extends DEFAULT_FAILURE_CALLBACK ? NonNullable<GetValue<T,K>> extends (ev:infer FEV)=>any ? FAILURE<FEV> : never :                                         
                                        GetValue<U,K> extends (ev:any)=>any ? Awaited<ReturnType<GetValue<U,K>>> extends SUCCESS<unknown>|FAILURE<unknown> ? Awaited<ReturnType<GetValue<U,K>>> : never : never
                                        
type CallbackType<T> = T extends (e:infer Ev)=>any ? ((x:Ev)=>Promise<SUCCESS<unknown>|FAILURE<unknown>>) | ((x:Ev)=>SUCCESS<unknown>|FAILURE<unknown>) | ((x:Ev)=>void) : never

type Nullable<T> = Exclude<T, NonNullable<T>>

type OnCallbackType<T> = { [ Key in { [K in keyof T]: K extends `on${infer _Name}` ? NonNullable<T[K]> extends (x:any)=>any ? K : never : never }[keyof T] ]: (CallbackType<NonNullable<T[Key]>> | DEFAULT_SUCCESS_CALLBACK | DEFAULT_FAILURE_CALLBACK | Nullable<T[Key]>) }

type OnCallbackReturnType<T, U> = { [ Key in { [K in keyof U]: K extends keyof OnCallbackType<T> ? K : never }[keyof U] ]: CallbackReturnType<T, U, Key> }

type ValueType<T> = T[keyof T]


export function promiseOnCallback<T, U extends OnCallbackType<T>, R = ValueType<OnCallbackReturnType<T,U>> extends SUCCESS<infer A>|FAILURE<infer _B> ? A : never>(obj:T, callbacks:U): Promise<OnCallbackResult<R>> {

    return new Promise((resolve, reject)=>{
        for (const [name, cb] of Object.entries(callbacks)) {
            if (obj[name as keyof T] !== undefined) {
                if (cb instanceof Function) {
                    obj[name as keyof T] = ((e:any)=>{
                        Promise.resolve(cb(e)).then((result)=>{
                            if (isSuccess(result)) {
                                resolve(new OnCallbackResult(name, result._value))
                            }
                            else if (isFailure(result)) {
                                reject(new OnCallbackResult(name, result._value))
                            }
                        })
                    }) as any
                }
                else if (cb === SUCCESS_TYPE) {
                    obj[name as keyof T] = ((e:any)=>resolve(new OnCallbackResult(name, e))) as any
                }
                else if (cb === FAILURE_TYPE) {
                    obj[name as keyof T] = ((e:any)=>reject(new OnCallbackResult(name, e))) as any
                }
            }
        }        
    })
}

export function taskifyOnCallback<T, U extends OnCallbackType<T>,
        R = ValueType<OnCallbackReturnType<T,U>> extends SUCCESS<infer A>|FAILURE<infer _B> ? A : never,
        L = ValueType<OnCallbackReturnType<T,U>> extends SUCCESS<infer _A>|FAILURE<infer B> ? B : never>
    (obj:T, callbacks:U): TE.TaskEither<OnCallbackResult<L>,OnCallbackResult<R>> {    
    return TE.tryCatch<OnCallbackResult<L>, OnCallbackResult<R>>(()=>promiseOnCallback(obj, callbacks), identity as (x:unknown)=>OnCallbackResult<L>)
}