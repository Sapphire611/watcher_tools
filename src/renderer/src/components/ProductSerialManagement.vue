<template>
  <div class="page">
    <h2>料号管理</h2>

    <el-card class="upload-card">
      <div class="upload-section">
        <div class="upload-info">
          <p>上传料号文件夹，需包含以下文件：</p>
          <ul>
            <li><code>{料号}.json</code></li>
            <li><code>{料号}_A.json</code> 和 <code>{料号}_A.png</code></li>
            <li><code>{料号}_B.json</code> 和 <code>{料号}_B.png</code></li>
            <li><code>productInfo.json</code></li>
          </ul>
        </div>
        <el-button
          type="primary"
          @click="handleUploadProductSerial"
          :loading="uploading"
        >
          上传料号
        </el-button>
      </div>
    </el-card>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      style="max-width: 800px; margin-top: 12px"
    >
      <template #title>
        上传后，首次选择该料号可能会有异常，此时需要重启 VRS,
        在管理后台进行料号上传则不用重启。
      </template>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const uploading = ref(false)

const handleUploadProductSerial = async () => {
  uploading.value = true
  try {
    const result = await window.api.uploadProductSerial()
    if (result.success) {
      ElMessage({
        message: `料号 ${result.folderName} 上传成功`,
        type: 'success',
        offset: 80,
        duration: 3000,
      })
    } else {
      ElMessage({
        message: result.error || '上传失败',
        type: 'error',
        offset: 80,
        duration: 5000,
      })
    }
  } catch (error) {
    ElMessage({
      message: '上传料号失败',
      type: 'error',
      offset: 80,
    })
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.page h2 {
  color: #409eff;
  margin-bottom: 15px;
}

.upload-card {
  max-width: 800px;
}

.upload-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.upload-info {
  flex: 1;
}

.upload-info p {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #606266;
}

.upload-info ul {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.upload-info li {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.upload-info code {
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #303133;
}
</style>
