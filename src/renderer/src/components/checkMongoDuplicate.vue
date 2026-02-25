<template>
  <div class="page">
    <h2>统计去重后的复判结果</h2>

    输入包含 _id 和 sn 的对象数组，程序将对 sn 进行去重并统计

    <el-card class="form-card">
      <el-form :model="formData" label-width="120px">
        <el-form-item label="输入数组">
          <el-input
            v-model="formData.jsonInput"
            type="textarea"
            :rows="10"
            placeholder='[{"_id": {"$oid": "698d1cc77e6cdbe24876b2f3"}, "sn": "094643CAC41500000660101"}]'
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleAnalyze">分析</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="mongoCheckStore.analyzed" class="result-card">
      <template #header>
        <div class="card-header">
          <span>统计结果</span>
        </div>
      </template>

      <div class="stats-info">
        <el-tag type="info" size="large">去重前: {{ mongoCheckStore.totalCount }} 条</el-tag>
        <el-tag type="success" size="large">去重后: {{ mongoCheckStore.uniqueCount }} 条</el-tag>
        <el-tag type="warning" size="large">重复: {{ mongoCheckStore.duplicateCount }} 条</el-tag>
      </div>

      <el-divider />

      <div class="duplicates-section">
        <h3>SN 出现次数统计</h3>
        <el-input
          v-model="mongoCheckStore.searchText"
          placeholder="搜索 SN..."
          clearable
          style="margin-bottom: 10px; width: 300px;"
        />
        <el-table :data="filteredSnStats" style="width: 100%" max-height="500">
          <el-table-column prop="sn" label="SN" width="250" />
          <el-table-column prop="count" label="出现次数" width="120" />
          <el-table-column prop="isDuplicate" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="scope.row.count > 1 ? 'warning' : 'success'" size="small">
                {{ scope.row.count > 1 ? '重复' : '唯一' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="indices" label="位置" />
        </el-table>
      </div>

      <el-divider />

      <div class="unique-section">
        <h3>去重后的 SN 列表 ({{ mongoCheckStore.uniqueSnList.length }} 条)</h3>
        <el-input
          v-model="mongoCheckStore.searchUniqueText"
          placeholder="搜索唯一 SN..."
          clearable
          style="margin-bottom: 10px; width: 300px;"
        />
        <div class="sn-grid">
          <el-tag
            v-for="(sn, index) in filteredUniqueList"
            :key="index"
            type="success"
            class="sn-tag"
          >
            {{ index + 1 }}. {{ sn }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import { useMongoCheckStore } from "@/stores/mongoCheck";

interface FormData {
  jsonInput: string;
}

const mongoCheckStore = useMongoCheckStore();

const formData = ref<FormData>({
  jsonInput: "",
});

// 过滤后的统计
const filteredSnStats = computed(() => {
  if (!mongoCheckStore.searchText) {
    return mongoCheckStore.snStats;
  }
  return mongoCheckStore.snStats.filter((stat) =>
    stat.sn.toLowerCase().includes(mongoCheckStore.searchText.toLowerCase())
  );
});

// 过滤后的唯一列表
const filteredUniqueList = computed(() => {
  if (!mongoCheckStore.searchUniqueText) {
    return mongoCheckStore.uniqueSnList;
  }
  return mongoCheckStore.uniqueSnList.filter((sn) =>
    sn.toLowerCase().includes(mongoCheckStore.searchUniqueText.toLowerCase())
  );
});

// 处理分析
const handleAnalyze = () => {
  if (!formData.value.jsonInput.trim()) {
    ElMessage({
      message: "请输入数组",
      type: "warning",
      offset: 80,
    });
    return;
  }

  try {
    const jsonArray = JSON.parse(formData.value.jsonInput);

    if (!Array.isArray(jsonArray)) {
      ElMessage({
        message: "输入必须是数组格式",
        type: "warning",
        offset: 80,
      });
      return;
    }

    // 提取所有 SN
    const snList: string[] = [];
    jsonArray.forEach((item: any, index: number) => {
      if (item.sn) {
        snList.push(item.sn);
      }
    });

    if (snList.length === 0) {
      ElMessage({
        message: "数组中没有找到 sn 字段",
        type: "warning",
        offset: 80,
      });
      return;
    }

    // 统计每个 SN 出现的次数和位置
    const snMap = new Map<string, { count: number; indices: number[] }>();
    snList.forEach((sn, index) => {
      if (!snMap.has(sn)) {
        snMap.set(sn, { count: 0, indices: [] });
      }
      const stat = snMap.get(sn)!;
      stat.count++;
      stat.indices.push(index + 1);
    });

    // 生成统计数据
    const stats = [];
    snMap.forEach((stat, sn) => {
      stats.push({
        sn,
        count: stat.count,
        indices: stat.indices,
        isDuplicate: stat.count > 1,
      });
    });

    // 按出现次数排序
    stats.sort((a, b) => b.count - a.count);

    // 更新 store
    mongoCheckStore.setStatistics(snList.length, snMap.size, snList.length - snMap.size);
    mongoCheckStore.setSnStats(stats);
    mongoCheckStore.setUniqueSnList(Array.from(snMap.keys()));
    mongoCheckStore.setAnalyzed(true);

    ElMessage({
      message: "分析完成",
      type: "success",
      offset: 80,
    });
  } catch (error) {
    ElMessage({
      message: "数组格式错误，请检查输入格式",
      type: "error",
      offset: 80,
    });
  }
};

// 重置
const handleReset = () => {
  formData.value.jsonInput = "";
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
.unique-section h3 {
  color: #409eff;
  margin-bottom: 15px;
  margin-top: 10px;
}

.sn-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.sn-tag {
  font-size: 13px;
  padding: 8px 12px;
  word-break: break-all;
}
</style>
