import { createIDBInitializer, IDBCreator, IDB } from "../src/utils/IDB"
import * as chai from "chai"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import { pipe } from "fp-ts/function"

const dbName = "db1"
const dbVersion = 1

type IdbData = {
    "store1": {
        "key1": {
            "key2": string
        }
    },
    "store2": {
        "value": number
    }
}

describe("IDB", ()=>{
    it("indexedDB example", async ()=>{
        const req = indexedDB.open("test", 1)
        await new Promise<IDBDatabase>((resolve, _reject) => {
            req.onupgradeneeded = function () {                            
                const db = req.result                            
                resolve(db)
            }
            req.onsuccess = function () {                
                const db = req.result                                
                resolve(db)
            }
        })                
        const delreq = indexedDB.deleteDatabase("test")
        delreq.onsuccess = function () {
            chai.assert.isTrue(true)
            console.log("delete onsuccess")            
        }
        
    })

    it("createIDBInitializer", async ()=>{
        const callback = createIDBInitializer<IdbData>().store("store1").autoIncrement(false).keyPath("key1", "key2").store("store2").keyPath("value").done()

        const result = await pipe(        
            TE.of(new IDBCreator(callback)),
            TE.chain((creator)=>creator.openDb(dbName, dbVersion)),
            TE.map((db)=>new IDB<IdbData>(db)),            
            TE.tapIO((idb)=>()=>idb.close()),            
            TE.chainW((idb)=>idb.delete()),            
            TE.tapError((e)=>TE.of(console.log(e.toString())))
        )()
        chai.assert.isTrue(E.isRight(result))
    })


    it("put and get", async ()=>{
        const callback = createIDBInitializer<IdbData>().store("store1").autoIncrement(false).keyPath("key1", "key2").store("store2").keyPath("value").done()

        const result = await pipe(
            TE.Do,
            TE.bind("creator", ()=>TE.right(new IDBCreator(callback))),
            TE.bind("db", ({creator})=>creator.openDb(dbName, dbVersion)),
            TE.bind("idb", ({db})=>TE.right(new IDB<IdbData>(db))),
            TE.bindW("store", ({idb})=>TE.right(idb.getStore("store2"))),
            TE.tap(({store})=>store.put({ "value": 5})),
            TE.bindW("data", ({store})=>store.get(5)),
            TE.tapIO(({data})=>()=>console.log(JSON.stringify(data))),
            TE.tapIO(({data})=>()=>chai.assert.isTrue(data.value == 5)),
            TE.tapIO(({idb})=>()=>idb.close()),            
            TE.tap(({idb})=>idb.delete()), 
            TE.tapError((e)=>TE.of(console.log(e.toString())))
        )()
        chai.assert.isTrue(E.isRight(result))
    })

    it("put and get with nested key", async ()=>{
        const callback = createIDBInitializer<IdbData>().store("store1").autoIncrement(false).keyPath("key1", "key2").store("store2").keyPath("value").done()

        const result = await pipe(
            TE.Do,
            TE.bind("creator", ()=>TE.right(new IDBCreator(callback))),
            TE.bind("db", ({creator})=>creator.openDb(dbName, dbVersion)),
            TE.bind("idb", ({db})=>TE.right(new IDB<IdbData>(db))),
            TE.bindW("store", ({idb})=>TE.right(idb.getStore("store1"))),
            TE.tap(({store})=>store.put({ "key1": { "key2": "hello"}})),
            TE.bindW("data", ({store})=>store.get("hello")),
            TE.tapIO(({data})=>()=>console.log(JSON.stringify(data))),
            TE.tapIO(({data})=>()=>chai.assert.isTrue(data.key1.key2 == "hello")),
            TE.tapIO(({idb})=>()=>idb.close()),            
            TE.tap(({idb})=>idb.delete()), 
            TE.tapError((e)=>TE.of(console.log(e.toString())))
        )()
        chai.assert.isTrue(E.isRight(result))
    })
})