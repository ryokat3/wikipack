import { Mediator } from "../Mediator"
import { saveFolderToElement, saveJsonToElement } from "../dataElement/dataToElement"
import { CONFIG_ID, WIKIPACK_SCRIPT_ID } from "../constant"

export async function createPack(template:string, workerAgent:Mediator):Promise<Blob> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(template, 'text/html')
    const scriptElem = doc.getElementById(WIKIPACK_SCRIPT_ID)
    if (scriptElem !== null) {
        scriptElem.removeAttribute('src')
        scriptElem.removeAttribute('inline')
        scriptElem.innerHTML = document.getElementById(WIKIPACK_SCRIPT_ID)?.innerHTML || ""
    }
    await saveFolderToElement(doc, workerAgent.rootFolder, "")

    doc.head.appendChild(saveJsonToElement(CONFIG_ID, {
        ...workerAgent.config,
        topPage: workerAgent.currentPage,
        initialConfig: false
    }, ""))

    return new Blob([ '<!DOCTYPE html>', doc.documentElement.outerHTML ], { type: 'text/html'})    
}