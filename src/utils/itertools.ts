
export function* takeWhile<T>(iter:Iterable<T>, cond:(t:T)=>boolean) {    
    for (const elem of iter) {
        if (cond(elem)) {
            yield elem
            continue
        }
        break
    }
}

export function* zip<T extends Iterable<unknown>[]>(...iterables:[...T]): Generator<{ [K in keyof T]:T[K] extends Iterable<infer U> ? U : never }, void, unknown> {
    const iterators = iterables.map((it) => it[Symbol.iterator]())
    while (true) {
        const nxts = iterators.map((it)=>it.next())
        if (nxts.map((nxt)=>nxt.done).every((done)=>done !== true)) {
            yield nxts.map((nxt)=>nxt.value) as any
            continue
        }
        return
    }
}