import { ipcMain, app } from 'electron'

export function register(): void {
  ipcMain.handle('switch-config-folder', async (_, folderName: string, backupName?: string) => {
    const path = await import('path')
    const fs = await import('fs')

    try {
      const watcherDir = path.join(app.getPath('appData'), 'watcher')

      // 确保目录存在
      await fs.promises.mkdir(watcherDir, { recursive: true })

      const sourceFolderPath = path.join(watcherDir, folderName)
      const currentFolderPath = path.join(watcherDir, 'config')

      // 验证源文件夹存在
      try {
        await fs.promises.access(sourceFolderPath)
      } catch {
        return { success: false, error: '源配置文件夹不存在' }
      }

      // 递归复制文件夹
      async function copyDir(src: string, dest: string) {
        await fs.promises.mkdir(dest, { recursive: true })
        const entries = await fs.promises.readdir(src, { withFileTypes: true })

        for (const entry of entries) {
          const srcPath = path.join(src, entry.name)
          const destPath = path.join(dest, entry.name)

          if (entry.isDirectory()) {
            await copyDir(srcPath, destPath)
          } else {
            await fs.promises.copyFile(srcPath, destPath)
          }
        }
      }

      // 递归删除文件夹
      async function removeDir(dir: string) {
        try {
          const entries = await fs.promises.readdir(dir, { withFileTypes: true })

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              await removeDir(fullPath)
            } else {
              await fs.promises.unlink(fullPath)
            }
          }

          await fs.promises.rmdir(dir)
        } catch (error) {
          // 忽略删除错误
        }
      }

      // 如果当前 config 文件夹存在，进行备份
      try {
        await fs.promises.access(currentFolderPath)

        if (backupName) {
          const backupFolderName = backupName.startsWith('config-') ? backupName : `config-${backupName}`
          const backupFolderPath = path.join(watcherDir, backupFolderName)

          // 先删除旧的备份文件夹（如果存在）
          try {
            await fs.promises.access(backupFolderPath)
            await removeDir(backupFolderPath)
          } catch {
            // 备份文件夹不存在，继续
          }

          // 复制当前 config 到备份位置
          await copyDir(currentFolderPath, backupFolderPath)
        }

        // 删除当前 config 文件夹
        await removeDir(currentFolderPath)
      } catch {
        // 当前 config 文件夹不存在，无需备份
      }

      // 复制选中的文件夹到 config
      await copyDir(sourceFolderPath, currentFolderPath)

      // 删除源文件夹
      await removeDir(sourceFolderPath)

      return {
        success: true,
        appliedFolder: 'config',
        needRestart: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
