import { assert } from "chai"

export class HeadingNumber {
    private static MAX_HEADING_LENGTH:number = 32

    private readonly headingNumber: number[]

    constructor(initialStr:string = "") {
        const initial = initialStr ? initialStr.split('.').map((numStr)=>parseInt(numStr, 10)) : []
        this.headingNumber = [ ...initial, ...(new Array(HeadingNumber.MAX_HEADING_LENGTH - initial.length).fill(0)) ]
    }

    public toString():string {
        return this.headingNumber.filter((n)=>n > 0).map(String).join('.') || "0"
    }

    public increase(level:number):string {
        assert(0 < level && level <= this.headingNumber.length)
        for (let i = 0; i < this.headingNumber.length; ++i) {
            if ((i < (level - 1)) && (this.headingNumber[i] === 0)) {
                this.headingNumber[i] = 1
            }
            else if (i === level - 1) {
                this.headingNumber[i] = this.headingNumber[i] + 1
            }
            else if (i > level - 1) {
                this.headingNumber[i] = 0
            }
        }
        return this.toString()
    }
}