import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('get-preset-configs', async () => {
    const path = await import('path')
    const fs = await import('fs')
    const { app } = await import('electron')

    try {
      const appPath = app.getAppPath()
      const configDir = path.join(appPath, 'src/renderer/src/views/config')

      const files = await fs.promises.readdir(configDir)
      const jsonFiles = files.filter((file) => file.endsWith('.json'))

      const configs: { [key: string]: string[] } = {}
      for (const file of jsonFiles) {
        const match = file.match(/^(defectList|defectTable)-(.+)\.json$/)
        if (match) {
          const type = match[1]
          if (!configs[type]) {
            configs[type] = []
          }
          configs[type].push(file)
        }
      }

      return {
        success: true,
        configs: configs,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
