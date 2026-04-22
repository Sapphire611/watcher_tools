<template>
  <div class="home-container">
    <h1>VRS 服务状态监控</h1>

    <el-card class="status-card">
      <template #header>
        <div class="card-header">
          <span>服务状态</span>
          <el-button
            type="primary"
            size="small"
            @click="checkAllServices"
            :loading="checking"
          >
            刷新状态
          </el-button>
        </div>
      </template>

      <div class="services-list">
        <div
          v-for="service in services"
          :key="service.name"
          class="service-item"
        >
          <div class="service-info">
            <div
              class="status-indicator"
              :class="{
                online: service.checked && service.status,
                offline: service.checked && !service.status && !service.optional,
                warning: service.checked && !service.status && service.optional,
                pending: !service.checked,
              }"
            ></div>
            <div class="service-details">
              <div class="service-name">
                {{ service.name }}
                <el-tag v-if="service.optional" size="small" type="info"
                  >可选</el-tag
                >
              </div>
              <div class="service-url">{{ service.url }}</div>
              <div
                v-if="service.name === 'MinIO 服务' && service.status"
                class="minio-bucket-info"
              >
                <span v-if="minioBucketStatus.checking" class="bucket-checking">
                  检查 Bucket...
                </span>
                <span
                  v-else-if="minioBucketStatus.checked && minioBucketStatus.exists"
                  class="bucket-status"
                >
                  ✓ Bucket: {{ minioConfig.bucketName }} | 存储:
                  {{ minioConfig.dataPath }}
                </span>
                <span
                  v-else-if="minioBucketStatus.checked && !minioBucketStatus.exists"
                  class="bucket-status bucket-error"
                >
                  ✗ Bucket 不存在: {{ minioConfig.bucketName }}
                </span>
              </div>
            </div>
          </div>
          <el-tag
            :type="
              !service.checked
                ? 'info'
                : service.status
                  ? 'success'
                  : service.optional
                    ? 'warning'
                    : 'danger'
            "
          >
            {{
              !service.checked
                ? '检查中...'
                : service.status
                  ? '正常'
                  : service.optional
                    ? '未启动'
                    : '异常'
            }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Service {
  name: string
  url: string
  status: boolean
  checked: boolean
  optional?: boolean
  type: 'http' | 'tcp'
  host?: string
  port?: number
}

const checking = ref(false)
const services = ref<Service[]>([
  {
    name: 'AVI 后台服务',
    url: 'http://localhost:9877',
    status: false,
    checked: false,
    type: 'http',
  },
  {
    name: 'MinIO 服务',
    url: 'http://localhost:9102',
    status: false,
    checked: false,
    type: 'http',
  },
  {
    name: 'MongoDB 服务',
    url: 'localhost:27017',
    status: false,
    checked: false,
    type: 'tcp',
    host: 'localhost',
    port: 27017,
  },
  {
    name: 'FileStash 服务',
    url: 'http://localhost:8334',
    status: false,
    checked: false,
    optional: true,
    type: 'http',
  },
])

// MinIO 配置（根据实际服务配置）
const minioConfig = ref({
  endpoint: 'http://localhost:9102',
  accessKey: 'deepiobjectdata',
  secretKey: 'deepiobject2019',
  bucketName: 'deepiresults',
  dataPath: 'C:\\',
})

const minioBucketStatus = ref({
  checking: false,
  checked: false,
  exists: false,
  error: '',
})

const checkService = async (service: Service): Promise<boolean> => {
  try {
    if (service.type === 'tcp' && service.host && service.port) {
      return await window.api.checkTcpPort(service.host, service.port)
    } else {
      const response = await fetch(service.url, {
        method: 'GET',
        mode: 'no-cors',
      })
      return true
    }
  } catch (error) {
    return false
  }
}

const loadMinioConfig = async () => {
  minioBucketStatus.value.checking = true
  minioBucketStatus.value.checked = false
  try {
    const config = await window.api.getMinioConfig(minioConfig.value.bucketName)
    if (config.success) {
      if (config.dataPath) {
        minioConfig.value.dataPath = config.dataPath
      }
      minioBucketStatus.value.exists = config.bucketExists ?? false
      minioBucketStatus.value.checked = true
    } else {
      minioBucketStatus.value.error = config.error || '读取配置失败'
      minioBucketStatus.value.checked = true
    }
  } catch (error) {
    minioBucketStatus.value.error = String(error)
    minioBucketStatus.value.checked = true
  } finally {
    minioBucketStatus.value.checking = false
  }
}

const checkAllServices = async () => {
  checking.value = true

  // 重置所有服务为未检查状态
  services.value.forEach((s) => {
    s.checked = false
  })

  for (const service of services.value) {
    service.status = await checkService(service)
    service.checked = true
  }
  checking.value = false

  // 如果 MinIO 服务正常，加载配置并检查 bucket
  const minioService = services.value.find((s) => s.name === 'MinIO 服务')
  if (minioService?.status) {
    await loadMinioConfig()
  }
}

onMounted(() => {
  checkAllServices()
})
</script>

<style scoped>
.home-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  color: #409eff;
  margin-bottom: 20px;
}

.status-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.service-item:hover {
  background-color: #ecf5ff;
}

.service-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s;
}

.status-indicator.online {
  background-color: #67c23a;
  box-shadow: 0 0 8px rgba(103, 194, 58, 0.6);
}

.status-indicator.offline {
  background-color: #f56c6c;
  box-shadow: 0 0 8px rgba(245, 108, 108, 0.6);
}

.status-indicator.warning {
  background-color: #e6a23c;
  box-shadow: 0 0 8px rgba(230, 162, 60, 0.6);
}

.status-indicator.pending {
  background-color: #909399;
  box-shadow: 0 0 8px rgba(144, 147, 153, 0.4);
}

.service-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.service-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.service-url {
  font-size: 13px;
  color: #909399;
  font-family: 'Consolas', 'Monaco', monospace;
}

.minio-bucket-info {
  margin-top: 6px;
  font-size: 13px;
}

.bucket-checking {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
}

.bucket-status {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
}

.bucket-status.bucket-error {
  color: #f56c6c;
}
</style>
