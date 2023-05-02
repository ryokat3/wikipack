import { marked, Slugger } from 'marked'
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



class MyRenderer extends marked.Renderer {

    public title: string | undefined = undefined
    private readonly dirPath:string

    public constructor(
        private readonly rootFolder:FolderType,
        private readonly filePath:string,
        private readonly isMarkdown:(fileName:string)=>boolean) {
        super()
        this.dirPath = getDir(this.filePath)
    }

    public heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6, raw: string, slugger: Slugger) {
        if (this.title === undefined && text !== "") {
            this.title = text
        }
        return super.heading(text, level, raw, slugger)
    }

    public link(href: string, title: string, text: string) {
        //if (href.toLowerCase().match(/\.(md|mkd|markdown)$/)) {
        if (this.isMarkdown(href)) {
            const fileName = addPath(this.dirPath, href)
            return super.link(`javascript:_open_markdown('${fileName}')`, title, text)
        }
        else {
            return super.link(href, title, text)
        }
    }

    public image(href:string, title:string, text:string) {      
        const fileName = addPath(this.dirPath, href)
        const imageFile = getFile(this.rootFolder, fileName)
        if ((imageFile !== undefined) && (imageFile.type === 'data')) {
            return super.image(imageFile.dataRef, title, text)
        }
        return super.image(href, title, text)
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
    return (text: string): { html: string, title: string } => {
        // hljs.highlightAll()

        const myRenderer = new MyRenderer(rootFolder, filePath, isMarkdown)
        marked.setOptions({
            renderer: myRenderer,
            // highlight: (code: string, _lang: string, callback?: (error: any, code: string) => void) => {
            highlight: (code: string, _lang: string) => {
                // NOTE: to avoid space character in lang
                //    
                const lang = decodeUriOrEcho(_lang)

                if ((!lang) || (lang.match(colorAndKeywordsRegex) === null)) {
                    return hljs.highlightAuto(code, [lang]).value
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
            },
            pedantic: false,
            gfm: true,
            breaks: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
        })
        const html = marked.parse(text)

        return {
            html: html,
            title: myRenderer.title || "No title"
        }
    }
}