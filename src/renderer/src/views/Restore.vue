<template>
  <div class="page">
    <h2>备份还原</h2>
    <div class="desc">
      选择 watcher 打包的备份文件夹或 backup.zip，自动还原：料号、panel.json 与缺陷图片、前道文件，并提交
      AI 数据 / SN / lot 到 KV 服务。
    </div>

    <el-card class="form-card">
      <el-form label-width="140px">
        <el-form-item label="备份来源">
          <div class="source-row">
            <el-button type="primary" @click="handleSelectSource">选择 backup.zip</el-button>
            <span class="source-path">{{ sourcePath || '未选择' }}</span>
          </div>
        </el-form-item>

        <el-form-item label="料号基准目录">
          <el-input v-model="productBase" clearable />
          <el-button class="browse-btn" @click="browse('productBase')">浏览</el-button>
        </el-form-item>

        <el-form-item label="minio 基础路径">
          <el-input v-model="minioBase" clearable />
          <el-button class="browse-btn" @click="browse('minioBase')">浏览</el-button>
        </el-form-item>

        <el-form-item label="前道文件基准目录">
          <el-input v-model="mappingBase" clearable />
          <el-button class="browse-btn" @click="browse('mappingBase')">浏览</el-button>
        </el-form-item>

        <el-form-item label="KV 服务器地址">
          <el-input v-model="serverUrl" clearable />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="submitKv">提交 KV 数据（AI 结果 / SN / lot）</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleRestore" :loading="loading" :disabled="!sourcePath">
            开始还原
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="http-card">
      <template #header>
        <div class="card-header">
          <span>HTTP 请求概要</span>
          <el-button
            v-if="sourcePath"
            type="primary"
            size="small"
            :loading="previewing"
            @click="handlePreview"
          >
            预览请求
          </el-button>
        </div>
      </template>

      <div class="http-summary">
        <div class="summary-line">
          还原过程仅对 KV 服务器发起 <b>POST</b> 请求（地址：{{ serverUrl }}），最多 5 条，无其他外部请求：
        </div>
        <div class="summary-line summary-static">
          <span class="summary-tag">POST</span> <code>ai_detail_results_tovrs</code> 或
          <code>ai_inference_result</code> — AI 数据，key = <code>SN_A</code> / <code>SN_B</code>
          （按 infer 文件内容自动判定：对象数组 → tovrs，字符串数组 → inference_result；空文件跳过）
        </div>
        <div class="summary-line summary-static">
          <span class="summary-tag">POST</span> <code>AVI_results_db</code> — SN → 面板路径，key = SN
        </div>
        <div class="summary-line summary-static">
          <span class="summary-tag">POST</span> <code>panel_list</code> + <code>lot_panel</code> — lot → SN 列表，key = lot_id
        </div>
      </div>

      <template v-if="previewKv.length">
        <div class="preview-sn" v-if="previewSn">SN：{{ previewSn }}，共 {{ previewKv.length }} 条请求</div>
        <el-collapse>
          <el-collapse-item
            v-for="(req, i) in previewKv"
            :key="i"
            :title="`${req.db_name} — key=${req.key}`"
          >
            <pre class="preview-code">{{ JSON.stringify(req, null, 2) }}</pre>
          </el-collapse-item>
        </el-collapse>
      </template>
      <div v-else-if="sourcePath && !previewing" class="summary-line summary-empty">
        尚未预览 — 点击右上角「预览请求」查看将要提交的精确请求
      </div>
    </el-card>

    <el-card v-if="logs.length" class="log-card">
      <template #header>
        <div class="card-header">
          <span>还原日志</span>
          <el-button type="default" size="small" @click="logs = []">清空</el-button>
        </div>
      </template>
      <div class="log-content">
        <div v-for="(item, i) in logs" :key="i" :class="['log-line', `log-${item.type}`]">
          <span class="log-mark">{{ mark(item.type) }}</span>
          <span class="log-text">{{ item.msg }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

interface LogItem {
  type: 'step' | 'ok' | 'warn' | 'err' | 'info'
  msg: string
}

interface KvRequest {
  db_name: string
  operation: string
  op_mode: string
  key: string
  value: string
}

const sourcePath = ref('')
const productBase = ref('')
const minioBase = ref('C:/minio/deepiresults')
const mappingBase = ref('')
const serverUrl = ref('http://localhost:9877')
const submitKv = ref(true)
const loading = ref(false)
const logs = ref<LogItem[]>([])
const previewing = ref(false)
const previewSn = ref('')
const previewKv = ref<KvRequest[]>([])

// 默认值: 料号基准 = %APPDATA%\watcher\config\productSerial, 前道基准 = Documents\mapping
onMounted(async () => {
  try {
    const res = await window.api.getAppConfigPath()
    if (res.success && res.configPath) {
      productBase.value = `${res.configPath}\\config\\productSerial`
    }
  } catch {
    /* 忽略, 使用默认 */
  }
  try {
    const r = await window.api.getHomeDir()
    if (r.homeDir) {
      mappingBase.value = `${r.homeDir}\\Documents\\mapping`
    }
  } catch {
    /* 忽略, 使用默认 */
  }
})

const handleSelectSource = async () => {
  const res = await window.api.selectRestoreSource()
  if (res.canceled) return
  if (res.error) {
    ElMessage({ message: `选择失败: ${res.error}`, type: 'error', offset: 80 })
    return
  }
  sourcePath.value = res.path || ''
  previewKv.value = []
  previewSn.value = ''
  // 选中后自动预览请求概要
  handlePreview()
}

// 预览: 解析备份, 返回将要提交的 KV 请求 (不执行任何写入)
const handlePreview = async () => {
  if (!sourcePath.value || previewing.value) return
  previewing.value = true
  previewKv.value = []
  previewSn.value = ''
  try {
    const res = await window.api.previewRestoreKv({
      sourcePath: sourcePath.value,
      minioBase: minioBase.value,
    })
    if (res.success) {
      previewSn.value = res.sn || ''
      previewKv.value = res.kv || []
      if (!previewKv.value.length) {
        ElMessage({ message: '预览完成: 备份中没有可提交的 KV 数据', type: 'warning', offset: 80 })
      }
    } else {
      ElMessage({ message: `预览失败: ${res.error || '未知错误'}`, type: 'error', offset: 80 })
    }
  } catch (e) {
    ElMessage({ message: `预览异常: ${e}`, type: 'error', offset: 80 })
  } finally {
    previewing.value = false
  }
}

const browse = async (key: 'productBase' | 'minioBase' | 'mappingBase') => {
  const res = await window.api.selectDirPath()
  if (res.canceled || res.error) return
  if (res.path) {
    if (key === 'productBase') productBase.value = res.path
    else if (key === 'minioBase') minioBase.value = res.path
    else mappingBase.value = res.path
  }
}

const mark = (type: string) => {
  const map: Record<string, string> = {
    step: '▶',
    ok: '✓',
    warn: '⚠',
    err: '✗',
    info: '·',
  }
  return map[type] || '·'
}

const handleRestore = async () => {
  if (!sourcePath.value) return
  loading.value = true
  logs.value = []
  try {
    const res = await window.api.restoreBackup({
      sourcePath: sourcePath.value,
      productBase: productBase.value,
      minioBase: minioBase.value,
      mappingBase: mappingBase.value,
      serverUrl: serverUrl.value,
      submitKv: submitKv.value,
    })
    logs.value = res.logs || []
    if (res.success) {
      ElMessage({ message: '还原完成', type: 'success', offset: 80 })
    } else {
      ElMessage({ message: `还原失败: ${res.error || '未知错误'}`, type: 'error', offset: 80 })
    }
  } catch (e) {
    logs.value.push({ type: 'err', msg: `还原异常: ${e}` })
    ElMessage({ message: `还原异常: ${e}`, type: 'error', offset: 80 })
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  sourcePath.value = ''
  logs.value = []
  previewKv.value = []
  previewSn.value = ''
}
</script>

<style scoped>
.page h2 {
  color: #409eff;
  margin-bottom: 10px;
}

.desc {
  color: #666;
  font-size: 13px;
  margin-bottom: 20px;
}

.form-card {
  max-width: 900px;
  margin-bottom: 20px;
}

.source-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.source-path {
  color: #409eff;
  font-size: 13px;
  word-break: break-all;
}

.browse-btn {
  margin-left: 10px;
}

.http-card {
  max-width: 900px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.http-summary {
  font-size: 13px;
  color: #555;
}

.summary-line {
  margin-bottom: 6px;
  line-height: 1.6;
}

.summary-static {
  padding-left: 8px;
}

.summary-empty {
  color: #909399;
}

.summary-tag {
  display: inline-block;
  background-color: #f56c6c;
  color: #fff;
  border-radius: 3px;
  font-size: 11px;
  padding: 1px 6px;
  margin-right: 4px;
  font-weight: bold;
}

.preview-sn {
  margin: 10px 0 6px;
  font-size: 13px;
  color: #409eff;
}

.preview-code {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-card {
  max-width: 900px;
}

.log-content {
  max-height: 400px;
  overflow: auto;
  background-color: #1e1e1e;
  border-radius: 4px;
  padding: 12px;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  line-height: 1.6;
}

.log-line {
  white-space: pre-wrap;
  word-break: break-all;
}

.log-step {
  color: #e6a23c;
  font-weight: bold;
  margin-top: 6px;
}

.log-ok {
  color: #67c23a;
}

.log-warn {
  color: #e6a23c;
}

.log-err {
  color: #f56c6c;
}

.log-info {
  color: #909399;
}

.log-mark {
  display: inline-block;
  width: 16px;
}
</style>
