type WorkerMessageMap = {
    [Key:string]: {
        request: {
            [Key:string]: any
        },
        response: any
    }
}

export type GetAPI<T extends WorkerMessageMap, Key extends keyof T> = (arg:T[Key]['request']) => Promise<T[Key]['response']>

export type GetRequestMessageType<T extends WorkerMessageMap, Key extends keyof T> = {
    type: Key,
    id: string,
    data: T[Key]['request']
}

export type GetResponseMessageType<T extends WorkerMessageMap, Key extends keyof T> = {
    type: Key,
    id: string,
    data: T[Key]['response']
}

export class WorkerInvoke<API extends WorkerMessageMap> {
    readonly worker:Worker
    id:number    
    readonly respMap:{ [id:string]: {
        resolve:(value:API[keyof API]['response'])=>void,
        reject:(reason?:any)=>void
    }}

    constructor(worker:Worker) {
        this.worker = worker
        this.id = 0
        this.respMap = {}       

        worker.onmessage = (e:MessageEvent<GetResponseMessageType<API, API[keyof API]['response']>>)=>{
            this.respMap[e.data.id].resolve(e.data.data)
            delete this.respMap[e.data.id]
        }
    }

    async invoke<T extends keyof API>(key: T, param:API[T]['request']):Promise<API[T]['response']> {
        const id = (this.id++).toString()
        const prom = new Promise<API[T]['response']>((resolve, reject) => {
            this.worker.postMessage({
                type: key,
                id: id,
                data: param
            })
            this.respMap[id] = {
                resolve: resolve,
                reject: reject
            }
        })
        return await prom
    }
}