import marked, { Marked } from 'marked'
import { markedHighlight } from "marked-highlight"
import hljs from 'highlight.js'
import { getFileFromTree } from "../tree/FileTree"
import { HyperRefData, FolderType } from "../tree/WikiFile"
import { addPath, isURL } from "../utils/appUtils"
import { HeadingNumber } from "./HeadingNumber"
import { HeadingTreeType } from "../tree/WikiFile"
import { genRendererRecorder, RendererRecord, genCompareCall } from "./markdownDiff"


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
): marked.MarkedExtension['renderer'] {        
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

    return (text: string, prevRecordList:RendererRecord[], diffId:string): string => {
        const highlightMarked = new Marked(highlightExtension)
        const compFunc = genCompareCall(prevRecordList)     
        const recorder = genRendererRecorder(recordList, diffId, compFunc)

        highlightMarked.use({ renderer:getRendererExtension(rootFolder, dirPath, isMarkdown, headingTree) })
        highlightMarked.use({ renderer:recorder })
        
        return highlightMarked.parse(text, { async: false} ) as string
    }
}