<template>
  <div class="page">
    <h2>解析 history_data_list_datetime Range</h2>

    可从接口直接查询、从本地 JSON 文件加载或粘贴 range_get 返回内容 (data_list 为双重 stringify, value 为 ; 分隔的多条记录), 支持按日期筛选浏览, 并可将某一天的数据编辑后 PUT 更新回服务器

    <el-card class="load-card">
      <template #header>
        <div class="card-header">
          <span>加载数据</span>
          <el-tag v-if="days.length" type="success">
            已解析 {{ days.length }} 天 / {{ totalRecords }} 条记录
          </el-tag>
        </div>
      </template>

      <div class="http-row">
        <el-input v-model="serverUrl" placeholder="http://localhost:9877" class="server-input" />
        <el-input v-model="rangeStart" placeholder="开始日期 20260805" class="date-input" />
        <el-input v-model="rangeEnd" placeholder="结束日期 20260813" class="date-input" />
        <el-button type="primary" :loading="loadingQuery" @click="handleQueryFromServer">
          从接口查询并解析
        </el-button>
      </div>

      <el-input
        v-model="rawText"
        type="textarea"
        :rows="6"
        placeholder="粘贴 range_get 接口返回的完整 JSON, 或点击「选择文件」从本地加载"
      />

      <div class="btn-row">
        <el-button type="default" @click="handleSelectFile" :loading="loadingFile">
          选择文件
        </el-button>
        <el-button type="primary" @click="handleParse" :loading="loadingParse">
          解析
        </el-button>
      </div>
    </el-card>

    <el-card v-if="days.length" class="browse-card">
      <template #header>
        <div class="card-header">
          <span>数据浏览</span>
          <div class="browse-tools">
            <el-select v-model="selectedKey" placeholder="按日期筛选" class="date-select">
              <el-option label="全部日期" value="" />
              <el-option
                v-for="d in days"
                :key="d.key"
                :label="`${d.key} (${d.records.length} 条)`"
                :value="d.key"
              />
            </el-select>
            <el-button type="primary" :disabled="!selectedKey" @click="openEdit">
              编辑当前日期
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableRows" border stripe size="small" max-height="600">
        <el-table-column v-if="!selectedKey" label="日期" prop="__day" width="110" fixed />
        <el-table-column
          v-for="c in columns"
          :key="c"
          :prop="c"
          :label="c"
          min-width="110"
          show-overflow-tooltip
        />
      </el-table>
    </el-card>

    <el-dialog
      v-model="editDialogVisible"
      :title="`编辑 ${editKey} 当日数据`"
      width="70%"
      top="5vh"
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        :title="`Value 格式为 JSON 数组, 每个元素是一条记录; PUT 更新会把所有记录用 ; 拼接成当天的完整 value, 整体覆盖发送到 ${serverUrl}`"
      />
      <el-input
        v-model="editText"
        type="textarea"
        :rows="20"
        class="edit-textarea"
        spellcheck="false"
      />
      <template #footer>
        <el-button @click="handleFormatEdit">格式化校验</el-button>
        <el-button type="primary" @click="handleSaveLocal">保存到本地</el-button>
        <el-button type="warning" :loading="putting" @click="handlePutServer">
          PUT 更新到服务器
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";

type RecordObj = Record<string, unknown>
interface DayData {
  key: string
  records: RecordObj[]
}

// 不重要的字段, 不渲染为列 (数据仍保留, 编辑 JSON 时可见)
const HIDDEN_FIELDS = new Set([
  "product_name", "decive_id", "cur_side", "ngCount", "okCount", "NF_count", "total_count",
]);

// 列展示的优先顺序, 其余字段按字母序排在后面
const PREFERRED_FIELDS = [
  "id", "record_id", "lot", "lot_record_id", "serial_number",
  "productName", "product_name", "decive_id", "cur_side", "result",
  "defectNum", "defect_count_A", "defect_count_B", "defect_count_total",
  "ngCount", "okCount", "NF_count", "total_count", "pcsNum",
  "average_time", "put_product_total_time",
  "start_time", "end_time", "time", "insert_time",
  "GP_OX", "channel", "is_retest", "pile_seq", "panel_seq",
];

const rawText = ref("");
const days = ref<DayData[]>([]);
const columns = ref<string[]>([]);
const selectedKey = ref("");
const serverUrl = ref("http://localhost:9877");
const rangeStart = ref("");
const rangeEnd = ref("");
const loadingFile = ref(false);
const loadingQuery = ref(false);
const loadingParse = ref(false);
const putting = ref(false);

const editDialogVisible = ref(false);
const editKey = ref("");
const editText = ref("");

const totalRecords = computed(() =>
  days.value.reduce((n, d) => n + d.records.length, 0)
);

const tableRows = computed(() => {
  if (selectedKey.value) {
    return days.value.find((d) => d.key === selectedKey.value)?.records ?? [];
  }
  return days.value.flatMap((d) =>
    d.records.map((r) => ({ ...r, __day: d.key }))
  );
});

// 解析 range_get 响应: data_list 每个元素是 stringify 过的 {key, value},
// value 又是 ; 分隔的多条 stringify 记录; 末尾的 "end_range_send" 为哨兵需过滤
function parseRangeResponse(text: string): { days: DayData[]; skipped: number } {
  const obj = JSON.parse(text);
  if (!obj || !Array.isArray(obj.data_list)) {
    throw new Error("响应中缺少 data_list 数组");
  }

  const dayMap = new Map<string, RecordObj[]>();
  let skipped = 0;

  for (const el of obj.data_list) {
    if (el === "end_range_send" || typeof el !== "string") continue;
    const { key, value } = JSON.parse(el);
    if (!dayMap.has(key)) dayMap.set(key, []);
    for (const part of value.split(";")) {
      const p = part.trim();
      if (!p) continue;
      try {
        dayMap.get(key)!.push(JSON.parse(p));
      } catch {
        skipped++;
      }
    }
  }

  const list = [...dayMap.entries()].map(([key, records]) => ({ key, records }));
  list.sort((a, b) => a.key.localeCompare(b.key));
  return { days: list, skipped };
}

function rebuildColumns(): void {
  const fieldSet = new Set<string>();
  days.value.forEach((d) =>
    d.records.forEach((r) =>
      Object.keys(r).forEach((k) => {
        if (!HIDDEN_FIELDS.has(k)) fieldSet.add(k);
      })
    )
  );
  columns.value = [...fieldSet].sort((a, b) => {
    const ia = PREFERRED_FIELDS.indexOf(a);
    const ib = PREFERRED_FIELDS.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

const handleParse = async () => {
  if (!rawText.value.trim()) {
    ElMessage({ message: "请先粘贴 JSON 或选择文件", type: "warning", offset: 80 });
    return;
  }

  loadingParse.value = true;
  try {
    const { days: parsed, skipped } = parseRangeResponse(rawText.value);
    if (!parsed.length) {
      throw new Error("没有解析到任何数据");
    }
    days.value = parsed;
    selectedKey.value = parsed[0].key;
    rebuildColumns();
    ElMessage({
      message: `解析成功: ${parsed.length} 天 / ${totalRecords.value} 条记录` +
        (skipped ? `, ${skipped} 条解析失败已跳过` : ""),
      type: "success",
      offset: 80,
    });
  } catch (error) {
    ElMessage({
      message: `解析失败: ${error instanceof Error ? error.message : error}`,
      type: "error",
      offset: 80,
    });
  } finally {
    loadingParse.value = false;
  }
};

// 通过 HTTP range_get 接口直接查询并解析 (与 IC数据维护-按日期范围查询历史数据 相同的请求体)
const handleQueryFromServer = async () => {
  if (!serverUrl.value.trim() || !rangeStart.value.trim() || !rangeEnd.value.trim()) {
    ElMessage({ message: "请填写服务器地址和日期范围", type: "warning", offset: 80 });
    return;
  }

  loadingQuery.value = true;
  try {
    const output = {
      db_name: "history_data_list_datetime",
      op_mode: "all",
      operation: "range_get",
      range_start: rangeStart.value,
      range_end: rangeEnd.value,
    };

    const result = await window.api.httpPost(serverUrl.value, output);

    if (result.success && result.data) {
      rawText.value = JSON.stringify(result.data);
      await handleParse();
    } else {
      ElMessage({
        message: `查询失败: ${result.error || "未知错误"}`,
        type: "error",
        offset: 80,
      });
    }
  } catch (error) {
    ElMessage({
      message: `查询失败: ${error instanceof Error ? error.message : error}`,
      type: "error",
      offset: 80,
    });
  } finally {
    loadingQuery.value = false;
  }
};

const handleSelectFile = async () => {
  loadingFile.value = true;
  try {
    const result = await window.api.selectAndReadFile();
    if (result.canceled) return;
    if (result.error) throw new Error(result.error);
    rawText.value = result.content ?? "";
    await handleParse();
  } catch (error) {
    ElMessage({
      message: `读取文件失败: ${error instanceof Error ? error.message : error}`,
      type: "error",
      offset: 80,
    });
  } finally {
    loadingFile.value = false;
  }
};

const openEdit = () => {
  const day = days.value.find((d) => d.key === selectedKey.value);
  if (!day) return;
  editKey.value = day.key;
  editText.value = JSON.stringify(day.records, null, 2);
  editDialogVisible.value = true;
};

// 校验编辑框内容为 JSON 数组, 失败返回 null
function parseEditText(): RecordObj[] | null {
  try {
    const arr = JSON.parse(editText.value);
    if (!Array.isArray(arr)) {
      throw new Error("Value 必须是 JSON 数组");
    }
    return arr as RecordObj[];
  } catch (error) {
    ElMessage({
      message: `Value 不是合法的 JSON 数组: ${error instanceof Error ? error.message : error}`,
      type: "warning",
      offset: 80,
    });
    return null;
  }
}

const handleFormatEdit = () => {
  const arr = parseEditText();
  if (!arr) return;
  editText.value = JSON.stringify(arr, null, 2);
  ElMessage({ message: "格式正确", type: "success", offset: 80 });
};

const handleSaveLocal = () => {
  const arr = parseEditText();
  if (!arr) return;
  const day = days.value.find((d) => d.key === editKey.value);
  if (day) {
    day.records = arr;
  } else {
    days.value.push({ key: editKey.value, records: arr });
    days.value.sort((a, b) => a.key.localeCompare(b.key));
  }
  rebuildColumns();
  editDialogVisible.value = false;
  ElMessage({ message: "已保存到本地", type: "success", offset: 80 });
};

const handlePutServer = async () => {
  const arr = parseEditText();
  if (!arr) return;
  if (!serverUrl.value.trim()) {
    ElMessage({ message: "请填写服务器地址", type: "warning", offset: 80 });
    return;
  }

  // 当天的所有数据都属于 value, 多条记录用 ; 拼接 (与 range_get 返回格式一致)
  const value = arr.map((r) => JSON.stringify(r)).join(";");

  putting.value = true;
  try {
    const output = {
      db_name: "history_data_list_datetime",
      operation: "put",
      op_mode: "all_ow",
      key: editKey.value,
      value,
    };

    const result = await window.api.httpPost(serverUrl.value, output);

    if (result.success && result.data) {
      const day = days.value.find((d) => d.key === editKey.value);
      if (day) {
        day.records = arr;
      } else {
        days.value.push({ key: editKey.value, records: arr });
        days.value.sort((a, b) => a.key.localeCompare(b.key));
      }
      rebuildColumns();
      editDialogVisible.value = false;
      ElMessage({
        message: `${editKey.value} 更新成功 (${arr.length} 条)`,
        type: "success",
        offset: 80,
      });
    } else {
      ElMessage({
        message: `更新失败: ${result.error || "未知错误"}`,
        type: "error",
        offset: 80,
      });
    }
  } catch (error) {
    ElMessage({
      message: `更新失败: ${error instanceof Error ? error.message : error}`,
      type: "error",
      offset: 80,
    });
  } finally {
    putting.value = false;
  }
};
</script>

<style scoped>
.page h2 {
  color: #409eff;
  margin-bottom: 15px;
}

.load-card {
  margin-top: 20px;
  margin-bottom: 20px;
}

.browse-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.browse-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.http-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.server-input {
  width: 220px;
}

.date-input {
  width: 160px;
}

.date-select {
  width: 200px;
}

.btn-row {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.edit-textarea :deep(textarea) {
  font-family: "Consolas", "Monaco", "Courier New", monospace;
  font-size: 13px;
  line-height: 1.5;
}
</style>
