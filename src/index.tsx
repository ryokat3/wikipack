import React from "react"
import { createRoot } from "react-dom/client"
import { Top } from "./renderer/Top"
import { WorkerInvoke } from "./utils/WorkerInvoke"
import { FileWorkerMessageMap } from "./fileWorker/FileWorkerInvoke"
import { readConfig } from "./config"
import { TopStateType } from "./renderer/TopReducer"
import { createRootFolder, updateMarkdownFile, updateDataFile } from "./markdown/FileTree"
import { EMBEDDED_DATA_FILE_CLASS, EMBEDDED_MARKDOWN_FILE_CLASS} from "./constant"
import { getDataFileFromElement, getMarkdownFileFromElement } from "./fs/embeddedFileFS"

import fileWorkerJS from "./tmp/fileWorker.bundle.js.asdata"
import defaultMarkdown from "./defaultMarkdown.md"


window.onload = async function () {

    const fileWorkerBlob = new Blob([fileWorkerJS], { type: 'application/javascript'})
    const fileWorker = new WorkerInvoke<FileWorkerMessageMap>(new Worker(URL.createObjectURL(fileWorkerBlob)))
    const config = readConfig()
    const container = document.getElementById('top')

    const initialRootFolder = createRootFolder()
    const markdownElemList = document.getElementsByClassName(EMBEDDED_MARKDOWN_FILE_CLASS)
    for (let i = 0; i < markdownElemList.length; i++) {
        const elem = markdownElemList.item(i)
        if (elem !== null) {
            const fileData = await getMarkdownFileFromElement(elem)
            if (fileData !== undefined) {                                
                updateMarkdownFile(initialRootFolder, fileData[0], fileData[1])
            }
        }
    }  
    const dataElemList = document.getElementsByClassName(EMBEDDED_DATA_FILE_CLASS)
    for (let i = 0; i < dataElemList.length; i++) {
        const elem = dataElemList.item(i)
        if (elem !== null) {
            const fileData = await getDataFileFromElement(elem)
            if (fileData !== undefined) {
                updateDataFile(initialRootFolder, fileData[0], fileData[1])
            }
        }
    }  

    if (config.initialConfig) {
        updateMarkdownFile(initialRootFolder, config.topPage, {
            type: "markdown",
            markdown: defaultMarkdown,
            timestamp: 0,
            imageList: [],
            linkList: []
        })
    }

    const initialState:TopStateType = {
        config: config,
        rootFolder: initialRootFolder,
        currentPage: config.topPage,
        seq: 0
    }

    if (container !== null) {     
        const root = createRoot(container)
        root.render(<Top fileWorker={fileWorker} config={config} initialState={initialState}/>)
    }
    else {
        // TODO: do something like : body.innerHTML = ...
    }
}