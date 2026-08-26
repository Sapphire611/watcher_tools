import { ipcMain } from 'electron'

interface SideInput {
  jsonPath?: string
  zipPath?: string
}

interface AddSnNewMinioPayload {
  sn?: string
  minioBase?: string
  sideA?: SideInput
  sideB?: SideInput
}

/**
 * 从 pcs_info[1].defect_info 的 defect_origin_images 中解析图包目录
 * 例: "0120260823145734720_3/9479eec6-.../70fa3501-.../20260823-145837/defect_package_20260823-145837.zip/xxx/ng_image_rgb.jpg"
 * → dirs: [0120260823145734720_3, ..., 20260823-145837], zipName: defect_package_20260823-145837.zip
 */
async function extractZipTarget(
  jsonPath: string
): Promise<{ dirs: string[]; zipName: string }> {
  const fs = await import('fs/promises')
  const content = await fs.readFile(jsonPath, 'utf8')
  const data = JSON.parse(content)
  const pcsInfo = data?.pcs_info
  if (!pcsInfo) {
    throw new Error('JSON 中缺少 pcs_info 字段')
  }
  const pcs = Array.isArray(pcsInfo) ? pcsInfo[1] : pcsInfo['1']
  if (!pcs) {
    throw new Error('pcs_info 中缺少 "1" 的数据')
  }
  const defectInfo = Array.isArray(pcs.defect_info) ? pcs.defect_info : []
  for (const defect of defectInfo) {
    const images = defect?.defect_origin_images
    if (!Array.isArray(images)) continue
    for (const image of images) {
      if (typeof image !== 'string' || !image) continue
      const segments = image.split('/')
      const zipIndex = segments.findIndex((s) => s.toLowerCase().endsWith('.zip'))
      if (zipIndex > 0) {
        return { dirs: segments.slice(0, zipIndex), zipName: segments[zipIndex] }
      }
    }
  }
  throw new Error('pcs_info[1].defect_info 中未找到 defect_origin_images 图包路径')
}

/** 复制 JSON 并按 pcs_info[1] 的 defect_origin_images 目录存放图包 */
async function prepareSide(
  side: 'A' | 'B',
  input: SideInput,
  snDir: string,
  logs: string[]
): Promise<string> {
  const fs = await import('fs/promises')
  const path = await import('path')

  if (!input.jsonPath) {
    throw new Error(`${side}面 JSON 路径未填写`)
  }
  const jsonName = path.basename(input.jsonPath)
  const sideDir = path.join(snDir, side)
  await fs.mkdir(sideDir, { recursive: true })

  // 步骤2: 存放 JSON
  const jsonDest = path.join(sideDir, jsonName)
  await fs.copyFile(input.jsonPath, jsonDest)
  logs.push(`[${side}] 已复制 JSON → ${jsonDest}`)

  // 步骤3: 存放图包（按 defect_origin_images 的目录层级创建，到 .zip 所在文件夹为止）
  if (!input.zipPath) {
    logs.push(`[${side}] 未填写图包路径，跳过图包存放`)
    return jsonName
  }
  const { dirs, zipName } = await extractZipTarget(input.jsonPath)
  const pkgDir = path.join(sideDir, ...dirs)
  await fs.mkdir(pkgDir, { recursive: true })
  const zipSourceName = path.basename(input.zipPath)
  if (zipSourceName !== zipName) {
    logs.push(
      `[${side}] 提示: 图包文件名(${zipSourceName})与 json 中的路径(${zipName})不一致，以 json 中的为准`
    )
  }
  const zipDest = path.join(pkgDir, zipName)
  await fs.copyFile(input.zipPath, zipDest)
  logs.push(`[${side}] 已复制图包 → ${zipDest}`)
  return jsonName
}

export function register(): void {
  // 仅选择文件路径（不读取内容，JSON 可能很大）
  ipcMain.handle('select-file-path', async (event) => {
    const { dialog, BrowserWindow } = await import('electron')
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      const result = await dialog.showOpenDialog(win!, {
        title: '选择文件',
        properties: ['openFile'],
        filters: [
          { name: 'JSON', extensions: ['json'] },
          { name: 'ZIP', extensions: ['zip'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      })
      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true }
      }
      return { canceled: false, filePath: result.filePaths[0] }
    } catch (error) {
      return {
        canceled: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  // 添加SN（新版minio版本）: 复制 JSON 与图包到新版 minio 目录
  ipcMain.handle('add-sn-new-minio', async (_event, payload: AddSnNewMinioPayload) => {
    const fs = await import('fs/promises')
    const path = await import('path')
    const logs: string[] = []
    try {
      const sn = (payload?.sn || '').replace(/[\\/:*?"<>|]/g, '_').trim()
      if (!sn) {
        throw new Error('SN 号不能为空')
      }
      const minioBase = (payload?.minioBase || '').trim().replace(/\\/g, '/').replace(/\/+$/, '')
      if (!minioBase) {
        throw new Error('minio 基础路径不能为空')
      }
      const snDir = path.join(minioBase, sn)
      await fs.mkdir(snDir, { recursive: true })
      logs.push(`minio 基础路径: ${minioBase}`)
      logs.push(`SN 目录: ${snDir}`)

      const jsonNameA = await prepareSide('A', payload?.sideA || {}, snDir, logs)
      const jsonNameB = await prepareSide('B', payload?.sideB || {}, snDir, logs)

      const minioUrls = {
        A: `minio://deepiresults/${sn}/A/${jsonNameA}`,
        B: `minio://deepiresults/${sn}/B/${jsonNameB}`,
      }
      logs.push(`minio URL A: ${minioUrls.A}`)
      logs.push(`minio URL B: ${minioUrls.B}`)
      return { success: true, logs, minioUrls }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logs.push(`错误: ${message}`)
      return { success: false, logs, error: message }
    }
  })
}
