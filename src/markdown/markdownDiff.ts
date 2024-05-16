import marked from 'marked'

type CallData<T extends { [key:string]:(...args:any[])=>any }> = { [Key in keyof T]: { type:Key, parameters:Parameters<T[Key]> } }
type DataUnion<T extends { [key:string|number|symbol]:any }> = T[keyof T]
type RemoveUndefined<T extends { [key:string]:any }> = { [Key in keyof T]: Exclude<T[Key], undefined> }

export type RendererRecord = DataUnion<CallData<marked.RendererApi>>
type RendererAllRequired = RemoveUndefined<Required<marked.RendererObject>>


export function genRendererRecorder(recordList:RendererRecord[], prevRecordList:RendererRecord[], diffId:string):RendererAllRequired {

    let idx:number = -1
    let found:boolean = prevRecordList.length === 0 ? true : false

    function isDiffRecord(i:number, type:keyof RendererAllRequired, args:Parameters<RendererAllRequired[typeof type]>):boolean {
        return (0 <= i && i < prevRecordList.length && (prevRecordList[i].type !== type || prevRecordList[i].parameters.length !== args.length || !prevRecordList[i].parameters.every((v, i)=> v === args[i])))
    }
    
    return {        
        code: (...args) => {
            
            recordList.push({
                type: "code",
                parameters: args
            })
            idx = idx + 1
            if (!found && isDiffRecord(idx, "code", args)) {                
                found = true
                return `<pre id="${diffId}"><code>${args[0]}</code></pre>`
            }            
            return false            
        },
        blockquote: (...args) => {
            recordList.push({
                type: "blockquote",
                parameters: args
            })
            idx = idx + 1
            if (!found && isDiffRecord(idx, "blockquote", args)) {                
                found = true
                return `<blockquote id="${diffId}">${args[0]}</blockquote>`
            }            
            return false            
        },
        html: (...args) => {
            recordList.push({
                type: "html",
                parameters: args
            })
            idx = idx + 1
            if (!found && isDiffRecord(idx, "html", args)) {                
                found = true
                return args[1] ? `<div id="${diffId}">${args[0]}</div>` : `<span id=${diffId}>${args[0]}</span>`
            } 
            return false
        },
        heading(...args:Parameters<RendererAllRequired['heading']>):false {            
            recordList.push({
                type: "heading",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        hr(...args:Parameters<RendererAllRequired['hr']>):false {
            recordList.push({
                type: "hr",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        list(...args:Parameters<RendererAllRequired['list']>):false {
            recordList.push({
                type: "list",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        listitem(...args:Parameters<RendererAllRequired['listitem']>):false {
            recordList.push({
                type: "listitem",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        checkbox(...args:Parameters<RendererAllRequired['checkbox']>):false {
            recordList.push({
                type: "checkbox",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        paragraph(...args:Parameters<RendererAllRequired['paragraph']>):false {
            recordList.push({
                type: "paragraph",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        table(...args:Parameters<RendererAllRequired['table']>):false {
            recordList.push({
                type: "table",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        tablerow(...args:Parameters<RendererAllRequired['tablerow']>):false {
            recordList.push({
                type: "tablerow",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        tablecell(...args:Parameters<RendererAllRequired['tablecell']>):false {
            recordList.push({
                type: "tablecell",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        strong(...args:Parameters<RendererAllRequired['strong']>):false {
            recordList.push({
                type: "strong",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        em(...args:Parameters<RendererAllRequired['em']>):false {
            recordList.push({
                type: "em",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        codespan(...args:Parameters<RendererAllRequired['codespan']>):false {
            recordList.push({
                type: "codespan",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        br(...args:Parameters<RendererAllRequired['br']>):false {
            recordList.push({
                type: "br",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        del(...args:Parameters<RendererAllRequired['del']>):false {
            recordList.push({
                type: "del",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        link(...args:Parameters<RendererAllRequired['link']>):false {
            recordList.push({
                type: "link",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        image(...args:Parameters<RendererAllRequired['image']>):false {
            recordList.push({
                type: "image",
                parameters: args
            })
            idx = idx + 1
            return false
        },
        text:(...args) => {
            recordList.push({
                type: "text",
                parameters: args
            })
            idx = idx + 1
            if (!found && isDiffRecord(idx, "text", args)) {                                
                found = true
                return `<p id="${diffId}">${args[0]}</p>`
            } 
            return false
        }
    }
}
