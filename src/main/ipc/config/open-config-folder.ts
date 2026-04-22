import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('open-config-folder', async () => {
    const { shell, app } = await import('electron')
    const path = await import('path')

    const configDir = path.join(app.getPath('appData'), 'watcher')

    try {
      await shell.openPath(configDir)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
