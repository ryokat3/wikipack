import { EMBEDDED_FILE_ID_PREFIX } from "../constant"
/// import { MARKDOWN_BLOCK_ID, EMBEDDED_FILE_FS_ID_PREFIX } from "../constant"

/*

export function getMarkdown() {
    const markdownElem = document.getElementById(MARKDOWN_BLOCK_ID)
    return markdownElem !== null ? markdownElem.innerHTML : undefined
}
*/

export function getEmbeddedFile(id:string) {
    const elem = document.getElementById(EMBEDDED_FILE_ID_PREFIX + id)
    return elem !== null ? elem.innerHTML : undefined
}
