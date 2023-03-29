import React from "react"
import { createRoot } from "react-dom/client"
import { Top } from "./renderer/Top"

window.onload = function () {
    const container = document.getElementById('top')

    if (container !== null) {     
        const root = createRoot(container)
        root.render(<Top />)
    }
    else {
        // TODO: do something like : body.innerHTML = ...
    }
}