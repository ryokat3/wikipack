import React from "react"
import { createRoot } from "react-dom/client"
import { Top } from "./renderer/Top"

import fileFetch from "./tmp/fileFetch.bundle.js.asdata"

window.onload = function () {
    const container = document.getElementById('top')

    if (container !== null) {     
        const root = createRoot(container)
        root.render(<Top />)
    }
    else {
        // TODO: do something like : body.innerHTML = ...
    }

    console.log(fileFetch)

    const blob = new Blob([fileFetch], { type: 'application/javascript'})
    const worker = new Worker(URL.createObjectURL(blob))
    worker.postMessage("Hello, worker")
}