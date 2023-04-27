import { FolderType, MarkdownFileType } from "./FileTreeType"
import { splitPath } from "../utils/appUtils"

export type MarkdownTreeType = {
    [name:string]: MarkdownTreeType | MarkdownFileType
}

export function isMarkdownFile(obj:MarkdownTreeType|MarkdownFileType):obj is MarkdownFileType {
    return ("type" in obj) && (obj['type'] === "markdown")
}

export function getMarkdownTree(root:FolderType):MarkdownTreeType {
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

export function getMarkdownFile(node:MarkdownTreeType|MarkdownFileType, pathName:string|string[]):MarkdownFileType|undefined {
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