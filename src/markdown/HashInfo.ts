import { canonicalFileName, parseQuery } from "../utils/appUtils"

export class HashInfo {
    readonly fileName:string|undefined
    readonly heading:string|undefined
    
    static fromURL(urlStr:string) {
        const url = new URL(urlStr)    
        const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash 
        return HashInfo.fromString(hash)         
    }

    static fromString(hashStr:string) {
        const nq = hashStr.split('?', 2)
        const fileName = (nq[0] !== "") ? canonicalFileName(nq[0]) : undefined
        const queryParams = ((nq.length > 1) && (nq[1] !== "")) ? parseQuery(nq[1]) : {}

        return new HashInfo(fileName, ('heading' in queryParams) ? queryParams['heading'] : undefined)           
    }

    constructor(fileName:string|undefined, heading:string|undefined) {
        this.fileName = fileName
        this.heading = heading
    }

    toString():string {
        return (this.fileName || "") + (this.heading ? `?heading=${this.heading}` : "")
    }

    apply():void {
        window.location.hash = `#${this.toString()}`
    }
}