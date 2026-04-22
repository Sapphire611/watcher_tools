declare global {
  interface Window {
    api: {
      ping: () => Promise<string>
      getAppVersion: () => Promise<string>
      asyncOperation: (arg: string) => Promise<string>
      httpPost: (url: string, data: any) => Promise<{
        success: boolean
        data?: any
        error?: string
      }>
      checkTcpPort: (host: string, port: number) => Promise<boolean>
      checkMinioBucket: (
        endpoint: string,
        accessKey: string,
        secretKey: string,
        bucketName: string
      ) => Promise<{
        exists: boolean
        accessible: boolean
        error?: string
      }>
      getMinioConfig: (bucketName: string) => Promise<{
        success: boolean
        dataPath?: string
        bucketExists?: boolean
        bucketPath?: string
        error?: string
      }>
      getAppConfigPath: () => Promise<{
        success: boolean
        configPath: string
      }>
      openConfigFolder: () => Promise<{
        success: boolean
        error?: string
      }>
      uploadProductSerial: () => Promise<{
        success: boolean
        folderName?: string
        targetPath?: string
        error?: string
      }>
      getPresetConfigs: () => Promise<{
        success: boolean
        configs?: { [key: string]: string[] }
        error?: string
      }>
      applyPresetConfig: (fileName: string) => Promise<{
        success: boolean
        appliedFile?: string
        error?: string
      }>
      getMesTypes: () => Promise<{
        success: boolean
        mesTypes?: string[]
        currentMesType?: string
        error?: string
      }>
      applyMesType: (mesType: string) => Promise<{
        success: boolean
        mesType?: string
        error?: string
      }>
    }
  }
}

export {}
