<template>
  <div class="page">
    <h2>查看 AI 详细结果</h2>

    根据 Key 查询 AI 详细过滤结果数据 (tovrs)

    <el-card class="code-card">
      <template #header>
        <div class="card-header">
          <el-tag type="warning">GET</el-tag>http://localhost:9877(请求示例)

          <el-button type="default" @click="copyExampleCode">复制</el-button>
        </div>
      </template>
      <pre class="code-content">{{ exampleCode }}</pre>
    </el-card>

    <el-card class="form-card">
      <el-form :model="store" label-width="120px">
        <el-form-item label="服务器地址">
          <el-input
            v-model="store.serverUrl"
            placeholder="http://localhost:9877"
            clearable
          />
        </el-form-item>

        <el-form-item label="Key">
          <el-input
            v-model="store.key"
            placeholder="例如: 261F90170800 2105_A"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleQuery" :loading="loading">
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button
            :disabled="!hasParsed"
            @click="resultDialogVisible = true"
          >
            编辑
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="store.responseResult" class="result-card">
      <template #header>
        <div class="card-header">
          <span>接口返回结果</span>
          <el-button type="default" @click="store.responseResult = ''"
            >清除</el-button
          >
        </div>
      </template>
      <pre class="result-content">{{ store.responseResult }}</pre>
    </el-card>

    <!-- 解析结果弹窗（点击行进入编辑弹窗） -->
    <el-dialog
      v-model="resultDialogVisible"
      :title="`解析结果（共 ${rows.length} 条，点击行编辑）`"
      width="90%"
      top="5vh"
    >
      <el-table
        :data="rows"
        border
        size="small"
        max-height="60vh"
        @row-click="openEditDialog"
      >
        <el-table-column type="index" label="#" width="50" fixed="left" />
        <el-table-column
          v-for="col in columns"
          :key="col"
          :label="col"
          min-width="110"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row[col] }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click.stop="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button
              link
              type="danger"
              size="small"
              @click.stop="handleDeleteRow(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button size="small" @click="handleAddRow">添加记录</el-button>
        <el-button
          size="small"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          保存修改
        </el-button>
        <el-button @click="resultDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`编辑记录 #${editingIndex + 1}`"
      width="560px"
      append-to-body
    >
      <el-form label-width="150px" label-position="left">
        <el-form-item v-for="col in columns" :key="col" :label="col">
          <div class="field-row">
            <el-input v-model="editingRow[col]" size="small" />
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDeleteColumnInDialog(col)"
              >删除字段</el-button
            >
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="handleAddFieldInDialog">
          添加字段
        </el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useViewAiDetailResultStore } from '../stores/dataMaintenance'

const store = useViewAiDetailResultStore()
const loading = ref(false)
const saving = ref(false)

// AI 详细结果固定字段（7 列）
const FIXED_FIELDS = [
  'pcs_index',
  'index',
  'ai_label',
  'defect_code',
  'mes_code',
  'auto_mark',
  'infer_detail',
]

// 解析后的原始数据（保存原始值类型，用于编辑后类型还原）
const parsed = ref<any[]>([])
// 表格编辑行（单元格值统一为字符串）
const rows = ref<Record<string, string>[]>([])
// 动态列（固定 7 列在前，数据中出现的其他字段追加在后）
const columns = ref<string[]>([])

const hasParsed = computed(() => rows.value.length > 0)

// 解析结果弹窗（点击「编辑」按钮打开）
const resultDialogVisible = ref(false)

// 编辑弹窗状态
const dialogVisible = ref(false)
const editingIndex = ref(-1)
const editingRow = ref<Record<string, string>>({})

// 示例源代码
const exampleCode = `{
  "db_name": "ai_detail_results_tovrs",
  "op_mode": "all",
  "operation": "get",
  "key": "261F90170800 2105_A"
}`

// 复制示例代码
const copyExampleCode = () => {
  navigator.clipboard
    .writeText(exampleCode)
    .then(() => {
      ElMessage({
        message: '复制成功',
        type: 'success',
        offset: 80,
      })
    })
    .catch(() => {
      ElMessage({
        message: '复制失败',
        type: 'error',
        offset: 80,
      })
    })
}

// 从接口响应中解析出可编辑的数组（兼容 value 为字符串或数组等多种格式）
function parseValue(data: any): any[] | null {
  try {
    let obj = data
    if (typeof obj === 'string') obj = JSON.parse(obj)
    if (Array.isArray(obj)) return obj
    let value = obj?.value
    if (typeof value === 'string') value = JSON.parse(value)
    if (Array.isArray(value)) return value
    return null
  } catch {
    return null
  }
}

// 值转显示字符串（对象/数组转 JSON 字符串）
function displayValue(v: any): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

// 编辑字符串按原始类型还原（布尔/数字/对象分别还原）
function convertType(orig: any, str: string): any {
  if (orig === null || orig === undefined) return str === '' ? '' : str
  if (typeof orig === 'boolean') return str === 'true'
  if (typeof orig === 'number') {
    if (str === '') return ''
    const n = Number(str)
    return Number.isNaN(n) ? str : n
  }
  if (typeof orig === 'object') {
    try {
      return JSON.parse(str)
    } catch {
      return str
    }
  }
  return str
}

function loadParsed(list: any[]) {
  // 深拷贝，避免编辑时污染原始响应
  parsed.value = list.map((item) => JSON.parse(JSON.stringify(item ?? {})))

  // 固定 7 列在前，再追加数据中出现的其他字段（保持首次出现顺序）
  const seen: string[] = []
  for (const f of FIXED_FIELDS) {
    if (!seen.includes(f)) seen.push(f)
  }
  for (const item of list) {
    for (const k of Object.keys(item ?? {})) {
      if (!seen.includes(k)) seen.push(k)
    }
  }
  columns.value = seen

  rows.value = list.map((item) => {
    const r: Record<string, string> = {}
    for (const col of columns.value) r[col] = displayValue(item?.[col])
    return r
  })
}

function clearParsed() {
  parsed.value = []
  rows.value = []
  columns.value = []
  resultDialogVisible.value = false
}

const handleQuery = async () => {
  // 验证表单
  if (!store.key || !store.serverUrl) {
    ElMessage({
      message: '请填写Key和服务器地址',
      type: 'warning',
      offset: 80,
    })
    return
  }

  loading.value = true

  try {
    // 构建查询请求对象
    const output = {
      db_name: 'ai_detail_results_tovrs',
      op_mode: 'all',
      operation: 'get',
      key: store.key,
    }

    // 使用主进程的 HTTP 请求，避免跨域问题
    const result = await window.api.httpPost(store.serverUrl, output)

    if (result.success && result.data) {
      store.setResponseResult(JSON.stringify(result.data, null, 2))
      const list = parseValue(result.data)
      if (list) {
        loadParsed(list)
        ElMessage({
          message: `查询成功，解析到 ${list.length} 条数据`,
          type: 'success',
          offset: 80,
        })
      } else {
        clearParsed()
        ElMessage({
          message: '查询成功，但未解析到可编辑数据',
          type: 'warning',
          offset: 80,
        })
      }
    } else {
      clearParsed()
      store.setResponseResult(`请求失败: ${result.error || '未知错误'}`)
      ElMessage({
        message: '查询失败',
        type: 'error',
        offset: 80,
      })
    }
  } catch (error) {
    console.error('请求失败:', error)
    clearParsed()
    store.setResponseResult(`请求失败: ${error}`)
    ElMessage({
      message: '查询失败',
      type: 'error',
      offset: 80,
    })
  } finally {
    loading.value = false
  }
}

// ==================== 表格行操作 ====================

// 打开编辑弹窗（拷贝当前行，确定后才生效）
const openEditDialog = (row: Record<string, string>) => {
  const index = rows.value.indexOf(row)
  if (index === -1) return
  editingIndex.value = index
  editingRow.value = JSON.parse(JSON.stringify(row))
  dialogVisible.value = true
}

// 确定：将弹窗修改合并回该行
const confirmEdit = () => {
  const idx = editingIndex.value
  if (idx >= 0) {
    for (const col of columns.value) {
      rows.value[idx][col] = editingRow.value[col] ?? ''
    }
  }
  dialogVisible.value = false
}

// 添加记录（空记录并打开编辑弹窗）
const handleAddRow = () => {
  const r: Record<string, string> = {}
  for (const col of columns.value) r[col] = ''
  rows.value.push(r)
  parsed.value.push({})
  openEditDialog(r)
}

// 删除记录
const handleDeleteRow = (row: Record<string, string>) => {
  const index = rows.value.indexOf(row)
  if (index === -1) return
  rows.value.splice(index, 1)
  parsed.value.splice(index, 1)
}

// ==================== 字段操作（作用于所有记录） ====================

const doAddField = (name: string) => {
  columns.value.push(name)
  for (const row of rows.value) row[name] = ''
}

const doDeleteField = (col: string) => {
  columns.value = columns.value.filter((c) => c !== col)
  for (const row of rows.value) delete row[col]
  for (const item of parsed.value) delete item[col]
}

// 弹窗内添加字段
const handleAddFieldInDialog = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请输入字段名称', '添加字段', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^\S+$/,
      inputErrorMessage: '字段名称不能为空',
    })
    const name = value.trim()
    if (columns.value.includes(name)) {
      ElMessage({
        message: `字段 ${name} 已存在`,
        type: 'warning',
        offset: 80,
      })
      return
    }
    doAddField(name)
    editingRow.value[name] = ''
  } catch {
    // 用户取消
  }
}

// 弹窗内删除字段
const handleDeleteColumnInDialog = (col: string) => {
  doDeleteField(col)
  delete editingRow.value[col]
}

// ==================== 保存 ====================

// 保存修改：按原始类型还原后写回
const handleSave = async () => {
  if (!store.key || !store.serverUrl) {
    ElMessage({
      message: '请填写Key和服务器地址',
      type: 'warning',
      offset: 80,
    })
    return
  }

  saving.value = true

  try {
    const list = rows.value.map((r, i) => {
      const item: any = {}
      for (const col of columns.value) {
        const orig = parsed.value[i]?.[col]
        item[col] = convertType(orig, r[col] ?? '')
      }
      return item
    })

    const output = {
      db_name: 'ai_detail_results_tovrs',
      operation: 'put',
      op_mode: 'all_ow',
      key: store.key,
      value: JSON.stringify(list),
    }

    const result = await window.api.httpPost(store.serverUrl, output)

    if (result.success) {
      store.setResponseResult(JSON.stringify(result.data, null, 2))
      ElMessage({
        message: '保存成功',
        type: 'success',
        offset: 80,
      })
      // 保存后重新查询，刷新数据
      await handleQuery()
    } else {
      store.setResponseResult(`保存失败: ${result.error || '未知错误'}`)
      ElMessage({
        message: '保存失败',
        type: 'error',
        offset: 80,
      })
    }
  } catch (error) {
    console.error('保存失败:', error)
    store.setResponseResult(`保存失败: ${error}`)
    ElMessage({
      message: '保存失败',
      type: 'error',
      offset: 80,
    })
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  store.clear()
  clearParsed()
}
</script>

<style scoped>
.page h2 {
  color: #409eff;
  margin-bottom: 15px;
}

.code-card {
  margin-top: 20px;
  margin-bottom: 20px;
  max-width: 800px;
}

.code-content {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #333;
}

.form-card {
  margin-top: 20px;
  margin-bottom: 20px;
  max-width: 800px;
}

.result-card {
  margin-top: 20px;
  max-width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-content {
  background-color: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.field-row .el-input {
  flex: 1;
}
</style>
