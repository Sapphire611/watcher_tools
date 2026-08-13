import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('select-and-read-file', async () => {
    const { dialog } = await import('electron')
    const fs = await import('fs/promises')

    try {
      const result = await dialog.showOpenDialog({
        title: '选择 JSON 文件',
        filters: [
          { name: 'JSON 文件', extensions: ['json'] },
          { name: '所有文件', extensions: ['*'] }
        ],
        properties: ['openFile']
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true }
      }

      const filePath = result.filePaths[0]
      const content = await fs.readFile(filePath, 'utf8')
      return { canceled: false, filePath, content }
    } catch (error) {
      return {
        canceled: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  })
}
