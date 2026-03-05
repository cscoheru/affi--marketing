<template>
  <div class="vue-dashboard-wrapper">
    <DashboardView
      :user="props.user"
      :token="props.token"
      :api-base-url="props.apiBaseUrl"
      @mounted="handleMounted"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import DashboardView from '../views/Dashboard.vue'
import { notifyParent } from './types'
import type { ComponentProps } from './types'

const props = defineProps<ComponentProps>()

const emit = defineEmits<{
  mounted: []
  error: [error: Error]
  dataRefresh: [data: any]
}>()

const handleMounted = () => {
  emit('mounted')
  notifyParent('mounted', { component: 'Dashboard' })
}

const handleError = (error: Error) => {
  emit('error', error)
  notifyParent('error', { message: error.message, component: 'Dashboard' })
}

onMounted(() => {
  console.log('[DashboardWrapper] Component mounted')
})
</script>

<style scoped>
.vue-dashboard-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
