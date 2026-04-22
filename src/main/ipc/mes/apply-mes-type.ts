import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('apply-mes-type', async (_, mesType: string) => {
    const path = await import('path')
    const fs = await import('fs')
    const { app } = await import('electron')

    try {
      const configDir = path.join(app.getPath('appData'), 'watcher', 'config')
      const mesDir = path.join(configDir, 'mes')
      const mesFile = path.join(mesDir, `${mesType}.json`)
      const networkConfFile = path.join(configDir, 'netWorkConf.json')

      const mesContent = await fs.promises.readFile(mesFile, 'utf8')
      const mesConfig = JSON.parse(mesContent)

      let networkConf: any = {}
      try {
        const networkContent = await fs.promises.readFile(networkConfFile, 'utf8')
        networkConf = JSON.parse(networkContent)
      } catch {
        // 文件不存在，使用空对象
      }

      networkConf.mes = mesConfig
      networkConf.mesType = mesType

      await fs.promises.writeFile(networkConfFile, JSON.stringify(networkConf, null, 2), 'utf8')

      return {
        success: true,
        mesType: mesType,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
