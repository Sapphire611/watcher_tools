<template>
  <el-container class="data-container">
    <el-aside width="200px" class="data-aside">
      <el-menu
        :default-active="activeMenu"
        class="data-menu"
        @select="handleSelect"
      >
        <el-menu-item index="demo1">
          <span>查询SN</span>
        </el-menu-item>
        <el-menu-item index="page6">
          <span>上传料号</span>
        </el-menu-item>
        <el-menu-item index="demo2">
          <span>添加SN</span>
        </el-menu-item>
        <el-menu-item index="demo5">
          <span>删除SN</span>
        </el-menu-item>
        <el-menu-item index="demo3">
          <span>查询Lot</span>
        </el-menu-item>
        <el-menu-item index="demo4">
          <span>添加Lot</span>
        </el-menu-item>
        <el-menu-item index="demo6">
          <span>删除Lot</span>
        </el-menu-item>
        <el-menu-item index="page1">
          <span>查询 VRS 历史记录</span>
        </el-menu-item>
        <el-menu-item index="page2">
          <span>删除 VRS 历史记录</span>
        </el-menu-item>
        <el-menu-item index="page3">
          <span>获取 AI过滤结果</span>
        </el-menu-item>
        <el-menu-item index="page5">
          <span>添加 AI过滤 A面结果</span>
        </el-menu-item>
        <el-menu-item index="page4">
          <span>添加 AI过滤 B面结果</span>
        </el-menu-item>
        <el-menu-item index="page7">
          <span>查看 AI详细结果</span>
        </el-menu-item>
        <el-menu-item index="page8">
          <span>添加 AI详细结果 A面</span>
        </el-menu-item>
        <el-menu-item index="page9">
          <span>添加 AI详细结果 B面</span>
        </el-menu-item>
        <el-menu-item index="page12">
          <span>添加历史数据</span>
        </el-menu-item>
        <el-menu-item index="page10">
          <span>按日期范围查询历史数据</span>
        </el-menu-item>
        <el-menu-item index="page11">
          <span>按Key查询历史数据</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main class="data-main">
      <QuerySN v-if="activeMenu === 'demo1'" />
      <ProductSerialManagement v-else-if="activeMenu === 'page6'" />
      <AddSN v-else-if="activeMenu === 'demo2'" />
      <QueryLot v-else-if="activeMenu === 'demo3'" />
      <AddLot v-else-if="activeMenu === 'demo4'" />
      <DeleteSN v-else-if="activeMenu === 'demo5'" />
      <DeleteLot v-else-if="activeMenu === 'demo6'" />
      <Page1 v-else-if="activeMenu === 'page1'" />
      <Page2 v-else-if="activeMenu === 'page2'" />
      <Page3 v-else-if="activeMenu === 'page3'" />
      <Page5 v-else-if="activeMenu === 'page5'" />
      <Page4 v-else-if="activeMenu === 'page4'" />
      <Page7 v-else-if="activeMenu === 'page7'" />
      <Page8 v-else-if="activeMenu === 'page8'" />
      <Page9 v-else-if="activeMenu === 'page9'" />
      <Page10 v-else-if="activeMenu === 'page10'" />
      <Page11 v-else-if="activeMenu === 'page11'" />
      <Page12 v-else-if="activeMenu === 'page12'" />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AddSN from '@/components/AddSN.vue'
import AddLot from '@/components/AddLot.vue'
import QuerySN from '@/components/QuerySN.vue'
import QueryLot from '@/components/QueryLot.vue'
import DeleteSN from '@/components/DeleteSN.vue'
import DeleteLot from '@/components/DeleteLot.vue'
import Page1 from '@/components/getVrsHistoryResult.vue'
import Page2 from '@/components/deleteVrsHistoryResult.vue'
import Page3 from '@/components/getAiInferenceResult.vue'
import Page5 from '@/components/addAiInferenceResultA.vue'
import Page4 from '@/components/addAiInferenceResultB.vue'
import Page7 from '@/components/ViewAiDetailResult.vue'
import Page8 from '@/components/AddAiDetailResultA.vue'
import Page9 from '@/components/AddAiDetailResultB.vue'
import Page10 from '@/components/getHistoryDataRange.vue'
import Page11 from '@/components/getHistoryDataByKey.vue'
import Page12 from '@/components/putHistoryData.vue'
import ProductSerialManagement from '@/components/ProductSerialManagement.vue'

const activeMenu = ref('demo1')

const handleSelect = (key: string) => {
  activeMenu.value = key
}
</script>

<style scoped>
.data-container {
  min-height: 100%;
}

.data-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  overflow: visible;
}

.data-menu {
  border-right: none;
}

.data-main {
  padding: 20px;
  overflow: visible;
}

.demo-page h2 {
  color: #409eff;
  margin-bottom: 15px;
}

.demo-page p {
  font-size: 16px;
  line-height: 1.6;
  color: #606266;
}
</style>
