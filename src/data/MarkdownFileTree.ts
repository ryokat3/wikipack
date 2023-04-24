import { Folder, MarkdownFile } from "./FileTree"
import { splitPath } from "../utils/appUtils"

export type MarkdownTreeType = {
    [name:string]: MarkdownTreeType | MarkdownFile
}

export function isMarkdownFile(obj:MarkdownTreeType|MarkdownFile):obj is MarkdownFile {
    return ("type" in obj) && (obj['type'] === "markdown")
}

export function getMarkdownTree(root:Folder):MarkdownTreeType {
    return Object.entries(root.children).sort((a, b)=>a[0] > b[0] ? 1 : -1).reduce((result, [name, node])=>{
        if (node.type === "markdown") {
            return {
                ...result,
                [name]: node
            }
        }
        else if (node.type === "folder") {
            const tree = getMarkdownTree(node)
            if (Object.keys(tree).length == 0) {
                return result
            }
            else {
                return {
                    ...result,
                    [name]: tree
                }
            }
        }
        else {
            return result
        }
    }, Object.create(null) as MarkdownTreeType)
}

export function getMarkdownFile(node:MarkdownTreeType|MarkdownFile, pathName:string|string[]):MarkdownFile|undefined {
    if (typeof pathName === 'string') {
        return getMarkdownFile(node, splitPath(pathName))
    }
    else if (pathName.length == 0) {
        return isMarkdownFile(node) ? node : undefined
    }
    else if (isMarkdownFile(node)) {
        return undefined
    }
    else if (pathName[0] in node) {
        return getMarkdownFile(node[pathName[0]], pathName.slice(1))
    } else {
        return undefined
    }
}