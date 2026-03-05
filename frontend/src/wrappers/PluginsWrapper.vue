<template>
  <div class="vue-plugins-wrapper">
    <PluginsView
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
import PluginsView from '../views/Plugins.vue'
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
  notifyParent('mounted', { component: 'Plugins' })
}

const handleError = (error: Error) => {
  emit('error', error)
  notifyParent('error', { message: error.message, component: 'Plugins' })
}

onMounted(() => {
  console.log('[PluginsWrapper] Component mounted')
})
</script>

<style scoped>
.vue-plugins-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
