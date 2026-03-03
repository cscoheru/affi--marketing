<template>
  <div class="dashboard-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <el-button type="primary" :icon="Plus" @click="router.push('/experiments/new')">
        New Experiment
      </el-button>
    </div>

    <!-- Statistics Cards -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <div class="stat-card">
          <div class="stat-icon" :style="{ background: stat.color }">
            <component :is="stat.icon" />
          </div>
          <div class="stat-content">
            <p class="stat-label">{{ stat.label }}</p>
            <p class="stat-value">{{ stat.value }}</p>
            <p class="stat-trend" :class="stat.trend > 0 ? 'positive' : 'negative'">
              <el-icon>
                <component :is="stat.trend > 0 ? TrendCharts : Bottom" />
              </el-icon>
              {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
            </p>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Charts and Recent Activity -->
    <el-row :gutter="20" class="content-row">
      <!-- Conversion Chart -->
      <el-col :span="16">
        <div class="chart-card">
          <div class="card-header">
            <h3>Conversions Overview</h3>
            <el-radio-group v-model="chartPeriod" size="small">
              <el-radio-button label="7d">7 Days</el-radio-button>
              <el-radio-button label="30d">30 Days</el-radio-button>
              <el-radio-button label="90d">90 Days</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container">
            <div class="mock-chart">
              <div v-for="item in chartData" :key="item.label" class="chart-bar">
                <div
                  class="bar"
                  :style="{ height: item.value + '%', background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' }"
                ></div>
                <span class="bar-label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- Quick Actions -->
      <el-col :span="8">
        <div class="actions-card">
          <h3>Quick Actions</h3>
          <div class="action-buttons">
            <el-button class="action-btn" @click="router.push('/experiments/new')">
              <el-icon><Plus /></el-icon>
              <span>Create Experiment</span>
            </el-button>
            <el-button class="action-btn" @click="router.push('/plugins')">
              <el-icon><Grid /></el-icon>
              <span>Manage Plugins</span>
            </el-button>
            <el-button class="action-btn" @click="router.push('/analytics')">
              <el-icon><TrendCharts /></el-icon>
              <span>View Analytics</span>
            </el-button>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Recent Experiments -->
    <div class="recent-section">
      <div class="section-header">
        <h3>Recent Experiments</h3>
        <el-link type="primary" @click="router.push('/experiments')">View All</el-link>
      </div>
      <el-table :data="recentExperiments" class="experiments-table">
        <el-table-column prop="name" label="Experiment" />
        <el-table-column prop="type" label="Type">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="Status">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="router.push(`/experiments/${row.id}`)">
              View
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExperimentStore } from '@/stores/experiment'
import {
  Plus,
  Grid,
  TrendCharts,
  DataLine,
  User,
  Wallet,
  Bottom
} from '@element-plus/icons-vue'

const router = useRouter()
const experimentStore = useExperimentStore()

const chartPeriod = ref('7d')

const stats = ref([
  { label: 'Total Experiments', value: '12', trend: 8, color: '#667eea', icon: DataLine },
  { label: 'Active Experiments', value: '5', trend: 25, color: '#10b981', icon: TrendCharts },
  { label: 'Total Conversions', value: '1,234', trend: 12, color: '#f59e0b', icon: User },
  { label: 'Revenue', value: '$12,345', trend: -3, color: '#ef4444', icon: Wallet }
])

const chartData = ref([
  { label: 'Mon', value: 45 },
  { label: 'Tue', value: 62 },
  { label: 'Wed', value: 38 },
  { label: 'Thu', value: 75 },
  { label: 'Fri', value: 52 },
  { label: 'Sat', value: 68 },
  { label: 'Sun', value: 85 }
])

const recentExperiments = computed(() => experimentStore.experiments.slice(0, 5))

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    seo: 'success',
    geo: 'warning',
    ai_agent: 'danger',
    affiliate_saas: 'info'
  }
  return colors[type] || ''
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'info',
    active: 'success',
    paused: 'warning',
    completed: '',
    archived: 'info'
  }
  return colors[status] || ''
}

onMounted(() => {
  experimentStore.fetchExperiments({ size: 5 })
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.stats-row {
  margin-top: 8px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: #ffffff;
}

.stat-icon :deep(.el-icon) {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-trend.positive {
  color: #10b981;
}

.stat-trend.negative {
  color: #ef4444;
}

.content-row {
  margin-top: 8px;
}

.chart-card,
.actions-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.chart-container {
  height: 200px;
}

.mock-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 100%;
  padding-top: 20px;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.bar {
  width: 40px;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
}

.bar-label {
  font-size: 12px;
  color: #6b7280;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  justify-content: flex-start;
  padding: 16px;
}

.action-btn span {
  margin-left: 8px;
}

.recent-section {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.experiments-table {
  width: 100%;
}
</style>
