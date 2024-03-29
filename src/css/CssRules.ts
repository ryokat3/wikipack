export type CssRulesDataType = { regex:string, cssList:string[] }[]


export class CssRules {

    cssRules: [RegExp, string[]][]

    constructor (cssRulesData:CssRulesDataType) {
        this.cssRules = cssRulesData.map((rule)=> [new RegExp(rule.regex, "i"), rule.cssList])
    }

    getCssList(fileName:string):string[] {
        for (const [regex, cssRule] of this.cssRules) {
            if (fileName.match(regex)) {
                return cssRule
            }            
        }
        return []
    }
}