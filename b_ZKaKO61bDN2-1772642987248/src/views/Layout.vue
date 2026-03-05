<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: isCollapsed }">
      <div class="sidebar-header">
        <div class="logo" v-show="!isCollapsed">
          <el-icon :size="24" color="#409eff"><Cpu /></el-icon>
          <span class="logo-text">ContentHub</span>
        </div>
        <div class="logo logo-mini" v-show="isCollapsed">
          <el-icon :size="24" color="#409eff"><Cpu /></el-icon>
        </div>
      </div>
      <el-menu
        :default-active="currentRoute"
        :collapse="isCollapsed"
        router
        class="sidebar-menu"
        background-color="#1d1e2c"
        text-color="#a3a6b7"
        active-text-color="#409eff"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer" v-show="!isCollapsed">
        <div class="system-info">
          <span class="version">v1.0.0</span>
        </div>
      </div>
    </aside>

    <!-- Main area -->
    <div class="main-wrapper" :class="{ expanded: isCollapsed }">
      <!-- Header -->
      <header class="main-header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            :size="20"
            @click="isCollapsed = !isCollapsed"
          >
            <Fold v-if="!isCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="3" :max="99" class="notification-badge">
            <el-icon :size="20" class="header-icon"><Bell /></el-icon>
          </el-badge>
          <el-dropdown trigger="click">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">A</el-avatar>
              <span class="user-name" v-show="true">管理员</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人设置</el-dropdown-item>
                <el-dropdown-item>系统配置</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Page content -->
      <main class="main-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Fold, Expand, Bell, ArrowDown, Cpu,
  ShoppingCart, Folder, Document, Upload, DataAnalysis
} from '@element-plus/icons-vue'

const route = useRoute()
const isCollapsed = ref(false)

const menuItems = [
  { path: '/products', title: '产品候选库', icon: ShoppingCart },
  { path: '/materials', title: '素材库', icon: Folder },
  { path: '/content', title: '内容管理', icon: Document },
  { path: '/publish', title: '发布中心', icon: Upload },
  { path: '/analytics', title: '数据看板', icon: DataAnalysis }
]

const currentRoute = computed(() => route.path)

const currentPageTitle = computed(() => {
  const item = menuItems.find(m => m.path === route.path)
  return item?.title || ''
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background-color: #f0f2f5;
}

/* Sidebar */
.sidebar {
  width: 220px;
  background-color: #1d1e2c;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  padding-top: 8px;
}

.sidebar-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  margin: 2px 8px;
  border-radius: 8px;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: rgba(64, 158, 255, 0.15) !important;
}

.sidebar-menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.system-info {
  text-align: center;
}

.version {
  font-size: 12px;
  color: #606266;
}

/* Main wrapper */
.main-wrapper {
  flex: 1;
  margin-left: 220px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: margin-left 0.3s ease;
}

.main-wrapper.expanded {
  margin-left: 64px;
}

/* Header */
.main-header {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  cursor: pointer;
  color: #606266;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: #409eff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  cursor: pointer;
  color: #606266;
  transition: color 0.2s;
}

.header-icon:hover {
  color: #409eff;
}

.notification-badge {
  line-height: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #606266;
}

.user-name {
  font-size: 14px;
}

.user-avatar {
  background-color: #409eff;
  color: #ffffff;
  font-weight: 600;
}

/* Main content */
.main-content {
  flex: 1;
  padding: 24px;
}
</style>
