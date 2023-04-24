import React from "react"
import { createRoot } from "react-dom/client"
import { Top } from "./component/Top"
import { WorkerInvoke } from "./utils/WorkerMessage"
import { FileWorkerMessageType } from "./localFile/FileWorkerMessageType"
import { readConfig } from "./config"
import { TopStateType } from "./component/TopReducer"
import { createRootFolder, updateMarkdownFile } from "./data/FileTree"
import { injectAllMarkdownFileFromElement, injectAllDataFileFromElement } from "./element/dataFromElement"
import { TOP_COMPONENT_ID } from "./constant"

import fileWorkerJS from "./tmp/fileWorker.bundle.js.asdata"
import defaultMarkdown from "./defaultMarkdown.md"

window.onload = async function () {

    const fileWorkerBlob = new Blob([fileWorkerJS], { type: 'application/javascript'})
    const fileWorker = new WorkerInvoke<FileWorkerMessageType>(new Worker(URL.createObjectURL(fileWorkerBlob)))
    const config = readConfig()
    const container = document.getElementById(TOP_COMPONENT_ID)

    const rootFolder = createRootFolder()
    await injectAllMarkdownFileFromElement(rootFolder)
    await injectAllDataFileFromElement(rootFolder)

    if (config.initialConfig) {
        updateMarkdownFile(rootFolder, config.topPage, {
            type: "markdown",
            markdown: defaultMarkdown,
            timestamp: 0,
            imageList: [],
            linkList: []
        })
    }

    const initialState:TopStateType = {
        config: config,
        rootFolder: rootFolder,
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