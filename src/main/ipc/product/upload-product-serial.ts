import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('upload-product-serial', async (event) => {
    const { dialog, app, BrowserWindow } = await import('electron')
    const fs = await import('fs')
    const path = await import('path')

    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) {
        return { success: false, error: '无法获取窗口实例' }
      }

      const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory'],
        title: '选择料号文件夹',
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, error: '用户取消选择' }
      }

      const sourceDir = result.filePaths[0]
      const folderName = path.basename(sourceDir)
      const files = await fs.promises.readdir(sourceDir)

      const requiredFiles = [
        `${folderName}.json`,
        `${folderName}_A.json`,
        `${folderName}_A.png`,
        `${folderName}_B.json`,
        `${folderName}_B.png`,
        'productInfo.json',
      ]

      const missingFiles = requiredFiles.filter((file) => !files.includes(file))

      if (missingFiles.length > 0) {
        return {
          success: false,
          error: `缺少必需文件: ${missingFiles.join(', ')}`,
        }
      }

      const configDir = path.join(app.getPath('appData'), 'watcher', 'config', 'productSerial')
      const targetDir = path.join(configDir, folderName)

      await fs.promises.mkdir(targetDir, { recursive: true })

      for (const file of requiredFiles) {
        const sourcePath = path.join(sourceDir, file)
        const targetPath = path.join(targetDir, file)
        await fs.promises.copyFile(sourcePath, targetPath)
      }

      return {
        success: true,
        folderName: folderName,
        targetPath: targetDir,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
