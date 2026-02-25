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
    }
  }
}

export {}
