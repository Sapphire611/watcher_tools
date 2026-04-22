<template>
  <div class="settings-container">
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>本地配置文件夹</span>
        </div>
      </template>

      <div class="config-info">
        <div class="info-item">
          <div class="info-label">配置路径：</div>
          <div class="info-value">
            <code>{{ configPath || '加载中...' }}</code>
          </div>
        </div>

        <div class="button-group">
          <el-button type="primary" @click="handleOpenFolder">
            打开配置文件夹
          </el-button>
          <el-button @click="handleRefresh" :loading="loading">
            刷新路径
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const configPath = ref('')
const loading = ref(false)

const loadConfigPath = async () => {
  loading.value = true
  try {
    const result = await window.api.getAppConfigPath()
    if (result.success) {
      configPath.value = result.configPath
    }
  } catch (error) {
    ElMessage({
      message: '获取配置路径失败',
      type: 'error',
      offset: 80,
    })
  } finally {
    loading.value = false
  }
}

const handleOpenFolder = async () => {
  try {
    const result = await window.api.openConfigFolder()
    if (result.success) {
      ElMessage({
        message: '已打开配置文件夹',
        type: 'success',
        offset: 80,
      })
    } else {
      ElMessage({
        message: `打开失败: ${result.error}`,
        type: 'error',
        offset: 80,
      })
    }
  } catch (error) {
    ElMessage({
      message: '打开配置文件夹失败',
      type: 'error',
      offset: 80,
    })
  }
}

const handleRefresh = () => {
  loadConfigPath()
}

onMounted(() => {
  loadConfigPath()
})
</script>

<style scoped>
.settings-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #409eff;
  margin-bottom: 20px;
}

.config-card {
  margin-top: 20px;
}

.card-header {
  font-weight: 500;
  font-size: 16px;
}

.config-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #303133;
}

.info-value code {
  background-color: #f5f7fa;
  padding: 8px 12px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  display: inline-block;
  word-break: break-all;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}
</style>
