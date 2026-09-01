import { ipcMain } from 'electron'
import { execFileSync } from 'child_process'
import { promises as fs, existsSync } from 'fs'
import os from 'os'
import path from 'path'

interface SideMeta {
  product_serial: string
  serial_number: string
  process_time: string
  describe_path: string
  machine_name: string
  lot_id: string
}

interface RestorePayload {
  sourcePath?: string
  productBase?: string
  minioBase?: string
  mappingBase?: string
  serverUrl?: string
  submitKv?: boolean
  localMinioUrl?: string
}

type LogType = 'step' | 'ok' | 'warn' | 'err' | 'info'
interface LogItem {
  type: LogType
  msg: string
}

interface KvRequest {
  db_name: string
  operation: string
  op_mode: string
  key: string
  value: string
}

interface BackupContext {
  backupRoot: string
  tempDir: string | null
  sn: string
  snTxt: string
  sideMeta: Partial<Record<'A' | 'B', SideMeta>>
}

/**
 * 查找 A/B 面的 fpcV2origindata 文件
 * 命名规则: fpcV2origindata_{A|B}_{机台名}_{计数}.json (机台名不固定, 如 127.0.0.1)
 * 优先 _last.json (正常复判快照), 其次取任意同名文件
 */
async function findSideJson(backupRoot: string, side: 'A' | 'B'): Promise<string | null> {
  const entries = await fs.readdir(backupRoot).catch(() => [])
  const prefix = `fpcV2origindata_${side}_`
  const matches = entries.filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
  if (!matches.length) return null
  return matches.find((f) => f.endsWith('_last.json')) || matches[0]
}

/**
 * 递归改写 json 中指向现场 minio 的完整图片 URL 为本地地址
 * 例: http://10.14.31.109:9102/deepiresults/... → http://127.0.0.1:9102/deepiresults/...
 * 返回改写次数
 */
function rewriteMinioUrls(value: unknown, localPrefix: string, count: { n: number }): unknown {
  if (typeof value === 'string') {
    const m = value.match(/^(https?:\/\/)([^/]+)\/(deepiresults\/.*)$/)
    if (m) {
      const rewritten = `${localPrefix}/${m[3]}`
      if (rewritten !== value) count.n++
      return rewritten
    }
    return value
  }
  if (Array.isArray(value)) return value.map((v) => rewriteMinioUrls(v, localPrefix, count))
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) {
      value[k] = rewriteMinioUrls(value[k], localPrefix, count)
    }
    return value
  }
  return value
}

/**
 * 计算 A/B 面在 minio 中的相对目录 (含全部中间层级, 如 日期/产品/SN/A_<pt>)
 * 以备份内图片目录的镜像层级为准 (与 json 内图片 URL 路径一致), 找不到图片时回退 产品/SN/A_<pt>
 */
async function deriveMinioRelDir(
  backupRoot: string,
  side: 'A' | 'B',
  meta: SideMeta,
  sn: string
): Promise<string> {
  const imgRoot = path.join(backupRoot, 'img', 'deepiresults')
  const found = await findImgSideDir(imgRoot, side, meta.process_time)
  if (found) return path.relative(imgRoot, found).replace(/\\/g, '/')
  return path.join(meta.product_serial, sn, `${side}_${meta.process_time}`).replace(/\\/g, '/')
}

/**
 * 在 imgRoot 下递归查找 <side>_<processTime> 目录 (容忍日期等中间层级, 如 deepiresults/20260901/<产品>/<SN>/A_...)
 */
async function findImgSideDir(
  imgRoot: string,
  side: string,
  processTime: string
): Promise<string | null> {
  const target = `${side}_${processTime}`
  const queue = [imgRoot]
  while (queue.length) {
    const dir = queue.pop()!
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
    for (const e of entries) {
      if (!e.isDirectory()) continue
      const p = path.join(dir, e.name)
      if (e.name === target) return p
      queue.push(p)
    }
  }
  return null
}

/** 返回 A/B 面 fpcV2origindata 文件对 [文件名, 面] */
async function findSideJsonFiles(backupRoot: string): Promise<Array<[string, 'A' | 'B']>> {
  const pairs: Array<[string, 'A' | 'B']> = []
  for (const side of ['A', 'B'] as const) {
    const name = await findSideJson(backupRoot, side)
    if (name) pairs.push([name, side])
  }
  return pairs
}

/** 递归查找包含 asideInfer.json 的备份根目录 (最多 3 层) */
async function findRoot(dir: string, logs: LogItem[]): Promise<string> {
  const queue = [dir]
  for (let depth = 0; depth < 3 && queue.length; depth++) {
    const next: string[] = []
    for (const d of queue) {
      if (existsSync(path.join(d, 'asideInfer.json'))) return d
      const entries = await fs.readdir(d, { withFileTypes: true }).catch(() => [])
      for (const e of entries) {
        if (e.isDirectory()) next.push(path.join(d, e.name))
      }
    }
    queue.splice(0, queue.length, ...next)
  }
  logs.push({ type: 'warn', msg: `未找到 asideInfer.json, 使用 ${dir} 作为备份根目录` })
  return dir
}

/** 解压 (zip) 并定位备份根目录, 返回根目录与临时目录 (无 zip 时 tempDir=null) */
async function resolveSource(sourcePath: string, logs: LogItem[]): Promise<{ backupRoot: string; tempDir: string | null }> {
  let rootDir = sourcePath
  let tempDir: string | null = null
  if (sourcePath.toLowerCase().endsWith('.zip')) {
    tempDir = path.join(os.tmpdir(), `restore-backup-${Date.now()}`)
    logs.push({ type: 'step', msg: `解压 ${path.basename(sourcePath)} → ${tempDir}` })
    try {
      execFileSync(
        'powershell',
        [
          '-NoProfile',
          '-Command',
          `Expand-Archive -Path '${sourcePath.replace(/'/g, "''")}' -DestinationPath '${tempDir.replace(/'/g, "''")}' -Force`,
        ],
        { stdio: 'pipe' }
      )
    } catch (e) {
      throw new Error(`解压失败: ${e instanceof Error ? e.message : String(e)}`)
    }
    rootDir = tempDir
  }
  const backupRoot = await findRoot(rootDir, logs)
  logs.push({ type: 'step', msg: `备份根目录: ${backupRoot}` })
  return { backupRoot, tempDir }
}

/** 读取 sn.txt 与 A/B 面 json 元信息 (SN 以 A 面 json 的 serial_number 为准, 同一块板 A/B 共用) */
async function readBackupMeta(backupRoot: string, logs: LogItem[]): Promise<BackupContext> {
  let snTxt = ''
  try {
    snTxt = (await fs.readFile(path.join(backupRoot, 'sn.txt'), 'utf8')).trim()
    logs.push({ type: 'ok', msg: `sn.txt: ${snTxt}` })
  } catch {
    logs.push({ type: 'warn', msg: '缺少 sn.txt' })
  }

  const sideMeta: Partial<Record<'A' | 'B', SideMeta>> = {}
  for (const [jname, side] of await findSideJsonFiles(backupRoot)) {
    const jpath = path.join(backupRoot, jname)
    if (!existsSync(jpath)) continue
    const data = JSON.parse(await fs.readFile(jpath, 'utf8'))
    sideMeta[side] = {
      product_serial: data.product_serial,
      serial_number: data.serial_number,
      process_time: data.process_time || '',
      describe_path: data.describe_path,
      machine_name: data.machine_name,
      lot_id: data.lot_id,
    }
  }
  const sn = sideMeta.A?.serial_number || sideMeta.B?.serial_number || snTxt
  if (snTxt && snTxt !== sn) {
    logs.push({ type: 'warn', msg: `sn.txt (${snTxt}) 与 panel json 的 serial_number (${sn}) 不一致, 以 json 为准` })
  }
  if (!sn) throw new Error('无法确定 SN')
  return { backupRoot, tempDir: null, sn, snTxt, sideMeta }
}

/** 构建还原将要提交的全部 KV 请求 (预览与执行共用) */
async function buildKvRequests(
  ctx: BackupContext,
  minioBase: string
): Promise<{ kv: KvRequest[]; inferFiles: Array<{ fname: string; side: string; dbName: string; count: number }> }> {
  const { backupRoot, sn, sideMeta } = ctx
  const basePath = minioBase.replace(/\\/g, '/')
  const kv: KvRequest[] = []
  const inferFiles: Array<{ fname: string; side: string; dbName: string; count: number }> = []

  // AI 数据 — 自动判定库类型: 元素为字符串 → ai_inference_result, 对象 → ai_detail_results_tovrs
  for (const [fname, side] of [['asideInfer.json', 'A'], ['bsideInfer.json', 'B']] as const) {
    const fpath = path.join(backupRoot, fname)
    if (!existsSync(fpath)) continue
    const text = (await fs.readFile(fpath, 'utf8')).trim()
    if (!text) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      continue
    }
    if (!Array.isArray(parsed)) continue
    const dbName = parsed.every((x) => typeof x === 'string')
      ? 'ai_inference_result'
      : 'ai_detail_results_tovrs'
    kv.push({ db_name: dbName, operation: 'put', op_mode: 'all_ow', key: `${sn}_${side}`, value: text })
    inferFiles.push({ fname, side, dbName, count: parsed.length })
  }

  // SN → AVI_results_db
  const sideInfos: Record<string, string> = {}
  for (const [_jname, side] of await findSideJsonFiles(backupRoot)) {
    const meta = sideMeta[side]
    if (!meta) continue
    const pt = meta.process_time
    const describeName = meta.describe_path || `${side}_${pt}-panel.json`
    const minioRelDir = await deriveMinioRelDir(backupRoot, side, meta, sn)
    sideInfos[side] = `${basePath}/${minioRelDir}/${describeName}`
  }
  if (Object.keys(sideInfos).length) {
    kv.push({
      db_name: 'AVI_results_db',
      operation: 'put',
      op_mode: 'all_ow',
      key: sn,
      value: JSON.stringify({ side_infos: sideInfos, sn }),
    })
  }

  // lot → panel_list + lot_panel
  const lotId = sideMeta.A?.lot_id || sideMeta.B?.lot_id
  if (lotId) {
    for (const dbName of ['panel_list', 'lot_panel']) {
      kv.push({ db_name: dbName, operation: 'put', op_mode: 'all_ow', key: lotId, value: sn })
    }
  }
  return { kv, inferFiles }
}

export function register(): void {
  // 获取用户主目录 (还原页面默认路径用)
  ipcMain.handle('get-home-dir', () => {
    return { homeDir: os.homedir() }
  })

  // 选择备份来源: zip 文件
  ipcMain.handle('select-restore-source', async (event) => {
    const { dialog, BrowserWindow } = await import('electron')
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      const result = await dialog.showOpenDialog(win!, {
        title: '选择 backup.zip',
        properties: ['openFile'],
        filters: [
          { name: 'ZIP', extensions: ['zip'] },
          { name: '所有文件', extensions: ['*'] },
        ],
      })
      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true }
      }
      return { canceled: false, path: result.filePaths[0] }
    } catch (error) {
      return {
        canceled: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  // 选择目录 (基准路径用)
  ipcMain.handle('select-dir-path', async (event) => {
    const { dialog, BrowserWindow } = await import('electron')
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      const result = await dialog.showOpenDialog(win!, {
        title: '选择文件夹',
        properties: ['openDirectory'],
      })
      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true }
      }
      return { canceled: false, path: result.filePaths[0] }
    } catch (error) {
      return {
        canceled: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })

  // 预览: 解析备份并返回将要提交的 KV 请求 (不执行任何写入/网络请求)
  ipcMain.handle('preview-restore-kv', async (_event, payload: RestorePayload) => {
    const logs: LogItem[] = []
    try {
      const sourcePath = (payload?.sourcePath || '').trim()
      if (!sourcePath || !existsSync(sourcePath)) {
        throw new Error('备份来源路径无效或不存在')
      }
      const { backupRoot, tempDir } = await resolveSource(sourcePath, logs)
      const ctx = await readBackupMeta(backupRoot, logs)
      const { kv, inferFiles } = await buildKvRequests(ctx, payload?.minioBase || 'C:/minio/deepiresults')
      // 预览不提交, 清理临时解压目录
      if (tempDir) await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
      return { success: true, logs, sn: ctx.sn, kv, inferFiles }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logs.push({ type: 'err', msg: message })
      return { success: false, logs, error: message }
    }
  })

  // 还原备份: 料号 + panel.json/图片 + 前道文件 + AI 数据 + SN/lot KV
  ipcMain.handle('restore-backup', async (_event, payload: RestorePayload) => {
    const logs: LogItem[] = []
    const log = (type: LogType, msg: string) => logs.push({ type, msg })
    const step = (msg: string) => log('step', msg)
    const ok = (msg: string) => log('ok', msg)
    const warn = (msg: string) => log('warn', msg)
    const err = (msg: string) => log('err', msg)

    try {
      const sourcePath = (payload?.sourcePath || '').trim()
      if (!sourcePath || !existsSync(sourcePath)) {
        throw new Error('备份来源路径无效或不存在')
      }
      const productBase = (payload?.productBase || '').trim().replace(/\/+$/, '')
      const minioBase = (payload?.minioBase || '').trim().replace(/\/+$/, '')
      const mappingBase = (payload?.mappingBase || '').trim().replace(/\/+$/, '')
      const serverUrl = (payload?.serverUrl || 'http://localhost:9877').trim()
      const submitKv = payload?.submitKv !== false
      const localMinioUrl = (payload?.localMinioUrl || 'http://127.0.0.1:9102').trim().replace(/\/+$/, '')
      if (!productBase || !minioBase || !mappingBase) {
        throw new Error('料号/图片/前道文件基准路径不能为空')
      }

      const { backupRoot, tempDir } = await resolveSource(sourcePath, logs)
      const ctx = await readBackupMeta(backupRoot, logs)
      const { sn } = ctx

      // 3. 料号文件夹
      step('还原料号文件夹')
      const productSrc = path.join(backupRoot, 'product')
      if (existsSync(productSrc)) {
        const ids = (await fs.readdir(productSrc, { withFileTypes: true }))
          .filter((e) => e.isDirectory())
          .map((e) => e.name)
        for (const id of ids) {
          const dest = path.join(productBase, id)
          const required = [
            `${id}.json`,
            `${id}_A.json`,
            `${id}_A.png`,
            `${id}_B.json`,
            `${id}_B.png`,
            'productInfo.json',
          ]
          const missing = required.filter((f) => !existsSync(path.join(productSrc, id, f)))
          if (missing.length) warn(`料号 ${id} 缺少必需文件: ${missing.join(', ')} (仍将复制完整文件夹)`)
          await fs.cp(path.join(productSrc, id), dest, { recursive: true, force: true })
          ok(`料号 ${id} → ${dest}`)
        }
      } else {
        warn('备份中无 product 目录, 跳过')
      }

      // 4. panel.json + 缺陷图片 → minio (目录层级以备份图片镜像为准, 与 json 内 URL 路径一致)
      step('还原 panel.json 与缺陷图片到 minio')
      const imgRoot = path.join(backupRoot, 'img', 'deepiresults')
      for (const [jname, side] of await findSideJsonFiles(backupRoot)) {
        const jpath = path.join(backupRoot, jname)
        const meta = ctx.sideMeta[side]
        if (!existsSync(jpath) || !meta) {
          warn(`${jname} 不存在, 跳过`)
          continue
        }
        const pt = meta.process_time
        const describeName = meta.describe_path || `${side}_${pt}-panel.json`
        const minioRelDir = await deriveMinioRelDir(backupRoot, side, meta, sn)
        const targetDir = path.join(minioBase, minioRelDir)
        await fs.mkdir(targetDir, { recursive: true })
        // 改写 json 内图片 URL: 现场机台 IP → 本地 minio 地址
        const data = JSON.parse(await fs.readFile(jpath, 'utf8'))
        const count = { n: 0 }
        rewriteMinioUrls(data, localMinioUrl, count)
        await fs.writeFile(path.join(targetDir, describeName), JSON.stringify(data))
        const rewritten = count.n ? ` (改写图片 URL ${count.n} 处 → ${localMinioUrl})` : ''
        ok(`${jname} → ${targetDir}\\${describeName}${rewritten}`)

        const imgSideDir = path.join(imgRoot, minioRelDir)
        if (existsSync(imgSideDir)) {
          await fs.cp(imgSideDir, targetDir, { recursive: true, force: true })
          const cnt = (await fs.readdir(targetDir, { recursive: true })).length
          ok(`缺陷图片 ${cnt} 项 → ${targetDir}`)
        } else {
          warn(`未找到对应图片目录 ${imgSideDir}`)
        }
      }

      // 5. 前道文件 mapping (相对路径原样)
      step('还原前道文件 (mapping)')
      const mappingSrc = path.join(backupRoot, 'mapping')
      if (existsSync(mappingSrc)) {
        await fs.cp(mappingSrc, mappingBase, { recursive: true, force: true })
        ok(`mapping → ${mappingBase} (相对路径原样保存)`)
      } else {
        warn('备份中无 mapping 目录, 跳过')
      }

      // 6. KV 数据
      if (!submitKv) {
        log('info', '已关闭 KV 数据提交, 跳过')
      } else {
        step(`提交 KV 数据到 ${serverUrl}`)
        const { kv, inferFiles } = await buildKvRequests(ctx, minioBase)
        for (const f of inferFiles) {
          ok(`AI 数据 ${f.fname} → ${f.dbName} key=${sn}_${f.side} (${f.count} 条)`)
        }
        if (kv.some((k) => k.db_name === 'AVI_results_db')) ok(`SN → AVI_results_db key=${sn}`)
        for (const k of kv.filter((k) => k.db_name === 'panel_list' || k.db_name === 'lot_panel')) {
          ok(`lot → ${k.db_name} key=${k.key} value=${k.value}`)
        }

        let okCount = 0
        let failCount = 0
        for (const k of kv) {
          try {
            const res = await fetch(serverUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(k),
            })
            const body = await res.text()
            if (res.ok && body.includes('"result":"OK"')) {
              ok(`POST ${k.db_name} key=${k.key} → ${res.status} OK`)
              okCount++
            } else {
              warn(`POST ${k.db_name} key=${k.key} → ${res.status} ${body.slice(0, 120)}`)
              failCount++
            }
          } catch (e) {
            warn(`POST ${k.db_name} key=${k.key} 失败: ${e instanceof Error ? e.message : String(e)}`)
            failCount++
          }
        }
        log('info', `KV 提交完成: 成功 ${okCount}, 失败 ${failCount}`)
      }

      if (tempDir) await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
      return { success: true, logs }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      err(message)
      return { success: false, logs, error: message }
    }
  })
}
