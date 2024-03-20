import * as chai from "chai"
import { splitPath } from "../src/utils/appUtils"
import { addProxyProperty, getProxyDataFunction, getProxyDataClass } from "../src/utils/proxyData"

describe("Javascript common", ()=>{
    it("splitPath", ()=>{        
        chai.assert.deepEqual(splitPath("a1/b2/c3"), ["a1", "b2", "c3"])
        chai.assert.deepEqual(splitPath("a1/b2/./c3"), ["a1", "b2", "c3"])
        chai.assert.deepEqual(splitPath("./a1/b2/c3"), ["a1", "b2", "c3"])
        chai.assert.deepEqual(splitPath("a1/b2/c3/."), ["a1", "b2", "c3"])
        chai.assert.deepEqual(splitPath("/a1/b2/c3/"), ["a1", "b2", "c3"])
        chai.assert.deepEqual(splitPath("a1//b2//c3"), ["a1", "b2", "c3"])

        chai.assert.deepEqual(splitPath("a1/../b2/c3"), ["b2", "c3"])
        chai.assert.deepEqual(splitPath("../a1/b2/c3"), ["..", "a1", "b2", "c3"])
        chai.assert.deepEqual(splitPath("../a1/../b2/c3"), ["..", "b2", "c3"])
        chai.assert.deepEqual(splitPath("/a1/../b2/../c3"), ["c3"])
        chai.assert.deepEqual(splitPath("../a1/b2/c3/.."), ["..", "a1", "b2" ])
        chai.assert.deepEqual(splitPath("../a1/../../b2/c3/.."), ["..", "..", "b2" ])
        chai.assert.deepEqual(splitPath("../../a1/b2/c3/.."), ["..", "..", "a1", "b2" ])
    })
})

describe("ProxyData", ()=>{

    it("addProxyProperty", () => {

        class Data {
            value:number = 1
        }
        
        class Wrapper extends Data {            
            value2:number
        
            constructor(data:Data, value2:number) {
                super()
                addProxyProperty(this, data, 'value')                
                this.value2 = value2
            }
        
            calc() {
                return this.value + this.value2
            }
        
            setValue(value:number) {                
                this.value = value                
            }
        }

        const data:Data = new Data()
        const wrapped:Wrapper = new Wrapper(data, 3)
        wrapped.value = 2
        
        chai.assert.equal(data.value, 2)
        wrapped.setValue(3)
        chai.assert.equal(data.value, 3)
        data.value = 4
        chai.assert.equal(wrapped.calc(), 7)
    }),

    it("getProxyDataFuction", ()=>{
        const data = {
            data: 1
        }
        type DataType = typeof data

        class Extended implements DataType {
            data:number = 2  
            data2:number = 3          
        }

        const func = getProxyDataFunction(data)
        const e1 = func(new Extended())
        const e2 = func(new Extended())

        chai.assert.equal(e1.data, 1)
        e1.data = 3
        chai.assert.equal(e2.data, 3)
    })

    it("getProxyDataClass", () => {
        class Data {
            value: number

            constructor(value:number) {
                this.value = value
            }
        }
        class Test {
            value:number = 2 // proxied
            value2:number    // not proxied

            constructor(value2:number) {
                this.value2 = value2
            }
        }
        const data = new Data(1)
        const ProxyTest = getProxyDataClass(Test, data)
        const nt1 = new ProxyTest(3)

        chai.assert.equal(nt1.value, 1)

        const nt2 = new ProxyTest(4)
        nt2.value = 5

        chai.assert.equal(nt1.value, 5)

        chai.assert.equal(nt1.value2, 3)
        chai.assert.equal(nt2.value2, 4)        
    })
})