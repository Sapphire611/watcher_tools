<template>
  <div class="settings-container">
    <el-card class="config-card">
      <div class="config-row">
        <div class="config-path">
          <span class="path-label">本地配置路径：</span>
          <code>{{ configPath || '加载中...' }}</code>
        </div>
        <el-button type="primary" size="small" @click="handleOpenFolder">
          打开文件夹
        </el-button>
      </div>
    </el-card>

    <el-card class="mes-card">
      <div class="config-row">
        <div class="config-path">
          <span class="path-label">当前 MES 类型：</span>
          <el-select
            v-model="currentMesType"
            placeholder="请选择 MES 类型"
            style="width: 300px"
            :loading="loadingMesTypes"
          >
            <el-option
              v-for="type in mesTypes"
              :key="type"
              :label="type"
              :value="type"
            />
          </el-select>
        </div>
        <el-button
          type="primary"
          size="small"
          :disabled="!currentMesType"
          :loading="applyingMesType"
          @click="handleMesTypeChange(currentMesType)"
        >
          确定
        </el-button>
      </div>
    </el-card>

    <el-card class="preset-card">
      <template #header>
        <div class="card-header">
          <span>预设缺陷列表配置</span>
          <el-button
            style="margin-left: 10px"
            size="small"
            @click="loadPresetConfigs"
            :loading="loadingPresets"
          >
            刷新列表
          </el-button>
        </div>
      </template>

      <div
        v-if="presetConfigs.defectList && presetConfigs.defectList.length > 0"
        class="config-group"
      >
        <div class="group-title">缺陷列表 (defectList)</div>
        <div class="config-grid">
          <div
            v-for="file in presetConfigs.defectList"
            :key="file"
            class="config-tile"
            :class="{ active: isActiveConfig('defectList', file) }"
            @click="handleApplyConfig('defectList', file)"
          >
            <div class="tile-icon-wrap">
              <svg
                class="tile-icon"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0 0 42 42h216v494z"
                  fill="currentColor"
                />
              </svg>
              <svg
                v-if="isActiveConfig('defectList', file)"
                class="tile-check"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="512" cy="512" r="512" fill="#67c23a" />
                <path
                  d="M432 664L256 488l48-48 128 128 304-304 48 48z"
                  fill="#fff"
                />
              </svg>
            </div>
            <div class="tile-name" :title="file">{{ file }}</div>
          </div>
        </div>
      </div>

      <div
        v-if="presetConfigs.defectTable && presetConfigs.defectTable.length > 0"
        class="config-group"
      >
        <div class="group-title">缺陷表格 (defectTable)</div>
        <div class="config-grid">
          <div
            v-for="file in presetConfigs.defectTable"
            :key="file"
            class="config-tile"
            :class="{ active: isActiveConfig('defectTable', file) }"
            @click="handleApplyConfig('defectTable', file)"
          >
            <div class="tile-icon-wrap">
              <svg
                class="tile-icon"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0 0 42 42h216v494z"
                  fill="currentColor"
                />
              </svg>
              <svg
                v-if="isActiveConfig('defectTable', file)"
                class="tile-check"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="512" cy="512" r="512" fill="#67c23a" />
                <path
                  d="M432 664L256 488l48-48 128 128 304-304 48 48z"
                  fill="#fff"
                />
              </svg>
            </div>
            <div class="tile-name" :title="file">{{ file }}</div>
          </div>
        </div>
      </div>

      <div
        v-if="!presetConfigs.defectList && !presetConfigs.defectTable"
        class="empty-state"
      >
        暂无预设配置文件
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const configPath = ref('')
const loading = ref(false)
const loadingPresets = ref(false)
const applyingConfig = ref('')
const presetConfigs = ref<{ [key: string]: string[] }>({})

// MES 类型相关
const mesTypes = ref<string[]>([])
const currentMesType = ref('')
const loadingMesTypes = ref(false)
const applyingMesType = ref(false)

// 从 localStorage 读取已应用的配置
const activeConfigs = ref<{ [key: string]: string }>({})

const loadActiveConfigs = () => {
  try {
    const saved = localStorage.getItem('activePresetConfigs')
    if (saved) {
      activeConfigs.value = JSON.parse(saved)
    }
  } catch {
    // ignore
  }
}

const saveActiveConfig = (type: string, fileName: string) => {
  activeConfigs.value[type] = fileName
  localStorage.setItem('activePresetConfigs', JSON.stringify(activeConfigs.value))
}

const isActiveConfig = (type: string, fileName: string): boolean => {
  return activeConfigs.value[type] === fileName
}

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
    await window.api.openConfigFolder()
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

const loadPresetConfigs = async () => {
  loadingPresets.value = true
  try {
    const result = await window.api.getPresetConfigs()
    if (result.success && result.configs) {
      presetConfigs.value = result.configs
    } else {
      ElMessage({
        message: result.error || '加载预设配置失败',
        type: 'error',
        offset: 80,
      })
    }
  } catch (error) {
    ElMessage({
      message: '加载预设配置失败',
      type: 'error',
      offset: 80,
    })
  } finally {
    loadingPresets.value = false
  }
}

const handleApplyConfig = async (type: string, fileName: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要应用 ${fileName} 吗？当前配置将被备份为 _old 文件。`,
      '确认应用',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch {
    return
  }

  applyingConfig.value = fileName
  try {
    const result = await window.api.applyPresetConfig(fileName)
    if (result.success) {
      saveActiveConfig(type, fileName)
      ElMessage({
        message: `已应用配置: ${result.appliedFile}`,
        type: 'success',
        offset: 80,
        duration: 3000,
      })
    } else {
      ElMessage({
        message: result.error || '应用配置失败',
        type: 'error',
        offset: 80,
        duration: 5000,
      })
    }
  } catch (error) {
    ElMessage({
      message: '应用配置失败',
      type: 'error',
      offset: 80,
    })
  } finally {
    applyingConfig.value = ''
  }
}

const loadMesTypes = async () => {
  loadingMesTypes.value = true
  try {
    const result = await window.api.getMesTypes()
    if (result.success) {
      mesTypes.value = result.mesTypes || []
      currentMesType.value = result.currentMesType || ''
    }
  } catch (error) {
    console.error('[loadMesTypes]', error)
  } finally {
    loadingMesTypes.value = false
  }
}

const handleMesTypeChange = async (mesType: string) => {
  applyingMesType.value = true
  try {
    const result = await window.api.applyMesType(mesType)
    if (result.success) {
      ElMessage({
        message: `已应用 MES 类型: ${mesType}`,
        type: 'success',
        offset: 80,
        duration: 3000,
      })
    } else {
      ElMessage({
        message: result.error || '应用 MES 类型失败',
        type: 'error',
        offset: 80,
        duration: 5000,
      })
    }
  } catch (error) {
    ElMessage({
      message: '应用 MES 类型失败',
      type: 'error',
      offset: 80,
    })
  } finally {
    applyingMesType.value = false
  }
}

onMounted(() => {
  loadActiveConfigs()
  loadConfigPath()
  loadPresetConfigs()
  loadMesTypes()
})
</script>

<style scoped>
.settings-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.config-card {
  margin-bottom: 20px;
}

.mes-card {
  margin-bottom: 20px;
}

.mes-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.config-path {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.path-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.config-path code {
  background-color: #f5f7fa;
  padding: 6px 12px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preset-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: 500;
  font-size: 16px;
}

.config-group {
  margin-bottom: 24px;
}

.config-group:last-child {
  margin-bottom: 0;
}

.group-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.config-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.config-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100px;
  padding: 12px 8px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.config-tile:hover {
  background-color: #ecf5ff;
}

.config-tile.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.tile-icon-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
}

.tile-icon {
  width: 48px;
  height: 48px;
  color: #909399;
}

.config-tile.active .tile-icon {
  color: #409eff;
}

.tile-check {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 18px;
  height: 18px;
}

.tile-name {
  font-size: 12px;
  color: #606266;
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
  max-width: 100px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border: 2px solid transparent;
  transition: all 0.3s;
}

.config-item:hover {
  background-color: #ecf5ff;
}

.config-item.active {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.config-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-icon {
  width: 20px;
  height: 20px;
  color: #909399;
  flex-shrink: 0;
}

.config-item.active .config-icon {
  color: #409eff;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: #67c23a;
  flex-shrink: 0;
}

.config-name {
  font-size: 13px;
  color: #606266;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
}
</style>
