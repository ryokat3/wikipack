import { assert } from "chai"

export class HeadingNumber {
    private readonly headingNumber: number[]

    constructor(n:number) {
        this.headingNumber = new Array(n).fill(0)
    }

    
    get length():number {
        return this.headingNumber.length
    }

    public toString():string {
        return this.headingNumber.filter((n)=>n > 0).map(String).join('.') || "0"
    }

    public increase(level:number):string {
        assert(0 < level && level <= this.length)
        for (let i = 0; i < this.length; ++i) {
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