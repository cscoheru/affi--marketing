<template>
  <div class="vue-experiments-wrapper">
    <ExperimentsView
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
import ExperimentsView from '../views/Experiments.vue'
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
  notifyParent('mounted', { component: 'Experiments' })
}

const handleError = (error: Error) => {
  emit('error', error)
  notifyParent('error', { message: error.message, component: 'Experiments' })
}

onMounted(() => {
  console.log('[ExperimentsWrapper] Component mounted')
})
</script>

<style scoped>
.vue-experiments-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
