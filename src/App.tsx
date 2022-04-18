import { useEffect, useRef, useState } from 'react'
import { VscOpenPreview, VscCopy } from 'react-icons/vsc'

import './App.css'
import { deleteFile, getFilesFromDir, getUnusedFiles, IFile, separateFiles } from './helper/file'
import { copyToClipboard, getFilePath } from './helper/util'

const App: React.FC<{ env: string }> = ({ env }) => {

  const [unusedStuffFiles, setUnusedStuffFiles] = useState<({ file: IFile; checked?: boolean })[]>([])
  const [status, setStatus] = useState<'unauthorized' | 'loading' | 'loaded'>('unauthorized')
  const [iframeSrc, setIframeSrc] = useState<string>()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const dirHandleRef = useRef<FileSystemDirectoryHandle>()

  const hasUnusedStuff = status === 'loaded' && unusedStuffFiles.length > 0

  console.log('[faiz:] === unusedStuffFiles', unusedStuffFiles)

  const onClickDelete = async () => {
    if (dirHandleRef.current) {
      for (let i = 0; i < unusedStuffFiles.length; i++) {
        if (unusedStuffFiles[i].checked) {
          const file = unusedStuffFiles[i].file
          await deleteFile(dirHandleRef.current, file)
          setUnusedStuffFiles(_files => _files.filter(f => f.file.name !== file.name))
        }
      }
    }
  }
  const onClickSearch = async () => {
    setStatus('loading')
    let dirHandle
    try {
      dirHandle = await window.showDirectoryPicker()
      if (dirHandle.kind !== 'directory') {
        setStatus('unauthorized')
        return logseq.App.showMsg('Please select a directory', 'error')
      }
    } catch (error) {
      setStatus('unauthorized')
      return logseq.App.showMsg('Failed to get authorization', 'error')
    }
    dirHandleRef.current = dirHandle
    const files = await getFilesFromDir(dirHandle)
    const [ stuffFiles, documentFiles ] = separateFiles(files)
    const unusedStuffFiles = await getUnusedFiles(stuffFiles, documentFiles)
    console.log('[faiz:] === _unusedStuffFiles', unusedStuffFiles)
    setUnusedStuffFiles(unusedStuffFiles.map(f => ({ file: f, checked: true })))
    setStatus('loaded')
  }
  const onCheckedChange = (e) => {
    const { value } = e.target
    setUnusedStuffFiles(unusedStuffFiles.map(f => value === f.file.name ? { ...f, checked: !f.checked } : f))
  }
  const onClickPreviewFile = async (file: IFile) => {
    console.log('[faiz:] === file', file)
    const filePath = await getFilePath(file)
    setIframeSrc(filePath)
  }
  const onClickCopy = async (file: IFile) => {
    const filePath = await getFilePath(file)
    copyToClipboard(filePath)
    logseq.App.showMsg('Copied to clipboard success', 'success')
  }

  useEffect(() => {
    logseq.App.getStateFromStore<'dark' | 'light'>('ui/theme')
      .then(theme => {
        setTheme(theme)
      })
    logseq.App.onThemeModeChanged(e => {
      setTheme(e.mode)
    })
  }, [])

  return (
    <main className="w-screen h-screen flex items-center justify-center">
      <div className="w-screen h-screen fixed top-0 left-0 bg-black bg-opacity-30" onClick={() => logseq.hideMainUI()}></div>
      <article
        className="w-5/6 h-5/6 z-0 rounded shadow flex"
        data-theme={theme}
      >
        <div className="flex flex-col w-2/3">
          <h3 className="mb-6">File Manager</h3>
          <section className="mb-4">
            <span role="button" className="px-2 py-2 text-xs" onClick={onClickSearch}>Search Unused Stuff</span>
            {/* logseq ifrmae 目前不支持删除功能 */}
            { env === 'browser' && hasUnusedStuff && <span role="button" className="py-2 px-2 ml-2 text-xs bg-rose-500 border-rose-500 hover:bg-rose-600" onClick={onClickDelete}>Delete</span>  }
          </section>

          { hasUnusedStuff && <div className="mb-1 text-base">Unused Stuff Files:</div>}

          <div className="flex flex-1 overflow-auto">

            {
              status === 'unauthorized' && <div className="mt-28">Please authorize the plugin to access your files.</div>
            }

            {
              status === 'loading' && <div className="mt-28" aria-busy="true">Searching...</div>
            }

            {
              status === 'loaded' && unusedStuffFiles.length === 0 && <div className="mt-28">No unused stuff files found.</div>
            }
            {
              hasUnusedStuff && (
                <div>
                  {
                    unusedStuffFiles.map((file, index) => (
                      <div className="flex items-center" key={file.file.name}>
                        <label className="text-sm">
                          <input className="w-4 h-4" type="checkbox" checked={file.checked} value={file.file.name} onChange={e => onCheckedChange(e)} />
                          {file.file.name}
                        </label>
                        <a className="ml-1" onClick={(e) => onClickPreviewFile(file.file)}><VscOpenPreview /></a>
                        <a className="ml-1" onClick={(e) => onClickCopy(file.file)}><VscCopy /></a>
                      </div>
                    ))
                  }
                </div>
              )
            }
          </div>

            {/* {iframeSrc && <iframe className="flex-1 ml-5 shadow" src={iframeSrc}></iframe>} */}
        </div>
        <iframe className="flex-1 ml-5 shadow-lg" src={iframeSrc}></iframe>
      </article>
    </main>
  )
}

export default App
