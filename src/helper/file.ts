export type IFile = File & { relativePath?: string[] | null }

export const getFilesFromDir = async (directoryHandle: FileSystemDirectoryHandle) => {
  async function* getFilesRecursively (entry: FileSystemDirectoryHandle | FileSystemFileHandle) {
    if (entry.kind === 'file') {
      const file: IFile = await entry.getFile()
      if (file !== null) {
        file.relativePath = await directoryHandle.resolve(entry)
        yield file
      }
    } else if (entry.kind === 'directory') {
      for await (const handle of entry.values()) {
        yield* getFilesRecursively(handle)
      }
    }
  }

  let files: IFile[] = []
  for await (const fileHandle of getFilesRecursively(directoryHandle)) {
    files.push(fileHandle)
  }
  return files
}

const STUFF_DIRS = ['assets', 'draws']
const DOCUMENT_DIRS = [/journals/, /pages/, /^logseq\/bak\/journals\//, /^logseq\/bak\/pages\//]
export const separateFiles = (files: IFile[]) => {
  const stuffFiles: IFile[] = []
  const documentFiles: IFile[] = []
  files.forEach(file => {
    const dir = file?.relativePath?.slice(0, -1)?.join('/') || ''
    if (STUFF_DIRS.includes(dir)) {
      stuffFiles.push(file)
    } else if (DOCUMENT_DIRS.find(regex => regex.test(dir))) {
      documentFiles.push(file)
    }
  })
  return [stuffFiles, documentFiles]
}

const MARKDOWN_IMG_REG = /!\[.*?\]\((.*)\)/g     // ![alt](../assets/xxx.png) ![alt](../assets/xxx.pdf)
const DRAW_REG = /\[\[(draws\/.+\.excalidraw)]]/g    // [[draws/xxx.excalidraw]]
export const getUnusedFiles = async (stuffFiles: IFile[], documentFiles: IFile[]) => {
  const stuffFilesMap = new Map<string, number>()
  stuffFiles.forEach(file => {
    const relativePath = file.relativePath?.join('/') || ''
    stuffFilesMap.set(relativePath, 0)
  })
  console.log('[faiz:] === stuffFilesMap', stuffFilesMap)
  // documentFiles.forEach(file => {
  //   const text = await file.text()
  // })
  const promises = documentFiles.map(async file => {
    const text = await file.text()
    const imgMatchs = text.matchAll(MARKDOWN_IMG_REG)
    const drawMatchs = text.matchAll(DRAW_REG)
    const imgPaths = [...imgMatchs].map(match => match[1]?.replace(/^\.\.\//, ''))
    const drawPaths = [...drawMatchs].map(match => match[1])
    return [...imgPaths, ...drawPaths]
  })
  const usedStuffFilesPaths = (await Promise.all(promises)).filter(paths => paths.length > 0)?.flat()
  console.log('[faiz:] === usedStuffFilesPaths', usedStuffFilesPaths)
  usedStuffFilesPaths.forEach(path => {
    if (stuffFilesMap.has(path)) {
      stuffFilesMap.set(path, (stuffFilesMap.get(path) || 0) + 1)
    }
  })
  console.log('[faiz:] === stuffFilesMap', stuffFilesMap)
  return stuffFiles.filter(file => stuffFilesMap.get(file.relativePath?.join('/') || '') === 0)
}


export const deleteFile = async (dirHandle: FileSystemDirectoryHandle, file: IFile) => {
  const relativePath = file.relativePath || []
  if (relativePath.length === 0) return Promise.reject(new Error('file.relativePath is empty'))
  if (relativePath.length === 1) return dirHandle.removeEntry(relativePath[0])

  let _dirHandle = dirHandle
  for (let i = 0; i < relativePath.length - 1; i++) {
    _dirHandle = await _dirHandle.getDirectoryHandle(relativePath[i])
  }

  const res = await dirHandle.queryPermission({ mode: 'readwrite' })
  console.log('[faiz:] === queryPermission', res, _dirHandle, relativePath[relativePath.length - 1])
  const rres = await dirHandle.requestPermission({ mode: 'readwrite' })
  console.log('[faiz:] === requestPermission', rres)

  // return _dirHandle.removeEntry(relativePath[relativePath.length - 1])
}
