import * as React from 'react'
import DialogTitle from '@mui/material/DialogTitle'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'

export interface SaveDialogProps {
    open: boolean;
    onClose: () => void;
}

function onDownload() {
    const blob = new Blob([ '<!DOCTYPE html>', document.documentElement.outerHTML ], { type: 'text/html'})   
    const dataRef = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.download = 'download.html'
    link.href = dataRef
    link.click()
}

export function SaveDialog(props: SaveDialogProps) {
    
    return (
        <Dialog onClose={props.onClose} open={props.open}>
            <DialogTitle>Save</DialogTitle>
            <Button onClick={onDownload} variant='contained' color="primary"></Button>
        </Dialog>
    );
}