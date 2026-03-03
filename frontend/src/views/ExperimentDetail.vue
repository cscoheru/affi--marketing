<template>
  <div class="experiment-detail-page">
    <!-- Header -->
    <div class="detail-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" @click="router.back()">Back</el-button>
        <h1 class="experiment-name">{{ experiment?.name }}</h1>
        <el-tag :type="getStatusColor(experiment?.status)" size="large">
          {{ experiment?.status }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button
          v-if="experiment?.status === 'draft'"
          type="success"
          :icon="VideoPlay"
          @click="handleStart"
        >
          Start
        </el-button>
        <el-button
          v-if="experiment?.status === 'active'"
          type="warning"
          :icon="VideoPause"
          @click="handlePause"
        >
          Pause
        </el-button>
        <el-button
          v-if="experiment?.status === 'active' || experiment?.status === 'paused'"
          type="danger"
          :icon="CircleClose"
          @click="handleStop"
        >
          Stop
        </el-button>
        <el-button :icon="Edit" @click="router.push(`/experiments/${experiment?.id}/edit`)">
          Edit
        </el-button>
      </div>
    </div>

    <!-- Metrics Cards -->
    <el-row :gutter="20" class="metrics-row">
      <el-col :span="6">
        <div class="metric-card">
          <p class="metric-label">Total Visitors</p>
          <p class="metric-value">{{ formatNumber(experiment?.metrics?.total_visitors) }}</p>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card">
          <p class="metric-label">Conversions</p>
          <p class="metric-value">{{ formatNumber(experiment?.metrics?.conversions) }}</p>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card">
          <p class="metric-label">Revenue</p>
          <p class="metric-value">${{ formatNumber(experiment?.metrics?.revenue) }}</p>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="metric-card">
          <p class="metric-label">Conv. Rate</p>
          <p class="metric-value">{{ formatPercent(experiment?.metrics?.conversion_rate) }}</p>
        </div>
      </el-col>
    </el-row>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="detail-tabs">
      <el-tab-pane label="Overview" name="overview">
        <div class="tab-content">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Experiment ID">{{ experiment?.id }}</el-descriptions-item>
            <el-descriptions-item label="Type">{{ experiment?.type }}</el-descriptions-item>
            <el-descriptions-item label="Status">{{ experiment?.status }}</el-descriptions-item>
            <el-descriptions-item label="Created">{{ formatDate(experiment?.created_at) }}</el-descriptions-item>
            <el-descriptions-item label="Start Date">{{ formatDate(experiment?.start_date) }}</el-descriptions-item>
            <el-descriptions-item label="End Date">{{ formatDate(experiment?.end_date) }}</el-descriptions-item>
          </el-descriptions>

          <el-divider>Configuration</el-divider>
          <div class="config-container">
            <el-descriptions :column="1" border>
              <el-descriptions-item
                v-for="(value, key) in flattenedConfig"
                :key="key"
                :label="key"
              >
                <code class="config-value">{{ formatConfigValue(value) }}</code>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Analytics" name="analytics">
        <div class="tab-content">
          <p class="empty-state">Analytics charts will be displayed here</p>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Activity" name="activity">
        <div class="tab-content">
          <el-timeline>
            <el-timeline-item timestamp={experiment?.created_at} color="#667eea">
              Experiment created
            </el-timeline-item>
            <el-timeline-item
              v-if="experiment?.start_date"
              :timestamp="experiment.start_date"
              color="#10b981"
            >
              Experiment started
            </el-timeline-item>
            <el-timeline-item
              v-if="experiment?.end_date"
              :timestamp="experiment.end_date"
              color="#6b7280"
            >
              Experiment ended
            </el-timeline-item>
          </el-timeline>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useExperimentStore } from '@/stores/experiment'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  VideoPlay,
  VideoPause,
  CircleClose,
  Edit
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const experimentStore = useExperimentStore()

const experiment = ref<any>(null)
const activeTab = ref('overview')

// Flatten nested config object
const flattenedConfig = computed(() => {
  if (!experiment.value?.config) return {}

  const flatten = (obj: any, prefix = ''): Record<string, any> => {
    const result: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flatten(value, newKey))
      } else {
        result[newKey] = value
      }
    }
    return result
  }

  return flatten(experiment.value.config)
})

const getStatusColor = (status?: string) => {
  if (!status) return 'info'
  const colors: Record<string, string> = {
    draft: 'info',
    active: 'success',
    paused: 'warning',
    completed: '',
    archived: 'info'
  }
  return colors[status] || 'info'
}

const formatNumber = (num?: number) => {
  return num?.toLocaleString() ?? 'N/A'
}

const formatPercent = (num?: number) => {
  return num ? `${(num * 100).toFixed(2)}%` : 'N/A'
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatConfigValue = (value: any) => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const handleStart = async () => {
  try {
    await experimentStore.startExperiment(route.params.id as string)
    ElMessage.success('Experiment started')
    await loadExperiment()
  } catch {
    ElMessage.error('Failed to start experiment')
  }
}

const handlePause = async () => {
  try {
    await experimentStore.pauseExperiment(route.params.id as string)
    ElMessage.success('Experiment paused')
    await loadExperiment()
  } catch {
    ElMessage.error('Failed to pause experiment')
  }
}

const handleStop = async () => {
  try {
    await experimentStore.stopExperiment(route.params.id as string)
    ElMessage.success('Experiment stopped')
    await loadExperiment()
  } catch {
    ElMessage.error('Failed to stop experiment')
  }
}

const loadExperiment = async () => {
  experiment.value = await experimentStore.fetchExperiment(route.params.id as string)
}

onMounted(() => {
  loadExperiment()
})
</script>

<style scoped>
.experiment-detail-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.experiment-name {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.metrics-row {
  margin-top: 8px;
}

.metric-card {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
}

.detail-tabs {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-content {
  padding: 16px 0;
}

.config-container {
  background: #ffffff;
}

.config-value {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}
</style>
