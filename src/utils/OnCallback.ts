import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import { identity } from "fp-ts/lib/function"


export const DEFAULT_SUCCESS_CALLBACK:unique symbol = Symbol('SUCCESS')
export const DEFAULT_FAILURE_CALLBACK:unique symbol = Symbol('FAILURE')
export const NO_CALLBACK:unique symbol = Symbol('NO')

type DEFAULT_SUCCESS_CALLBACK = typeof DEFAULT_SUCCESS_CALLBACK
type DEFAULT_FAILURE_CALLBACK = typeof DEFAULT_FAILURE_CALLBACK
type NO_CALLBACK = typeof NO_CALLBACK


type DEFAULT_ON_CALLBACK = {
    readonly onsuccess: typeof DEFAULT_SUCCESS_CALLBACK,
    readonly oncomplete: typeof DEFAULT_SUCCESS_CALLBACK,
    readonly onerror: typeof DEFAULT_FAILURE_CALLBACK,
    readonly onfailure: typeof DEFAULT_FAILURE_CALLBACK,
    readonly onabort: typeof DEFAULT_SUCCESS_CALLBACK
}

export const DEFAULT_ON_CALLBACK:DEFAULT_ON_CALLBACK = {
    onsuccess: DEFAULT_SUCCESS_CALLBACK,
    oncomplete: DEFAULT_SUCCESS_CALLBACK,
    onerror: DEFAULT_FAILURE_CALLBACK,
    onfailure: DEFAULT_FAILURE_CALLBACK,
    onabort: DEFAULT_SUCCESS_CALLBACK
}


type SUCCESS<T> = E.Right<T>

type FAILURE<T> = E.Left<T>

export function isSuccess(target:any):target is SUCCESS<any> {
    return E.isRight(target)
}


export function isFailure(target:any):target is FAILURE<any> {
    return E.isLeft(target)
}

type GetValue<T, K> = T[K extends keyof T ? K : never]

type OnCallbackFilter<T> = T extends (e:infer Ev)=>any ? ((x:Ev)=>unknown) : never

type OnCallbackType<T> = { readonly [ Key in { [K in keyof T]: K extends `on${infer _Name}` ? NonNullable<T[K]> extends (x:any)=>any ? K : never : never }[keyof T] ]: (OnCallbackFilter<NonNullable<T[Key]>> | DEFAULT_SUCCESS_CALLBACK | DEFAULT_FAILURE_CALLBACK | NO_CALLBACK ) }

type ConvertOnCallbackType<T, U, K> = GetValue<U,K> extends DEFAULT_SUCCESS_CALLBACK ? NonNullable<GetValue<T,K>> extends (ev:infer SEV)=>any ? SUCCESS<SEV> : never : 
                                        GetValue<U,K> extends DEFAULT_FAILURE_CALLBACK ? NonNullable<GetValue<T,K>> extends (ev:infer FEV)=>any ? FAILURE<FEV> : never :                                         
                                        GetValue<U,K> extends (ev:any)=>any ? Awaited<ReturnType<GetValue<U,K>>> extends E.Either<unknown,unknown> ? Awaited<ReturnType<GetValue<U,K>>> : never : never
                                       
type OnCallbackReturnType<T, U> = { [ Key in { [K in keyof U]: K extends keyof OnCallbackType<T> ? K : never }[keyof U] ]: ConvertOnCallbackType<T, U, Key> }

type ValueType<T> = T[keyof T]


export function promiseOnCallback<T, U extends OnCallbackType<T>, R = ValueType<OnCallbackReturnType<T,U>> extends E.Either<unknown, infer R> ? R : never>(obj:T, callbacks:U): Promise<R> {        
    return new Promise((resolve, reject)=>{                
        for (const [name, cb] of Object.entries(callbacks)) {            
            if (obj[name as keyof T] !== undefined) {                
                if (cb instanceof Function) {
                    obj[name as keyof T] = ((e:any)=>{                                                                                           
                        Promise.resolve(cb(e)).then((result)=>{                            
                            if (isSuccess(result)) {
                                resolve(result.right)
                            }
                            else if (isFailure(result)) {
                                reject([result.left, name])
                            }
                        }).catch((reason)=>reject(reason))
                    }) as any
                }
                else if (cb === DEFAULT_SUCCESS_CALLBACK) {
                    obj[name as keyof T] = ((e:any)=>resolve(e)) as any
                }
                else if (cb === DEFAULT_FAILURE_CALLBACK) {
                    obj[name as keyof T] = ((e:any)=>reject([e,name])) as any
                }
            }
        }        
    })
}

export function taskifyOnCallback<T, U extends OnCallbackType<T>,
        R = ValueType<OnCallbackReturnType<T,U>> extends E.Either<unknown, infer R> ? R : never,
        L = ValueType<OnCallbackReturnType<T,U>> extends E.Either<infer L, unknown> ? L : never>
    (obj:T, callbacks:U): TE.TaskEither<[L,string], R> {          
        return TE.tryCatch<[L, string] , R>(()=>promiseOnCallback(obj, callbacks), identity as (x:unknown)=>[L,string])
}