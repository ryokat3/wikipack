import React from "react"
import { PageTreeFolderType } from "../tree/PageTree"
import { HeadingTreeType } from "../tree/WikiFile"
import { HashInfo } from "../markdown/HashInfo"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view'
import { addPath, getFileName } from "../utils/appUtils"
import { styled } from "@mui/material/styles"
import { HtmlInfo } from "../tree/PageTree"

const StickySimpleTreeView = styled(SimpleTreeView)(({})=>({     
    position: "sticky",
    top: 0    
}))

function getHeadingTree(children:HeadingTreeType[], pagePath:string) {    
    if (children.length > 0) {        
        return children.map((child)=> {
            const itemId = new HashInfo(pagePath, child.value.heading.toString()).toString()
            const label = child.value.text
            const children = getHeadingTree(child.children, pagePath)
        return <TreeItem itemId={itemId} label={label} key={itemId}>{children}</TreeItem>
    })
    }
    else {        
        return undefined
    }
}

interface PageTreeViewItemProps {
    htmlInfo: HtmlInfo   
    pagePath: string
}

const PageTreeViewItem: React.FunctionComponent<PageTreeViewItemProps> = (props: PageTreeViewItemProps) => {    
    const children = getHeadingTree(props.htmlInfo.heading.children, props.pagePath)
    return <TreeItem itemId={props.pagePath} label={getFileName(props.pagePath)} key={props.pagePath}>{children}</TreeItem>    
}

interface PageTreeViewProps {
    root: PageTreeFolderType    
    pagePath?: string    
}

const FOLDER_ITEM_ID = 'folder'

export const PageTreeView: React.FunctionComponent<PageTreeViewProps> = (props: PageTreeViewProps) => {    
    const childrenView = Object.entries(props.root.children).map(([name, value])=>{
        const pagePath = addPath(props.pagePath, name)        
        return (value.type === "markdown")
            ? <PageTreeViewItem htmlInfo={value} pagePath={pagePath}></PageTreeViewItem>            
            : <PageTreeView root={value} pagePath={pagePath}></PageTreeView>        
    })

    const onNodeSelect = (_: React.SyntheticEvent, itemId:string, isSelected:boolean):void =>{
        if ((isSelected) && (itemId !== FOLDER_ITEM_ID)) {            
            HashInfo.fromString(itemId).apply()
        }
    }

    return ((props.pagePath === "") || (props.pagePath === undefined)) ? <StickySimpleTreeView
            aria-label="file system navigator"
            slots={{ collapseIcon: ChevronRightIcon, expandIcon: ExpandMoreIcon }}                    
            onItemSelectionToggle={onNodeSelect}
            sx={{ overflow:'hidden'}}                    
        >            
            {childrenView}
        </StickySimpleTreeView> : <TreeItem itemId={FOLDER_ITEM_ID} label={getFileName(props.pagePath)} key={props.pagePath}>
            {childrenView}
        </TreeItem>         
}