// Exposes the minimal desktop bridge to the web app (window.desktopAuth).
// Kept deliberately tiny: the renderer gets one function, not IPC access.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktopAuth', {
  signIn: url => ipcRenderer.invoke('desktop-auth:sign-in', url),
})
