import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('async-operation', async (_, arg) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return `Processed: ${arg}`
  })
}
