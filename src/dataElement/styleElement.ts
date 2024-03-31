import { MARKDOWN_CSS_FILE_CLASS, FILE_NAME_ATTR, FILE_STAMP_ATTR } from "../constant"
import { tuple } from "fp-ts/lib/function"


export function collectCssElement(): Element[] {    
    return Array.from(document.getElementsByClassName(MARKDOWN_CSS_FILE_CLASS))
}

export function findCssElement(fileName:string): Element|undefined {
    for (const element of collectCssElement()) {        
        if (element.getAttribute(FILE_NAME_ATTR) === fileName) {
            return element
        }        
    }    
    return undefined
}

export function updateCssElement(css:string, fileName:string, fileStamp:string): HTMLStyleElement {    
    const element = findCssElement(fileName)
    if (element !== undefined) {        
        if (element.getAttribute(FILE_STAMP_ATTR) === fileStamp) {
            return element as HTMLStyleElement
        }        
        element.remove()
    }
    return addCssElement(css, MARKDOWN_CSS_FILE_CLASS, {
        [FILE_NAME_ATTR]: fileName,
        [FILE_STAMP_ATTR]: fileStamp
    })
}

export function addCssElement(css:string, className:string, attrs:{ [attr:string]:string }): HTMLStyleElement {
    const elem = document.createElement('style')

    elem.classList.add(className)
    Object.entries(attrs).forEach(([name, value])=>{        
        elem.setAttribute(name, value)        
    })
    elem.innerHTML = css

    document.head.appendChild(elem)
    return elem
}


function removeCssElement(entry:[string, string|null, Element], cssList:string[]) {
    if (!cssList.includes(entry[0])) {
        entry[2].remove()
    }
    return entry
}

export function getNewCssList(cssList:string[]):{ [fileName:string]:string|undefined } {
    const currentCssList = Object.fromEntries(collectCssElement()
            .map((element)=>tuple(element.getAttribute(FILE_NAME_ATTR), element.getAttribute(FILE_STAMP_ATTR), element))
            .filter((x):x is [string, string|null, Element]=>x[0] !== null)
            .map((x)=>removeCssElement(x, cssList))
            .filter((x)=>cssList.includes(x[0]))
            .map((x)=>[x[0], (x[1] !== null) ? x[1] : undefined]))

    return { ...cssList.reduce<{[key:string]:string|undefined}>((acc, x)=>{ 
        return { ...acc, [x]:undefined }
    }, Object.create(null)), ...currentCssList }
}