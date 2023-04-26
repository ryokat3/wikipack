import { TopStateType } from "../component/TopReducer"
import { saveFolderToElement, saveJsonToElement } from "../element/dataToElement"
import { getElementFile } from "../element/dataFromElement"
import { CONFIG_ID, EMBEDDED_DATA_FILE_CLASS, EMBEDDED_MARKDOWN_FILE_CLASS, EMBEDDED_CSS_FILE_CLASS } from "../constant"


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

    await saveFolderToElement(state.rootFolder, "")

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