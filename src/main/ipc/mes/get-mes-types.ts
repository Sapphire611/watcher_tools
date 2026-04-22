import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('get-mes-types', async () => {
    const path = await import('path')
    const fs = await import('fs')
    const { app } = await import('electron')

    try {
      const configDir = path.join(app.getPath('appData'), 'watcher', 'config')
      const mesDir = path.join(configDir, 'mes')
      const networkConfFile = path.join(configDir, 'netWorkConf.json')

      let currentMesType = ''
      try {
        const networkContent = await fs.promises.readFile(networkConfFile, 'utf8')
        const networkConf = JSON.parse(networkContent)
        currentMesType = networkConf.mesType || ''
      } catch {
        // 文件不存在或解析失败
      }

      try {
        await fs.promises.mkdir(mesDir, { recursive: true })
      } catch {
        // 目录已存在
      }

      const files = await fs.promises.readdir(mesDir)
      const jsonFiles = files
        .filter((file) => file.endsWith('.json'))
        .filter((file) => !file.includes('_transe'))

      return {
        success: true,
        mesTypes: jsonFiles.map((file) => file.replace('.json', '')),
        currentMesType: currentMesType,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
