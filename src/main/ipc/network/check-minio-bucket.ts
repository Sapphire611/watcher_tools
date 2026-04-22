import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle(
    'check-minio-bucket',
    async (
      _,
      endpoint: string,
      _accessKey: string,
      _secretKey: string,
      bucketName: string,
    ) => {
      try {
        const url = `${endpoint}/${bucketName}/`
        const date = new Date().toUTCString()

        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            Host: new URL(endpoint).host,
            Date: date,
          },
        })

        return {
          exists: response.status === 200 || response.status === 403,
          accessible: response.status === 200,
        }
      } catch (error) {
        return {
          exists: false,
          accessible: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
  )
}
