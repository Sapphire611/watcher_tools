import { ipcMain } from 'electron'
import { createConnection } from 'net'

export function register(): void {
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
}
