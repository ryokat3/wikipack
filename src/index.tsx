import React from "react"
import { createRoot } from "react-dom/client"
import { Top } from "./renderer/Top"
import { WorkerInvoke } from "./utils/WorkerInvoke"
import { FileWorkerMessageMap } from "./fileWorker/FileWorkerInvoke"
import { readConfig } from "./config"
import { TopStateType } from "./renderer/TopReducer"
import { createRootFolder, updateMarkdownFile } from "./markdown/FileTree"

import fileWorkerJS from "./tmp/fileWorker.bundle.js.asdata"
import defaultMarkdown from "./defaultMarkdown.md"


window.onload = function () {

    const fileWorkerBlob = new Blob([fileWorkerJS], { type: 'application/javascript'})
    const fileWorker = new WorkerInvoke<FileWorkerMessageMap>(new Worker(URL.createObjectURL(fileWorkerBlob)))
    const config = readConfig()
    const container = document.getElementById('top')

    const initialRootFolder = createRootFolder()
    updateMarkdownFile(initialRootFolder, config.topPage, {
        type: "markdown",
        markdown: defaultMarkdown,
        timestamp: 0,
        imageList: [],
        linkList: []
    })

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