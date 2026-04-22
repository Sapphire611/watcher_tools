import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('apply-preset-config', async (_, fileName: string) => {
    const path = await import('path')
    const fs = await import('fs')
    const { app } = await import('electron')

    try {
      const appPath = app.getAppPath()
      const sourceFile = path.join(appPath, 'src/renderer/src/views/config', fileName)

      const configDir = path.join(app.getPath('appData'), 'watcher', 'config')
      await fs.promises.mkdir(configDir, { recursive: true })

      const match = fileName.match(/^(defectList|defectTable)-(.+)\.json$/)
      if (!match) {
        return { success: false, error: '无效的配置文件名' }
      }

      const baseName = match[1]
      const targetFileName = `${baseName}.json`
      const targetFile = path.join(configDir, targetFileName)

      try {
        await fs.promises.access(targetFile)
        const oldFileName = `${baseName}_old.json`
        const oldFile = path.join(configDir, oldFileName)
        await fs.promises.rename(targetFile, oldFile)
      } catch {
        // 目标文件不存在，无需备份
      }

      await fs.promises.copyFile(sourceFile, targetFile)

      return {
        success: true,
        appliedFile: targetFileName,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
