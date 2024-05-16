import marked from 'marked'

type CallData<T extends { [key:string]:(...args:any[])=>any }> = { [Key in keyof T]: { type:Key, parameters:Parameters<T[Key]> } }
type DataUnion<T extends { [key:string|number|symbol]:any }> = T[keyof T]
type RemoveUndefined<T extends { [key:string]:any }> = { [Key in keyof T]: Exclude<T[Key], undefined> }

type AddParam<T extends { [key:string]:(...args:any[])=>any }> = { [Key in keyof T]: ( ...args:[ ...Parameters<T[Key]>, string ])=>string }

export type RendererRecord = DataUnion<CallData<marked.RendererApi>>
type RendererAllRequired = RemoveUndefined<Required<marked.RendererObject>>


const escapeTest = /[&<>"']/;
const escapeReplace = new RegExp(escapeTest.source, 'g');
const escapeTestNoEncode = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/;
const escapeReplaceNoEncode = new RegExp(escapeTestNoEncode.source, 'g');
const escapeReplacements: { [index: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}

const getEscapeReplacement = (ch: string) => escapeReplacements[ch]
function escape(html: string, encode?: boolean) {
    if (encode) {
        if (escapeTest.test(html)) {
            return html.replace(escapeReplace, getEscapeReplacement);
        }
    } else {
        if (escapeTestNoEncode.test(html)) {
            return html.replace(escapeReplaceNoEncode, getEscapeReplacement);
        }
    }

    return html;
}
function cleanUrl(href: string) {
    try {
        href = encodeURI(href).replace(/%25/g, '%');
    } catch (e) {
        return null;
    }
    return href;
}

// Original Renderer
//
// https://github.com/markedjs/marked/blob/master/src/Renderer.ts
//
const rendererWithId:AddParam<Required<marked.RendererObject>> = {
    code: (code: string, infostring: string | undefined, escaped: boolean, id: string):string => {
        const lang = (infostring || '').match(/^\S*/)?.[0]
        code = code.replace(/\n$/, '') + '\n'

        return (lang) 
            ? `<pre id="${id}"><code class="language-${escape(lang)}">${(escaped ? code : escape(code, true))}</code></pre>\n`
            : `<pre><code>${(escaped ? code : escape(code, true))}</code></pre>\n`
    },
    blockquote: (quote:string, id:string):string => {
        return `<blockquote id="${id}">\n${quote}</blockquote>\n`
    },
    html: (html:string, block:boolean|undefined, id:string):string => {
        return block ? `<div id="${id}">${html}</div>` : `<span id=${id}>${html}</span>`        
    },
    heading: (text:string, level:number, _raw:string, id:string):string => {
        return `<h${level} id="${id}">${text}</h${level}>\n`;
    },
    hr: (id:string):string => {
        return `<hr id="${id}"/>`
    },
    list: (body: string, ordered: boolean, start: number | '', id:string):string =>{
        const type = ordered ? 'ol' : 'ul';
        const startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
        return `<${type}${startatt} id="${id}">${body}</${type}>\n`
    },
    listitem: (text:string, _task:boolean, _checked:boolean, id:string):string => {
        return `<li id="${id}">${text}</li>\n`
    },
    checkbox: (checked: boolean, id:string):string => {
        return `<input ${(checked ? 'checked=""' : '')} disabled="" type="checkbox" id="${id}">`
    },
    paragraph: (text:string, id:string):string => {
        return `<p id="${id}">${text}</p>\n`
    },

    table: (header: string, body: string, id: string): string => {
        if (body) {
            body = `<tbody>${body}</tbody>`
        }
        return `<table id="${id}"><thead>${header}</thead>${body}</table>\n`
    },
    tablerow: (content: string, id: string): string => {
        return `<tr id="${id}">${content}</tr>`;
    },
    tablecell: (content: string, flags: { header: boolean, align: 'center' | 'left' | 'right' | null }, id: string): string => {
        const type = flags.header ? 'th' : 'td';
        const tag = flags.align ? `<${type} align="${flags.align}" id="${id}">` : `<${type} id="${id}">`;
        return tag + content + `</${type}>\n`;
    },
    strong: (text: string, id: string): string => {
        return `<strong id="${id}">${text}</strong>`;
    },
    em: (text: string, id: string): string => {
        return `<em id="${id}">${text}</em>`;
    },
    codespan: (text: string, id: string): string => {
        return `<code id="${id}">${text}</code>`;
    },
    br:(id: string): string => {
        return `<br id="${id}"/>`
    },
    del: (text: string, id: string): string => {
        return `<del id="${id}">${text}</del>`;
    },
    link: (href: string, title: string | null | undefined, text: string, id: string): string => {
        const cleanHref = cleanUrl(href);
        if (cleanHref === null) {
            return text
        }
        href = cleanHref
        return `<a href="${href}" ${(title) ? `title="${title}"` : ""} id="${id}">${text}</a>`
    },
    image:(href: string, title: string | null, text: string, id:string): string => {
        const cleanHref = cleanUrl(href)
        if (cleanHref === null) {
            return text
        }
        href = cleanHref;

        return `<img src="${href}" alt="${text}" ${(title) ? `title="${title}"` : ""} id="${id}"></img>`        
    },
    text: (text:string, id:string):string => {
        return `<span id="${id}">${text}</span>`
    }
}

export function genCompareCall(prevRecordList:RendererRecord[]) {

    let i:number = -1
    let found:boolean = false

    return (type:keyof RendererAllRequired, args:Parameters<RendererAllRequired[typeof type]>):boolean => {
        i = i + 1
        if (found) {
            return false
        }
        const result = (0 <= i && i < prevRecordList.length && (prevRecordList[i].type !== type || prevRecordList[i].parameters.length !== args.length || !prevRecordList[i].parameters.every((v, i)=> v === args[i])))
        if (result) {
            found = true
        }
        return result
    }
}

export function genRendererRecorder(recordList:RendererRecord[], diffId:string, isFirstDiff:(type:keyof RendererAllRequired, args:Parameters<RendererAllRequired[typeof type]>)=>boolean):RendererAllRequired {
    
    function genProc<T extends keyof RendererAllRequired>(type:T) {
        return (...args:Parameters<RendererAllRequired[T]>):string|false => {
            recordList.push({
                type: type,
                parameters: args
            } as any)
            return (isFirstDiff(type, args)) ? rendererWithId[type](...args, diffId) : false
        }
    }

    return {        
        code: genProc("code"),
        blockquote: genProc("blockquote"),
        html: genProc("html"),
        heading: genProc("heading"),
        hr: genProc("hr"),
        list: genProc("list"),
        listitem: genProc("listitem"),
        checkbox: genProc("checkbox"),
        paragraph: genProc("paragraph"),
        table: genProc("table"),
        tablerow: genProc("tablerow"),
        tablecell: genProc("tablecell"),
        strong: genProc("strong"),        
        em: genProc("em"),
        codespan: genProc("codespan"),
        br: genProc("br"),
        del: genProc("del"),
        link: genProc("link"),
        image: genProc("image"),
        text:genProc("text")
    }
}
