import { app, BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { createIPCHandlers } from './ipc'

// GPU 着色器磁盘缓存写盘失败时(目录被旧进程/杀毒软件占用) 回退到内存缓存, 避免报错
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

// 单实例锁: 避免多个实例争用同一缓存目录, 导致磁盘缓存创建失败
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../src/renderer/src/assets/images/logo.jpg'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      // 安全增强设置
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      disableBlinkFeatures: 'Auxclick',
    },
  })

  // 设置会话级别的内容安全策略
  const ses = mainWindow.webContents.session
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; " +
            "font-src 'self' data:; " +
            "connect-src 'self' http://localhost:* https://*; " +
            "object-src 'none';",
        ],
      },
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发模式下加载开发服务器，生产环境加载打包后的文件
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 当应用准备好时创建窗口
app.whenReady().then(() => {
  // 设置应用用户模型 ID（Windows）
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.watcher-tools.app')
  }

  // 注册 IPC 处理器
  createIPCHandlers()

  createWindow()

  app.on('activate', function () {
    // 在 macOS 上，当点击 dock 图标且没有其他窗口打开时，重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 当所有窗口都关闭时退出应用（macOS 除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
