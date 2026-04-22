import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('get-app-config-path', async () => {
    const { app } = await import('electron')
    const path = await import('path')
    const fs = await import('fs')

    const configDir = path.join(app.getPath('appData'), 'watcher')

    try {
      await fs.promises.mkdir(configDir, { recursive: true })
    } catch (error) {
      // 目录已存在或创建失败
    }

    return {
      success: true,
      configPath: configDir,
    }
  })
}
