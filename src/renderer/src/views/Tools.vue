<template>
  <el-container class="tools-container">
    <el-aside width="200px" class="tools-aside">
      <el-menu
        :default-active="activeMenu"
        class="tools-menu"
        @select="handleSelect"
      >
        <el-menu-item index="page1">
          <span>查看lot列表中是否重复</span>
        </el-menu-item>
        <el-menu-item index="page2">
          <span>统计去重后的复判结果</span>
        </el-menu-item>
        <el-menu-item index="page3">
          <span>比对结果</span>
        </el-menu-item>
        <el-menu-item index="page4">
          <span>解析 Range 历史数据</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="tools-main">
      <ToolPage1 v-if="activeMenu === 'page1'" />
      <ToolPage2 v-else-if="activeMenu === 'page2'" />
      <ToolPage3 v-else-if="activeMenu === 'page3'" />
      <ToolPage4 v-else-if="activeMenu === 'page4'" />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ToolPage1 from '@/components/checkLotDuplicate.vue'
import ToolPage2 from '@/components/checkMongoDuplicate.vue'
import ToolPage3 from '@/components/compareResults.vue'
import ToolPage4 from '@/components/parseHistoryDataRange.vue'

const activeMenu = ref('page1')

const handleSelect = (key: string) => {
  activeMenu.value = key
}
</script>

<style scoped>
.tools-container {
  height: 100%;
}

.tools-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.tools-menu {
  border-right: none;
  height: 100%;
}

.tools-main {
  padding: 20px;
  overflow: visible;
  /* 防止表格内容把整个页面撑宽出现页面级横向滚动条 (滚动条只出现在表格内部) */
  min-width: 0;
}
</style>
