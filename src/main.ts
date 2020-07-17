import * as marked from 'marked'
import * as hljs from 'highlight.js';


class MyRenderer extends marked.Renderer {

    public title:string|undefined = undefined

    public constructor () {
        super()
    }
    
    public heading(text:string, level:1|2|3|4|5|6, raw:string) {
        if (this.title === undefined && text !== "") {
            this.title = text
        }
        return super.heading(text, level, raw, new marked.Slugger())
    }

}

export const highlight_keywords = (code:string, keywords:string[], class_name:string):string => {
    if (keywords.length === 0) {
        return code
    }
    return highlight_keywords(code.replace(new RegExp(keywords[0], 'gi'), `<span class="${class_name}">${keywords[0]}</span>`), keywords.slice(1), class_name)
}

export const render = (text:string):{ html:string, title:string } => {
    hljs.initHighlightingOnLoad()

    const myRenderer = new MyRenderer

    marked.setOptions({
        renderer: myRenderer,
        highlight: (code:string, lang:string, callback?:(error:any, code:string)=>void) => {
            if (!lang) {
                return hljs.highlightAuto(code, [ lang ]).value
            }
            let match = lang.match(/[#%]/i)
            if (match === null) {
                return hljs.highlightAuto(code, [ lang ]).value
            }

            let escaped_code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            match = lang.match(/#\[(.*?)\]/i)
            if (match !== null) {
                escaped_code = highlight_keywords(escaped_code, match[1].split(','), "hljs-name")
            }
            match = lang.match(/%\[(.*?)\]/i)
            if (match !== null) {
                escaped_code = highlight_keywords(escaped_code, match[1].split(','), "hljs-type")
            }
            return `<pre><code>${escaped_code}</code></pre>`
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