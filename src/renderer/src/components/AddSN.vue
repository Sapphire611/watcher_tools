<template>
  <div class="add-sn-page">
    <h2>添加SN</h2>

    <div>
      先将料号放入 productSerial
      文件夹,数据包放入本地minio目录中,然后点击添加数据
    </div>

    <el-tag type="danger">会自动将斜杠替换为正斜杠</el-tag>
    <el-card class="code-card">
      <template #header>
        <div class="card-header">
          <el-tag type="warning">POST</el-tag>http://localhost:9877(请求示例)

          <el-button type="default" @click="copyExampleCode">复制</el-button>
        </div>
      </template>
      <pre class="code-content">{{ exampleCode }}</pre>
    </el-card>

    <el-card class="form-card">
      <el-form :model="addSnStore" label-width="120px">
        <el-form-item label="服务器地址">
          <el-input
            v-model="addSnStore.serverUrl"
            placeholder="http://localhost:9877"
            clearable
          />
        </el-form-item>

        <el-form-item label="A面地址">
          <el-input
            v-model="addSnStore.sideA"
            placeholder="C:/minio/deepiresults/20250722/20250722183901786010/20250722183901786010-panel.json"
            clearable
          />
        </el-form-item>

        <el-form-item label="B面地址">
          <el-input
            v-model="addSnStore.sideB"
            placeholder="C:/minio/deepiresults/20250722/20250722184021494443/20250722184021494443-panel.json"
            clearable
          />
        </el-form-item>

        <el-form-item label="SN">
          <el-input
            v-model="addSnStore.sn"
            placeholder="请输入SN号"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            添加数据
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="addSnStore.responseResult" class="result-card">
      <template #header>
        <div class="card-header">
          <span>接口返回结果</span>
          <el-button type="default" @click="addSnStore.responseResult = ''"
            >清除</el-button
          >
        </div>
      </template>
      <pre class="result-content">{{ addSnStore.responseResult }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAddSnStore } from '../stores/dataMaintenance'

const addSnStore = useAddSnStore()
const loading = ref(false)

// 示例源代码
const exampleCode = `{
  "db_name": "AVI_results_db",
  "operation": "put",
  "op_mode": "all_ow",
  "key": "200138069 0001",
  "value": "{\"side_infos\":{\"A\":\"C:/minio/deepiresults/20250722/20250722183901786010/20250722183901786010-panel.json\",\"B\":\"C:/minio/deepiresults/20250722/20250722184021494443/20250722184021494443-panel.json\"},\"sn\":\"20250722183901786010\"}"
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

const handleSubmit = async () => {
  // 验证表单
  if (!addSnStore.sideA || !addSnStore.sn || !addSnStore.serverUrl) {
    ElMessage({
      message: '请填写所有必填项',
      type: 'warning',
      offset: 80,
    })
    return
  }

  loading.value = true

  try {
    // 处理路径分隔符：将 \ 和 \\ 替换为 /
    const processedSideA = addSnStore.sideA.replace(/\\/g, '/')
    const processedSideB = addSnStore.sideB.replace(/\\/g, '/')

    // 构建请求对象
    const obj = {
      side_infos: {
        A: processedSideA,
        ...(addSnStore.sideB && { B: processedSideB }),
      },
      sn: addSnStore.sn,
    }

    const output = {
      db_name: 'AVI_results_db',
      operation: 'put',
      op_mode: 'all_ow',
      key: obj.sn,
      value: JSON.stringify(obj),
    }

    // 使用主进程的 HTTP 请求，避免跨域问题
    const result = await window.api.httpPost(addSnStore.serverUrl, output)

    if (result.success && result.data) {
      addSnStore.setResponseResult(JSON.stringify(result.data, null, 2))
      ElMessage({
        message: '数据提交成功',
        type: 'success',
        offset: 80,
      })
    } else {
      addSnStore.setResponseResult(`请求失败: ${result.error || '未知错误'}`)
      ElMessage({
        message: '数据提交失败',
        type: 'error',
        offset: 80,
      })
    }
  } catch (error) {
    console.error('请求失败:', error)
    addSnStore.setResponseResult(`请求失败: ${error}`)
    ElMessage({
      message: '数据提交失败',
      type: 'error',
      offset: 80,
    })
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  addSnStore.clear()
}
</script>

<style scoped>
.add-sn-page h2 {
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
  font-size: 14px;
  line-height: 1.5;
}
</style>
