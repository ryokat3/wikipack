// import { marked, Slugger } from 'marked'
import marked, { Marked } from 'marked'
import { markedHighlight } from "marked-highlight"
import hljs from 'highlight.js'
import { getFileFromTree } from "../fileTree/FileTree"
import { /* MarkdownFileType,*/ TokenListType, FolderType } from "../fileTree/WikiFile"
import { getDir, addPath, isURL } from "../utils/appUtils"


function getWalkTokenExtension(link: TokenListType, dirPath: string, isMarkdownFile: (fileName: string) => boolean): (token:marked.Token)=>void {
    return (token: marked.Token) => {
        if (token.type === "image") {
            if (!isURL(token.href)) {
                // link.imageList.push(splitPath(`${dirPath}/${token.href}`).join('/'))
                link.imageList.push(addPath(dirPath, token.href))
            }
        }
        else if (token.type === "link") {
            const pagePath = addPath(dirPath, token.href)
            if (!isURL(token.href)) {
                if (isMarkdownFile(token.href)) {
                    link.markdownList.push(pagePath)
                }
                else {
                    link.linkList.push(pagePath)
                }
            }
        }
        else if (token.type === "heading") {
            link.headingList.push({ depth:token.depth, text:token.text })
        }
    }
}

const emptyTokenList: TokenListType = {
    imageList: [],
    linkList: [],
    markdownList: [],
    headingList: []
}

export function getTokenList(markdown:string, dirPath:string, isMarkdownFile:(fileName:string)=>boolean):TokenListType {

    const tokenList = structuredClone(emptyTokenList)
    marked.use({ walkTokens: getWalkTokenExtension(tokenList, dirPath, isMarkdownFile) })
    marked.parse(markdown)

    return tokenList
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