import '@logseq/libs'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './index.css'

const isDevelopment = import.meta.env.DEV
const isBrowser = import.meta.env.VITE_APP_EVIROMENT === 'browser' || isDevelopment

if (isBrowser) {
  renderApp('browser')
} else {
  console.log('=== logseq-plugin-file-manager loaded ===')
  logseq.ready(() => {

    logseq.provideModel({
      show() {
        renderApp('logseq')
        logseq.showMainUI()
      },
    })

    logseq.App.registerUIItem('toolbar', {
      key: 'logseq-plugin-file-manager',
      template: '<a data-on-click="show" class="button"><i class="ti ti-file-report"></i></a>',
    })

  })
}

function renderApp(env: 'browser' | 'logseq') {
  ReactDOM.render(
    <React.StrictMode>
      <App env={env} />
    </React.StrictMode>,
    document.getElementById('root')
  )
}
