<template>
  <div class="vue-settlements-wrapper">
    <SettlementsView
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
import SettlementsView from '../views/Settlements.vue'
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
  notifyParent('mounted', { component: 'Settlements' })
}

const handleError = (error: Error) => {
  emit('error', error)
  notifyParent('error', { message: error.message, component: 'Settlements' })
}

onMounted(() => {
  console.log('[SettlementsWrapper] Component mounted')
})
</script>

<style scoped>
.vue-settlements-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
