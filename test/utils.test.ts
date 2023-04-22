import * as chai from "chai"
import { splitPath } from "../src/utils/appUtils"

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