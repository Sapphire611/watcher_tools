#!/usr/bin/env node
/**
 * 还原备份脚本 — 把 watcher 的 backup 压缩包还原为可用现场
 *
 * 用法:
 *   node restore-backup.mjs <zip或目录> [选项]
 *
 * 选项:
 *   --product-base <path>   料号基准目录 (默认: %APPDATA%\watcher\config\productSerial)
 *   --minio-base <path>     minio 基础目录 (默认: C:\minio\deepiresults)
 *   --mapping-base <path>   前道文件基准目录 (默认: %USERPROFILE%\Documents\mapping)
 *   --server <url>          KV 服务地址 (默认: http://localhost:9877)
 *   --local-minio <url>     本地 minio 地址, 用于改写 json 内图片 URL (默认: http://127.0.0.1:9102)
 *   --no-kv                 只还原文件，不提交 KV 数据
 *   --dry-run               只预览计划，不执行任何操作
 *
 * 还原内容:
 *   1. product/料号/          → product-base/料号/           (料号文件夹)
 *   2. fpcV2origindata_*.json + img/ → minio-base/<产品>/<SN>/<A|B>_<时间>/  (panel.json 与缺陷图片)
 *   3. mapping/**             → mapping-base/**              (前道文件, 相对路径原样)
 *   4. asideInfer/bsideInfer  → 自动判定库类型并 POST 到 KV 服务
 *   5. SN → AVI_results_db, lot → panel_list + lot_panel     (KV 数据)
 */
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

import { execFileSync } from 'node:child_process'
import { promises as fs, existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// ---------- 参数解析 ----------
const args = process.argv.slice(2)
function getArg(name, def) {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] ? args[i + 1] : def
}
const source = args.find((a) => !a.startsWith('--'))
const productBase = getArg('--product-base') || path.join(process.env.APPDATA || '', 'watcher', 'config', 'productSerial')
const minioBase = getArg('--minio-base') || 'C:\\minio\\deepiresults'
const mappingBase = getArg('--mapping-base') || path.join(os.homedir(), 'Documents', 'mapping')
const serverUrl = getArg('--server') || 'http://localhost:9877'
const localMinioUrl = (getArg('--local-minio') || 'http://127.0.0.1:9102').replace(/\/+$/, '')
const noKv = args.includes('--no-kv')
const dryRun = args.includes('--dry-run')

if (!source) {
  console.error('用法: node restore-backup.mjs <backup.zip 或 backup 目录> [选项]')
  process.exit(1)
}
if (!existsSync(source)) {
  console.error(`错误: 找不到 ${source}`)
  process.exit(1)
}

// ---------- 工具函数 ----------
const log = (msg) => console.log(msg)
const step = (msg) => console.log(`\n▶ ${msg}`)
const warn = (msg) => console.log(`  ⚠ ${msg}`)
const ok = (msg) => console.log(`  ✓ ${msg}`)

async function copyFile(src, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.copyFile(src, dest)
}

// ---------- 1. 解压 ----------
let rootDir = source
if (source.toLowerCase().endsWith('.zip')) {
  const tmp = path.join(os.tmpdir(), `restore-backup-${Date.now()}`)
  step(`解压 ${path.basename(source)} → ${tmp}`)
  execFileSync('powershell', [
    '-NoProfile', '-Command',
    `Expand-Archive -Path '${source.replace(/'/g, "''")}' -DestinationPath '${tmp.replace(/'/g, "''")}' -Force`,
  ], { stdio: 'inherit' })
  rootDir = tmp
}

// 定位备份根目录（包含 asideInfer.json 的目录, 最多找 3 层）
async function findRoot(dir) {
  const queue = [dir]
  for (let depth = 0; depth < 3 && queue.length; depth++) {
    const next = []
    for (const d of queue) {
      if (existsSync(path.join(d, 'asideInfer.json'))) return d
      const entries = await fs.readdir(d, { withFileTypes: true }).catch(() => [])
      for (const e of entries) {
        if (e.isDirectory()) next.push(path.join(d, e.name))
      }
    }
    queue.splice(0, queue.length, ...next)
  }
  return dir
}
const backupRoot = await findRoot(rootDir)
step(`备份根目录: ${backupRoot}`)

// 读取 sn.txt (仅作校验参考)
let snTxt = ''
try {
  snTxt = (await fs.readFile(path.join(backupRoot, 'sn.txt'), 'utf8')).trim()
  ok(`sn.txt: ${snTxt}`)
} catch {
  warn('缺少 sn.txt')
}

// 递归改写 json 中指向现场 minio 的完整图片 URL 为本地地址, 返回改写次数
function rewriteMinioUrls(value, localPrefix, count) {
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
    for (const k of Object.keys(value)) value[k] = rewriteMinioUrls(value[k], localPrefix, count)
    return value
  }
  return value
}

// 计算 A/B 面在 minio 中的相对目录 (含全部中间层级, 以备份图片镜像为准), 找不到图片时回退 产品/SN/A_<pt>
async function deriveMinioRelDir(root, side, meta, sn) {
  const imgRoot = path.join(root, 'img', 'deepiresults')
  const found = await findImgSideDir(imgRoot, side, meta.process_time)
  if (found) return path.relative(imgRoot, found).replace(/\\/g, '/')
  return path.join(meta.product_serial, sn, `${side}_${meta.process_time}`).replace(/\\/g, '/')
}

// 递归查找 <side>_<processTime> 目录 (容忍日期等中间层级, 如 deepiresults/20260901/<产品>/<SN>/A_...)
async function findImgSideDir(imgRoot, side, processTime) {
  const target = `${side}_${processTime}`
  const queue = [imgRoot]
  while (queue.length) {
    const dir = queue.pop()
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

// 查找 A/B 面 fpcV2origindata 文件 (机台名不固定): fpcV2origindata_{A|B}_{机台名}_{计数}.json, 优先 _last
async function findSideJsonFiles(root) {
  const entries = await fs.readdir(root).catch(() => [])
  const pairs = []
  for (const side of ['A', 'B']) {
    const prefix = `fpcV2origindata_${side}_`
    const matches = entries.filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
    const name = matches.find((f) => f.endsWith('_last.json')) || matches[0]
    if (name) pairs.push([name, side])
  }
  return pairs
}

// 读取 A/B 面 json 元信息 (serial 以 A 面 json 的 serial_number 为准, 同一块板 A/B 共用)
const sideMeta = {}
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
let sn = sideMeta.A?.serial_number || sideMeta.B?.serial_number || snTxt
if (snTxt && snTxt !== sn) {
  warn(`sn.txt (${snTxt}) 与 panel json 的 serial_number (${sn}) 不一致, 以 json 为准`)
}

// ---------- 2. product 料号 ----------
step('还原料号文件夹')
const productSrc = path.join(backupRoot, 'product')
const requiredProductFiles = (id) => [
  `${id}.json`, `${id}_A.json`, `${id}_A.png`, `${id}_B.json`, `${id}_B.png`, 'productInfo.json',
]
if (existsSync(productSrc)) {
  const ids = (await fs.readdir(productSrc, { withFileTypes: true }))
    .filter((e) => e.isDirectory()).map((e) => e.name)
  for (const id of ids) {
    const dest = path.join(productBase, id)
    const missing = requiredProductFiles(id).filter((f) => !existsSync(path.join(productSrc, id, f)))
    if (missing.length) {
      warn(`料号 ${id} 缺少必需文件: ${missing.join(', ')} (仍将复制完整文件夹)`)
    }
    if (dryRun) {
      ok(`[dry-run] ${productSrc}\\${id} → ${dest}`)
    } else {
      await fs.cp(path.join(productSrc, id), dest, { recursive: true, force: true })
      ok(`${productSrc}\\${id} → ${dest}`)
    }
  }
} else {
  warn('备份中无 product 目录, 跳过')
}

// ---------- 3. panel.json + 缺陷图片 → minio ----------
step('还原 panel.json 与缺陷图片到 minio')
const imgRoot = path.join(backupRoot, 'img', 'deepiresults')
for (const [jname, side] of await findSideJsonFiles(backupRoot)) {
  const jpath = path.join(backupRoot, jname)
  const meta = sideMeta[side]
  if (!existsSync(jpath) || !meta) {
    warn(`${jname} 不存在, 跳过`)
    continue
  }
  const productId = meta.product_serial
  const serial = sn // A/B 共用同一 SN
  const pt = meta.process_time
  const describeName = meta.describe_path || `${side}_${pt}-panel.json`
  const minioRelDir = await deriveMinioRelDir(backupRoot, side, meta, serial)
  const targetDir = path.join(minioBase, minioRelDir)
  const jsonDest = path.join(targetDir, describeName)

  if (dryRun) {
    ok(`[dry-run] ${jname} → ${jsonDest}`)
  } else {
    // 改写 json 内图片 URL: 现场机台 IP → 本地 minio 地址
    const data = JSON.parse(await fs.readFile(jpath, 'utf8'))
    const count = { n: 0 }
    rewriteMinioUrls(data, localMinioUrl, count)
    await fs.mkdir(targetDir, { recursive: true })
    await fs.writeFile(jsonDest, JSON.stringify(data))
    ok(`${jname} → ${jsonDest}${count.n ? ` (改写图片 URL ${count.n} 处 → ${localMinioUrl})` : ''}`)
  }

  // 缺陷图片: 与 panel.json 同一相对目录
  const imgSideDir = path.join(imgRoot, minioRelDir)
  if (existsSync(imgSideDir)) {
    if (dryRun) {
      const files = []
      const walk = async (d) => {
        for (const e of await fs.readdir(d, { withFileTypes: true })) {
          const p = path.join(d, e.name)
          if (e.isDirectory()) await walk(p)
          else files.push(p)
        }
      }
      await walk(imgSideDir)
      ok(`[dry-run] 缺陷图片 ${files.length} 个 → ${targetDir}`)
    } else {
      await fs.cp(imgSideDir, targetDir, { recursive: true, force: true })
      const cnt = (await fs.readdir(targetDir, { recursive: true })).length
      ok(`缺陷图片 ${cnt} 项 → ${targetDir}`)
    }
  } else {
    warn(`未找到对应图片目录 ${imgSideDir}`)
  }
}

// ---------- 4. mapping 前道文件 ----------
step('还原前道文件 (mapping)')
const mappingSrc = path.join(backupRoot, 'mapping')
if (existsSync(mappingSrc)) {
  if (dryRun) {
    const files = []
    const walk = async (d, rel) => {
      for (const e of await fs.readdir(d, { withFileTypes: true })) {
        const p = path.join(d, e.name)
        if (e.isDirectory()) await walk(p, path.join(rel, e.name))
        else files.push(path.join(rel, e.name))
      }
    }
    await walk(mappingSrc, '')
    for (const f of files) ok(`[dry-run] mapping${f} → ${mappingBase}${f}`)
  } else {
    await fs.cp(mappingSrc, mappingBase, { recursive: true, force: true })
    ok(`mapping\\* → ${mappingBase} (相对路径原样保存)`)
  }
} else {
  warn('备份中无 mapping 目录, 跳过')
}

// ---------- 5. KV 数据 ----------
if (noKv) {
  log('\n(--no-kv) 跳过 KV 数据提交')
} else {
  const kv = []
  const basePath = minioBase.replace(/\\/g, '/')

  // 5.1 AI 数据 (asideInfer / bsideInfer) — 自动判定库类型
  for (const [fname, side] of [['asideInfer.json', 'A'], ['bsideInfer.json', 'B']]) {
    const fpath = path.join(backupRoot, fname)
    if (!existsSync(fpath)) { warn(`${fname} 不存在, 跳过`); continue }
    const text = (await fs.readFile(fpath, 'utf8')).trim()
    if (!text) { warn(`${fname} 为空, 跳过`); continue }
    let parsed
    try { parsed = JSON.parse(text) } catch { warn(`${fname} 不是合法 JSON, 跳过`); continue }
    if (!Array.isArray(parsed)) { warn(`${fname} 不是数组, 跳过`); continue }

    // 判定规则: 元素为字符串 → ai_inference_result; 元素为对象 → ai_detail_results_tovrs
    const dbName = parsed.every((x) => typeof x === 'string')
      ? 'ai_inference_result'
      : 'ai_detail_results_tovrs'
    kv.push({
      db_name: dbName,
      operation: 'put',
      op_mode: 'all_ow',
      key: `${sn}_${side}`,
      value: text,
    })
    ok(`AI 数据 ${fname} → ${dbName} key=${sn}_${side} (${parsed.length} 条)`)
  }

  // 5.2 SN → AVI_results_db
  const sideInfos = {}
  for (const [jname, side] of await findSideJsonFiles(backupRoot)) {
    const meta = sideMeta[side]
    if (!meta) continue
    const pt = meta.process_time
    const describeName = meta.describe_path || `${side}_${pt}-panel.json`
    const minioRelDir = await deriveMinioRelDir(backupRoot, side, meta, sn)
    sideInfos[side] = `${basePath}/${minioRelDir}/${describeName}`
  }
  if (Object.keys(sideInfos).length) {
    const snValue = { side_infos: sideInfos, sn }
    kv.push({
      db_name: 'AVI_results_db',
      operation: 'put',
      op_mode: 'all_ow',
      key: sn,
      value: JSON.stringify(snValue),
    })
    ok(`SN → AVI_results_db key=${sn} side_infos=${JSON.stringify(sideInfos)}`)
  }

  // 5.3 lot → panel_list + lot_panel
  const lotId = sideMeta.A?.lot_id || sideMeta.B?.lot_id
  if (lotId) {
    for (const dbName of ['panel_list', 'lot_panel']) {
      kv.push({
        db_name: dbName,
        operation: 'put',
        op_mode: 'all_ow',
        key: lotId,
        value: sn,
      })
      ok(`lot → ${dbName} key=${lotId} value=${sn}`)
    }
  }

  // 执行 KV 提交
  if (dryRun) {
    for (const k of kv) ok(`[dry-run] POST ${serverUrl} ${k.db_name} key=${k.key}`)
  } else if (kv.length) {
    log(`\n提交 ${kv.length} 条 KV 数据到 ${serverUrl} ...`)
    let okCount = 0, failCount = 0
    for (const k of kv) {
      try {
        const res = await fetch(serverUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(k),
        })
        const body = await res.text()
        if (res.ok) { ok(`POST ${k.db_name} key=${k.key} → ${res.status} ${body.slice(0, 80)}`); okCount++ }
        else { warn(`POST ${k.db_name} key=${k.key} → ${res.status} ${body.slice(0, 120)}`); failCount++ }
      } catch (e) {
        warn(`POST ${k.db_name} key=${k.key} 失败: ${e.message}`)
        failCount++
      }
    }
    log(`\nKV 提交完成: 成功 ${okCount}, 失败 ${failCount}`)
  }
}

log('\n还原脚本执行完毕' + (dryRun ? ' (dry-run 模式, 未执行任何操作)' : ''))
