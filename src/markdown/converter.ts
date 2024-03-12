// import { marked, Slugger } from 'marked'
import marked, { Marked } from 'marked'
import { markedHighlight } from "marked-highlight"
import hljs from 'highlight.js'
import { getFile } from "../data/FileTree"
import { MarkdownFileType, FolderType } from "../data/FileTreeType"
import { splitPath, getDir, addPath } from "../utils/appUtils"

function isURL(url:string):boolean {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }   
}

export function getMarkdownFile(markdown:string, fileName:string, timestamp:number, isMarkdownFile:(fileName:string)=>boolean):MarkdownFileType {

    const result:MarkdownFileType = {
        type: "markdown",
        markdown: markdown,
        timestamp: timestamp,
        imageList: [],
        linkList: []
    }
    const dirPath = splitPath(fileName).slice(0,-1).join('/')
    
    //const warlkTokens = (token:marked.Token) => {
    const warlkTokens = (token:marked.Token) => {
        if (token.type === "image") {            
            if (! isURL(token.href)) {                
                result.imageList.push(splitPath(`${dirPath}/${token.href}`).join('/'))
            }
        }
        else if (token.type === "link") {                        
            if ((! isURL(token.href)) && (! isMarkdownFile(token.href))) {                
                result.linkList.push(splitPath(`${dirPath}/${token.href}`).join('/'))
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
            if (isMarkdown(href)) {
                const fileName = addPath(dirPath, href)
                return renderer.link(`javascript:_open_markdown('${fileName}')`, title, text)
            }
            else {
                return renderer.link(href, title, text)
            }
        },

        image(href:string, title:string|null, text:string) {      
            const fileName = addPath(dirPath, href)
            const imageFile = getFile(rootFolder, fileName)
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