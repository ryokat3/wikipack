
import { getKeyValueDB } from "../src/utils/KeyValueDB"
import * as TE from "fp-ts/TaskEither"
import * as E from "fp-ts/Either"
import { pipe, identity } from "fp-ts/function"

const dbName = "db1"
const dbVersion = 1
const dbStoreInfo = {
    "store1": ["key1", "key2"]
}

describe("keyValueDB", ()=>{

    it("create and delete", async ()=>{
        chai.assert.isTrue(E.isRight(await pipe(
            TE.tryCatch(()=>getKeyValueDB(dbName, dbVersion, dbStoreInfo), identity),
            TE.tapIO((db)=>()=>db.close()),
            TE.chain((db)=>TE.tryCatch(()=>db.delete(), identity))
        )()))
    }),

    it("put and get", async ()=>{
        chai.assert.isTrue(E.isRight(await pipe(
            TE.Do,
            TE.bind("db", ()=>TE.tryCatch(()=>getKeyValueDB(dbName, dbVersion, dbStoreInfo), identity)),
            TE.bind("store", ({db})=>TE.right(db.getStore("store1", "readwrite"))),
            TE.tapIO(({store})=>()=>store.put({ key1: 1, key2: 2, value: "value"})),            
            TE.bind("result", ({store})=>TE.tryCatch(()=>store.get({ key1: 1, key2: 2}), identity)),            
            TE.tapIO(({db})=>()=>db.close()),
            TE.tap(({db})=>TE.tryCatch(()=>db.delete(), identity)),
            TE.tapIO(({result})=>()=>console.log(JSON.stringify(result)))
        )()))
    })
})