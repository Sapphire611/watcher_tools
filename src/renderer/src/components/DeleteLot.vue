<template>
  <div class="delete-lot-page">
    <h2>删除Lot</h2>

    根据Lot号删除对应的料号记录

    <el-tabs v-model="activeTab" class="db-tabs">
      <el-tab-pane label="panel_list" name="panel_list" />
      <el-tab-pane label="lot_panel" name="lot_panel" />
    </el-tabs>

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
      <el-form :model="deleteLotStore" label-width="120px">
        <el-form-item label="服务器地址">
          <el-input
            v-model="deleteLotStore.serverUrl"
            placeholder="http://localhost:9877"
            clearable
          />
        </el-form-item>

        <el-form-item label="Lot号">
          <el-input
            v-model="deleteLotStore.lot"
            placeholder="请输入要删除的Lot号"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="danger" @click="handleDelete" :loading="loading">
            删除Lot
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="deleteLotStore.responseResult" class="result-card">
      <template #header>
        <div class="card-header">
          <span>接口返回结果</span>
          <el-button type="default" @click="deleteLotStore.responseResult = ''"
            >清除</el-button
          >
        </div>
      </template>
      <pre class="result-content">{{ deleteLotStore.responseResult }}</pre>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useDeleteLotStore } from "../stores/dataMaintenance";

const deleteLotStore = useDeleteLotStore();
const loading = ref(false);
const activeTab = ref("panel_list");

// 示例源代码（跟随所选数据表）
const exampleCode = computed(() => {
  return JSON.stringify(
    {
      db_name: activeTab.value,
      operation: "delete",
      op_mode: "all",
      key: "200138069",
    },
    null,
    2
  );
});

// 复制示例代码
const copyExampleCode = () => {
  navigator.clipboard
    .writeText(exampleCode.value)
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
  if (!deleteLotStore.lot || !deleteLotStore.serverUrl) {
    ElMessage({
      message: "请填写Lot号和服务器地址",
      type: "warning",
      offset: 80,
    });
    return;
  }

  loading.value = true;

  try {
    // 构建删除请求对象
    const output = {
      db_name: activeTab.value,
      operation: "delete",
      op_mode: "all",
      key: deleteLotStore.lot,
    };

    // 使用主进程的 HTTP 请求，避免跨域问题
    const result = await window.api.httpPost(deleteLotStore.serverUrl, output);

    if (result.success && result.data) {
      deleteLotStore.setResponseResult(JSON.stringify(result.data, null, 2));
      ElMessage({
        message: "删除成功",
        type: "success",
        offset: 80,
      });
    } else {
      deleteLotStore.setResponseResult(
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
    deleteLotStore.setResponseResult(`请求失败: ${error}`);
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
  deleteLotStore.clear();
};
</script>

<style scoped>
.delete-lot-page h2 {
  color: #f56c6c;
  margin-bottom: 15px;
}

.db-tabs {
  max-width: 800px;
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
