// TagOps Pro desktop shell.
//
// Serves the built web app (../dist, or resources/renderer when packaged)
// over a private tagops:// protocol — no local web server, no file:// quirks —
// and brokers Google sign-in through the system browser, since Google blocks
// OAuth inside embedded app windows. See docs/decision-log.md (ADR-0021).

const { app, BrowserWindow, ipcMain, net, protocol, shell } = require('electron')
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

// Must match the redirectTo the renderer passes to Supabase (src/pages/Login.tsx)
// and the Redirect URL allow-listed in the Supabase dashboard.
const AUTH_CALLBACK_PORT = 53682
const AUTH_CALLBACK_PATH = '/auth/callback'
const AUTH_TIMEOUT_MS = 5 * 60 * 1000

const APP_SCHEME = 'tagops'
const APP_URL = `${APP_SCHEME}://app/`

const RENDERER_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'renderer')
  : path.join(__dirname, '..', 'dist')

let mainWindow = null

// Registered before app ready so the scheme gets standard-URL treatment
// (an origin, localStorage, fetch) — required for the Supabase client.
protocol.registerSchemesAsPrivileged([
  { scheme: APP_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

function registerRendererProtocol() {
  protocol.handle(APP_SCHEME, request => {
    const { pathname } = new URL(request.url)
    const rendererRoot = path.resolve(RENDERER_DIR)
    const requested = path.resolve(path.join(rendererRoot, decodeURIComponent(pathname)))
    if (!requested.startsWith(rendererRoot)) {
      return new Response('Not found', { status: 404 })
    }
    // Single-page app: any path that isn't a real file serves index.html.
    const target = fs.existsSync(requested) && fs.statSync(requested).isFile()
      ? requested
      : path.join(rendererRoot, 'index.html')
    return net.fetch(pathToFileURL(target).toString())
  })
}

// One-shot loopback server: Supabase redirects the signed-in browser here
// with ?code=, which we hand back to the renderer to finish the session.
function waitForAuthCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${AUTH_CALLBACK_PORT}`)
      if (url.pathname !== AUTH_CALLBACK_PATH) {
        res.writeHead(404).end()
        return
      }
      const code = url.searchParams.get('code')
      const errorDescription = url.searchParams.get('error_description') ?? url.searchParams.get('error')
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<!doctype html><meta charset="utf-8"><title>TagOps Pro</title>
        <body style="font-family:system-ui;background:#08090a;color:#e6e7eb;display:grid;place-items:center;height:100vh;margin:0">
        <p>${code ? 'Signed in — you can close this tab and return to TagOps Pro.' : 'Sign-in failed — you can close this tab.'}</p></body>`)
      finish(() => {
        if (code) resolve(code)
        else reject(new Error(errorDescription || 'Sign-in was cancelled.'))
      })
    })

    const timeout = setTimeout(() => {
      finish(() => reject(new Error('Sign-in timed out. Please try again.')))
    }, AUTH_TIMEOUT_MS)

    function finish(settle) {
      clearTimeout(timeout)
      server.close()
      settle()
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
        mainWindow.focus()
      }
    }

    server.on('error', err => {
      clearTimeout(timeout)
      reject(err.code === 'EADDRINUSE'
        ? new Error('Another sign-in is already in progress. Close it and try again.')
        : err)
    })
    server.listen(AUTH_CALLBACK_PORT, '127.0.0.1')
  })
}

ipcMain.handle('desktop-auth:sign-in', async (_event, url) => {
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error('Invalid OAuth URL')
  }
  const codePromise = waitForAuthCode()
  shell.openExternal(url)
  return codePromise
})

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#08090a',
    title: 'TagOps Pro',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Anything trying to leave the app opens in the user's real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(APP_URL)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log(`[tagops-desktop] loaded ${mainWindow.webContents.getURL()}`)
  })

  mainWindow.on('closed', () => { mainWindow = null })
  mainWindow.loadURL(APP_URL)
}

app.whenReady().then(() => {
  registerRendererProtocol()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
