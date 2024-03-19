type Constructor = new (...args: any[]) => any

export function addProxyProperty<Data extends { [key:string]:any },T extends Data>(obj:T, data:Data, prop:keyof Data):T {
    Object.defineProperty(obj, prop, {
        get: function() {
            return data[prop]
        },
        set: function(x) {
            data[prop] = x
        }
    })
    return obj
}

export function getProxyDataFunction<T extends { [key:string]:any }>(initialData:T) {
    const proxyData:T = initialData
    return <U extends T> (target:U) => {                
        return Object.keys(proxyData).reduce((obj:U, key:string)=>addProxyProperty(obj, proxyData, key), target)
    }
}

export function getProxyDataClass<Data extends { [key:string]:any }, Cls extends Constructor>(
    cls: Cls,
    data: InstanceType<Cls> extends Data ? Data : never   
) {
    return new Proxy(cls, {
        construct(target, args) {
            return getProxyDataFunction(data)(new target(...args))                        
        }
    })
}