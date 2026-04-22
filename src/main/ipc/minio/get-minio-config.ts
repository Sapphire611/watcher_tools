import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('get-minio-config', async (_, bucketName: string) => {
    try {
      const { exec } = await import('child_process')
      const { promisify } = await import('util')
      const fs = await import('fs')
      const path = await import('path')
      const execAsync = promisify(exec)

      // 从 Windows 服务获取 WinSW exe 路径
      const { stdout } = await execAsync('sc qc DeepiObjectStorage', {
        encoding: 'utf8',
      })

      const match = stdout.match(/BINARY_PATH_NAME\s*:\s*"?(.+?)"?\s*$/im)
      if (!match) {
        return { success: false, error: 'Unable to find service binary path' }
      }

      // 读取同目录下的 WinSW XML 配置
      const exePath = match[1].trim()
      const serviceDir = path.dirname(exePath)
      const xmlName = path.basename(exePath, path.extname(exePath)) + '.xml'
      const xmlPath = path.join(serviceDir, xmlName)

      const xmlContent = await fs.promises.readFile(xmlPath, 'utf8')

      // 从 <arguments> 中提取数据路径
      const argsMatch = xmlContent.match(/<arguments>(.*?)<\/arguments>/i)
      if (!argsMatch) {
        return { success: false, error: 'Unable to parse arguments from XML config' }
      }

      // 解析: server --address :9102 C:\minio
      const args = argsMatch[1].trim()
      const parts = args.split(/\s+/)
      const dataPath = parts[parts.length - 1]

      // 检查 bucket 目录是否存在
      const bucketPath = path.join(dataPath, bucketName)
      let bucketExists = false
      try {
        const stats = await fs.promises.stat(bucketPath)
        bucketExists = stats.isDirectory()
      } catch {
        bucketExists = false
      }

      return {
        success: true,
        dataPath: dataPath,
        bucketExists: bucketExists,
        bucketPath: bucketPath,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
}
