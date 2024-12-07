import marked from 'marked'

type CallData<T extends { [key:string]:(...args:any[])=>any }> = { [Key in keyof T]: { type:Key, parameters:Parameters<T[Key]> } }
type DataUnion<T extends { [key:string|number|symbol]:any }> = T[keyof T]

export type RendererRecord = DataUnion<CallData<marked.RendererApi>>
export type PostRendererObject = { [Key in keyof Required<marked.RendererObject>]:(html:string)=>string }

const defaultRenderer = new marked.Renderer()

export function genRendererObject<Ret>(render:(key:keyof marked.RendererApi)=>(...args:Parameters<marked.RendererApi[typeof key]>)=>Ret):{ [Key in keyof marked.RendererApi]:(...args:Parameters<marked.RendererApi[Key]>)=>Ret} {    

    return {
        space: render("space"),
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

// export function addPostRenderer(rndrObj:marked.RendererObject, postObj: PostRendererObject):Required<marked.RendererObject> {
export function addPostRenderer(rndrObj:Partial<marked.RendererApi>, postObj: PostRendererObject):Required<marked.RendererObject> {

    return {
        ...defaultRenderer,
        space: (token:Parameters<marked.RendererApi['space']>[0]) => postObj.space((rndrObj.space && rndrObj.space(token)) || defaultRenderer.space(token)),                
        code: (token:Parameters<marked.RendererApi['code']>[0]) => postObj.code((rndrObj.code && rndrObj.code(token)) || defaultRenderer.code(token)),                
        blockquote: (token:Parameters<marked.RendererApi['blockquote']>[0]) => postObj.blockquote((rndrObj.blockquote && rndrObj.blockquote(token)) || defaultRenderer.blockquote(token)),
        html: (token:Parameters<marked.RendererApi['html']>[0]) => postObj.html((rndrObj.html && rndrObj.html(token)) || defaultRenderer.html(token)),
        heading: (token:Parameters<marked.RendererApi['heading']>[0]) => postObj.heading((rndrObj.heading && rndrObj.heading(token)) || defaultRenderer.heading(token)),
        hr: (token:Parameters<marked.RendererApi['hr']>[0]) => postObj.hr((rndrObj.hr && rndrObj.hr(token)) || defaultRenderer.hr(token)),
        list: (token:Parameters<marked.RendererApi['list']>[0]) => postObj.list((rndrObj.list && rndrObj.list(token)) || defaultRenderer.list(token)),
        listitem: (token:Parameters<marked.RendererApi['listitem']>[0]) => postObj.listitem((rndrObj.listitem && rndrObj.listitem(token)) || defaultRenderer.listitem(token)),
        checkbox: (token:Parameters<marked.RendererApi['checkbox']>[0]) => postObj.checkbox((rndrObj.checkbox && rndrObj.checkbox(token)) || defaultRenderer.checkbox(token)),
        paragraph: (token:Parameters<marked.RendererApi['paragraph']>[0]) => postObj.paragraph((rndrObj.paragraph && rndrObj.paragraph(token)) || defaultRenderer.paragraph(token)),
        table: (token:Parameters<marked.RendererApi['table']>[0]) => postObj.table((rndrObj.table && rndrObj.table(token)) || defaultRenderer.table(token)),
        tablerow: (token:Parameters<marked.RendererApi['tablerow']>[0]) => postObj.tablerow((rndrObj.tablerow && rndrObj.tablerow(token)) || defaultRenderer.tablerow(token)),
        tablecell: (token:Parameters<marked.RendererApi['tablecell']>[0]) => postObj.tablecell((rndrObj.tablecell && rndrObj.tablecell(token)) || defaultRenderer.tablecell(token)),
        strong: (token:Parameters<marked.RendererApi['strong']>[0]) => postObj.strong((rndrObj.strong && rndrObj.strong(token)) || defaultRenderer.strong(token)),
        em: (token:Parameters<marked.RendererApi['em']>[0]) => postObj.em((rndrObj.em && rndrObj.em(token)) || defaultRenderer.em(token)),
        codespan: (token:Parameters<marked.RendererApi['codespan']>[0]) => postObj.codespan((rndrObj.codespan && rndrObj.codespan(token)) || defaultRenderer.codespan(token)),
        br: (token:Parameters<marked.RendererApi['br']>[0]) => postObj.br((rndrObj.br && rndrObj.br(token)) || defaultRenderer.br(token)),
        del: (token:Parameters<marked.RendererApi['del']>[0]) => postObj.del((rndrObj.del && rndrObj.del(token)) || defaultRenderer.del(token)),
        link: (token:Parameters<marked.RendererApi['link']>[0]) => postObj.link((rndrObj.link && rndrObj.link(token)) || defaultRenderer.link(token)),
        image: (token:Parameters<marked.RendererApi['image']>[0]) => postObj.image((rndrObj.image && rndrObj.image(token)) || defaultRenderer.image(token)),
        text: (token:Parameters<marked.RendererApi['text']>[0]) => postObj.text((rndrObj.text && rndrObj.text(token)) || defaultRenderer.text(token))
    }
}
