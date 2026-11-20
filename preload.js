// Exposes a small, safe bridge to the page. The API secret stays in the main process.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('genartz', {
  isDesktop: true,
  submit: (args) => ipcRenderer.invoke('hf:submit', args),
  status: (id) => ipcRenderer.invoke('hf:status', id),
  cancel: (args) => ipcRenderer.invoke('hf:cancel', args),
  setKey: (c) => ipcRenderer.invoke('hf:setKey', c),
  hasKey: () => ipcRenderer.invoke('hf:hasKey'),
  test: () => ipcRenderer.invoke('hf:test'),
  open: (url) => ipcRenderer.invoke('app:open', url),
  notify: (n) => ipcRenderer.invoke('app:notify', n)
});
