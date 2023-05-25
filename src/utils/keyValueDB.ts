import * as TE from "fp-ts/TaskEither"
import { Cast } from "boost-ts/typelib"





type ReadWrite<T> = { -readonly [P in keyof T]: ReadWrite<T[P]> }

export type StoreInfoType = {
    readonly [storeName:string] : readonly string[]
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
}


class KeyValueStore<T extends StoreInfoType, StoreName extends keyof T> {
    constructor(
        private readonly store: IDBObjectStore,
        private readonly keyPath: T[StoreName]
    ) { }

    private getKey(value: { [key:string]: any }) {
        return this.keyPath.map((key) => value[key])
    }

    put(value: { [key in Cast<T[StoreName], string>]: unknown }) {
        return TE.tryCatch(() => {
            const req = this.store.put(value)

            return new Promise<void>((resolve, reject) => {
                req.onsuccess = (_) => resolve()
                req.onerror = (_) => reject(`Failed to add ${JSON.stringify(value)}`)
            })
        }, (reason: unknown) => (reason as any).toString())
    }

    get(key: { [key in Cast<T[StoreName], string>]: unknown }) {
        return TE.tryCatch(() => {
            return new Promise((resolve, reject) => {
                const req = this.store.get(this.getKey(key) as IDBValidKey)
                req.onsuccess = (event) => {
                    if (event.target !== null) {
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
        }, (reason: unknown) => (reason as any).toString())
    }
}


export function getKeyValueDB<T extends StoreInfoType>(dbName:string, dbVersion:number, storeInfo:T)  {
    return TE.tryCatch(()=>{
        return new Promise<KeyValueDB<T>>((resolve, reject)=> {
            const openReq = indexedDB.open(dbName, dbVersion)

            openReq.onupgradeneeded = (event) => {
                if (event.target !== null) {
                    const db = (event.target as IDBOpenDBRequest).result                    
                    for (const [storeName, keyPath] of Object.entries(storeInfo)) {
                        db.createObjectStore(storeName, {
                                keyPath: keyPath as ReadWrite<typeof keyPath>
                        })
                    }                    
                    resolve(new KeyValueDB(db, storeInfo))
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
    },
    (reason:unknown)=>(reason as any).toString())
}