import marked, { Marked, RendererApi } from 'marked'
import { markedHighlight } from "marked-highlight"
import hljs from 'highlight.js'
import { getFileFromTree } from "../tree/FileTree"
import { HyperRefData, FolderType } from "../tree/WikiFile"
import { addPath, isURL, randomString, deepEqual } from "../utils/appUtils"
import { HeadingNumber } from "./HeadingNumber"
import { HeadingTreeType } from "../tree/WikiFile"
import { RendererRecord, genRendererObject, postRenderer, PostRendererObject } from "./markdownDiff"


export function addElementId(setId:(id:string)=>void) {
    return (htmlStr:string):string => {
        const template = document.createElement('template')
        template.innerHTML = htmlStr
        const target = template.content.children[0]
        const id = target.getAttribute("id")
        if (id) {
            setId(id)
        }
        else {
            const randomId = randomString()
            target.setAttribute("id", randomId)
            setId(randomId)
        }        
        return target.outerHTML
    }
}

export function createAddElementIdRenderer(isSame:FailOnce, setId:(id:string)=>void):PostRendererObject {
    const addIdFunc = addElementId(setId)
    const elementFunc = (htmlStr:string) => {
        return isSame.check() ? htmlStr : addIdFunc(htmlStr)
    }
    const textFunc = (text:string) => {
        if (isSame.check()) {
            return text
        }
        else {
            const randomId = randomString()            
            setId(randomId)
            return `<span id="${randomId}">${text}</span>`
        }
    }

    return {
        code: elementFunc,        
        blockquote: elementFunc,
        html: textFunc,
        heading: elementFunc,
        hr: elementFunc,
        list: elementFunc,
        listitem: elementFunc,
        checkbox: elementFunc,
        paragraph: elementFunc,
        table: elementFunc,
        tablerow: elementFunc,
        tablecell: elementFunc,
        strong: elementFunc,
        em: elementFunc,
        codespan: elementFunc,
        br: elementFunc,
        del: elementFunc,
        link: elementFunc,
        image: elementFunc,
        text: textFunc
    }
}

function getWalkTokenExtension(hrefData: HyperRefData, dirPath: string, isMarkdownFile: (fileName: string) => boolean): (token:marked.Token)=>void {    

    return (token: marked.Token) => {
        if (token.type === "image") {
            if (!isURL(token.href)) {                
                hrefData.imageList.push(addPath(dirPath, token.href))
            }
        }
        else if (token.type === "link") {
            const pagePath = addPath(dirPath, token.href)
            if (!isURL(token.href)) {
                if (isMarkdownFile(token.href)) {
                    hrefData.markdownList.push(pagePath)
                }
                else {
                    hrefData.linkList.push(pagePath)
                }
            }
        }
    }
}

export function getHyperRefData(markdown:string, dirPath:string, isMarkdownFile:(fileName:string)=>boolean):HyperRefData {


    const mark = new Marked()
    const hrefData:HyperRefData = {
        imageList: [],
        linkList: [],
        markdownList: []
    }
    mark.use({ walkTokens: getWalkTokenExtension(hrefData, dirPath, isMarkdownFile) })
    mark.parse(markdown)    

    return hrefData
}

function extractText(htmlStr:string):string {
    var span = document.createElement('span')
    span.innerHTML = htmlStr
    return span.textContent || span.innerText
}


function getRendererExtension(    
    rootFolder:FolderType,
    dirPath:string,
    isMarkdown:(fileName:string)=>boolean,
    headingTree:HeadingTreeType
): marked.RendererObject {        
    const renderer = new marked.Renderer()
    let headingNumber = HeadingNumber.create()
1
    return {
        link(href: string, title: string|null|undefined, text: string) {            
            const fileName = addPath(dirPath, href)
            if (isMarkdown(href)) {                                                
                return renderer.link(`#${fileName}`, title, text)
            }
            else {                
                const dataFile = getFileFromTree(rootFolder, fileName)
                if ((dataFile !== undefined) && (dataFile.type === 'data')) {
                    return renderer.link(dataFile.dataRef, title, text)                    
                }
                else {
                    return renderer.link(href, title, text)
                }
            }
        },

        image(href:string, title:string|null, text:string) {      
            const fileName = addPath(dirPath, href)
            const imageFile = getFileFromTree(rootFolder, fileName)
            if ((imageFile !== undefined) && (imageFile.type === 'data')) {
                return renderer.image(imageFile.dataRef, title, text)
            }
            return renderer.image(href, title, text)
        }, 

        heading(text:string, level:number, _raw:string) {
            headingNumber = headingNumber.increase(level)
            const textContnet = extractText(text)            
            headingTree.add({ text:textContnet, heading: headingNumber })                                    
            return `<h${level} id="${headingNumber}" style="scroll-margin-top:16px;">${text}</h${level}>`            
        }
    }
}

const colorAndKeywordsRegex = /([#%](?:[0-9a-fA-F]{3,6}|\w+))\[(.*?)\]/

function decodeUriOrEcho(uri: string) {
    try {
        return decodeURIComponent(uri)
    }
    catch (e) {
        if (e instanceof URIError) {
            return uri
        }
        throw e
    }
}

export function createRendererRecorder(rendererRecordList:RendererRecord[]):marked.RendererObject {
    function recoder<T extends keyof marked.RendererApi>(type:T) {
        return (...args:Parameters<marked.RendererApi[T]>):false => {
            rendererRecordList.push({
                type: type,
                parameters: args
            } as any)
            return false
        }
    }
    return genRendererObject(recoder)
}

export function createCompRendererRecord(prevRecordList:RendererRecord[], counter:FailOnce):(type:keyof marked.RendererApi) => (...args:Parameters<RendererApi[typeof type]>) =>false {

    let idx:number = -1

    return (type:keyof marked.RendererApi) => (...args:Parameters<RendererApi[typeof type]>):false => {
        if (counter.foundFalse) {
            return false
        }
        idx = idx + 1        
        const result:boolean = 
            0 <= idx &&
            idx < prevRecordList.length &&
            prevRecordList[idx].type === type &&            
            deepEqual(prevRecordList[idx].parameters, args)
/*            
            prevRecordList[idx].parameters.length === args.length &&
            prevRecordList[idx].parameters.every((v, i)=> v === args[i])
*/            

        if (0 <= idx && idx < prevRecordList.length && !result) {
            console.log(`NOT MATCH: ${idx}: ${type}<=>${prevRecordList[idx].type} : ${JSON.stringify(args)}<=> ${JSON.stringify(prevRecordList[idx].parameters)}`)
        }

        counter.set(result)                
        return false
    }
}

function createRecordList(recordList:RendererRecord[]):(type:keyof marked.RendererApi) => (...args:Parameters<RendererApi[typeof type]>) =>false {

    return (type:keyof marked.RendererApi) => (...args:Parameters<RendererApi[typeof type]>):false => {
        console.log(`RECORD: type: ${type}, parameters: ${JSON.stringify(args)}`)
        recordList.push({
            type:type,
            parameters: args
        } as any)
        return false
    }
}

export class FailOnce {
    private lst:boolean[] = []
    private idx:number = -1

    get foundFalse():boolean {        
        return this.lst.length > 0 && !this.lst.every((x)=>x)
    }

    set(val:boolean):void {
        this.lst.push(this.foundFalse ? true : val)
    }

    check():boolean {        
        this.idx = this.idx + 1

        if (this.idx < this.lst.length) {
            return this.lst[this.idx]
        }
        else if (this.foundFalse) {
            return true
        }
        else {
            this.set(false)
            return false
        }
    }
}


export function getRenderer(rootFolder: FolderType,  dirPath:string, isMarkdown:(fileName:string)=>boolean, headingTree:HeadingTreeType, recordList:RendererRecord[]) {
    const highlightExtension = markedHighlight({
        langPrefix: 'hljs language-',
         highlight(code, _lang, _info) {

            // NOTE: to avoid space character in lang
            //    
            const lang = decodeUriOrEcho(_lang)

            if ((!lang) || (lang.match(colorAndKeywordsRegex) === null)) {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext'
                return hljs.highlight(code, { language }).value
            }

            const escapedCode = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

            const highlightedCode = lang.split(';').reduce((codeByColor, colorAndKeywords) => {

                const colorAndKeywordsMatch: RegExpMatchArray | null = colorAndKeywords.match(colorAndKeywordsRegex)
                if (colorAndKeywordsMatch === null) {
                    return codeByColor
                }
                else {
                    const isTextHighlight: boolean = (colorAndKeywordsMatch[1][0] === '#')
                    const color: string = colorAndKeywordsMatch[1].substring(1)
                    const isRgb: boolean = (color.match(/^[0-9a-fA-F]{3,6}$/) !== null)

                    return colorAndKeywordsMatch[2].split(',').reduce((codeByWord, keyword) => {
                        return codeByWord.replace(new RegExp(keyword, 'gi'), `<span style="${(isTextHighlight) ? 'color' : 'background-color'}:${(isRgb) ? '#' : ''}${color}">${keyword}</span>`)
                    }, codeByColor)
                }
            }, escapedCode)

            return `<pre><code>${highlightedCode}</code></pre>`
        }
    })

    return (text: string, prevRecordList:RendererRecord[], setId:(id:string)=>void): string => {

        const failOnce = new FailOnce()
        getRecordList(text, recordList, prevRecordList, failOnce)


        const highlightMarked = new Marked(highlightExtension)        
        const renderer = getRendererExtension(rootFolder, dirPath, isMarkdown, headingTree)        

        if (prevRecordList.length > 0) {
            highlightMarked.use({ renderer:postRenderer(renderer, createAddElementIdRenderer(failOnce, setId)) })                        
        }
        else {
            highlightMarked.use({ renderer:renderer })            
        }
        
        return highlightMarked.parse(text, { async: false} ) as string
    }
}

function getRecordList(text:string, recordList:RendererRecord[], prevRecordList:RendererRecord[], failOnce:FailOnce):RendererRecord[] {    
    const recordRenderer = createRecordList(recordList)
    const compRenderer = createCompRendererRecord(prevRecordList, failOnce)

    const parser = new Marked()

    parser.use({ renderer:genRendererObject(compRenderer) })
    parser.use({ renderer:genRendererObject(recordRenderer) })
    
    parser.parse(text, { async: false} ) as string

    return recordList
}