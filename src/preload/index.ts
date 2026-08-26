import { contextBridge, ipcRenderer } from 'electron'

// 自定义 API
const api = {
  ping: () => ipcRenderer.invoke('ping'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  asyncOperation: (arg: string) => ipcRenderer.invoke('async-operation', arg),
  httpPost: (url: string, data: any) => ipcRenderer.invoke('http-post', url, data),
  checkTcpPort: (host: string, port: number) => ipcRenderer.invoke('check-tcp-port', host, port),
  checkMinioBucket: (endpoint: string, accessKey: string, secretKey: string, bucketName: string) =>
    ipcRenderer.invoke('check-minio-bucket', endpoint, accessKey, secretKey, bucketName),
  getMinioConfig: (bucketName: string) => ipcRenderer.invoke('get-minio-config', bucketName),
  selectFilePath: () => ipcRenderer.invoke('select-file-path'),
  addSnNewMinio: (payload: any) => ipcRenderer.invoke('add-sn-new-minio', payload),
  getAppConfigPath: () => ipcRenderer.invoke('get-app-config-path'),
  openConfigFolder: () => ipcRenderer.invoke('open-config-folder'),
  uploadProductSerial: () => ipcRenderer.invoke('upload-product-serial'),
  getPresetConfigs: () => ipcRenderer.invoke('get-preset-configs'),
  applyPresetConfig: (fileName: string, backupName?: string) => ipcRenderer.invoke('apply-preset-config', fileName, backupName),
  getConfigFolders: () => ipcRenderer.invoke('get-config-folders'),
  switchConfigFolder: (folderName: string, backupName?: string) => ipcRenderer.invoke('switch-config-folder', folderName, backupName),
  getMesTypes: () => ipcRenderer.invoke('get-mes-types'),
  applyMesType: (mesType: string) => ipcRenderer.invoke('apply-mes-type', mesType),
  selectAndReadFile: () => ipcRenderer.invoke('select-and-read-file')
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
