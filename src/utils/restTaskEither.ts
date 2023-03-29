import { right } from "fp-ts/lib/Either"
import { pipe } from "fp-ts/lib/pipeable"
import * as TE from "fp-ts/lib/TaskEither"

export class FetchApiError extends Error {
    constructor(readonly reason: unknown) { super() }
}
export function isFetchApiError(restError: unknown): restError is FetchApiError {
    return restError instanceof FetchApiError
}

type RestErrorType = Response | FetchApiError

export function getRestTE(...args: Parameters<typeof fetch>) {
    return pipe(
        TE.tryCatch(() => fetch(...args), (reason: unknown) => new FetchApiError(reason)),
        TE.filterOrElse((response: Response) => response.ok, (response: Response) => response as RestErrorType)
    )
}

export const liftRestTE = <A, B>(f: (a: A) => Promise<B>) => (a: A) => async () => right<RestErrorType, B>(await f(a))
