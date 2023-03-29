import { MARKDOWN_BLOCK_ID } from "../constant"

export function getMarkdown() {
    const markdownElem = document.getElementById(MARKDOWN_BLOCK_ID)
    return markdownElem !== null ? markdownElem.innerHTML : undefined
}