<template>
  <div class="page">
    <h2>比对结果</h2>

    将【查看lot列表中是否重复】的重复项 与
    【统计去重后的复判结果】去重后的列表进行比对

    <el-card
      v-if="!lotCheckStore.allItems.length || !mongoCheckStore.analyzed"
      class="info-card"
    >
      <el-empty description="请先完成以下两个操作">
        <div class="steps">
          <div class="step">
            <el-tag
              :type="lotCheckStore.allItems.length > 0 ? 'success' : 'info'"
              size="large"
            >
              步骤1: 在【查看lot列表中是否重复】中添加数据
            </el-tag>
            <el-tag
              v-if="lotCheckStore.allItems.length > 0"
              type="success"
              size="small"
            >
              ✓ 已完成 ({{ lotCheckStore.allItems.length }} 项)
            </el-tag>
          </div>
          <div class="step">
            <el-tag
              :type="mongoCheckStore.analyzed ? 'success' : 'info'"
              size="large"
            >
              步骤2: 在【统计去重后的复判结果】中分析数据
            </el-tag>
            <el-tag v-if="mongoCheckStore.analyzed" type="success" size="small">
              ✓ 已完成 ({{ mongoCheckStore.uniqueSnList.length }} 条唯一)
            </el-tag>
          </div>
        </div>
      </el-empty>
    </el-card>

    <el-card v-else class="result-card">
      <template #header>
        <div class="card-header">
          <span>比对结果</span>
          <el-button type="default" @click="handleRefresh">刷新</el-button>
        </div>
      </template>

      <div class="stats-info">
        <el-tag type="info" size="large"
          >Lot重复项: {{ lotDuplicates.length }}</el-tag
        >
        <el-tag type="success" size="large"
          >Mongo唯一项: {{ mongoCheckStore.uniqueSnList.length }}</el-tag
        >
        <el-tag type="warning" size="large"
          >匹配项: {{ matchedItems.length }}</el-tag
        >
        <el-tag type="danger" size="large"
          >不匹配项: {{ unmatchedItems.length }}</el-tag
        >
      </div>

      <el-divider />

      <el-tabs v-model="activeTab">
        <el-tab-pane label="匹配项" name="matched">
          <div class="tab-description">
            <el-text type="success"
              >在Lot重复项中且在Mongo唯一列表中的项</el-text
            >
          </div>
          <el-input
            v-model="searchMatched"
            placeholder="搜索匹配项..."
            clearable
            style="margin-bottom: 10px; width: 300px"
          />
          <div class="items-grid">
            <el-tag
              v-for="(item, index) in filteredMatched"
              :key="index"
              type="success"
              class="item-tag"
            >
              {{ index + 1 }}. {{ item }}
            </el-tag>
          </div>
        </el-tab-pane>

        <el-tab-pane label="不匹配项" name="unmatched">
          <div class="tab-description">
            <el-text type="danger"
              >在Lot重复项中但不在Mongo唯一列表中的项</el-text
            >
          </div>
          <el-input
            v-model="searchUnmatched"
            placeholder="搜索不匹配项..."
            clearable
            style="margin-bottom: 10px; width: 300px"
          />
          <div class="items-grid">
            <el-tag
              v-for="(item, index) in filteredUnmatched"
              :key="index"
              type="danger"
              class="item-tag"
            >
              {{ index + 1 }}. {{ item }}
            </el-tag>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Lot重复项详情" name="lot-duplicates">
          <div class="tab-description">
            <el-text type="warning"
              >Lot列表中的所有重复项（出现次数>1）</el-text
            >
          </div>
          <el-table
            :data="lotDuplicatesTableData"
            style="width: 100%"
            max-height="400"
          >
            <el-table-column prop="item" label="项" width="300" />
            <el-table-column prop="count" label="出现次数" width="100" />
            <el-table-column prop="status" label="比对状态" width="120">
              <template #default="scope">
                <el-tag
                  :type="
                    matchedItems.includes(scope.row.item) ? 'success' : 'danger'
                  "
                  size="small"
                >
                  {{
                    matchedItems.includes(scope.row.item) ? "匹配" : "不匹配"
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="indices" label="位置" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Mongo唯一列表" name="mongo-unique">
          <div class="tab-description">
            <el-text>Mongo去重后的所有唯一SN</el-text>
          </div>
          <el-input
            v-model="searchMongo"
            placeholder="搜索Mongo唯一项..."
            clearable
            style="margin-bottom: 10px; width: 300px"
          />
          <div class="items-grid">
            <el-tag
              v-for="(item, index) in filteredMongo"
              :key="index"
              :type="matchedItems.includes(item) ? 'success' : 'info'"
              class="item-tag"
            >
              {{ index + 1 }}. {{ item }}
            </el-tag>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useLotCheckStore } from "@/stores/lotCheck";
import { useMongoCheckStore } from "@/stores/mongoCheck";

const lotCheckStore = useLotCheckStore();
const mongoCheckStore = useMongoCheckStore();

const activeTab = ref("matched");
const searchMatched = ref("");
const searchUnmatched = ref("");
const searchMongo = ref("");

// Lot重复项
const lotDuplicates = computed(() => {
  return lotCheckStore.getDuplicates();
});

// Lot重复项表格数据
const lotDuplicatesTableData = computed(() => {
  return lotDuplicates.value.map((dup) => ({
    item: dup.item,
    count: dup.count,
    status: matchedItems.value.includes(dup.item) ? "匹配" : "不匹配",
    indices: dup.indices.join(", "),
  }));
});

// 匹配项：在Lot重复项中且在Mongo唯一列表中
const matchedItems = computed(() => {
  const mongoSet = new Set(mongoCheckStore.uniqueSnList);
  return lotDuplicates.value
    .filter((dup) => mongoSet.has(dup.item))
    .map((dup) => dup.item);
});

// 不匹配项：在Lot重复项中但不在Mongo唯一列表中
const unmatchedItems = computed(() => {
  const mongoSet = new Set(mongoCheckStore.uniqueSnList);
  return lotDuplicates.value
    .filter((dup) => !mongoSet.has(dup.item))
    .map((dup) => dup.item);
});

// 过滤后的匹配项
const filteredMatched = computed(() => {
  if (!searchMatched.value) {
    return matchedItems.value;
  }
  return matchedItems.value.filter((item) =>
    item.toLowerCase().includes(searchMatched.value.toLowerCase()),
  );
});

// 过滤后的不匹配项
const filteredUnmatched = computed(() => {
  if (!searchUnmatched.value) {
    return unmatchedItems.value;
  }
  return unmatchedItems.value.filter((item) =>
    item.toLowerCase().includes(searchUnmatched.value.toLowerCase()),
  );
});

// 过滤后的Mongo唯一列表
const filteredMongo = computed(() => {
  if (!searchMongo.value) {
    return mongoCheckStore.uniqueSnList;
  }
  return mongoCheckStore.uniqueSnList.filter((item) =>
    item.toLowerCase().includes(searchMongo.value.toLowerCase()),
  );
});

// 刷新
const handleRefresh = () => {
  // 触发重新计算
  activeTab.value = activeTab.value === "matched" ? "matched" : "matched";
};
</script>

<style scoped>
.page h2 {
  color: #409eff;
  margin-bottom: 15px;
}

.info-card {
  margin-top: 20px;
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

.steps {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.step {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-info {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.tab-description {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  max-height: 400px;
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
