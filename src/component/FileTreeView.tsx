import React from "react"
import { MarkdownTreeType, isMarkdownFile, getMarkdownFile } from "../file/FileTree"
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { TreeView, TreeItem } from '@mui/lab'
import { addPath, getFileName } from "../utils/appUtils"


interface MarkdownFileItemProps {
    pathName: string,    
}

const MarkdownFileItem: React.FunctionComponent<MarkdownFileItemProps> = (props: MarkdownFileItemProps) => {
    return <TreeItem nodeId={props.pathName} label={getFileName(props.pathName)}></TreeItem>
}

interface FolderViewProps {
    root: MarkdownTreeType
    pathName: string    
}

export const FolderView: React.FunctionComponent<FolderViewProps> = (props: FolderViewProps) => {
    const childrenView = Object.entries(props.root).map(([name, value])=>{
        if (isMarkdownFile(value)) {
            return <MarkdownFileItem pathName={addPath(props.pathName, name)} key={name}></MarkdownFileItem>            
        }
        else {
            return <FolderView root={value} pathName={addPath(props.pathName, name)} key={name}></FolderView>
        }
    })

    const onNodeSelect = (_: React.SyntheticEvent, nodeIds: Array<string>|string):void =>{
        if (typeof nodeIds === "string") {
            const markdownFile = getMarkdownFile(props.root, nodeIds)
            if (markdownFile !== undefined) {
                _open_markdown(nodeIds)
            }
        }
    }

    return (props.pathName === "") ? <TreeView
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

interface FileTreeViewProps {
    root: MarkdownTreeType   
}

export const FileTreeView: React.FunctionComponent<FileTreeViewProps> = (props: FileTreeViewProps) => {    
    return <FolderView root={props.root} pathName=""></FolderView>    
}