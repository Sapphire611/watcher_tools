<template>
  <div class="page">
    <h2>添加历史数据</h2>

    添加 history_data_list_datetime 中的历史数据 (Value 为 JSON 对象, 提交时自动 stringify)

    <el-card class="code-card">
      <template #header>
        <div class="card-header">
          <el-tag type="warning">PUT</el-tag>http://localhost:9877 (请求示例)

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
            placeholder="例如: 20260813"
            clearable
          />
        </el-form-item>

        <el-form-item label="Value">
          <el-input
            v-model="store.value"
            type="textarea"
            :rows="16"
            placeholder='例如: {"NF_count":0,"average_time":0,...}'
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
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import {
  usePutHistoryDataStore,
  PUT_HISTORY_DATA_VALUE_TEMPLATE,
} from "../stores/dataMaintenance";

const store = usePutHistoryDataStore();
const loading = ref(false);

// 示例源代码 (value 为 stringify 后的 JSON 字符串)
const exampleCode = `{
  "db_name": "history_data_list_datetime",
  "operation": "put",
  "op_mode": "all_ow",
  "key": "20260813",
  "value": "${PUT_HISTORY_DATA_VALUE_TEMPLATE
    .replace(/\s+/g, "")
    .replace(/"/g, '\\"')}"
}`;

// 复制示例代码
const copyExampleCode = () => {
  navigator.clipboard
    .writeText(exampleCode)
    .then(() => {
      ElMessage({
        message: "复制成功",
        type: "success",
        offset: 80,
      });
    })
    .catch(() => {
      ElMessage({
        message: "复制失败",
        type: "error",
        offset: 80,
      });
    });
};

const handleSubmit = async () => {
  // 验证表单
  if (!store.key || !store.value || !store.serverUrl) {
    ElMessage({
      message: "请填写所有必填项",
      type: "warning",
      offset: 80,
    });
    return;
  }

  // Value 需要 stringify 后提交
  let valueStr: string;
  try {
    valueStr = JSON.stringify(JSON.parse(store.value));
  } catch {
    ElMessage({
      message: "Value 不是合法的 JSON 格式",
      type: "warning",
      offset: 80,
    });
    return;
  }

  loading.value = true;

  try {
    // 构建请求对象
    const output = {
      db_name: "history_data_list_datetime",
      operation: "put",
      op_mode: "all_ow",
      key: store.key,
      value: valueStr,
    };

    // 使用主进程的 HTTP 请求，避免跨域问题
    const result = await window.api.httpPost(store.serverUrl, output);

    if (result.success && result.data) {
      store.setResponseResult(JSON.stringify(result.data, null, 2));
      ElMessage({
        message: "数据提交成功",
        type: "success",
        offset: 80,
      });
    } else {
      store.setResponseResult(`请求失败: ${result.error || "未知错误"}`);
      ElMessage({
        message: "数据提交失败",
        type: "error",
        offset: 80,
      });
    }
  } catch (error) {
    console.error("请求失败:", error);
    store.setResponseResult(`请求失败: ${error}`);
    ElMessage({
      message: "数据提交失败",
      type: "error",
      offset: 80,
    });
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  store.clear();
};
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
  font-family: "Consolas", "Monaco", "Courier New", monospace;
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
