import { TopStateType } from "../component/TopReducer"
import { saveFolderToElement, saveJsonToElement } from "../element/dataToElement"
// import { getElementFile } from "../element/dataFromElement"
import { CONFIG_ID, /* EMBEDDED_DATA_FILE_CLASS, EMBEDDED_MARKDOWN_FILE_CLASS, EMBEDDED_CSS_FILE_CLASS, */ WIKIPACK_SCRIPT_ID } from "../constant"

/*
export async function getNewFileHandle() {
    return await window.showSaveFilePicker({
        types: [
            {
                description: "HTML file",
                accept: {
                    "text/html": [ ".html" ]
                }
            }
        ]
    })
}

function removeElementList(elemList:HTMLCollectionOf<Element>):void {
    for (const elem of Array.from(elemList)) {
        elem.remove()
    }    
}

export async function saveAsHtml(state:TopStateType) {

    removeElementList(document.getElementsByClassName(EMBEDDED_MARKDOWN_FILE_CLASS))
    removeElementList(document.getElementsByClassName(EMBEDDED_DATA_FILE_CLASS))
    removeElementList(document.getElementsByClassName(EMBEDDED_CSS_FILE_CLASS))
    const configElement = getElementFile(CONFIG_ID)
    if (configElement !== null) {
        configElement.remove()
    }

    await saveFolderToElement(document, state.rootFolder, "")

    document.head.appendChild(saveJsonToElement(CONFIG_ID, {
        ...state.config,
        topPage: state.currentPage,
        initialConfig: false
    }, 0))

    const handle = await getNewFileHandle()
    const writable = await handle.createWritable()
    await writable.write('<!DOCTYPE html>\n' + document.documentElement.outerHTML)    
    await writable.close()    
}
*/

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