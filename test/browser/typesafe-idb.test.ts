import { createIDBInitializer, IDBCreator, IDB } from "../../src/utils/typesafe-idb"
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
        },
        "key3": number
    },
    "store2": {
        "value": number
    }
}

const data1_1:IdbData["store1"] = {
    "key1": {
        "key2": "hello"
    },
    "key3": 5    
}

const data1_2:IdbData["store1"] = {
    "key1": {
        "key2": "world"
    },
    "key3": 5
}


describe("typesafe-idb", ()=>{   
    
    // Skip this test case
    xit("indexedDB lifecycle", async ()=>{        
        // NOTE: open takes long time ??
        const req = indexedDB.open("test", 1)        
        await new Promise<IDBDatabase>((resolve, _reject) => {
            req.onupgradeneeded = function () {                    
                console.log("indexedDB open request: onupgradeneeded")                                
                const db = req.result                            
                resolve(db)
            }
            req.onsuccess = function () {                
                console.log("indexedDB open request: onsuccess")                                
                const db = req.result                                
                resolve(db)
            }
        })


        const delreq = indexedDB.deleteDatabase("test")
        await new Promise<IDBDatabase>((resolve, _reject) => {
            delreq.onsuccess = function () {
                console.log("indexedDB delete request: onsuccess")                                
                chai.assert.isTrue(true)                    
                resolve(delreq.result)
            }
        })        
    }).timeout(5000)

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
            TE.tap(({store})=>store.put(data1_1)),
            TE.tap(({store})=>store.put(data1_2)),
            TE.bindW("data", ({store})=>store.get("hello")),            
            TE.tapIO(({data})=>()=>chai.assert.isTrue(data.key1.key2 == "hello")),
            TE.tapIO(({idb})=>()=>idb.close()),            
            TE.tap(({idb})=>idb.delete()), 
            TE.tapError((e)=>TE.of(console.log(e.toString())))
        )()
        chai.assert.isTrue(E.isRight(result))
    })

    it("put and get with multiple key", async ()=>{
        const callback = createIDBInitializer<IdbData>().store("store1").autoIncrement(false).keyPath("key1", "key2").keyPath("key3").store("store2").keyPath("value").done()        

        const result = await pipe(
            TE.Do,
            TE.bind("creator", ()=>TE.right(new IDBCreator(callback))),
            TE.bind("db", ({creator})=>creator.openDb(dbName, dbVersion)),
            TE.bind("idb", ({db})=>TE.right(new IDB<IdbData>(db))),
            TE.bindW("store", ({idb})=>TE.right(idb.getStore("store1"))),            
            TE.tap(({store})=>store.put(data1_1)),
            TE.tap(({store})=>store.put(data1_2)),
            TE.bindW("data", ({store})=>store.get("hello", 5)),            
            TE.tapIO(({data})=>()=>chai.assert.isTrue(data.key1.key2 == "hello")),
            TE.tapIO(({data})=>()=>chai.assert.isTrue(data.key3 == 5)),
            TE.bindW("data2", ({store})=>store.get("world", 5)),            
            TE.tapIO(({data2})=>()=>chai.assert.isTrue(data2.key1.key2 == "world")),
            TE.tapIO(({data2})=>()=>chai.assert.isTrue(data2.key3 == 5)),
            TE.tapIO(({idb})=>()=>idb.close()),            
            TE.tap(({idb})=>idb.delete()), 
            TE.tapError((e)=>TE.of(console.log(e.toString())))
        )()
        chai.assert.isTrue(E.isRight(result))
    })
})