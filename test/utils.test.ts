import * as chai from "chai"
import { splitPath } from "../src/utils/appUtils"
import { addProxyProperty, getProxyDataFunction, getProxyDataClass } from "../src/utils/proxyData"
import { HeadingNumber } from "../src/markdown/HeadingNumber"
import { TreeRel, createIndexTree, genHierachicalComparator } from "../src/tree/IndexTree"
import { takeWhile, zip } from "../src/utils/itertools"

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

describe("HeadingNumber", ()=>{
    it("basic", ()=>{
        let heading = HeadingNumber.create()

        chai.assert.equal(heading.toString(), "")
        heading = heading.increase(1)
        chai.assert.equal(heading.toString(), "1")
        heading = heading.increase(2)
        chai.assert.equal(heading.toString(), "1.1")
        heading = heading.increase(4)
        chai.assert.equal(heading.toString(), "1.1.0.1")
        heading = heading.increase(3)
        chai.assert.equal(heading.toString(), "1.1.1")
        heading = heading.increase(1)
        chai.assert.equal(heading.toString(), "2")
        heading = heading.increase(7)
        chai.assert.equal(heading.toString(), "2.0.0.0.0.0.1")        
    })

    it("Initial Value", ()=>{
        const heading = HeadingNumber.fromString("2.1")

        chai.assert.equal(heading.toString(), "2.1")
        chai.assert.equal(heading.increase(3).toString(), "2.1.1")
        chai.assert.equal(heading.increase(1).toString(), "3")       
    })

    it("comp", ()=>{
        const heading = HeadingNumber.fromString("1.1.1")

        const compHeadingNumber = genHierachicalComparator((v1:number, v2:number)=> (v1 === v2) ? 0 : (v1 > v2) ? 1 : -1, (h:HeadingNumber)=>h.value)

        chai.assert.equal(compHeadingNumber(heading, HeadingNumber.fromString("1.1.1.1")), TreeRel.decendants)
        chai.assert.equal(compHeadingNumber(heading, HeadingNumber.fromString("1.1")), TreeRel.ancestor)
        chai.assert.equal(compHeadingNumber(heading, HeadingNumber.fromString("1.2")), TreeRel.greater)
        chai.assert.equal(compHeadingNumber(heading, HeadingNumber.fromString("1.1.1")), TreeRel.same)
        chai.assert.equal(compHeadingNumber(heading, HeadingNumber.fromString("1.1.0.3")), TreeRel.less)

        chai.assert.equal(compHeadingNumber(HeadingNumber.fromString("1.1.1.1"), HeadingNumber.fromString("1.1.1")), TreeRel.ancestor)
        chai.assert.equal(compHeadingNumber(HeadingNumber.fromString("1.1.1.1"), HeadingNumber.fromString("1.1.1.1.1")), TreeRel.decendants)
        chai.assert.equal(compHeadingNumber(HeadingNumber.fromString("1.1.1.1"), HeadingNumber.fromString("1.1.1.1")), TreeRel.same)
        chai.assert.equal(compHeadingNumber(HeadingNumber.fromString("1.1.1.1.1"), HeadingNumber.fromString("1.1.2.1")), TreeRel.greater)
        chai.assert.equal(compHeadingNumber(HeadingNumber.fromString("1.1.3"), HeadingNumber.fromString("1.1.2.1")), TreeRel.less)
        chai.assert.equal(compHeadingNumber(HeadingNumber.fromString("1.1.3"), HeadingNumber.fromString("2")), TreeRel.greater)
    })
})

describe("takeWhile", ()=>{
    it("basic", ()=>{
        chai.assert.deepEqual(Array.from(takeWhile([1, 2, 0, 4, 0], (x)=>x > 0)), [1, 2])
        chai.assert.deepEqual(Array.from(takeWhile([], (x)=>x > 0)), [])
        chai.assert.deepEqual(Array.from(takeWhile([0, 2, 0, 4, 0], (x)=>x > 0)), [])
        chai.assert.deepEqual(Array.from(takeWhile([1, 2, 3, 4, 5], (x)=>x > 0)), [1, 2, 3, 4, 5])

        chai.assert.deepEqual(Array.from(takeWhile(takeWhile([1, 2, 3, 4, 5], (x)=>x > 0), (x)=>x < 4)), [1, 2, 3])
    })
})

describe("HierachicalValue", ()=>{
    it("basic", ()=>{
        const compHeadingNumber = genHierachicalComparator((v1:number, v2:number)=> (v1 === v2) ? 0 : (v1 > v2) ? 1 : -1, (h:HeadingNumber)=>h.value)
        const tree = createIndexTree(compHeadingNumber)

        const root = new tree(HeadingNumber.create())
        chai.assert.isTrue(root.isRoot)

        root.add(HeadingNumber.fromString("1.2.1"))
        chai.assert.equal(root.children[0].value.toString(), "1.2.1")

        root.add(HeadingNumber.fromString("1"))
        chai.assert.equal(root.children[0].value.toString(), "1")

        root.add(HeadingNumber.fromString("1.2.1.2"))
        root.add(HeadingNumber.fromString("2"))
        root.add(HeadingNumber.fromString("1.2"))
        root.add(HeadingNumber.fromString("1.1.1"))

        chai.assert.equal(root.children[0].value.toString(), "1")
        chai.assert.equal(root.children[1].value.toString(), "2")
        chai.assert.equal(root.children[0].children[0].value.toString(), "1.1.1")
        chai.assert.equal(root.children[0].children[1].value.toString(), "1.2")
        chai.assert.equal(root.children[0].children[1].children[0].value.toString(), "1.2.1")
        chai.assert.equal(root.children[0].children[1].children[0].children[0].value.toString(), "1.2.1.2")            
    })
})

describe("zip", ()=>{
    it("basic", ()=>{        
        chai.assert.deepEqual(Array.from(zip([1,2,3], ["1","2","3"])), [[1, "1"],[2, "2"],[3, "3"]])
        chai.assert.deepEqual(Array.from(zip([1,2,3,4], ["1","2","3"])), [[1, "1"],[2, "2"],[3, "3"]])
        chai.assert.deepEqual(Array.from(zip([1,2,3], ["1","2","3","4"])), [[1, "1"],[2, "2"],[3, "3"]])

        chai.assert.deepEqual(Array.from(zip([1,2,3], ["1","2","3"], [true, false, true])), [[1, "1", true],[2, "2", false],[3, "3", true]])
        chai.assert.deepEqual(Array.from(zip([1,2,3], ["1","2","3"], [])), [])
    })
})