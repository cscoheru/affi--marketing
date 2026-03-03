<template>
  <div class="not-found-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <p class="error-message">Page not found</p>
      <el-button type="primary" @click="router.push('/')">
        Go Home
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped>
.not-found-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-content {
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 16px;
}

.error-message {
  font-size: 24px;
  color: #6b7280;
  margin-bottom: 24px;
}
</style>
