import { ipcMain } from 'electron'

export function register(): void {
  ipcMain.handle('get-app-version', () => {
    return process.versions.electron
  })
}
