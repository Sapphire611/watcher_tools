import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('get-config-folders', async () => {
    const path = await import('path')
    const fs = await import('fs')
    const { app } = await import('electron')

    try {
      const watcherDir = path.join(app.getPath('appData'), 'watcher')

      // 确保目录存在
      await fs.promises.mkdir(watcherDir, { recursive: true })

      const items = await fs.promises.readdir(watcherDir, { withFileTypes: true })

      // 筛选出 config- 开头的文件夹（不包括 config 本身）
      const configFolders: string[] = []
      for (const item of items) {
        if (item.isDirectory() && item.name.startsWith('config-')) {
          configFolders.push(item.name)
        }
      }

      return {
        success: true,
        folders: configFolders,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
