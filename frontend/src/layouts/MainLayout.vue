<template>
  <el-container class="main-layout">
    <!-- Sidebar -->
    <el-aside :width="collapsed ? '64px' : '240px'" class="sidebar">
      <div class="logo">
        <span class="logo-text">AffiHub</span>
        <span v-if="collapsed" class="logo-icon">A</span>
      </div>

      <el-menu
        :default-active="currentRoute"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <span>Dashboard</span>
        </el-menu-item>
        <el-menu-item index="/experiments">
          <el-icon><DataLine /></el-icon>
          <span>Experiments</span>
        </el-menu-item>
        <el-menu-item index="/plugins">
          <el-icon><Grid /></el-icon>
          <span>Plugins</span>
        </el-menu-item>
        <el-menu-item index="/analytics">
          <el-icon><TrendCharts /></el-icon>
          <span>Analytics</span>
        </el-menu-item>
        <el-menu-item index="/settlements">
          <el-icon><Wallet /></el-icon>
          <span>Settlements</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- Main Content -->
    <el-container class="main-container">
      <!-- Header -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            :icon="collapsed ? Expand : Fold"
            text
            @click="collapsed = !collapsed"
          />
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentRouteName">{{ currentRouteName }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- User Menu -->
          <el-dropdown @command="handleCommand">
            <div class="user-dropdown">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="user-name">{{ userStore.user?.name || 'User' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  Profile
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  Settings
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  Logout
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- Page Content -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Odometer,
  DataLine,
  Grid,
  TrendCharts,
  Wallet,
  Fold,
  Expand,
  UserFilled,
  ArrowDown,
  User,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const collapsed = ref(false)

const currentRoute = computed(() => route.path)
const currentRouteName = computed(() => {
  const routeMap: Record<string, string> = {
    Dashboard: 'Dashboard',
    Experiments: 'Experiments',
    ExperimentCreate: 'Create Experiment',
    ExperimentDetail: 'Experiment Details',
    Plugins: 'Plugins',
    Analytics: 'Analytics',
    Settlements: 'Settlements'
  }
  return routeMap[route.name as string] || ''
})

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('Profile page coming soon')
      break
    case 'settings':
      ElMessage.info('Settings page coming soon')
      break
    case 'logout':
      await userStore.logout()
      router.push('/login')
      break
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #1a1f36 0%, #141829 100%);
  border-right: 1px solid #e5e7eb;
  transition: width 0.3s;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}


.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}

.logo-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  font-weight: 700;
  margin: 0 auto;
}

.sidebar-menu {
  border: none;
  background: transparent;
}

.sidebar-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.7);
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
}

.sidebar-menu :deep(.el-icon) {
  font-size: 20px;
}

.main-container {
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.user-dropdown:hover {
  background: #f3f4f6;
}

.user-name {
  font-size: 14px;
  color: #374151;
}

.main-content {
  background: #f9fafb;
  padding: 20px;
  overflow-y: auto;
}

/* Page transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
