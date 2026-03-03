<template>
  <div class="analytics-page">
    <div class="page-header">
      <h1 class="page-title">Analytics</h1>
    </div>

    <div class="placeholder-content">
      <el-empty description="Analytics page coming soon">
        <el-button type="primary" @click="router.push('/experiments')">
          View Experiments
        </el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.placeholder-content {
  background: #ffffff;
  border-radius: 12px;
  padding: 60px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
