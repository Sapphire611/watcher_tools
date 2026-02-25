<template>
  <div class="page">
    <h2>查看lot列表中是否重复</h2>

    <div>输入包含 value 字段的 JSON 对象，程序将自动分割并统计重复项</div>

    <div>这个JSON就是【数据维护-查询Lot】中的接口返回</div>

    <el-card class="form-card">
      <el-form :model="formData" label-width="120px">
        <el-form-item label="输入JSON">
          <el-input
            v-model="formData.jsonInput"
            type="textarea"
            :rows="10"
            placeholder='{"key": "202602071421265385", "result": "OK", "value": "094643CAC41200000070402;094643CAC41200000060402"}'
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleAdd">添加并分析</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="lotCheckStore.allItems.length > 0" class="result-card">
      <template #header>
        <div class="card-header">
          <span
            >统计结果 (共 {{ lotCheckStore.allItems.length }} 项，{{
              duplicates.length
            }}
            个重复)</span
          >
          <el-button type="default" @click="handleClear">清空所有</el-button>
        </div>
      </template>

      <div class="stats-info">
        <el-tag type="success" size="large"
          >总数: {{ lotCheckStore.allItems.length }}</el-tag
        >
        <el-tag type="warning" size="large"
          >重复: {{ duplicates.length }}</el-tag
        >
        <el-tag type="info" size="large">唯一: {{ uniqueItems.length }}</el-tag>
      </div>

      <el-divider />

      <div v-if="duplicates.length > 0" class="duplicates-section">
        <h3>重复项列表</h3>
        <el-table
          :data="duplicatesTableData"
          style="width: 100%"
          max-height="400"
        >
          <el-table-column prop="item" label="项" width="300" />
          <el-table-column prop="count" label="出现次数" width="100" />
          <el-table-column prop="indices" label="位置" />
        </el-table>
      </div>

      <el-divider />

      <div class="all-items-section">
        <h3>所有项列表</h3>
        <el-input
          v-model="lotCheckStore.searchText"
          placeholder="搜索项..."
          clearable
          style="margin-bottom: 10px; width: 300px"
        />
        <div class="items-grid">
          <el-tag
            v-for="(item, index) in filteredItems"
            :key="index"
            :type="isDuplicate(item) ? 'warning' : 'info'"
            class="item-tag"
          >
            {{ index + 1 }}. {{ item }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useLotCheckStore } from "@/stores/lotCheck";

interface FormData {
  jsonInput: string;
}

const lotCheckStore = useLotCheckStore();

const formData = ref<FormData>({
  jsonInput: "",
});

// 统计重复项
const duplicates = computed(() => {
  return lotCheckStore.getDuplicates();
});

// 唯一项
const uniqueItems = computed(() => {
  return lotCheckStore.getUniqueItems();
});

// 重复项表格数据
const duplicatesTableData = computed(() => {
  return duplicates.value.map((dup) => ({
    item: dup.item,
    count: dup.count,
    indices: dup.indices.join(", "),
  }));
});

// 过滤后的项
const filteredItems = computed(() => {
  if (!lotCheckStore.searchText) {
    return lotCheckStore.allItems;
  }
  return lotCheckStore.allItems.filter((item) =>
    item.toLowerCase().includes(lotCheckStore.searchText.toLowerCase()),
  );
});

// 判断是否重复
const isDuplicate = (item: string): boolean => {
  return lotCheckStore.isDuplicate(item);
};

// 处理添加
const handleAdd = () => {
  if (!formData.value.jsonInput.trim()) {
    ElMessage({
      message: "请输入JSON数据",
      type: "warning",
      offset: 80,
    });
    return;
  }

  try {
    const jsonObj = JSON.parse(formData.value.jsonInput);

    if (!jsonObj.value) {
      ElMessage({
        message: "JSON中必须包含value字段",
        type: "warning",
        offset: 80,
      });
      return;
    }

    // 按分号分割
    const items = jsonObj.value
      .split(";")
      .filter((item: string) => item.trim() !== "");

    if (items.length === 0) {
      ElMessage({
        message: "value中没有有效数据",
        type: "warning",
        offset: 80,
      });
      return;
    }

    // 添加到列表中
    lotCheckStore.addItems(items);

    ElMessage({
      message: `成功添加 ${items.length} 项`,
      type: "success",
      offset: 80,
    });

    // 清空输入框
    formData.value.jsonInput = "";
  } catch (error) {
    ElMessage({
      message: "JSON格式错误",
      type: "error",
      offset: 80,
    });
  }
};

// 重置输入
const handleReset = () => {
  formData.value.jsonInput = "";
};

// 清空所有
const handleClear = () => {
  lotCheckStore.clearAll();
  ElMessage({
    message: "已清空所有数据",
    type: "success",
    offset: 80,
  });
};
</script>

<style scoped>
.page h2 {
  color: #409eff;
  margin-bottom: 15px;
}

.form-card {
  margin-top: 20px;
  margin-bottom: 20px;
  max-width: 900px;
}

.result-card {
  margin-top: 20px;
  max-width: 900px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-info {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.duplicates-section h3,
.all-items-section h3 {
  color: #409eff;
  margin-bottom: 15px;
  margin-top: 10px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.item-tag {
  font-size: 13px;
  padding: 8px 12px;
  word-break: break-all;
}
</style>
