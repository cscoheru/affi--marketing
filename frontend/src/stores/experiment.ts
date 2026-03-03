import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Experiment, ExperimentQuery } from '@/types'
import experimentApi from '@/api/experiments'

export const useExperimentStore = defineStore('experiment', () => {
  // State
  const experiments = ref<Experiment[]>([])
  const currentExperiment = ref<Experiment | null>(null)
  const loading = ref(false)
  const pagination = ref({
    total: 0,
    page: 1,
    size: 20
  })

  // Computed
  const activeExperiments = computed(() =>
    experiments.value.filter(e => e.status === 'active')
  )
  const draftExperiments = computed(() =>
    experiments.value.filter(e => e.status === 'draft')
  )

  // Actions
  const fetchExperiments = async (params?: ExperimentQuery) => {
    loading.value = true
    try {
      const response = await experimentApi.list(params) as any
      experiments.value = response.data.items
      pagination.value = {
        total: response.data.total,
        page: response.data.page,
        size: response.data.size
      }
    } finally {
      loading.value = false
    }
  }

  const fetchExperiment = async (id: string) => {
    loading.value = true
    try {
      const response = await experimentApi.detail(id) as any
      currentExperiment.value = response.data
      return currentExperiment.value
    } finally {
      loading.value = false
    }
  }

  const createExperiment = async (data: any) => {
    loading.value = true
    try {
      const response = await experimentApi.create(data) as any
      experiments.value.push(response.data)
      return response.data
    } finally {
      loading.value = false
    }
  }

  const updateExperiment = async (id: string, data: any) => {
    loading.value = true
    try {
      const response = await experimentApi.update(id, data) as any
      const index = experiments.value.findIndex(e => e.id === id)
      if (index !== -1) {
        experiments.value[index] = response.data
      }
      if (currentExperiment.value?.id === id) {
        currentExperiment.value = response.data
      }
      return response.data
    } finally {
      loading.value = false
    }
  }

  const deleteExperiment = async (id: string) => {
    loading.value = true
    try {
      await experimentApi.delete(id)
      experiments.value = experiments.value.filter(e => e.id !== id)
      if (currentExperiment.value?.id === id) {
        currentExperiment.value = null
      }
    } finally {
      loading.value = false
    }
  }

  const startExperiment = async (id: string) => {
    const response = await experimentApi.start(id) as any
    const index = experiments.value.findIndex(e => e.id === id)
    if (index !== -1) {
      experiments.value[index] = response.data
    }
    if (currentExperiment.value?.id === id) {
      currentExperiment.value = response.data
    }
    return response.data
  }

  const stopExperiment = async (id: string) => {
    const response = await experimentApi.stop(id) as any
    const index = experiments.value.findIndex(e => e.id === id)
    if (index !== -1) {
      experiments.value[index] = response.data
    }
    if (currentExperiment.value?.id === id) {
      currentExperiment.value = response.data
    }
    return response.data
  }

  const pauseExperiment = async (id: string) => {
    const response = await experimentApi.pause(id) as any
    const index = experiments.value.findIndex(e => e.id === id)
    if (index !== -1) {
      experiments.value[index] = response.data
    }
    if (currentExperiment.value?.id === id) {
      currentExperiment.value = response.data
    }
    return response.data
  }

  const clearCurrent = () => {
    currentExperiment.value = null
  }

  return {
    experiments,
    currentExperiment,
    loading,
    pagination,
    activeExperiments,
    draftExperiments,
    fetchExperiments,
    fetchExperiment,
    createExperiment,
    updateExperiment,
    deleteExperiment,
    startExperiment,
    stopExperiment,
    pauseExperiment,
    clearCurrent
  }
})
