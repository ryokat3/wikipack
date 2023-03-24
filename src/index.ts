import { marked, Slugger } from 'marked'
import hljs from 'highlight.js'
import { findFSHandle, getFSHandle } from './fstools'

const MARKDOWN_BLOCK_ID = "markdown"
const HTML_BLOCK_ID = "html"
const FADE_LAYER_ID = "fadeLayer"

class MyRenderer extends marked.Renderer {

    public title: string | undefined = undefined

    public constructor() {
        super()
    }

    public heading(text: string, level: 1 | 2 | 3 | 4 | 5 | 6, raw: string, slugger: Slugger) {
        if (this.title === undefined && text !== "") {
            this.title = text
        }
        return super.heading(text, level, raw, slugger)
    }

    public link(href: string, title: string, text: string) {
        if (href.toLowerCase().match(/\.(md|mkd|markdown)$/)) {
            return super.link(`javascript:_open_markdown('${href}')`, title, text)
        }
        else {
            return super.link(href, title, text)
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

const render = (text: string): { html: string, title: string } => {
    // hljs.highlightAll()

    const myRenderer = new MyRenderer
    marked.setOptions({
        renderer: myRenderer,
        highlight: (code: string, _lang: string, callback?: (error: any, code: string) => void) => {
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
                    const isTextHighlight:boolean = (colorAndKeywordsMatch[1][0] === '#')
                    const color:string = colorAndKeywordsMatch[1].substring(1)
                    const isRgb:boolean = (color.match(/^[0-9a-fA-F]{3,6}$/) !== null)

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

var rootHandle:FileSystemDirectoryHandle|undefined = undefined

async function onFileDropped(elem: HTMLElement, ev: Event) {    
    if (!(ev instanceof DragEvent)) {
        return
    }

    const items = ev.dataTransfer?.items
    if (items === undefined) {
        alert("No dropped item found")
        return
    }
    if (items.length > 1) {
        alert("Multiple items were dropped")
        return
    }
    
    const item = items[0]
    if (!('kind' in item)) {        
        console.log("item doesn't have kind property")        
    }
    else if (item.kind === 'file') {
        const handle = await item.getAsFileSystemHandle()

        if (handle === null) {
            console.log("handle is null")
        }
        else if (!('kind' in handle)) {
            console.log("handle doesn't have kind property")
        }
        else if (handle.kind === 'file') {                       
            render_markdown_blob(elem, await (handle as FileSystemFileHandle).getFile())
        }
        else if (handle.kind === 'directory') {            
            rootHandle = handle as FileSystemDirectoryHandle
            const hf = await findFSHandle(handle as FileSystemDirectoryHandle, (name: string) => name.split('.').pop() === 'md')
            render_markdown_blob(elem, await (hf[0][1] as FileSystemFileHandle).getFile())
        }
    }
    else if (item.kind === 'string') {        
        item.getAsString((msg:string)=> {
            console.log(`string "${msg}" was dropped`)
            alert(`"${msg}" was dropped as string. Try again.`)
        })        
    }
    else {
        console.log("unknown object was dropped")
    }
}

function render_markdown(elem: HTMLElement, markdown: string): void {
    const converted = render(markdown)
    elem.innerHTML = converted.html
    if (converted.title !== undefined) {
        document.title = converted.title
    }
}

function render_markdown_blob(elem: HTMLElement, blob: Blob): void {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {        
        if ((e.target !== null) && (e.target.result !== null) && (typeof e.target.result == 'string')) {                        
            render_markdown(elem, e.target.result)
        }
    }
    reader.readAsText(blob, "utf-8")
}

window.onload = function () {

    // Find 'body' element    
    const bodyElems = document.getElementsByTagName('body')
    if (bodyElems.length == 0) {
        console.debug("No body element found")
        return
    }
    const bodyElem = bodyElems[0]

    const markdownElem = document.getElementById(MARKDOWN_BLOCK_ID)
    const htmlElem = document.getElementById(HTML_BLOCK_ID)
    const fadeLayerElem = document.getElementById(FADE_LAYER_ID)

    if ((markdownElem !== null) && (htmlElem !== null)) {
        render_markdown(htmlElem, markdownElem.innerHTML)
    }
    else if (markdownElem === null) {
        bodyElem.innerHTML = '<p>No elememt whose id attribute is "markdown" found</p>'
    }
    else if (htmlElem === null) {
        bodyElem.innerHTML = '<p>No elememt whose id attribute is "html" found</p>'
    }

    if (htmlElem !== null) {
        window.addEventListener('dragenter', function (e: Event) {
            e.stopPropagation()
            e.preventDefault()
            if ((fadeLayerElem != null) && (fadeLayerElem.style.visibility != "visible")) {
                fadeLayerElem.style.visibility = "visible"
            }
        }, false)
        window.addEventListener('dragleave', function (e: Event) {
            e.stopPropagation()
            e.preventDefault()
            if ((fadeLayerElem != null) && (fadeLayerElem.style.visibility != "hidden")) {
                fadeLayerElem.style.visibility = "hidden"
            }
        }, false)
        window.addEventListener('dragover', function (e: Event) {
            e.stopPropagation()
            e.preventDefault()
            if ((fadeLayerElem != null) && (fadeLayerElem.style.visibility != "visible")) {
                fadeLayerElem.style.visibility = "visible"
            }
        }, false)
        window.addEventListener("drop", (e: Event) => {
            e.stopPropagation()
            e.preventDefault()
            if ((fadeLayerElem != null) && (fadeLayerElem.style.visibility != "hidden")) {
                fadeLayerElem.style.visibility = "hidden"
            }
            onFileDropped(htmlElem, e)
        }, false)

        const url = new URL(document.location.href)
        if (url.protocol.toLowerCase() == "file:") {
            _open_markdown = async (fileName: string) => {
                if (rootHandle === undefined) {
                    rootHandle = await window.showDirectoryPicker() 
                }
                const handle = await getFSHandle(rootHandle, fileName)
                if ((handle !== undefined) && (handle.kind === 'file')) {
                    render_markdown_blob(htmlElem, await (handle as FileSystemFileHandle).getFile())
                }
            }
        }
        else {
            _open_markdown = (fileName: string) => {
                fetch(fileName).then(response => response.blob()).then(blob => render_markdown_blob(htmlElem, blob))
            }
        }
    }
}

// console.log(document.documentElement.outerHTML)