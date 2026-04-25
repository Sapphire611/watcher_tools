import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('apply-preset-config', async (_, fileName: string, backupName?: string) => {
    const path = await import('path')
    const fs = await import('fs')
    const { app } = await import('electron')

    try {
      const configDir = path.join(app.getPath('appData'), 'watcher', 'config')

      // 确保目录存在
      await fs.promises.mkdir(configDir, { recursive: true })

      const sourceFile = path.join(configDir, fileName)

      const match = fileName.match(/^(defectList|defectTable)-(.+)\.json$/)
      if (!match) {
        return { success: false, error: '无效的配置文件名' }
      }

      const baseName = match[1]
      const currentFileName = `${baseName}.json`
      const currentFile = path.join(configDir, currentFileName)

      try {
        await fs.promises.access(currentFile)

        if (backupName) {
          const backupFileName = backupName.endsWith('.json') ? backupName : `${backupName}.json`
          const backupFile = path.join(configDir, backupFileName)
          await fs.promises.rename(currentFile, backupFile)
        }
      } catch {
        // 当前文件不存在，无需备份
      }

      await fs.promises.rename(sourceFile, currentFile)

      return {
        success: true,
        appliedFile: currentFileName,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
