import { contextBridge, ipcRenderer } from 'electron'

// 自定义 API
const api = {
  ping: () => ipcRenderer.invoke('ping'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  asyncOperation: (arg: string) => ipcRenderer.invoke('async-operation', arg),
  httpPost: (url: string, data: any) => ipcRenderer.invoke('http-post', url, data)
}

// 在 window 对象上暴露受保护的方法
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
