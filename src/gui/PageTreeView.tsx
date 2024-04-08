import React from "react"
import { PageTreeFolderType } from "../fileTree/PageTree"
import { getFileFromTree } from "../fileTree/FileTree"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view'
import { addPath, getFileName } from "../utils/appUtils"


interface PageTreeViewItemProps {
    pagePath: string
}

const PageTreeViewItem: React.FunctionComponent<PageTreeViewItemProps> = (props: PageTreeViewItemProps) => {
    return <TreeItem itemId={props.pagePath} label={getFileName(props.pagePath)}></TreeItem>
}

interface PageTreeViewProps {
    root: PageTreeFolderType    
    pagePath?: string  
}

export const PageTreeView: React.FunctionComponent<PageTreeViewProps> = (props: PageTreeViewProps) => {
    
    const childrenView = Object.entries(props.root.children).map(([name, value])=>{
        return (value.type === "markdown")
            ? <PageTreeViewItem pagePath={addPath(props.pagePath, name)} key={name}></PageTreeViewItem>            
            : <PageTreeView root={value} pagePath={addPath(props.pagePath, name)} key={name}></PageTreeView>        
    })

    const onNodeSelect = (_: React.SyntheticEvent, itemId: string, isSelected:boolean):void =>{
        if (isSelected) {
            const node = getFileFromTree(props.root, itemId)
            if ((node !== undefined) && (node.type === "markdown")) {
                window.location.hash = `#${itemId}`                
            }
        }
    }

    return ((props.pagePath === "") || (props.pagePath === undefined)) ? <SimpleTreeView
            aria-label="file system navigator"
            slots={{ collapseIcon: ChevronRightIcon, expandIcon: ExpandMoreIcon }}                    
            onItemSelectionToggle={onNodeSelect}            
        >            
            {childrenView}
        </SimpleTreeView> : <TreeItem itemId={props.pagePath} label={getFileName(props.pagePath) }>
            {childrenView}
        </TreeItem>         
}