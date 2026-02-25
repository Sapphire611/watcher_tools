<template>
  <div class="page">
    <h2>删除 VRS 历史记录</h2>

    根据 SN 号删除 VRS 历史记录

    <el-card class="code-card">
      <template #header>
        <div class="card-header">
          <el-tag type="warning">POST</el-tag>
          http://localhost:9877 (请求示例)

          <el-button type="default" @click="copyExampleCode">复制</el-button>
        </div>
      </template>
      <pre class="code-content">{{ exampleCode }}</pre>
    </el-card>

    <el-card class="form-card">
      <el-form :model="deleteVrsHistoryStore" label-width="120px">
        <el-form-item label="服务器地址">
          <el-input
            v-model="deleteVrsHistoryStore.serverUrl"
            placeholder="http://localhost:9877"
            clearable
          />
        </el-form-item>

        <el-form-item label="SN">
          <el-input
            v-model="deleteVrsHistoryStore.sn"
            placeholder="请输入要删除的SN号"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="danger" @click="handleDelete" :loading="loading">
            删除VRS历史记录
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="deleteVrsHistoryStore.responseResult" class="result-card">
      <template #header>
        <div class="card-header">
          <span>接口返回结果</span>
          <el-button
            type="default"
            @click="deleteVrsHistoryStore.responseResult = ''"
            >清除</el-button
          >
        </div>
      </template>
      <pre class="result-content">{{
        deleteVrsHistoryStore.responseResult
      }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useDeleteVrsHistoryStore } from "../stores/dataMaintenance";

const deleteVrsHistoryStore = useDeleteVrsHistoryStore();
const loading = ref(false);

// 示例源代码
const exampleCode = `{
  "db_name": "vrs_history_result",
  "op_mode": "all",
  "operation": "delete",
  "key": "200138069 0001"
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

const handleDelete = async () => {
  // 验证表单
  if (!deleteVrsHistoryStore.sn || !deleteVrsHistoryStore.serverUrl) {
    ElMessage({
      message: "请填写SN和服务器地址",
      type: "warning",
      offset: 80,
    });
    return;
  }

  loading.value = true;

  try {
    // 构建删除请求对象
    const output = {
      db_name: "vrs_history_result",
      op_mode: "all",
      operation: "delete",
      key: deleteVrsHistoryStore.sn,
    };

    // 使用主进程的 HTTP 请求，避免跨域问题
    const result = await window.api.httpPost(
      deleteVrsHistoryStore.serverUrl,
      output,
    );

    if (result.success && result.data) {
      deleteVrsHistoryStore.setResponseResult(
        JSON.stringify(result.data, null, 2),
      );
      ElMessage({
        message: "删除成功",
        type: "success",
        offset: 80,
      });
    } else {
      deleteVrsHistoryStore.setResponseResult(
        `请求失败: ${result.error || "未知错误"}`,
      );
      ElMessage({
        message: "删除失败",
        type: "error",
        offset: 80,
      });
    }
  } catch (error) {
    console.error("请求失败:", error);
    deleteVrsHistoryStore.setResponseResult(`请求失败: ${error}`);
    ElMessage({
      message: "删除失败",
      type: "error",
      offset: 80,
    });
  } finally {
    loading.value = false;
  }
};

const handleReset = () => {
  deleteVrsHistoryStore.clear();
};
</script>

<style scoped>
.page h2 {
  color: #f56c6c;
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
