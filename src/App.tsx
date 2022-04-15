import './App.css'

const App: React.FC<{ env: string }> = ({ env }) => {

  const onClick = async () => {
    console.log('clicked')
    const dirHandle = await window.showDirectoryPicker()
    const promises: Promise<string>[] = []
    for await (const entry of dirHandle.values()) {
      if (entry.kind !== 'file') {
        continue
      }
      promises.push(entry.getFile().then((file) => `${file.name} (${file.size})`))
    }
    const files = await Promise.all(promises)
    console.log('[faiz:] === files', files)
  }

  return (
    <main className="w-screen h-screen flex items-center justify-center">
      <div className="w-screen h-screen fixed top-0 left-0 bg-black bg-opacity-30" onClick={() => logseq.hideMainUI()}></div>
      <article
        className="w-5/6 h-5/6 z-0 rounded shadow"
        data-theme="dark"
      >
        <h2>File Manager</h2>
        <section>
          <span role="button" className="px-2 py-2" onClick={onClick}>Search un used image</span>
        </section>
      </article>
    </main>
  )
}

export default App
