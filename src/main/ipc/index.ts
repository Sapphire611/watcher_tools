import { ipcMain } from 'electron'
import { createConnection } from 'net'

export function createIPCHandlers(): void {
  // 示例：简单的 ping-pong 处理器
  ipcMain.handle('ping', () => 'pong')

  // 示例：获取应用版本
  ipcMain.handle('get-app-version', () => {
    return process.versions.electron
  })

  // 示例：异步操作
  ipcMain.handle('async-operation', async (_, arg) => {
    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return `Processed: ${arg}`
  })

  // HTTP POST 请求处理器
  ipcMain.handle('http-post', async (_, url: string, data: any) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  // TCP 端口检测处理器
  ipcMain.handle('check-tcp-port', async (_, host: string, port: number) => {
    return new Promise<boolean>((resolve) => {
      const socket = createConnection({ host, port, timeout: 2000 })

      socket.on('connect', () => {
        socket.destroy()
        resolve(true)
      })

      socket.on('error', () => {
        resolve(false)
      })

      socket.on('timeout', () => {
        socket.destroy()
        resolve(false)
      })
    })
  })

  // MinIO bucket 检查处理器
  ipcMain.handle(
    'check-minio-bucket',
    async (
      _,
      endpoint: string,
      accessKey: string,
      secretKey: string,
      bucketName: string,
    ) => {
      try {
        const url = `${endpoint}/${bucketName}/`
        const date = new Date().toUTCString()

        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            Host: new URL(endpoint).host,
            Date: date,
          },
        })

        return {
          exists: response.status === 200 || response.status === 403,
          accessible: response.status === 200,
        }
      } catch (error) {
        return {
          exists: false,
          accessible: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    },
  )

  // 读取 MinIO 服务配置
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

  // 获取应用配置路径
  ipcMain.handle('get-app-config-path', async () => {
    const { app } = await import('electron')
    const path = await import('path')
    const fs = await import('fs')

    const configDir = path.join(app.getPath('appData'), 'watcher')

    // 确保目录存在
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

  // 打开配置文件夹
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
