<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <el-menu
        :default-active="activeMenu"
        mode="horizontal"
        :router="true"
        @select="handleSelect"
      >
        <el-menu-item index="/home">首页</el-menu-item>
        <el-menu-item index="/data">数据维护</el-menu-item>
        <el-menu-item index="/tools">工具</el-menu-item>
        <el-menu-item index="/settings">设置</el-menu-item>
      </el-menu>
    </el-header>
    <el-main class="layout-main">
      <router-view />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const activeMenu = ref(route.path);

const handleSelect = (key: string) => {
  activeMenu.value = key;
};
</script>

<style scoped>
.layout-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  padding: 0;
  height: auto;
}

.layout-main {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.el-menu {
  border-right: none;
}
</style>
