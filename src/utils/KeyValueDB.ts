import * as TE from "fp-ts/TaskEither"
import { identity, pipe } from "fp-ts/function"
import { Success, Failure, taskifyOnCallback, DEFAULT_ON_CALLBACK, DEFAULT_FAILURE_CALLBACK } from "./OnCallback"



export type StoreInfoType = {
    [storeName:string] : string[]
}

class KeyValueDB<T extends StoreInfoType> {
    constructor(
        private readonly db: IDBDatabase,
        private readonly storeInfo: T
    ) { }

    getStore<StoreName extends (keyof T)>(storeName: StoreName, mode: IDBTransactionMode) {
        const transaction = this.db.transaction(storeName as string, mode)
        return new KeyValueStore<T, StoreName>(transaction.objectStore(storeName as string), this.storeInfo[storeName])
    }

    close() {
        this.db.close()
    }

    delete() {        
        const req = window.indexedDB.deleteDatabase(this.db.name)
        return new Promise((resolve, reject)=> {
            req.onerror = (_) => {                  
                reject(`Failed to delete indexedDB ${this.db.name}`)
            }
            req.onsuccess = (_) => {                                
                resolve(`Succeeded to delted indexedDB ${this.db.name}`)
            }
            req.onblocked = (_) => {
                this.db.close()                           
            }
        })
    }
}


class KeyValueStore<T extends StoreInfoType, StoreName extends keyof T> {
    constructor(
        private readonly store: IDBObjectStore,
        private readonly keyPath: T[StoreName]
    ) { }

    private getKey(value: { [key: string]: any }) {
        return this.keyPath.map((key) => value[key])
    }

    put(value: { [key in T[StoreName]&string]: unknown }) {
        const req = this.store.put(value)

        return new Promise<void>((resolve, reject) => {
            req.onsuccess = (_) => {
                console.log("put succeeded")
                resolve()
            }
            req.onerror = (_) => reject(`Failed to add ${JSON.stringify(value)}`)
        })
    }

    get(key: { [key in T[StoreName]&string]: unknown }) {
        return new Promise((resolve, reject) => {
            console.log("get called")                    
            const req = this.store.get(this.getKey(key) as IDBValidKey)
            req.onsuccess = (event) => {
                if (event.target !== null) {
                    console.log("get succeeded")                    
                    resolve((event.target as IDBRequest).result)
                }
                else {
                    reject("No record")
                }
            }
            req.onerror = (_event) => {                
                reject("Failed to get record by error")
            }            
        })
    }
}



export function getKeyValueDB<T extends StoreInfoType>(dbName:string, dbVersion:number, storeInfo:T)  {    
    return new Promise<KeyValueDB<T>>((resolve, reject) => {
        const openReq = indexedDB.open(dbName, dbVersion)

        openReq.onupgradeneeded = (event) => {            
            if (event.target !== null) {
                const db = (event.target as IDBOpenDBRequest).result
                
                for (const [storeName, keyPath] of Object.entries(storeInfo)) {
                    db.createObjectStore(storeName, {
                        keyPath: keyPath
                    })
                }
                const txn = (event.target as IDBOpenDBRequest).transaction
                if (txn !== null) {
                    txn.oncomplete = (_ev2)=> {
                        resolve(new KeyValueDB(db, storeInfo))
                    }
                    txn.onerror = (e)=> {
                        reject(e)
                    }
                }
                else {
                    reject("Failed create database because no")
                }
                
            }
            else {
                reject("Failed to create database")
            }
        }

        openReq.onsuccess = (event) => {            
            if (event.target !== null) {
                resolve(new KeyValueDB((event.target as IDBOpenDBRequest).result, storeInfo))
            }
            else {
                reject("Failed to get database")
            }
        }

        openReq.onerror = (_) => {
            reject("Failed to open request")
        }
    })
}

type IndexOption = {
    indexName: string,
    keyPath: string|string[],
    unique: boolean,
    multiEntry: boolean
}

type StoreOptions = {
    autoIncrement: boolean,
    keyPath: string|string[],
    index: IndexOption[]
}

type OnUpgradeNeededType = {
    [storeName:string]: StoreOptions
}

function setupObjectStore(db:IDBDatabase, storeInfo:OnUpgradeNeededType) {
    for (const [storeName, storeOptions] of Object.entries(storeInfo)) {
        const param: IDBObjectStoreParameters = ((typeof storeOptions.keyPath === "string") || (storeOptions.keyPath.length > 0)) ? {
            keyPath: storeOptions.keyPath,
            autoIncrement: storeOptions.autoIncrement
        } : {
            autoIncrement: storeOptions.autoIncrement
        }
        const store = db.createObjectStore(storeName, param)
        for (const indexOption of storeOptions.index) {
            store.createIndex(indexOption.indexName, indexOption.keyPath, {
                unique: indexOption.unique,
                multiEntry: indexOption.multiEntry
            })
        }
    }
}

export class OnUpgradeNeededCallback<T, Names extends keyof T & string = never, StoreName extends keyof T & string = never> {
    constructor(
        private readonly upgradeData:OnUpgradeNeededType = Object.create(null),
        private readonly storeName:(keyof T & string)|undefined= undefined
    ) {}

    store<ThisStoreName extends Exclude<keyof T & string, Names>>(name:ThisStoreName):OnUpgradeNeededCallback<T, Names|ThisStoreName, ThisStoreName> {
        return (name in this.upgradeData) ? new OnUpgradeNeededCallback<T, Names|ThisStoreName, ThisStoreName>(this.upgradeData, name) :
            new OnUpgradeNeededCallback<T, Names|ThisStoreName, ThisStoreName>({
                ...this.upgradeData,
                [name]: {
                    autoIncrement: false,
                    keyPath: [],
                    index: []
                } as StoreOptions
            }, name)
    }

    autoIncrement(autoIncrement:boolean): OnUpgradeNeededCallback<T,Names,StoreName> {
        if ((this.storeName === undefined) || (this.upgradeData[this.storeName] === undefined)) {
            throw new Error("No store name defined when calling autoIncrement")
        }                
        else {
            const storeOption = this.upgradeData[this.storeName]
            return new OnUpgradeNeededCallback<T,Names>({
                ...this.upgradeData,
                [this.storeName]: {
                    ...storeOption,
                    autoIncrement: autoIncrement
                }
            }, this.storeName)
        }
    }

    keyPath<K1 extends keyof T[StoreName] & string>(keyPath:K1 | [K1]): OnUpgradeNeededCallback<T,Names,StoreName>
    keyPath<K1 extends keyof T[StoreName] & string, K2 extends keyof T[StoreName][K1] & string>(keyPath:[K1, K2]): OnUpgradeNeededCallback<T,Names,StoreName>
    keyPath<K1 extends keyof T[StoreName] & string, K2 extends keyof T[StoreName][K1] & string, K3 extends keyof T[StoreName][K1][K2] & string>(keyPath:[K1,K2,K3]): OnUpgradeNeededCallback<T,Names,StoreName>
    keyPath(keyPath:string|string[]):OnUpgradeNeededCallback<T,Names> {
        if ((this.storeName === undefined) || (this.upgradeData[this.storeName] === undefined)) {
            throw new Error("No store name defined when calling keyPath")
        }                
        else {
            const storeOption = this.upgradeData[this.storeName]
            return new OnUpgradeNeededCallback<T,Names,StoreName>({
                ...this.upgradeData,
                [this.storeName]: {
                    ...storeOption,
                    keyPath: keyPath
                }
            }, this.storeName)
        }              
    }

    index<K1 extends keyof T[StoreName] & string>(name:string, keyPath:K1|[K1], unique:boolean, multiEntry:boolean):OnUpgradeNeededCallback<T,Names>
    index<K1 extends keyof T[StoreName] & string, K2 extends keyof T[StoreName][K1] & string>(name:string, keyPath:`${K1},${K2}`|[K1,K2], unique:boolean, multiEntry:boolean):OnUpgradeNeededCallback<T,Names>
    index<K1 extends keyof T[StoreName] & string, K2 extends keyof T[StoreName][K1] & string, K3 extends keyof T[StoreName][K1][K2] & string>(name:string, keyPath:`${K1},${K2}`|[K1,K2,K3], unique:boolean, multiEntry:boolean):OnUpgradeNeededCallback<T,Names>
    index(name:string, keyPath:string|string[], unique:boolean = false, multiEntry:boolean = false):OnUpgradeNeededCallback<T,Names> {        
        if ((this.storeName === undefined) || (this.upgradeData[this.storeName] === undefined)) {
            throw new Error("No store name defined when calling keyPath")
        }                
        else {
            const storeOption = this.upgradeData[this.storeName]
            return new OnUpgradeNeededCallback<T,Names>({
                ...this.upgradeData,
                [this.storeName]: {
                    ...storeOption,
                    index: [
                        ...storeOption.index,
                        {
                            indexName: name,
                            keyPath: keyPath,
                            unique: unique,
                            multiEntry: multiEntry
                        }
                    ]
                }
            }, this.storeName)
        }  
    
    }

    private _onupgradeneeded(event:IDBVersionChangeEvent) {
        const upgradeData = this.upgradeData
        return pipe(            
            TE.Do,
            TE.bind("req", ()=>TE.fromNullable("IDBOpenDBRequest is null")(event.target as IDBOpenDBRequest | null)),
            TE.bind("db", (e)=>TE.of(e.req.result)),
            TE.tapIO(({db})=>()=>setupObjectStore(db, upgradeData)),
            TE.bind("txn", (e)=>TE.fromNullable("transaction is null")(e.req.transaction)),
            TE.tap(({txn})=>taskifyOnCallback(txn, DEFAULT_ON_CALLBACK)),            
            TE.map(({db})=>db)
        )        
    }

    onupgradeneeded(): keyof T extends Names ? (event:IDBVersionChangeEvent)=>Promise<IDBDatabase> : never {                    
        return ((event: IDBVersionChangeEvent) => pipe(
            this._onupgradeneeded(event),
            TE.tapError((reason) => TE.fromIO(() => console.log(reason))),
            TE.getOrElse((reason) => { throw reason })
        )()) as keyof T extends Names ? (event:IDBVersionChangeEvent)=>Promise<IDBDatabase> : never 
    }

    private _openDb(dbName:string, dbVersion:number) {
        return pipe(                
            TE.right(indexedDB.open(dbName, dbVersion)),
            TE.chain((req)=>taskifyOnCallback(req, {
                ...DEFAULT_ON_CALLBACK,
                onupgradeneeded: this._onupgradeneeded,
                onblocked: DEFAULT_FAILURE_CALLBACK                
            }))
        )                                  
    }
}