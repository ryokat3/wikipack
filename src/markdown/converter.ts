// import { marked, Slugger } from 'marked'
import marked, { Marked } from 'marked'
import { markedHighlight } from "marked-highlight"
import hljs from 'highlight.js'
import { getFileFromTree } from "../fileTree/FileTree"
import { MarkdownFileType, MarkdownLinkType, FolderType } from "../fileTree/WikiFile"
import { splitPath, getDir, addPath, isURL } from "../utils/appUtils"


function collectMarkdownLink(token:marked.Token, link:MarkdownLinkType, dirPath:string, isMarkdownFile:(fileName:string)=>boolean):void {
    if (token.type === "image") {            
        if (! isURL(token.href)) {                
            link.imageList.push(splitPath(`${dirPath}/${token.href}`).join('/'))
        }
    }
    else if (token.type === "link") {   
        const fileName = splitPath(`${dirPath}/${token.href}`).join('/')                     
        if (! isURL(token.href)) {
            if (isMarkdownFile(token.href)) {                
                link.markdownList.push(fileName)
            }
            else {
                link.linkList.push(fileName)
            }
        }
    }
}
export function getMarkdownLink(markdown:string, dirPath:string, isMarkdownFile:(fileName:string)=>boolean):MarkdownLinkType {

    const link:MarkdownLinkType = {
        imageList: [],
        linkList: [],
        markdownList: []
    }
    marked.use({ walkTokens: (token:marked.Token) => collectMarkdownLink(token, link, dirPath, isMarkdownFile) })
    marked.parse(markdown)

    return link
}

export function getMarkdownFile(markdown:string, fileName:string, fileStamp:string, isMarkdownFile:(fileName:string)=>boolean):MarkdownFileType {

    const result:MarkdownFileType = {
        type: "markdown",
        markdown: markdown,
        fileStamp: fileStamp,
        imageList: [],
        linkList: [],
        markdownList: []
    }
    const dirPath = splitPath(fileName).slice(0,-1).join('/')
        
    const warlkTokens = (token:marked.Token) => {        
        if (token.type === "image") {            
            if (! isURL(token.href)) {                
                result.imageList.push(splitPath(`${dirPath}/${token.href}`).join('/'))
            }
        }
        else if (token.type === "link") {   
            const fileName = splitPath(`${dirPath}/${token.href}`).join('/')                     
            if (! isURL(token.href)) {
                if (isMarkdownFile(token.href)) {                
                    result.markdownList.push(fileName)
                }
                else {
                    result.linkList.push(fileName)
                }
            }
        }
    }
    marked.use({ walkTokens: warlkTokens })
    marked.parse(markdown)

    return result
}

function getRendererExtension(    
    rootFolder:FolderType,
    filePath:string,
    isMarkdown:(fileName:string)=>boolean
): marked.MarkedExtension['renderer'] {
    const dirPath = getDir(filePath)
    const renderer = new marked.Renderer()
       
    return {
        link(href: string, title: string|null|undefined, text: string) {            
            const fileName = addPath(dirPath, href)
            if (isMarkdown(href)) {                                
                // return renderer.link(`javascript:_open_markdown('${fileName}')`, title, text)
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


export function getRenderer(rootFolder: FolderType,  filePath:string, isMarkdown:(fileName:string)=>boolean) {
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

    return (text: string): string => {
        const highlightMarked = new Marked(highlightExtension)
        
        highlightMarked.use({ renderer:getRendererExtension(rootFolder, filePath, isMarkdown) })
        return highlightMarked.parse(text, { async: false} ) as string
    }
}