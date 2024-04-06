import React from "react"
import { MarkdownMenuFolderType } from "../fileTree/MarkdownMenu"
import { getFileFromTree } from "../fileTree/FileTree"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view'
import { addPath, getFileName } from "../utils/appUtils"


interface MarkdownMenuFileProps {
    pathName: string
}

const MarkdownMenuFile: React.FunctionComponent<MarkdownMenuFileProps> = (props: MarkdownMenuFileProps) => {
    return <TreeItem itemId={props.pathName} label={getFileName(props.pathName)}></TreeItem>
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

    const onNodeSelect = (_: React.SyntheticEvent, itemId: string, isSelected:boolean):void =>{
        if (isSelected) {
            const node = getFileFromTree(props.root, itemId)
            if ((node !== undefined) && (node.type === "markdown")) {
                window.location.hash = `#${itemId}`                
            }
        }
    }

    return ((props.pathName === "") || (props.pathName === undefined)) ? <SimpleTreeView
            aria-label="file system navigator"
            slots={{ collapseIcon: ChevronRightIcon, expandIcon: ExpandMoreIcon }}                    
            onItemSelectionToggle={onNodeSelect}            
        >            
            {childrenView}
        </SimpleTreeView> : <TreeItem itemId={props.pathName} label={getFileName(props.pathName) }>
            {childrenView}
        </TreeItem>         
}