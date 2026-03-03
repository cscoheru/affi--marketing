<template>
  <div class="experiments-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="page-title">Experiments</h1>
      <el-button type="primary" :icon="Plus" @click="router.push('/experiments/new')">
        Create Experiment
      </el-button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-input
            v-model="filters.search"
            placeholder="Search experiments..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.type" placeholder="All Types" clearable @change="fetchData">
            <el-option label="SEO" value="seo" />
            <el-option label="GEO" value="geo" />
            <el-option label="AI Agent" value="ai_agent" />
            <el-option label="Affiliate SaaS" value="affiliate_saas" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.status" placeholder="All Status" clearable @change="fetchData">
            <el-option label="Draft" value="draft" />
            <el-option label="Active" value="active" />
            <el-option label="Paused" value="paused" />
            <el-option label="Completed" value="completed" />
            <el-option label="Archived" value="archived" />
          </el-select>
        </el-col>
      </el-row>
    </div>

    <!-- Experiments Table -->
    <el-table
      :data="experimentStore.experiments"
      v-loading="experimentStore.loading"
      class="experiments-table"
    >
      <el-table-column prop="name" label="Name" min-width="200" />
      <el-table-column prop="type" label="Type" width="120">
        <template #default="{ row }">
          <el-tag :type="getTypeColor(row.type)" size="small">
            {{ getTypeLabel(row.type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="Status" width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusColor(row.status)" size="small">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Created" width="180">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="200" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button size="small" @click="router.push(`/experiments/${row.id}`)">
              View
            </el-button>
            <el-dropdown @command="handleAction">
              <el-button size="small">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    :command="'start-' + row.id"
                    v-if="row.status === 'draft'"
                  >
                    <el-icon><VideoPlay /></el-icon>
                    Start
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="'pause-' + row.id"
                    v-if="row.status === 'active'"
                  >
                    <el-icon><VideoPause /></el-icon>
                    Pause
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="'stop-' + row.id"
                    v-if="row.status === 'active' || row.status === 'paused'"
                  >
                    <el-icon><CircleClose /></el-icon>
                    Stop
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="'delete-' + row.id"
                    divided
                  >
                    <el-icon><Delete /></el-icon>
                    Delete
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExperimentStore } from '@/stores/experiment'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  MoreFilled,
  VideoPlay,
  VideoPause,
  CircleClose,
  Delete
} from '@element-plus/icons-vue'
import type { ExperimentQuery } from '@/types'

const router = useRouter()
const experimentStore = useExperimentStore()

const filters = reactive({
  search: '',
  type: undefined as string | undefined,
  status: undefined as string | undefined
})

const pagination = ref({
  page: 1,
  size: 20,
  total: 0
})

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    seo: 'success',
    geo: 'warning',
    ai_agent: 'danger',
    affiliate_saas: 'info'
  }
  return colors[type] || ''
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    seo: 'SEO',
    geo: 'GEO',
    ai_agent: 'AI Agent',
    affiliate_saas: 'SaaS'
  }
  return labels[type] || type
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'info',
    active: 'success',
    paused: 'warning',
    completed: '',
    archived: 'info'
  }
  return colors[status] || ''
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const fetchData = async () => {
  const params: ExperimentQuery = {
    page: pagination.value.page,
    size: pagination.value.size,
    type: filters.type as any,
    status: filters.status as any
  }
  if (filters.search) {
    params.search = filters.search
  }
  await experimentStore.fetchExperiments(params)
  pagination.value.total = experimentStore.pagination.total
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchData()
}

const handleAction = async (command: string) => {
  const parts = command.split('-')
  const action = parts[0]
  const id = parts[1]

  if (!id) return

  try {
    switch (action) {
      case 'start':
        await experimentStore.startExperiment(id)
        ElMessage.success('Experiment started')
        break
      case 'pause':
        await experimentStore.pauseExperiment(id)
        ElMessage.success('Experiment paused')
        break
      case 'stop':
        await experimentStore.stopExperiment(id)
        ElMessage.success('Experiment stopped')
        break
      case 'delete':
        await ElMessageBox.confirm('Are you sure you want to delete this experiment?', 'Confirm', {
          type: 'warning'
        })
        await experimentStore.deleteExperiment(id)
        ElMessage.success('Experiment deleted')
        fetchData()
        break
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Action failed')
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.experiments-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.filters-bar {
  background: #ffffff;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.experiments-table {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 16px;
}
</style>
