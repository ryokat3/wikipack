import { Folder, MarkdownFile, CssFile, DataFile } from "../data/FileTreeType"
import { dataUrlDecodeAsArrayBuffer } from "../utils/appUtils"

export async function getDirectoryHandle() {
    return await window.showDirectoryPicker({
        mode: "readwrite",
        startIn: "documents"
    })
}

async function saveMarkdownFileToLocalFile(handle:FileSystemDirectoryHandle, markdownFile:MarkdownFile, name:string) {
    const fileHandle = await handle.getFileHandle(name, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(markdownFile.markdown)
    await writable.close()
}

async function saveCssFileToLocalFile(handle:FileSystemDirectoryHandle, cssFile:CssFile, name:string) {
    const fileHandle = await handle.getFileHandle(name, { create: true })
    const writable = await fileHandle.createWritable()
    await writable.write(cssFile.css)
    await writable.close()
}

async function saveDataFileToLocalFile(handle:FileSystemDirectoryHandle, dataFile:DataFile, name:string) {
    const fileHandle = await handle.getFileHandle(name, { create: true })
    const writable = await fileHandle.createWritable()
    if (typeof dataFile.buffer === "string") {
        await writable.write(await dataUrlDecodeAsArrayBuffer(dataFile.buffer))        
    }
    else {
        await writable.write(dataFile.buffer)
    }
    await writable.close()
}

async function saveFolderToLocalFolder(handle:FileSystemDirectoryHandle, folder:Folder) {
    Object.entries(folder.children).map(async ([name, child])=>{
        if (child.type === "folder") {
            await saveFolderToLocalFolder(await handle.getDirectoryHandle(name, { create: true}), child)
        }
        else if (child.type === "markdown") {
            await saveMarkdownFileToLocalFile(handle, child, name)
        }
        else if (child.type === "css") {
            await saveCssFileToLocalFile(handle, child, name)
        }
        else {
            await saveDataFileToLocalFile(handle, child, name)
        }
    })
}

export async function extract(root:Folder):Promise<void> {
    const handle = await getDirectoryHandle()
    await saveFolderToLocalFolder(handle, root)
}