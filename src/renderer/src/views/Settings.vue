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

    <el-card class="folder-card">
      <template #header>
        <div class="card-header">
          <span>切换配置文件夹</span>
          <el-button
            style="margin-left: 10px"
            size="small"
            @click="loadConfigFolders"
            :loading="loadingFolders"
          >
            刷新列表
          </el-button>
        </div>
      </template>

      <div
        v-if="configFolders && configFolders.length > 0"
        class="config-group"
      >
        <div class="group-title">可用的配置文件夹</div>
        <div class="config-grid">
          <div
            v-for="folder in configFolders"
            :key="folder"
            class="config-tile"
            @click="handleSwitchFolder(folder)"
          >
            <div class="tile-icon-wrap">
              <svg
                class="tile-icon"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M880 298.4H521L403.7 186.2c-1.5-1.4-3.5-2.2-5.5-2.2H144c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V330.4c0-17.7-14.3-32-32-32zM840 768H184V256h188.5l119.6 114.4H840V768z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div class="tile-name" :title="folder">{{ folder }}</div>
          </div>
        </div>
      </div>

      <div
        v-if="!configFolders || configFolders.length === 0"
        class="empty-state"
      >
        暂无可切换的配置文件夹
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
const presetConfigs = ref<{ [key: string]: string[] }>({})

// 配置文件夹相关
const loadingFolders = ref(false)
const configFolders = ref<string[]>([])

// MES 类型相关
const mesTypes = ref<string[]>([])
const currentMesType = ref('')
const loadingMesTypes = ref(false)
const applyingMesType = ref(false)

// 记录最近使用的配置文件
const recentConfigs = ref<{ [key: string]: string[] }>({
  defectList: [],
  defectTable: []
})

// 记录最近使用的配置文件夹
const recentFolders = ref<string[]>([])

const loadRecentConfigs = () => {
  try {
    const saved = localStorage.getItem('recentPresetConfigs')
    if (saved) {
      recentConfigs.value = JSON.parse(saved)
    }
  } catch {
    // ignore
  }
}

const loadRecentFolders = () => {
  try {
    const saved = localStorage.getItem('recentConfigFolders')
    if (saved) {
      recentFolders.value = JSON.parse(saved)
    }
  } catch {
    // ignore
  }
}

const saveRecentConfig = (type: string, fileName: string) => {
  if (!recentConfigs.value[type]) {
    recentConfigs.value[type] = []
  }

  // 移除重复项
  recentConfigs.value[type] = recentConfigs.value[type].filter(f => f !== fileName)

  // 添加到开头
  recentConfigs.value[type].unshift(fileName)

  // 只保留最近两次
  recentConfigs.value[type] = recentConfigs.value[type].slice(0, 2)

  localStorage.setItem('recentPresetConfigs', JSON.stringify(recentConfigs.value))
}

const saveRecentFolder = (folderName: string) => {
  // 移除重复项
  recentFolders.value = recentFolders.value.filter(f => f !== folderName)

  // 添加到开头
  recentFolders.value.unshift(folderName)

  // 只保留最近两次
  recentFolders.value = recentFolders.value.slice(0, 2)

  localStorage.setItem('recentConfigFolders', JSON.stringify(recentFolders.value))
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
    // 提取当前文件名的后缀部分作为默认值
    const match = fileName.match(/^(defectList|defectTable)-(.+)\.json$/)
    const suffix = match ? match[2] : 'backup'
    const defaultBackupName = `${type}-${suffix}-backup`

    // 获取最近使用的配置
    const recentList = recentConfigs.value[type] || []

    // 构建 HTML 内容
    let htmlContent = `
      <div style="margin-bottom: 16px;">
        <div style="margin-bottom: 8px; color: #606266; font-size: 14px;">
          请输入备份文件的后缀名称：
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #909399; font-size: 14px; white-space: nowrap;">${type}-</span>
          <input
            id="backup-name-input"
            type="text"
            placeholder="例如：${suffix}-backup"
            style="
              flex: 1;
              padding: 8px 12px;
              border: 1px solid #dcdfe6;
              border-radius: 4px;
              font-size: 14px;
              outline: none;
              box-sizing: border-box;
            "
            onfocus="this.style.borderColor='#409eff'"
            onblur="this.style.borderColor='#dcdfe6'"
          />
        </div>
        <div style="margin-top: 4px; color: #909399; font-size: 12px;">
          完整文件名：${type}-<span id="preview-name">${suffix}-backup</span>.json
        </div>
      </div>
    `

    if (recentList.length > 0) {
      htmlContent += `
        <div style="margin-top: 16px;">
          <div style="margin-bottom: 8px; color: #909399; font-size: 13px;">
            最近使用的配置（点击快速填入后缀）：
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${recentList.map(recent => {
              const nameWithoutExt = recent.replace('.json', '')
              const suffixPart = nameWithoutExt.replace(`${type}-`, '')
              return `
                <button
                  class="recent-config-btn"
                  onclick="
                    var input = document.getElementById('backup-name-input');
                    var preview = document.getElementById('preview-name');
                    input.value='${suffixPart}';
                    preview.textContent='${suffixPart}';
                    input.focus();
                  "
                  style="
                    padding: 6px 12px;
                    border: 1px solid #dcdfe6;
                    border-radius: 4px;
                    background: #f5f7fa;
                    color: #606266;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                  "
                  onmouseover="this.style.borderColor='#409eff'; this.style.color='#409eff'; this.style.background='#ecf5ff';"
                  onmouseout="this.style.borderColor='#dcdfe6'; this.style.color='#606266'; this.style.background='#f5f7fa';"
                >
                  ${suffixPart}
                </button>
              `
            }).join('')}
          </div>
        </div>
      `
    }

    await ElMessageBox({
      title: '确认应用',
      message: htmlContent,
      dangerouslyUseHTMLString: true,
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          const input = document.getElementById('backup-name-input') as HTMLInputElement
          const value = input?.value?.trim()

          if (!value) {
            ElMessage({
              message: '请输入有效的备份文件名',
              type: 'warning',
              offset: 80,
            })
            return
          }

          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            ElMessage({
              message: '文件名只能包含字母、数字、下划线和横线',
              type: 'warning',
              offset: 80,
            })
            return
          }

          // 构建完整的备份文件名：type-用户输入
          const fullBackupName = `${type}-${value}`

          instance.confirmButtonLoading = true
          window.api.applyPresetConfig(fileName, fullBackupName)
            .then(res => {
              if (res.success) {
                saveRecentConfig(type, fileName)
                ElMessage({
                  message: `已应用配置: ${res.appliedFile}`,
                  type: 'success',
                  offset: 80,
                  duration: 3000,
                })
                loadPresetConfigs()
                done()
              } else {
                ElMessage({
                  message: res.error || '应用配置失败',
                  type: 'error',
                  offset: 80,
                  duration: 5000,
                })
                instance.confirmButtonLoading = false
              }
            })
            .catch(() => {
              ElMessage({
                message: '应用配置失败',
                type: 'error',
                offset: 80,
              })
              instance.confirmButtonLoading = false
            })
        } else {
          done()
        }
      }
    })

    // 在对话框打开后，设置默认值并添加输入监听
    setTimeout(() => {
      const input = document.getElementById('backup-name-input') as HTMLInputElement
      const preview = document.getElementById('preview-name') as HTMLElement
      if (input && preview) {
        input.value = `${suffix}-backup`

        // 监听输入变化，实时更新预览
        input.addEventListener('input', () => {
          preview.textContent = input.value || suffix
        })

        input.focus()
        input.select()
      }
    }, 100)

  } catch (error) {
    // 用户取消
  }
}

const loadConfigFolders = async () => {
  loadingFolders.value = true
  try {
    const result = await window.api.getConfigFolders()
    if (result.success && result.folders) {
      configFolders.value = result.folders
    } else {
      ElMessage({
        message: result.error || '加载配置文件夹失败',
        type: 'error',
        offset: 80,
      })
    }
  } catch (error) {
    ElMessage({
      message: '加载配置文件夹失败',
      type: 'error',
      offset: 80,
    })
  } finally {
    loadingFolders.value = false
  }
}

const handleSwitchFolder = async (folderName: string) => {
  try {
    // 提取文件夹名称的后缀部分作为默认值
    const suffix = folderName.replace('config-', '')
    const defaultBackupName = `${suffix}-backup`

    // 获取最近使用的文件夹
    const recentList = recentFolders.value || []

    // 构建 HTML 内容
    let htmlContent = `
      <div style="margin-bottom: 16px;">
        <div style="margin-bottom: 8px; color: #606266; font-size: 14px;">
          请输入当前配置文件夹的备份名称后缀：
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #909399; font-size: 14px; white-space: nowrap;">config-</span>
          <input
            id="folder-backup-input"
            type="text"
            placeholder="例如：${defaultBackupName}"
            style="
              flex: 1;
              padding: 8px 12px;
              border: 1px solid #dcdfe6;
              border-radius: 4px;
              font-size: 14px;
              outline: none;
              box-sizing: border-box;
            "
            onfocus="this.style.borderColor='#409eff'"
            onblur="this.style.borderColor='#dcdfe6'"
          />
        </div>
        <div style="margin-top: 4px; color: #909399; font-size: 12px;">
          完整文件夹名：config-<span id="folder-preview-name">${defaultBackupName}</span>
        </div>
      </div>
    `

    if (recentList.length > 0) {
      htmlContent += `
        <div style="margin-top: 16px;">
          <div style="margin-bottom: 8px; color: #909399; font-size: 13px;">
            最近使用的文件夹（点击快速填入后缀）：
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${recentList.map(recent => {
              const suffixPart = recent.replace('config-', '')
              return `
                <button
                  class="recent-folder-btn"
                  onclick="
                    var input = document.getElementById('folder-backup-input');
                    var preview = document.getElementById('folder-preview-name');
                    input.value='${suffixPart}';
                    preview.textContent='${suffixPart}';
                    input.focus();
                  "
                  style="
                    padding: 6px 12px;
                    border: 1px solid #dcdfe6;
                    border-radius: 4px;
                    background: #f5f7fa;
                    color: #606266;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                  "
                  onmouseover="this.style.borderColor='#409eff'; this.style.color='#409eff'; this.style.background='#ecf5ff';"
                  onmouseout="this.style.borderColor='#dcdfe6'; this.style.color='#606266'; this.style.background='#f5f7fa';"
                >
                  ${suffixPart}
                </button>
              `
            }).join('')}
          </div>
        </div>
      `
    }

    await ElMessageBox({
      title: '确认切换',
      message: htmlContent,
      dangerouslyUseHTMLString: true,
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          const input = document.getElementById('folder-backup-input') as HTMLInputElement
          const value = input?.value?.trim()

          if (!value) {
            ElMessage({
              message: '请输入有效的备份文件夹名称',
              type: 'warning',
              offset: 80,
            })
            return
          }

          if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
            ElMessage({
              message: '文件夹名只能包含字母、数字、下划线和横线',
              type: 'warning',
              offset: 80,
            })
            return
          }

          // 构建完整的备份文件夹名：config-用户输入
          const fullBackupName = `config-${value}`

          instance.confirmButtonLoading = true
          window.api.switchConfigFolder(folderName, fullBackupName)
            .then(res => {
              if (res.success) {
                saveRecentFolder(folderName)

                if (res.needRestart) {
                  ElMessageBox.alert(
                    '配置文件夹已切换成功，请重启应用以使更改生效。',
                    '需要重启',
                    {
                      confirmButtonText: '确定',
                      type: 'success',
                    }
                  ).then(() => {
                    loadConfigFolders()
                    done()
                  })
                } else {
                  ElMessage({
                    message: `已切换到配置文件夹: ${res.appliedFolder}`,
                    type: 'success',
                    offset: 80,
                    duration: 3000,
                  })
                  loadConfigFolders()
                  done()
                }
              } else {
                ElMessage({
                  message: res.error || '切换配置文件夹失败',
                  type: 'error',
                  offset: 80,
                  duration: 5000,
                })
                instance.confirmButtonLoading = false
              }
            })
            .catch(() => {
              ElMessage({
                message: '切换配置文件夹失败',
                type: 'error',
                offset: 80,
              })
              instance.confirmButtonLoading = false
            })
        } else {
          done()
        }
      }
    })

    // 在对话框打开后，设置默认值并添加输入监听
    setTimeout(() => {
      const input = document.getElementById('folder-backup-input') as HTMLInputElement
      const preview = document.getElementById('folder-preview-name') as HTMLElement
      if (input && preview) {
        input.value = defaultBackupName

        // 监听输入变化，实时更新预览
        input.addEventListener('input', () => {
          preview.textContent = input.value || suffix
        })

        input.focus()
        input.select()
      }
    }, 100)

  } catch (error) {
    // 用户取消
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
  loadRecentConfigs()
  loadRecentFolders()
  loadConfigPath()
  loadPresetConfigs()
  loadConfigFolders()
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

.folder-card {
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

.config-tile:hover .tile-icon {
  color: #409eff;
}

.tile-name {
  font-size: 12px;
  color: #606266;
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
  max-width: 100px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  font-size: 14px;
}
</style>
