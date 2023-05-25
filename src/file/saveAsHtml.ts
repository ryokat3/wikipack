import { TopStateType } from "../component/TopReducer"
import { saveFolderToElement, saveJsonToElement } from "../element/dataToElement"
import { CONFIG_ID, WIKIPACK_SCRIPT_ID } from "../constant"

export async function createPack(template:string, state:TopStateType):Promise<Blob> {
    const parser = new DOMParser()
    const doc = parser.parseFromString(template, 'text/html')
    const scriptElem = doc.getElementById(WIKIPACK_SCRIPT_ID)
    if (scriptElem !== null) {
        scriptElem.removeAttribute('src')
        scriptElem.removeAttribute('inline')
        scriptElem.innerHTML = document.getElementById(WIKIPACK_SCRIPT_ID)?.innerHTML || ""
    }
    await saveFolderToElement(doc, state.rootFolder, "")

    doc.head.appendChild(saveJsonToElement(CONFIG_ID, {
        ...state.config,
        topPage: state.currentPage,
        initialConfig: false
    }, 0))

    return new Blob([ '<!DOCTYPE html>', doc.documentElement.outerHTML ], { type: 'text/html'})    
}