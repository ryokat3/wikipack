import React, { useCallback } from "react"
import { PageTreeFolderType } from "../tree/PageTree"
import { HeadingTreeType } from "../tree/WikiFile"
import { HashInfo } from "../markdown/HashInfo"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { SimpleTreeView, TreeItem } from '@mui/x-tree-view'
import Box from '@mui/material/Box'
import { addPath, getFileName } from "../utils/appUtils"
import { styled } from "@mui/material/styles"
import { HtmlInfo } from "../tree/PageTree"

const StickySimpleTreeView = styled(SimpleTreeView)(({})=>({     
    position: "sticky",
    top: 0    
}))

interface HeadingViewItemProps {
    heading: HeadingTreeType
    pagePath: string
}

const HeadingViewItem: React.FunctionComponent<HeadingViewItemProps> = (props: HeadingViewItemProps) => {
    const children = props.heading.children.map((child) => {
        const key = new HashInfo(props.pagePath, child.value.heading.toString()).toString()
        return <HeadingViewItem heading={child} pagePath={props.pagePath} key={key}></HeadingViewItem>
    })

    const itemId = new HashInfo(props.pagePath, props.heading.value.heading.toString()).toString()
    const label = props.heading.value.text

    const clickHandler = useCallback((event:React.MouseEvent):void=>{
        event.stopPropagation()
        new HashInfo(props.pagePath, props.heading.value.heading.toString()).apply()        
    },[])

    return <TreeItem itemId={itemId} label={<Box onClick={clickHandler}>{label}</Box>} key={itemId}>{children}</TreeItem>    
}

interface PageTreeViewItemProps {
    htmlInfo: HtmlInfo   
    pagePath: string
}

const PageTreeViewItem: React.FunctionComponent<PageTreeViewItemProps> = (props: PageTreeViewItemProps) => {    
    const children = props.htmlInfo.heading.children.map((child) => {
        const key = new HashInfo(props.pagePath, child.value.heading.toString()).toString()
        return <HeadingViewItem heading={child} pagePath={props.pagePath} key={key}></HeadingViewItem>
    })    

    const clickHandler = useCallback((event:React.MouseEvent):void=>{
        event.stopPropagation()
        new HashInfo(props.pagePath, undefined).apply()        
    },[])

    return <TreeItem itemId={props.pagePath} label={<Box onClick={clickHandler}>{getFileName(props.pagePath)}</Box>} key={props.pagePath}>{children}</TreeItem>    
}

interface PageTreeViewProps {
    root: PageTreeFolderType    
    pagePath?: string    
}

export const PageTreeView: React.FunctionComponent<PageTreeViewProps> = (props: PageTreeViewProps) => {    
    const childrenView = Object.entries(props.root.children).map(([name, value])=>{
        const pagePath = addPath(props.pagePath, name)        
        return (value.type === "markdown")
            ? <PageTreeViewItem htmlInfo={value} pagePath={pagePath} key={pagePath}></PageTreeViewItem>            
            : <PageTreeView root={value} pagePath={pagePath} key={pagePath}></PageTreeView>
    })

    const clickHandler = useCallback((event:React.MouseEvent):void=>{
        event.stopPropagation()
    },[])

    return ((props.pagePath === "") || (props.pagePath === undefined)) ? <StickySimpleTreeView
            aria-label="file system navigator"
            slots={{ collapseIcon: ExpandMoreIcon, expandIcon: ChevronRightIcon }}            
            sx={{ overflow:'hidden'}}                    
        >            
            {childrenView}
        </StickySimpleTreeView> : <TreeItem itemId={props.pagePath} label={<Box onClick={clickHandler}>{getFileName(props.pagePath)}</Box>} key={props.pagePath}>
            {childrenView}
        </TreeItem>         
}