import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('ping', () => 'pong')
}
