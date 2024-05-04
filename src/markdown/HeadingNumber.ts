
export class HeadingNumber {    
    readonly value: number[]

    private constructor(value:number[]) {
        this.value = value
    }

    static create():HeadingNumber {
        return new HeadingNumber([])
    }

    static fromString(initialStr:string):HeadingNumber {
        return new HeadingNumber(initialStr.split('.').map((numStr)=>parseInt(numStr, 10)))        
    }    

    public toString():string {        
        return this.value.map(String).join('.')
    }

    public increase(level:number):HeadingNumber {
        const value = new Array<number>(level).fill(0)
        for (const idx of value.keys()) {
            if (idx === level - 1) {
                value[idx] = (this.value.length > idx) ? this.value[idx] + 1 : 1
            }
            else {
                value[idx] = (this.value.length > idx) ? this.value[idx] : 0
            }
        }
        return new HeadingNumber(value)
    }
}