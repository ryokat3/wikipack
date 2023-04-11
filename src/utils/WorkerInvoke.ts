import { SelectObject, FilterObject, Cast } from "boost-ts"

type RequestType = {
    request: any
}

type ResponseType = {
    response: any
}

type CallType = RequestType & ResponseType

export type WorkerMessageMap = {
    [Key:string]: RequestType | ResponseType | CallType
}

type RequestMap<T extends WorkerMessageMap> = FilterObject<SelectObject<T, RequestType>, CallType>
type RequestDataType<T extends WorkerMessageMap, Key extends keyof RequestMap<T> = keyof RequestMap<T>> = Cast<RequestMap<T>[Key], RequestType>

type ResponseMap<T extends WorkerMessageMap> = FilterObject<SelectObject<T, ResponseType>, CallType>
type ResponseDataType<T extends WorkerMessageMap, Key extends keyof ResponseMap<T> = keyof ResponseMap<T>> = Cast<ResponseMap<T>[Key], ResponseType>

type CallMap<T extends WorkerMessageMap> = SelectObject<T, CallType>
type CallDataType<T extends WorkerMessageMap, Key extends keyof CallMap<T> = keyof CallMap<T>> = Cast<CallMap<T>[Key], CallType>

export class WorkerInvoke<T extends WorkerMessageMap> {
    private readonly worker:Worker
    private id:number    
    private readonly callMap: { [id:number] : {
        resolve:(value:CallDataType<T>['response'])=>void,
        reject:(reason?:any)=>void
    }}    
    private readonly eventHandler: { [Key in keyof ResponseMap<T>]: (payload: ResponseDataType<T>['response'])=>void } = Object.create(null)

    constructor(worker:Worker) {
        this.worker = worker
        this.id = 0
        this.callMap = Object.create(null)
        this.eventHandler = Object.create(null)

        worker.onmessage = (e:MessageEvent<{ id:number, payload:CallDataType<T>['response']} | { type:keyof ResponseMap<T>, payload:ResponseDataType<T>['response']}>)=>{
            if ("id" in e.data) {
                this.callMap[e.data.id].resolve(e.data.payload)
                delete this.callMap[e.data.id]
            }
            else if ("type" in e.data) {
                this.eventHandler[e.data.type](e.data.payload)
            }
        }
    }

    public async call<Key extends keyof CallMap<T>>(key: Key, param:CallDataType<T, Key>['request']):Promise<CallDataType<T, Key>['response']> {
        const id = this.id++
        const prom = new Promise<CallDataType<T, Key>['response']>((resolve, reject) => {
            this.worker.postMessage({
                type: key,
                id: id,
                payload: param
            })
            this.callMap[id] = {
                resolve: resolve,
                reject: reject
            }
        })
        return await prom
    }

    public request<Key extends keyof RequestMap<T>>(key: Key, param:RequestDataType<T, Key>['request']):void {
        this.worker.postMessage({
            type:key,
            payload:param
        })
    }

    public addEventHandler<Key extends keyof ResponseMap<T>>(key:Key, callback:(payload: ResponseDataType<T, Key>['response'])=>void) {
        this.eventHandler[key] = callback
    }

}

export class WorkerThreadHandler<T extends WorkerMessageMap> {
    constructor(        
        private readonly callHandler: { [Key in keyof CallMap<T>]: (payload: CallDataType<T, Key>['request']) => CallDataType<T, Key>['response'] } = Object.create(null),
        private readonly requestHandler: { [Key in keyof RequestMap<T>]: (payload: RequestDataType<T, Key>['request'])=>void } = Object.create(null),
    ) {}

    public addCallHandler<Key extends keyof CallMap<T>>(key:Key, callback:(payload: CallDataType<T, Key>['request']) => Promise<CallDataType<T, Key>['response']>) {
        return new WorkerThreadHandler({
            ...this.callHandler,
            [key]:callback
        }, this.requestHandler)
    }

    public addRequestHandler<Key extends keyof RequestMap<T>>(key:Key, callback:(payload: RequestDataType<T, Key>['request'])=>void) {
        return new WorkerThreadHandler(this.callHandler, {
            ...this.requestHandler,
            [key]:callback      
        })
    }

    public build(postMessage:(msg:any)=>void) {
        return async (e:MessageEvent<{type:keyof CallMap<T>, id:number, payload:CallDataType<T>['request']} | {type:keyof RequestMap<T>, payload:RequestDataType<T>['request']}>) => {
            if ('id' in e.data) {
                const callback = this.callHandler[e.data.type]
                postMessage({
                    type: e.data.type,
                    id: e.data.id,
                    payload: await callback(e.data.payload)
                })
            }
            else {
                const callback = this.requestHandler[e.data.type]
                callback(e.data.payload)                
            }
        }
    }
}