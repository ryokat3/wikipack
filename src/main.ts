import * as marked from 'marked'
import * as hljs from 'highlight.js';


class MyRenderer extends marked.Renderer {

    public title:string|undefined = undefined

    public constructor () {
        super()
    }

    public heading(text:string, level:number, raw:string) {
        if (this.title === undefined && text !== "") {
            this.title = text
        }
        return super.heading(text, level, raw)
    }

}

export const render = (text:string):{ html:string, title:string } => {
    hljs.initHighlightingOnLoad()

    const myRenderer = new MyRenderer

    marked.setOptions({
        renderer: myRenderer,
        highlight: (code:string, lang:string, callback:(error:any, code:string)=>void) => {
            return hljs.highlightAuto(code, [ lang ]).value
        },
        pedantic: false,
        gfm: true,
        tables: true,
        breaks: false,
        sanitize: false,
        smartLists: true,
        smartypants: false,
        xhtml: false
    })    
    const html = marked.parse(text)

    return {
        html: html,
        title: myRenderer.title
    }   
}