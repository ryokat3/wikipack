import { Either} from "fp-ts/lib/Either"

export type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
    T[P] extends object ? RecursivePartial<T[P]> :
    T[P]
}

export type BoxType<T> = { type:T }

type BoxValueType<T extends BoxType<unknown>> = T extends BoxType<Either<unknown, infer R>> ? R
    : T extends BoxType<unknown> ? T["type"]
    : never

export type ValueType<T> = BoxValueType<BoxType<T>>

type BoxErrorType<T extends BoxType<unknown>> = T extends BoxType<Either<infer L, unknown>> ? L
    : T extends BoxType<unknown> ? T["type"]
    : never

export type ErrorType<T> = BoxErrorType<BoxType<T>>

export type Writeable<T> = { -readonly [P in keyof T]: T[P] }

// export type BoxUnpromise<T extends BoxType<unknown>> = T extends BoxType<Promise<infer U>> ? U : T extends BoxType<any> ? T['type'] : never
export type BoxUnpromise<T extends BoxType<any>> = T extends BoxType<Promise<infer U>> ? U : T extends BoxType<any> ? T["type"] : never

export type Unpromise<T> = BoxUnpromise<BoxType<T>>

export type PromiseUnion<T> = Unpromise<T> | Promise<Unpromise<T>>