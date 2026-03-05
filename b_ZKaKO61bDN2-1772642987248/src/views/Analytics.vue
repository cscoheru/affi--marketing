<template>
  <div class="analytics-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1>数据看板</h1>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :shortcuts="dateShortcuts"
      />
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <StatCard
        :value="overview.totalRevenue"
        label="总收入"
        :icon="Money"
        color="#409eff"
        prefix="$"
        :trend="overview.revenueTrend"
      />
      <StatCard
        :value="overview.totalViews"
        label="总阅读量"
        :icon="View"
        color="#67c23a"
        :trend="overview.viewsTrend"
      />
      <StatCard
        :value="overview.conversionRate"
        label="转化率"
        :icon="TrendCharts"
        color="#e6a23c"
        suffix="%"
        :trend="overview.conversionTrend"
      />
      <StatCard
        :value="overview.publishedCount"
        label="已发布内容"
        :icon="DocumentChecked"
        color="#909399"
        :trend="overview.publishedTrend"
      />
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <el-card shadow="never" class="chart-card trend-chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">收入趋势</span>
            <el-radio-group v-model="trendType" size="small">
              <el-radio-button value="revenue">收入</el-radio-button>
              <el-radio-button value="views">阅读量</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div ref="trendChartRef" class="chart-container"></div>
      </el-card>
      <el-card shadow="never" class="chart-card platform-chart-card">
        <template #header>
          <span class="card-title">平台分布</span>
        </template>
        <div ref="platformChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- Content Ranking -->
    <el-card shadow="never" class="ranking-card">
      <template #header>
        <span class="card-title">内容表现排行</span>
      </template>
      <el-table :data="topContents" :default-sort="{ prop: 'revenue', order: 'descending' }">
        <el-table-column type="index" width="50" label="#">
          <template #default="{ $index }">
            <span class="rank-number" :class="{ 'top-rank': $index < 3 }">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="内容标题" min-width="260" />
        <el-table-column prop="views" label="阅读量" width="120" sortable>
          <template #default="{ row }">
            {{ row.views.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="clicks" label="点击量" width="120" sortable>
          <template #default="{ row }">
            {{ row.clicks.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="conversions" label="转化数" width="100" sortable />
        <el-table-column prop="revenue" label="收入" width="120" sortable>
          <template #default="{ row }">
            <span class="revenue-value">${{ row.revenue.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="转化率" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="Number(((row.conversions / row.views) * 100).toFixed(1))"
              :stroke-width="6"
              :color="getConversionColor(row.conversions / row.views)"
              :format="(p: number) => p + '%'"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Money, View, TrendCharts, DocumentChecked } from '@element-plus/icons-vue'
import StatCard from '@/components/StatCard.vue'
import {
  mockAnalyticsOverview,
  mockTopContents,
  mockTrendData,
  mockPlatformDistribution
} from '@/api/mock'

const overview = ref(mockAnalyticsOverview)
const topContents = ref(mockTopContents)
const trendData = ref(mockTrendData)
const platformData = ref(mockPlatformDistribution)

const dateRange = ref<string[]>([])
const trendType = ref('revenue')

const trendChartRef = ref<HTMLElement>()
const platformChartRef = ref<HTMLElement>()

let trendChart: echarts.ECharts | null = null
let platformChart: echarts.ECharts | null = null

const dateShortcuts = [
  { text: '最近7天', value: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 7); return [s, e] } },
  { text: '最近30天', value: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 30); return [s, e] } },
  { text: '本月', value: () => { const e = new Date(); const s = new Date(e.getFullYear(), e.getMonth(), 1); return [s, e] } },
]

function initTrendChart() {
  if (!trendChartRef.value) return
  trendChart = echarts.init(trendChartRef.value)
  updateTrendChart()
}

function updateTrendChart() {
  if (!trendChart) return
  const isRevenue = trendType.value === 'revenue'
  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e4e7ed',
      textStyle: { color: '#303133' }
    },
    grid: { top: 20, right: 20, bottom: 30, left: 60 },
    xAxis: {
      type: 'category',
      data: trendData.value.map(d => d.date),
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: {
        color: '#909399',
        formatter: isRevenue ? '${value}' : '{value}'
      }
    },
    series: [{
      data: trendData.value.map(d => isRevenue ? d.revenue : d.views),
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: isRevenue ? '#409eff' : '#67c23a' },
      itemStyle: { color: isRevenue ? '#409eff' : '#67c23a' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: isRevenue ? 'rgba(64,158,255,0.3)' : 'rgba(103,194,58,0.3)' },
          { offset: 1, color: isRevenue ? 'rgba(64,158,255,0.02)' : 'rgba(103,194,58,0.02)' }
        ])
      }
    }]
  })
}

function initPlatformChart() {
  if (!platformChartRef.value) return
  platformChart = echarts.init(platformChartRef.value)
  platformChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: {
      bottom: 0,
      textStyle: { color: '#909399' }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      padAngle: 3,
      itemStyle: { borderRadius: 6 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: platformData.value.map((d, i) => ({
        ...d,
        itemStyle: { color: ['#409eff', '#67c23a', '#e6a23c', '#909399'][i] }
      }))
    }]
  })
}

function getConversionColor(rate: number) {
  if (rate >= 0.003) return '#67c23a'
  if (rate >= 0.002) return '#e6a23c'
  return '#f56c6c'
}

watch(trendType, () => {
  updateTrendChart()
})

onMounted(() => {
  nextTick(() => {
    initTrendChart()
    initPlatformChart()
  })

  window.addEventListener('resize', () => {
    trendChart?.resize()
    platformChart?.resize()
  })
})
</script>

<style scoped>
.analytics-page {
  max-width: 1400px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.charts-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.ranking-card {
  border-radius: 12px;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  background-color: #f0f0f0;
  color: #909399;
}

.rank-number.top-rank {
  background-color: #409eff;
  color: #ffffff;
}

.revenue-value {
  font-weight: 600;
  color: #409eff;
}
</style>
