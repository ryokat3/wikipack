import marked from 'marked'

type CallData<T extends { [key:string]:(...args:any[])=>any }> = { [Key in keyof T]: { type:Key, parameters:Parameters<T[Key]> } }
type DataUnion<T extends { [key:string|number|symbol]:any }> = T[keyof T]

export type RendererRecord = DataUnion<CallData<marked.RendererApi>>
export type PostRendererObject = { [Key in keyof Required<marked.RendererObject>]:(html:string)=>string }

const defaultRenderer = new marked.Renderer()

export function genRendererObject<Ret>(render:(key:keyof marked.RendererApi)=>(...args:Parameters<marked.RendererApi[typeof key]>)=>Ret):{ [Key in keyof marked.RendererApi]:(...args:Parameters<marked.RendererApi[Key]>)=>Ret} {    

    return {        
        code: render("code"),
        blockquote: render("blockquote"),
        html: render("html"),
        heading: render("heading"),
        hr: render("hr"),
        list: render("list"),
        listitem: render("listitem"),
        checkbox: render("checkbox"),
        paragraph: render("paragraph"),
        table: render("table"),
        tablerow: render("tablerow"),
        tablecell: render("tablecell"),
        strong: render("strong"),        
        em: render("em"),
        codespan: render("codespan"),
        br: render("br"),
        del: render("del"),
        link: render("link"),
        image: render("image"),
        text:render("text")
    }
}

export function postRenderer(rndrObj:marked.RendererObject, postObj: PostRendererObject):Required<marked.RendererObject> {
    return {
        code: (...args:Parameters<marked.RendererApi['code']>) => postObj.code((rndrObj.code && rndrObj.code(...args)) || defaultRenderer.code(...args)),                
        blockquote: (...args:Parameters<marked.RendererApi['blockquote']>) => postObj.blockquote((rndrObj.blockquote && rndrObj.blockquote(...args)) || defaultRenderer.blockquote(...args)),
        html: (...args:Parameters<marked.RendererApi['html']>) => postObj.html((rndrObj.html && rndrObj.html(...args)) || defaultRenderer.html(...args)),
        heading: (...args:Parameters<marked.RendererApi['heading']>) => postObj.heading((rndrObj.heading && rndrObj.heading(...args)) || defaultRenderer.heading(...args)),
        hr: (...args:Parameters<marked.RendererApi['hr']>) => postObj.hr((rndrObj.hr && rndrObj.hr(...args)) || defaultRenderer.hr(...args)),
        list: (...args:Parameters<marked.RendererApi['list']>) => postObj.list((rndrObj.list && rndrObj.list(...args)) || defaultRenderer.list(...args)),
        listitem: (...args:Parameters<marked.RendererApi['listitem']>) => postObj.listitem((rndrObj.listitem && rndrObj.listitem(...args)) || defaultRenderer.listitem(...args)),
        checkbox: (...args:Parameters<marked.RendererApi['checkbox']>) => postObj.checkbox((rndrObj.checkbox && rndrObj.checkbox(...args)) || defaultRenderer.checkbox(...args)),
        paragraph: (...args:Parameters<marked.RendererApi['paragraph']>) => postObj.paragraph((rndrObj.paragraph && rndrObj.paragraph(...args)) || defaultRenderer.paragraph(...args)),
        table: (...args:Parameters<marked.RendererApi['table']>) => postObj.table((rndrObj.table && rndrObj.table(...args)) || defaultRenderer.table(...args)),
        tablerow: (...args:Parameters<marked.RendererApi['tablerow']>) => postObj.tablerow((rndrObj.tablerow && rndrObj.tablerow(...args)) || defaultRenderer.tablerow(...args)),
        tablecell: (...args:Parameters<marked.RendererApi['tablecell']>) => postObj.tablecell((rndrObj.tablecell && rndrObj.tablecell(...args)) || defaultRenderer.tablecell(...args)),
        strong: (...args:Parameters<marked.RendererApi['strong']>) => postObj.strong((rndrObj.strong && rndrObj.strong(...args)) || defaultRenderer.strong(...args)),
        em: (...args:Parameters<marked.RendererApi['em']>) => postObj.em((rndrObj.em && rndrObj.em(...args)) || defaultRenderer.em(...args)),
        codespan: (...args:Parameters<marked.RendererApi['codespan']>) => postObj.codespan((rndrObj.codespan && rndrObj.codespan(...args)) || defaultRenderer.codespan(...args)),
        br: (...args:Parameters<marked.RendererApi['br']>) => postObj.br((rndrObj.br && rndrObj.br(...args)) || defaultRenderer.br(...args)),
        del: (...args:Parameters<marked.RendererApi['del']>) => postObj.del((rndrObj.del && rndrObj.del(...args)) || defaultRenderer.del(...args)),
        link: (...args:Parameters<marked.RendererApi['link']>) => postObj.link((rndrObj.link && rndrObj.link(...args)) || defaultRenderer.link(...args)),
        image: (...args:Parameters<marked.RendererApi['image']>) => postObj.image((rndrObj.image && rndrObj.image(...args)) || defaultRenderer.image(...args)),
        text: (...args:Parameters<marked.RendererApi['text']>) => postObj.text((rndrObj.text && rndrObj.text(...args)) || defaultRenderer.text(...args))
    }
}
