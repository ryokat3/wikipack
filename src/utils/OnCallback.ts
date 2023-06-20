import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import { identity } from "fp-ts/lib/function"


export const successCallback:unique symbol = Symbol('onCallbackSuccess')
export const failureCallback:unique symbol = Symbol('onCallbackFailure')
export const noCallback:unique symbol = Symbol('onCallbackIgnore')

type OnCallbackSuccess = typeof successCallback
type OnCallbackFailure = typeof failureCallback
type OnCallbackNoCallback = typeof noCallback

type OnCallbackDefaultSet = {
    readonly onsuccess: typeof successCallback,
    readonly oncomplete: typeof successCallback,
    readonly onerror: typeof failureCallback,
    readonly onfailure: typeof failureCallback,
    readonly onabort: typeof successCallback
}

export const defaultSet:OnCallbackDefaultSet = {
    onsuccess: successCallback,
    oncomplete: successCallback,
    onerror: failureCallback,
    onfailure: failureCallback,
    onabort: successCallback
}

type GetValue<T, K> = T[K extends keyof T ? K : never]

type ValueType<T> = T[keyof T]

type OnCallbackFilter<T> = T extends (e:infer Ev)=>any ? ((x:Ev)=>unknown) : never

type OnCallbackSetType<T> = { readonly [ Key in { [K in keyof T]: K extends `on${infer _Name}` ? NonNullable<T[K]> extends (x:any)=>any ? K : never : never }[keyof T] ]: (OnCallbackFilter<NonNullable<T[Key]>> | OnCallbackSuccess | OnCallbackFailure | OnCallbackNoCallback ) }

type OnCallbackReturnType<T, U, K> = GetValue<U,K> extends OnCallbackSuccess ? NonNullable<GetValue<T,K>> extends (ev:infer SEV)=>any ? E.Right<SEV> : never : 
                                        GetValue<U,K> extends OnCallbackFailure ? NonNullable<GetValue<T,K>> extends (ev:infer FEV)=>any ? E.Left<FEV> : never :                                         
                                        GetValue<U,K> extends (ev:any)=>any ? Awaited<ReturnType<GetValue<U,K>>> extends E.Either<unknown,unknown> ? Awaited<ReturnType<GetValue<U,K>>> : never : never
                                       
type OnCallbackSetReturnType<T, U> = { [ Key in { [K in keyof U]: K extends keyof OnCallbackSetType<T> ? K : never }[keyof U] ]: OnCallbackReturnType<T, U, Key> }


export function taskify<T, U extends OnCallbackSetType<T>,
    R = ValueType<OnCallbackSetReturnType<T, U>> extends E.Either<unknown, infer R> ? R : never,
    L = ValueType<OnCallbackSetReturnType<T, U>> extends E.Either<infer L, unknown> ? L : never>
    (obj: T, onCallbackSet: U): TE.TaskEither<[L, string], R> {    
    return TE.tryCatch<[L, string], R>(() => {
        return new Promise((resolve, reject) => {
            for (const [name, onCallback] of Object.entries(onCallbackSet)) {
                if (obj[name as keyof T] !== undefined) {
                    if (onCallback instanceof Function) {
                        obj[name as keyof T] = ((e: any) => {
                            Promise.resolve(onCallback(e)).then((result) => {
                                //if (isSuccess(result)) {
                                if (E.isRight<R>(result)) {
                                    resolve(result.right)
                                }
                                else if (E.isLeft<L>(result)) {
                                    reject([result.left, name])
                                }
                            }).catch((reason) => reject(reason))
                        }) as any
                    }
                    else if (onCallback === successCallback) {
                        obj[name as keyof T] = ((e: any) => resolve(e)) as any
                    }
                    else if (onCallback === failureCallback) {
                        obj[name as keyof T] = ((e: any) => reject([e, name])) as any
                    }
                }
            }
        })
    }, identity as (x: unknown) => [L, string])
}