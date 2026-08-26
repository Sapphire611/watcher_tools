<template>
  <div class="add-sn-minio-page">
    <h2>添加SN（新版minio版本）</h2>

    <div class="tips">
      <p>1. 填写 SN 号，选择 A/B 面 JSON 与图包，点击「添加数据」。</p>
      <p>
        2. 程序将 JSON 复制到 <code>minio基础路径/[SN]/[A|B]/</code>，并读取
        <code>pcs_info[1].defect_info</code> 的 <code>defect_origin_images</code>
        创建目录存放图包（到 .zip 所在文件夹为止）。
      </p>
      <p>3. 最后以 minio://deepiresults/[SN]/[A|B]/xxx.json 写入 AVI_results_db。</p>
    </div>

    <el-card class="form-card">
      <el-form :model="store" label-width="140px">
        <el-form-item label="SN号" required>
          <el-input v-model="store.sn" placeholder="例如: 0120260823150058258" clearable />
        </el-form-item>

        <el-form-item label="minio基础路径">
          <el-input v-model="store.minioBase" clearable />
        </el-form-item>

        <el-form-item label="A面JSON" required>
          <div class="path-row">
            <el-input v-model="store.sideAJson" placeholder="选择 A 面 panel JSON" clearable />
            <el-button @click="pickFile('sideAJson')">选择文件</el-button>
          </div>
        </el-form-item>

        <el-form-item label="A面图包">
          <div class="path-row">
            <el-input v-model="store.sideAZip" placeholder="选择 A 面图包 zip" clearable />
            <el-button @click="pickFile('sideAZip')">选择文件</el-button>
          </div>
        </el-form-item>

        <el-form-item label="B面JSON" required>
          <div class="path-row">
            <el-input v-model="store.sideBJson" placeholder="选择 B 面 panel JSON" clearable />
            <el-button @click="pickFile('sideBJson')">选择文件</el-button>
          </div>
        </el-form-item>

        <el-form-item label="B面图包">
          <div class="path-row">
            <el-input v-model="store.sideBZip" placeholder="选择 B 面图包 zip" clearable />
            <el-button @click="pickFile('sideBZip')">选择文件</el-button>
          </div>
        </el-form-item>

        <el-form-item label="机台号">
          <el-input v-model="store.machineName" placeholder="例如: M01" clearable />
        </el-form-item>

        <el-form-item label="服务器地址">
          <el-input v-model="store.serverUrl" placeholder="http://localhost:9877" clearable />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            添加数据
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="logs.length" class="result-card">
      <template #header>
        <div class="card-header">
          <span>处理日志</span>
          <el-button type="default" @click="logs = []">清除</el-button>
        </div>
      </template>
      <pre class="result-content">{{ logs.join('\n') }}</pre>
    </el-card>

    <el-card v-if="store.responseResult" class="result-card">
      <template #header>
        <div class="card-header">
          <span>接口返回结果</span>
          <el-button type="default" @click="store.setResponseResult('')">清除</el-button>
        </div>
      </template>
      <pre class="result-content">{{ store.responseResult }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAddSnMinioStore } from '../stores/dataMaintenance'

const store = useAddSnMinioStore()
const loading = ref(false)
const logs = ref<string[]>([])

type Field = 'sideAJson' | 'sideAZip' | 'sideBJson' | 'sideBZip'

const pickFile = async (field: Field) => {
  const result = await window.api.selectFilePath()
  if (result.canceled) return
  if (result.error) {
    ElMessage({ message: `选择失败: ${result.error}`, type: 'error', offset: 80 })
    return
  }
  if (result.filePath) {
    store[field] = result.filePath
  }
}

const handleSubmit = async () => {
  if (!store.sn || !store.sideAJson || !store.sideBJson) {
    ElMessage({ message: '请填写 SN 号及 A/B 面 JSON', type: 'warning', offset: 80 })
    return
  }
  if (!store.minioBase) {
    ElMessage({ message: '请填写 minio 基础路径', type: 'warning', offset: 80 })
    return
  }

  loading.value = true
  logs.value = []

  try {
    // 步骤2、3: 复制 JSON 与图包到新版 minio 目录
    const result = await window.api.addSnNewMinio({
      sn: store.sn,
      minioBase: store.minioBase,
      sideA: { jsonPath: store.sideAJson, zipPath: store.sideAZip },
      sideB: { jsonPath: store.sideBJson, zipPath: store.sideBZip },
    })
    logs.value = result.logs || []

    if (!result.success || !result.minioUrls) {
      ElMessage({
        message: `文件处理失败: ${result.error || '未知错误'}`,
        type: 'error',
        offset: 80,
      })
      return
    }

    // 步骤1: 以 minio:// 路径写入 AVI_results_db
    const obj = {
      side_infos: {
        A: result.minioUrls.A,
        B: result.minioUrls.B,
      },
      sn: store.sn,
      machineName: store.machineName,
    }
    const output = {
      db_name: 'AVI_results_db',
      operation: 'put',
      op_mode: 'all_ow',
      key: obj.sn,
      value: JSON.stringify(obj),
    }

    logs.value.push('提交 AVI_results_db ...')
    const httpResult = await window.api.httpPost(store.serverUrl, output)
    if (httpResult.success && httpResult.data) {
      store.setResponseResult(JSON.stringify(httpResult.data, null, 2))
      logs.value.push('数据库提交成功')
      ElMessage({ message: '数据提交成功', type: 'success', offset: 80 })
    } else {
      logs.value.push(`数据库提交失败: ${httpResult.error || '未知错误'}`)
      ElMessage({ message: '数据提交失败', type: 'error', offset: 80 })
    }
  } catch (error) {
    logs.value.push(`错误: ${error}`)
    ElMessage({ message: `操作失败: ${error}`, type: 'error', offset: 80 })
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  store.clear()
  logs.value = []
}
</script>

<style scoped>
.add-sn-minio-page h2 {
  color: #409eff;
  margin-bottom: 15px;
}

.tips {
  color: #606266;
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 20px;
}

.tips p {
  margin: 0;
}

.tips code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: #c7254e;
}

.form-card {
  margin-top: 20px;
  max-width: 800px;
}

.path-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.path-row .el-input {
  flex: 1;
}

.result-card {
  margin-top: 20px;
  max-width: 800px;
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
  font-size: 13px;
  line-height: 1.5;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: #333;
}
</style>
