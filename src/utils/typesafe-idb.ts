import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import { pipe } from "fp-ts/function"
import * as OC from "./OnCallback"


function createOnUpgradeNeeded(idbSetup:(db:IDBDatabase)=>Promise<void>) {

    return async (event:IDBVersionChangeEvent) => await pipe(            
        TE.Do,            
        TE.bind("req", ()=>TE.fromNullable("IDBOpenDBRequest is null")(event.target as IDBOpenDBRequest | null)),                        
        TE.bind("db", (e)=>TE.of(e.req.result)), 
        TE.tapTask(({db})=>()=>idbSetup(db)),
        TE.bind("txn", (e)=>TE.fromNullable("IDBOpenDBRequest transaction is null")(e.req.transaction)),
        TE.tap(({txn})=>OC.taskify(txn, OC.defaultSet)),            
        TE.map(({db})=>db)
    )()
}

export class IDBCreator {

    constructor(
        private readonly idbSetup:(db:IDBDatabase)=>Promise<void>
    ) {}

    openDb(dbName:string, dbVersion:number) {                
        const onUpgradeNeeded = createOnUpgradeNeeded(this.idbSetup)

        return pipe(                
            TE.right(indexedDB.open(dbName, dbVersion)),               
            TE.chain((req)=>OC.taskify(req, {
                ...OC.defaultSet,
                onupgradeneeded: onUpgradeNeeded,                    
                onsuccess: (ev:Event)=>E.right((ev.target as IDBOpenDBRequest).result),
                onblocked: OC.failureCallback
            }))            
        )                                  
    }
}

export class IDB<DbData> {
    constructor(
        private readonly db: IDBDatabase        
    ) {}

    getStore<StoreName extends keyof DbData & string>(storeName: StoreName) {
        return new IDBStore<DbData[StoreName]>(this.db, storeName)
    }

    close() {
        this.db.close()
    }

    delete() {
        const db = this.db  
        return OC.taskify(window.indexedDB.deleteDatabase(db.name), {
            ...OC.defaultSet,
            onblocked: (e) => { db.close(); return E.right(e) },
            onupgradeneeded: OC.noCallback
        })
    }
}


class IDBStore<StoreData> {
    constructor(
        private readonly db: IDBDatabase,
        private readonly storeName:　string
    ) {}

    private getStore(mode:IDBTransactionMode) {
        const transaction = this.db.transaction(this.storeName, mode)
        return transaction.objectStore(this.storeName)
    }
    
    put(value: StoreData) {        
        const store = this.getStore("readwrite")
        return OC.taskify(store.put(value), OC.defaultSet)
    }

    get(...keys: Extract<IDBValidKey, any[]>) {
        const store = this.getStore("readonly")
        return OC.taskify(store.get(keys), {
            ...OC.defaultSet,
            onsuccess: (ev)=> (ev.target != null) ? E.right((ev.target as IDBRequest).result as StoreData) : E.left(ev)            
        })
    }
}

type OnUpgradeNeededType = {
    [storeName: string]: {
        autoIncrement: boolean,
        keyPath: string[][],
        index: {
            [indexName: string]: {
                keyPath: string[],
                unique: boolean,
                multiEntry: boolean
            }
        }
    }
}

function createOnUpgradeNeededCallback(storeInfo: OnUpgradeNeededType) {        
    return async (db: IDBDatabase):Promise<void> => {            
        for (const [storeName, storeOption] of Object.entries(storeInfo)) {
            const storeParam: IDBObjectStoreParameters = (storeOption.keyPath.length > 0) ? {
                keyPath: storeOption.keyPath.map((kp)=>kp.join('.')),
                autoIncrement: storeOption.autoIncrement
            } : {
                autoIncrement: storeOption.autoIncrement
            }
            const store = db.createObjectStore(storeName, storeParam)
            for (const [indexName, indexOption] of Object.entries(storeOption.index)) {
                store.createIndex(indexName, indexOption.keyPath.join('.'), {
                    unique: indexOption.unique,
                    multiEntry: indexOption.multiEntry
                })
            }
        }
    }
}

export function createIDBInitializer<DbData> () {
    return new IDBConstructorBase<DbData, never>(Object.create(null))
}

class IDBConstructorBase<DbData, StoreNameList extends keyof DbData & string> {
    constructor(
        protected readonly upgradeData: OnUpgradeNeededType
    ) {}

    store<StoreName extends Exclude<keyof DbData & string, StoreNameList>>(storeName:StoreName):IDBStoreConstructor<DbData, StoreNameList|StoreName, DbData[StoreName]> {
        return new IDBStoreConstructor<DbData, StoreNameList | StoreName, DbData[StoreName]>({
            ...this.upgradeData,
            [storeName]: {
                autoIncrement: false,
                keyPath: [],
                index: {}
            }
        }, storeName)
    }

    done(): keyof DbData extends StoreNameList ? (db:IDBDatabase)=>Promise<void> : never {        
        return createOnUpgradeNeededCallback(this.upgradeData) as any
    } 
}


class IDBStoreConstructorBase<DbData, StoreNameList extends keyof DbData & string, StoreData> extends IDBConstructorBase<DbData, StoreNameList> {   
    
    constructor(
        upgradeData:OnUpgradeNeededType,
        protected readonly storeName:(keyof DbData & string)
    ) {
        super(upgradeData)
    }

    index(indexName:string):IDBIndexConstructor<DbData,StoreNameList,StoreData> {        
        const storeOption = this.upgradeData[this.storeName]        
        return new IDBIndexConstructor<DbData,StoreNameList,StoreData>({
            ...this.upgradeData,
            [this.storeName]: {
                ...storeOption,
                index: {
                    ...storeOption.index,
                    [indexName]: {                        
                        keyPath: [],
                        unique: false,
                        multiEntry: false
                    }
                }
            }
        }, this.storeName, indexName)
    }
}


class IDBStoreConstructor<DbData, StoreNameList extends keyof DbData & string, StoreData> extends IDBStoreConstructorBase<DbData, StoreNameList, StoreData> {
    constructor(
        upgradeData:OnUpgradeNeededType,
        storeName:(keyof DbData & string)
    ) {
        super(upgradeData, storeName)
    }

    autoIncrement(autoIncrement:boolean): IDBStoreConstructor<DbData,StoreNameList,StoreData> {
        const storeOption = this.upgradeData[this.storeName]
        return new IDBStoreConstructor<DbData, StoreNameList, StoreData>({
            ...this.upgradeData,
            [this.storeName]: {
                ...storeOption,
                autoIncrement: autoIncrement
            }
        }, this.storeName)
    }

    keyPath<K1 extends keyof StoreData & string>(k1:StoreData[K1] extends IDBValidKey ? K1 : never): IDBStoreConstructor<DbData,StoreNameList,StoreData>
    keyPath<K1 extends keyof StoreData & string, K2 extends keyof StoreData[K1] & string>(k1:K1, k2:StoreData[K1][K2] extends IDBValidKey ? K2 : never): IDBStoreConstructor<DbData,StoreNameList,StoreData>
    keyPath<K1 extends keyof StoreData & string, K2 extends keyof StoreData[K1] & string, K3 extends keyof StoreData[K1][K2] & string>(k1:K1, k2:K2, k3:StoreData[K1][K2][K3] extends IDBValidKey ? K3 : never): IDBStoreConstructor<DbData,StoreNameList,StoreData>
    keyPath(...keyPath:string[]):IDBStoreConstructor<DbData,StoreNameList,StoreData> {
        const storeOption = this.upgradeData[this.storeName]
        const currentKeyPath = this.upgradeData[this.storeName]['keyPath']
        return new IDBStoreConstructor<DbData, StoreNameList, StoreData>({
            ...this.upgradeData,
            [this.storeName]: {
                ...storeOption,
                keyPath: [                    
                    ...currentKeyPath,
                    keyPath
                ]
            }
        }, this.storeName)
    }

}

class IDBIndexConstructor<DbData, StoreNameList extends keyof DbData & string, StoreData> extends IDBStoreConstructorBase<DbData, StoreNameList, StoreData> {
    constructor(
        upgradeData:OnUpgradeNeededType,
        storeName:(keyof DbData & string),
        private readonly indexName:string                
    ) {
        super(upgradeData, storeName)
    }

    keyPath<K1 extends keyof StoreData & string>(k1:K1): IDBIndexConstructor<DbData, StoreNameList, StoreData>
    keyPath<K1 extends keyof StoreData & string, K2 extends keyof StoreData[K1] & string>(k1:K1, k2:K2): IDBIndexConstructor<DbData, StoreNameList, StoreData>
    keyPath<K1 extends keyof StoreData & string, K2 extends keyof StoreData[K1] & string, K3 extends keyof StoreData[K1][K2] & string>(k1:K1, k2:K2, k3:K3): IDBIndexConstructor<DbData, StoreNameList, StoreData>
    keyPath(...keyPath:string[]):IDBIndexConstructor<DbData, StoreNameList, StoreData> {
        const storeOption = this.upgradeData[this.storeName]
        const indexOption = this.upgradeData[this.storeName]['index'][this.indexName]
        return new IDBIndexConstructor<DbData, StoreNameList, StoreData>({
            ...this.upgradeData,
            [this.storeName]: {
                ...storeOption,
                index: {
                    ...storeOption['index'],
                    [this.indexName]: {
                        ...indexOption,
                        keyPath: keyPath
                    }
                }
            }
        }, this.storeName, this.indexName)
    }

    unique(unique:boolean): IDBIndexConstructor<DbData, StoreNameList, StoreData> {
        const storeOption = this.upgradeData[this.storeName]
        const indexOption = this.upgradeData[this.storeName]['index'][this.indexName]
        return new IDBIndexConstructor<DbData, StoreNameList, StoreData>({
            ...this.upgradeData,
            [this.storeName]: {
                ...storeOption,
                index: {
                    ...storeOption['index'],
                    [this.indexName]: {
                        ...indexOption,
                        unique: unique
                    }
                }
            }
        }, this.storeName, this.indexName)    
    }

    multiEntry(multiEntry:boolean): IDBIndexConstructor<DbData, StoreNameList, StoreData> {
        const storeOption = this.upgradeData[this.storeName]
        const indexOption = this.upgradeData[this.storeName]['index'][this.indexName]
        return new IDBIndexConstructor<DbData, StoreNameList, StoreData>({
            ...this.upgradeData,
            [this.storeName]: {
                ...storeOption,
                index: {
                    ...storeOption['index'],
                    [this.indexName]: {
                        ...indexOption,
                        multiEntry: multiEntry
                    }
                }
            }
        }, this.storeName, this.indexName)
    }
}



