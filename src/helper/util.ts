import { IFile } from "./file"

// copy to clipboard
export function copyToClipboard(text: string) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}

export const getFilePath = async (file: IFile) => {
  const graph = await logseq.App.getCurrentGraph()
  if (graph) {
    const filePath = `file:///${graph.path}/${file.relativePath?.join('/')}`
    return filePath
  }
  return Promise.reject(new Error('graph is null'))
}