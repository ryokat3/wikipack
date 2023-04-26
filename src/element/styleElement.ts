import { CURRENT_CSS_FILE_CLASS, FILE_NAME_ATTR, SEQ_NUMBER_ATTR } from "../constant"

export function getCurrentCssElement(): Element[] {    
    return Array.from(document.getElementsByClassName(CURRENT_CSS_FILE_CLASS))
}

export function addCssElement(fileName:string, css:string, seq:number): HTMLStyleElement {
    const elem = document.createElement('style')

    elem.setAttribute(FILE_NAME_ATTR, fileName)
    elem.setAttribute(SEQ_NUMBER_ATTR, seq.toString())
    elem.innerHTML = css

    document.head.appendChild(elem)
    return elem
}

