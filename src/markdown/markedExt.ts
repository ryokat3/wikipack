import marked, { Marked, RendererApi } from 'marked'
import { markedHighlight } from "marked-highlight"
import hljs from 'highlight.js'
import { getFileFromTree } from "../tree/FileTree"
import { HyperRefData, FolderType } from "../tree/WikiFile"
import { addPath, isURL, randomString, deepEqual } from "../utils/appUtils"
import { HeadingNumber } from "./HeadingNumber"
import { HeadingTreeType, genHeadingTreeRoot } from "../tree/WikiFile"
import { RendererRecord, genRendererObject, addPostRenderer, PostRendererObject } from "./markedUtils"
import { Bean } from "../utils/appUtils"
import { HtmlInfo } from "../tree/PageTree"


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

export function createAddElementIdRenderer(equality:CheckEquality):{
        postRenderer: PostRendererObject,
        getId: ()=>string|undefined
    } {
    const idBean = new Bean<string>()

    const addIdFunc = addElementId(idBean.setter)
    const elementFunc = (htmlStr:string) => {
        return equality.check() ? htmlStr : addIdFunc(htmlStr)
    }
    const textFunc = (text:string) => {
        if (equality.check()) {
            return text
        }
        else {
            const randomId = randomString()            
            idBean.set(randomId)
            return `<span id="${randomId}">${text}</span>`
        }
    }

    return {
        postRenderer: {
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
        },
        getId: idBean.getter
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

const defaultRenderer = new marked.Renderer()

export type MarkdownParseContext = {
    root: FolderType,
    dir: string,    
    isMarkdown:(fileName:string)=>boolean    
}

function createHeadingTreeRenderer(ctxt:MarkdownParseContext): { renderer: marked.RendererObject, heading: HeadingTreeType } {        
    
    const headingTree = genHeadingTreeRoot()
    let headingNumber = HeadingNumber.create()
1
    const renderer =  {
        link(href: string, title: string|null|undefined, text: string) {            
            const fileName = addPath(ctxt.dir, href)
            if (ctxt.isMarkdown(href)) {                                                
                return defaultRenderer.link(`#${fileName}`, title, text)
            }
            else {                
                const dataFile = getFileFromTree(ctxt.root, fileName)
                if ((dataFile !== undefined) && (dataFile.type === 'data')) {
                    return defaultRenderer.link(dataFile.dataRef, title, text)                    
                }
                else {
                    return defaultRenderer.link(href, title, text)
                }
            }
        },

        image(href:string, title:string|null, text:string) {      
            const fileName = addPath(ctxt.dir, href)
            const imageFile = getFileFromTree(ctxt.root, fileName)
            if ((imageFile !== undefined) && (imageFile.type === 'data')) {
                return defaultRenderer.image(imageFile.dataRef, title, text)
            }
            return defaultRenderer.image(href, title, text)
        }, 

        heading(text:string, level:number, _raw:string) {
            headingNumber = headingNumber.increase(level)
            const textContnet = extractText(text)            
            headingTree.add({ text:textContnet, heading: headingNumber })                                    
            return `<h${level} id="${headingNumber}" style="scroll-margin-top:16px;">${text}</h${level}>`            
        }
    }

    return {
        renderer: renderer,
        heading: headingTree
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

export function createDiffCheckRenderer(prevRecordList:RendererRecord[]): {
        renderer: (type:keyof marked.RendererApi) => (...args:Parameters<RendererApi[typeof type]>) =>false,
        equality: FailOnce
    } {

    const equality = new FailOnce()
    let idx:number = -1

    const renderer = (type:keyof marked.RendererApi) => (...args:Parameters<RendererApi[typeof type]>):false => {
        if (equality.foundFalse) {
            return false
        }
        idx = idx + 1        
        const result:boolean = 
            0 <= idx &&
            idx < prevRecordList.length &&
            prevRecordList[idx].type === type &&            
            deepEqual(prevRecordList[idx].parameters, args)

        equality.set(result)                
        return false
    }

    return {
        renderer: renderer,
        equality: equality
    }
}

function createRecordListRenderer():{
        renderer: (type:keyof marked.RendererApi) => (...args:Parameters<RendererApi[typeof type]>) =>false,
        recordList: RendererRecord[]
    } {

    const recordList:RendererRecord[] = []
    const renderer = (type:keyof marked.RendererApi) => (...args:Parameters<RendererApi[typeof type]>):false => {        
        recordList.push({
            type:type,
            parameters: args
        } as any)
        return false
    }

    return {
        renderer: renderer,
        recordList: recordList
    }
}

interface CheckEquality {
    check:() => boolean
}

export class FailOnce implements CheckEquality {
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

export type HtmlInfoAndDiff = HtmlInfo & {
    diffId: string|undefined
}


export function parseAndDiffMarkdown(
        markdown:string,
        ctxt: MarkdownParseContext,
        prevMd: RendererRecord[]
    ):HtmlInfoAndDiff {

    const recordListRenderer = createRecordListRenderer()
    const diffCheckRenderer = createDiffCheckRenderer(prevMd)
    doParse(markdown, new Marked(), [ genRendererObject(diffCheckRenderer.renderer), genRendererObject(recordListRenderer.renderer) ])

    const headingRenderer = createHeadingTreeRenderer(ctxt)        
    const postRenderer = createAddElementIdRenderer(diffCheckRenderer.equality)
    const renderer = addPostRenderer(headingRenderer.renderer, postRenderer.postRenderer)

    return {
        html: doParse(markdown, new Marked(highlightExtension), [renderer]),
        recordList: recordListRenderer.recordList,
        heading: headingRenderer.heading,
        diffId: postRenderer.getId()
    }                      
}

export function parseMarkdown(
        markdown:string,
        ctxt: MarkdownParseContext
    ):HtmlInfo {

    const recordListRenderer = createRecordListRenderer()    
    doParse(markdown, new Marked(), [ genRendererObject(recordListRenderer.renderer) ])

    const headingRenderer = createHeadingTreeRenderer(ctxt)      
    return {
        html: doParse(markdown, new Marked(highlightExtension), [ headingRenderer.renderer ] ),
        recordList: recordListRenderer.recordList,
        heading: headingRenderer.heading     
    }
}

function doParse(markdown:string, parser:marked.Marked, rendererList:marked.RendererObject[]):string {
    for (const renderer of rendererList) {
        parser.use({ renderer: renderer})
    }
    return parser.parse(markdown, { async: false} ) as string
}