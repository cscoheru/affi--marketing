<template>
  <el-card class="stat-card" shadow="never">
    <div class="stat-icon-wrapper" :style="{ backgroundColor: color + '15', color: color }">
      <el-icon :size="22"><component :is="icon" /></el-icon>
    </div>
    <div class="stat-body">
      <div class="stat-value">{{ prefix }}{{ formattedValue }}{{ suffix }}</div>
      <div class="stat-label">{{ label }}</div>
      <div class="stat-trend" v-if="trend !== undefined" :class="trend >= 0 ? 'trend-up' : 'trend-down'">
        <span>{{ trend >= 0 ? '&#9650;' : '&#9660;' }} {{ Math.abs(trend) }}%</span>
        <span class="trend-label">较上月</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

const props = defineProps<{
  value: number
  label: string
  icon: Component
  color: string
  prefix?: string
  suffix?: string
  trend?: number
}>()

const formattedValue = computed(() => {
  if (props.value >= 10000) {
    return (props.value / 10000).toFixed(1) + 'w'
  }
  if (props.value >= 1000) {
    return props.value.toLocaleString()
  }
  return props.value.toString()
})
</script>

<style scoped>
.stat-card {
  border-radius: 12px;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-body {
  flex: 1;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.stat-trend {
  margin-top: 6px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.trend-label {
  color: #c0c4cc;
}
</style>
