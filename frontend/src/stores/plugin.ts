import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Plugin, PluginConfigUpdate } from '@/types'
import * as pluginApi from '@/api/plugins'

export const usePluginStore = defineStore('plugin', () => {
  // State
  const plugins = ref<Plugin[]>([])
  const currentPlugin = ref<Plugin | null>(null)
  const loading = ref(false)

  // Actions
  const fetchPlugins = async () => {
    loading.value = true
    try {
      const response = await pluginApi.getPlugins() as any
      plugins.value = response.data.items
    } finally {
      loading.value = false
    }
  }

  const fetchPlugin = async (id: string) => {
    loading.value = true
    try {
      const response = await pluginApi.getPluginDetail(id) as any
      currentPlugin.value = response.data
      return currentPlugin.value
    } finally {
      loading.value = false
    }
  }

  const updatePluginConfig = async (id: string, data: PluginConfigUpdate) => {
    loading.value = true
    try {
      const response = await pluginApi.updatePluginConfig(id, data) as any
      const index = plugins.value.findIndex(p => p.id === id)
      if (index !== -1) {
        plugins.value[index] = response.data
      }
      if (currentPlugin.value?.id === id) {
        currentPlugin.value = response.data
      }
      return response.data
    } finally {
      loading.value = false
    }
  }

  const togglePlugin = async (id: string) => {
    const plugin = plugins.value.find(p => p.id === id)
    if (!plugin) return

    const newEnabled = !plugin.enabled
    return await updatePluginConfig(id, { enabled: newEnabled, parameters: plugin.config })
  }

  const executePlugin = async (id: string, data: any) => {
    loading.value = true
    try {
      const response = await pluginApi.executePlugin(id, data) as any
      return response.data
    } finally {
      loading.value = false
    }
  }

  const getPluginsByType = (type: string) => {
    return plugins.value.filter(p => p.type === type)
  }

  const getEnabledPlugins = () => {
    return plugins.value.filter(p => p.enabled)
  }

  return {
    plugins,
    currentPlugin,
    loading,
    fetchPlugins,
    fetchPlugin,
    updatePluginConfig,
    togglePlugin,
    executePlugin,
    getPluginsByType,
    getEnabledPlugins
  }
})
