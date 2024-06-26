import React from "react"
import { createRoot } from "react-dom/client"
import { Top } from "./gui/Top"
import { WorkerInvoke } from "./utils/WorkerMessage"
import { WorkerMessageType } from "./worker/WorkerMessageType"
import { appData } from "./app"
import { readConfig } from "./config"
import { TopStateType } from "./gui/TopReducer"
import { isEmptyFileTreeFolder, updateFileOfTree } from "./tree/FileTree"
import { injectAllMarkdownFileFromElement, injectAllCssFileFromElement, injectAllDataFileFromElement } from "./dataElement/dataFromElement"
import { TOP_COMPONENT_ID } from "./constant"
import { makeFileRegexChecker } from "./utils/appUtils"
import { getHyperRefData } from "./markdown/markedExt"

import workerJS from "./tmp/worker.bundle.js.asdata"
import defaultMarkdown from "./defaultMarkdown.md"
import templateHtml from "./template.html"


window.onload = async function () {

    const workerBlob = new Blob([workerJS], { type: 'application/javascript'})
    const worker = new WorkerInvoke<WorkerMessageType>(new Worker(URL.createObjectURL(workerBlob)))    
    const config = readConfig()
    const container = document.getElementById(TOP_COMPONENT_ID)
    const isMarkdownFile = makeFileRegexChecker(config.markdownFileRegex)
    
    // Set File Element
    //
    await injectAllMarkdownFileFromElement(appData.rootFolder, isMarkdownFile)
    await injectAllCssFileFromElement(appData.rootFolder)
    await injectAllDataFileFromElement(appData.rootFolder)

    // Set default Markdown page if Markdown File element not found
    //
    if (isEmptyFileTreeFolder(appData.rootFolder)) {
        updateFileOfTree(appData.rootFolder, config.topPage, {
            ...getHyperRefData(defaultMarkdown, "", isMarkdownFile),
            type: "markdown",
            markdown: defaultMarkdown,
            fileStamp: "",
            fileSrc: { type: "never" }
        })
    }
    
    const initialState:TopStateType = {
        title: "",
        html: "",
        heading: undefined,        
        packFileName: "wikipack",
        seq: 0,
        diffId: ""
    }

    if (container !== null) {     
        const root = createRoot(container)
        root.render(<Top worker={worker} config={config} templateHtml={templateHtml} initialState={initialState}/>)
    }
    else {
        // TODO: do something like : body.innerHTML = ...
    }
}