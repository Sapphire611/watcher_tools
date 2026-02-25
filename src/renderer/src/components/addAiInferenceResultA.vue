<template>
  <div class="page">
    <h2>AI 过滤 A 面结果</h2>

    添加 AI 过滤后的 A 面结果数据

    <el-card class="code-card">
      <template #header>
        <div class="card-header">
          <el-tag type="warning">POST</el-tag>
          http://localhost:9877 (请求示例)

          <el-button type="link" @click="copyExampleCode">复制</el-button>
        </div>
      </template>
      <pre class="code-content">{{ exampleCode }}</pre>
    </el-card>

    <el-card class="form-card">
      <el-form :model="addAiInferenceAStore" label-width="120px">
        <el-form-item label="服务器地址">
          <el-input
            v-model="addAiInferenceAStore.serverUrl"
            placeholder="http://localhost:9877"
            clearable
          />
        </el-form-item>

        <el-form-item label="Key">
          <el-input
            v-model="addAiInferenceAStore.key"
            placeholder="例如: 261F90170800 2105_A"
            clearable
          />
        </el-form-item>

        <el-form-item label="Value">
          <el-input
            v-model="addAiInferenceAStore.value"
            type="textarea"
            :rows="8"
            placeholder='例如: ["A_0_0_1","A_0_1_1"]'
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

    <el-card v-if="addAiInferenceAStore.responseResult" class="result-card">
      <template #header>
        <div class="card-header">
          <span>接口返回结果</span>
          <el-button type="link" @click="addAiInferenceAStore.responseResult = ''">清除</el-button>
        </div>
      </template>
      <pre class="result-content">{{ addAiInferenceAStore.responseResult }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useAddAiInferenceAStore } from "../stores/dataMaintenance";

const addAiInferenceAStore = useAddAiInferenceAStore();
const loading = ref(false);

// 示例源代码
const exampleCode = `{
  "db_name": "ai_inference_result",
  "operation": "put",
  "op_mode": "all_ow",
  "key": "261F90170800 2105_A",
  "value": "[\\"A_0_0_1\\",\\"A_0_1_1\\",\\"A_0_2_1\\"]"
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
  if (
    !addAiInferenceAStore.key ||
    !addAiInferenceAStore.value ||
    !addAiInferenceAStore.serverUrl
  ) {
    ElMessage({
      message: "请填写所有必填项",
      type: "warning",
      offset: 80,
    });
    return;
  }

  loading.value = true;

  try {
    // 构建请求对象
    const output = {
      db_name: "ai_inference_result",
      operation: "put",
      op_mode: "all_ow",
      key: addAiInferenceAStore.key,
      value: addAiInferenceAStore.value,
    };

    // 使用主进程的 HTTP 请求，避免跨域问题
    const result = await window.api.httpPost(addAiInferenceAStore.serverUrl, output);

    if (result.success && result.data) {
      addAiInferenceAStore.setResponseResult(JSON.stringify(result.data, null, 2));
      ElMessage({
        message: "数据提交成功",
        type: "success",
        offset: 80,
      });
    } else {
      addAiInferenceAStore.setResponseResult(`请求失败: ${result.error || "未知错误"}`);
      ElMessage({
        message: "数据提交失败",
        type: "error",
        offset: 80,
      });
    }
  } catch (error) {
    console.error("请求失败:", error);
    addAiInferenceAStore.setResponseResult(`请求失败: ${error}`);
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
  addAiInferenceAStore.clear();
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
