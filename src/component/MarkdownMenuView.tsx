import React from "react"
import { MarkdownMenuFolderType } from "../data/MarkdownMenu"
import { getFile } from "../data/FileTree"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { TreeView, TreeItem } from '@mui/lab'
import { addPath, getFileName } from "../utils/appUtils"


interface MarkdownMenuFileProps {
    pathName: string,    
}

const MarkdownMenuFile: React.FunctionComponent<MarkdownMenuFileProps> = (props: MarkdownMenuFileProps) => {
    return <TreeItem nodeId={props.pathName} label={getFileName(props.pathName)}></TreeItem>
}

interface MarkdownMenuViewProps {
    root: MarkdownMenuFolderType
    pathName?: string  
}

export const MarkdownMenuView: React.FunctionComponent<MarkdownMenuViewProps> = (props: MarkdownMenuViewProps) => {
    
    const childrenView = Object.entries(props.root.children).map(([name, value])=>{
        return (value.type === "markdown")
            ? <MarkdownMenuFile pathName={addPath(props.pathName, name)} key={name}></MarkdownMenuFile>            
            : <MarkdownMenuView root={value} pathName={addPath(props.pathName, name)} key={name}></MarkdownMenuView>        
    })

    const onNodeSelect = (_: React.SyntheticEvent, nodeIds: Array<string>|string):void =>{
        if (typeof nodeIds === "string") {
            const node = getFile(props.root, nodeIds)
            if ((node !== undefined) && (node.type === "markdown")) {
                _open_markdown(nodeIds)
            }
        }
    }

    return ((props.pathName === "") || (props.pathName === undefined)) ? <TreeView
            aria-label="file system navigator"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            onNodeSelect={onNodeSelect}          
        >            
            {childrenView}
        </TreeView> : <TreeItem nodeId={props.pathName} label={getFileName(props.pathName)}>
            {childrenView}
        </TreeItem> 
}