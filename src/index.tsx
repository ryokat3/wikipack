import React from "react"
import { createRoot } from "react-dom/client"
import { Top } from "./gui/Top"
import { WorkerInvoke } from "./utils/WorkerMessage"
import { WorkerMessageType } from "./worker/WorkerMessageType"
import { mediatorData } from "./Mediator"
import { readConfig } from "./config"
import { TopStateType } from "./gui/TopReducer"
import { updateFileOfTree } from "./fileTree/FileTree"
import { injectAllMarkdownFileFromElement, injectAllCssFileFromElement, injectAllDataFileFromElement } from "./dataElement/dataFromElement"
import { TOP_COMPONENT_ID } from "./constant"
import { makeFileRegexChecker } from "./utils/appUtils"

import workerJS from "./tmp/worker.bundle.js.asdata"
import defaultMarkdown from "./defaultMarkdown.md"
import templateHtml from "./template.html"


window.onload = async function () {

    const workerBlob = new Blob([workerJS], { type: 'application/javascript'})
    const worker = new WorkerInvoke<WorkerMessageType>(new Worker(URL.createObjectURL(workerBlob)))    
    const config = readConfig()
    const container = document.getElementById(TOP_COMPONENT_ID)
    const isMarkdownFile = makeFileRegexChecker(config.markdownFileRegex)
    
    await injectAllMarkdownFileFromElement(mediatorData.rootFolder, isMarkdownFile)
    await injectAllCssFileFromElement(mediatorData.rootFolder)
    await injectAllDataFileFromElement(mediatorData.rootFolder)

    if (config.initialConfig) {
        updateFileOfTree(mediatorData.rootFolder, config.topPage, {
            type: "markdown",
            markdown: defaultMarkdown,
            timestamp: 0,
            imageList: [],
            linkList: []
        })
    }

    const initialState:TopStateType = {
        title: "",
        html: "",
        packFileName: "wikipack",
        seq: 0        
    }

    if (container !== null) {     
        const root = createRoot(container)
        root.render(<Top worker={worker} config={config} templateHtml={templateHtml} initialState={initialState}/>)
    }
    else {
        // TODO: do something like : body.innerHTML = ...
    }
}