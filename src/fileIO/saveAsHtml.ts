import { AppHandler } from "../app"
import { saveFolderToElement, saveJsonToElement } from "../dataElement/dataToElement"
import { CONFIG_ID, WIKIPACK_SCRIPT_ID } from "../constant"

export async function createPack(template:string, mediator:AppHandler):Promise<Blob> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(template, 'text/html')
    const scriptElem = doc.getElementById(WIKIPACK_SCRIPT_ID)
    if (scriptElem !== null) {
        scriptElem.removeAttribute('src')
        scriptElem.removeAttribute('inline')
        scriptElem.innerHTML = document.getElementById(WIKIPACK_SCRIPT_ID)?.innerHTML || ""
    }
    await saveFolderToElement(doc, mediator.rootFolder, "")

    doc.head.appendChild(saveJsonToElement(CONFIG_ID, {
        ...mediator.config,
        topPage: mediator.currentPage,
        initialConfig: false
    }, ""))

    return new Blob([ '<!DOCTYPE html>', doc.documentElement.outerHTML ], { type: 'text/html'})    
}