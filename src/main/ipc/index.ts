import { ipcMain } from 'electron'

export function createIPCHandlers(): void {
  // 示例：简单的 ping-pong 处理器
  ipcMain.handle('ping', () => 'pong')

  // 示例：获取应用版本
  ipcMain.handle('get-app-version', () => {
    return process.versions.electron
  })

  // 示例：异步操作
  ipcMain.handle('async-operation', async (_, arg) => {
    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return `Processed: ${arg}`
  })

  // HTTP POST 请求处理器
  ipcMain.handle('http-post', async (_, url: string, data: any) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()
      return {
        success: true,
        data: result
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
}
