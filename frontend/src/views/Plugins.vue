<template>
  <div class="plugins-page">
    <div class="page-header">
      <h1 class="page-title">Plugin Marketplace</h1>
    </div>

    <el-row :gutter="20" v-loading="pluginStore.loading">
      <el-col :span="8" v-for="plugin in plugins" :key="plugin.id">
        <div class="plugin-card">
          <div class="plugin-header">
            <div class="plugin-icon">
              <el-icon><Grid /></el-icon>
            </div>
            <div class="plugin-info">
              <h3 class="plugin-name">{{ plugin.name }}</h3>
              <el-tag :type="getPluginTypeColor(plugin.type)" size="small">
                {{ plugin.type }}
              </el-tag>
            </div>
          </div>
          <p class="plugin-description">{{ plugin.description || 'No description available' }}</p>
          <div class="plugin-meta">
            <span class="plugin-version">v{{ plugin.version }}</span>
            <el-switch
              v-model="plugin.enabled"
              @change="togglePlugin(plugin.id)"
            />
          </div>
          <div class="plugin-actions">
            <el-button size="small" @click="configurePlugin(plugin.id)">
              Configure
            </el-button>
            <el-button size="small" type="primary" plain @click="executePlugin(plugin.id)">
              Execute
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { usePluginStore } from '@/stores/plugin'
import { ElMessage } from 'element-plus'
import { Grid } from '@element-plus/icons-vue'

const pluginStore = usePluginStore()

const plugins = computed(() => pluginStore.plugins)

const getPluginTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    seo: 'success',
    attribution: 'warning',
    settlement: 'info',
    tracking: 'danger',
    ai: ''
  }
  return colors[type] || ''
}

const togglePlugin = async (id: string) => {
  try {
    await pluginStore.togglePlugin(id)
    ElMessage.success('Plugin updated')
  } catch {
    ElMessage.error('Failed to update plugin')
  }
}

const configurePlugin = (_id: string) => {
  ElMessage.info('Configuration dialog coming soon')
}

const executePlugin = (_id: string) => {
  ElMessage.info('Plugin execution coming soon')
}

onMounted(() => {
  pluginStore.fetchPlugins()
})
</script>

<style scoped>
.plugins-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.plugin-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plugin-header {
  display: flex;
  gap: 12px;
}

.plugin-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: #ffffff;
}

.plugin-icon :deep(.el-icon) {
  font-size: 24px;
}

.plugin-info {
  flex: 1;
}

.plugin-name {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}

.plugin-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.plugin-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plugin-version {
  font-size: 12px;
  color: #9ca3af;
}

.plugin-actions {
  display: flex;
  gap: 8px;
}

.plugin-actions .el-button {
  flex: 1;
}
</style>
