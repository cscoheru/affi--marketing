<template>
  <div class="materials-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1>素材库</h1>
      <el-button type="primary" @click="handleRefresh" :loading="refreshing">
        <el-icon><Refresh /></el-icon>
        刷新素材
      </el-button>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filters">
        <el-select v-model="filterAsin" placeholder="选择产品 (ASIN)" clearable style="width: 300px">
          <el-option
            v-for="p in productOptions"
            :key="p.asin"
            :label="`${p.title} (${p.asin})`"
            :value="p.asin"
          />
        </el-select>
        <el-select v-model="filterSource" placeholder="全部来源" clearable>
          <el-option label="Amazon 评论" value="amazon_review" />
          <el-option label="YouTube" value="youtube" />
          <el-option label="Reddit" value="reddit" />
          <el-option label="Quora" value="quora" />
        </el-select>
        <el-slider
          v-model="sentimentRange"
          :min="0"
          :max="100"
          range
          :format-tooltip="(val: number) => `${val}%`"
          style="width: 200px"
        />
        <span class="filter-label">情感分数</span>
      </div>
    </el-card>

    <!-- Summary Cards -->
    <div class="summary-row">
      <el-card v-for="item in sourceStats" :key="item.type" class="summary-card" shadow="never">
        <div class="summary-icon" :style="{ backgroundColor: item.color + '20', color: item.color }">
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
        </div>
        <div class="summary-info">
          <span class="summary-count">{{ item.count }}</span>
          <span class="summary-label">{{ item.label }}</span>
        </div>
      </el-card>
    </div>

    <!-- Materials List -->
    <el-card shadow="never">
      <el-table :data="filteredMaterials" stripe style="width: 100%">
        <el-table-column prop="asin" label="ASIN" width="130" />
        <el-table-column prop="sourceType" label="来源" width="140">
          <template #default="{ row }">
            <el-tag :type="sourceTypeMap[row.sourceType]?.tagType || 'info'" size="small">
              {{ sourceTypeMap[row.sourceType]?.label || row.sourceType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容摘要" min-width="300">
          <template #default="{ row }">
            <div class="content-preview">{{ row.content }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="sentimentScore" label="情感分数" width="120" sortable>
          <template #default="{ row }">
            <div class="sentiment-cell">
              <el-progress
                :percentage="row.sentimentScore * 100"
                :stroke-width="6"
                :color="getSentimentColor(row.sentimentScore)"
                :show-text="false"
                style="width: 60px"
              />
              <span class="sentiment-value">{{ (row.sentimentScore * 100).toFixed(0) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="采集时间" width="120" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="handlePreview(row)">预览</el-button>
            <el-button size="small" link type="primary" @click="handleOpenSource(row)">来源</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Preview Dialog -->
    <el-dialog v-model="previewVisible" title="素材详情" width="600px">
      <template v-if="previewMaterial">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ASIN">{{ previewMaterial.asin }}</el-descriptions-item>
          <el-descriptions-item label="来源">
            <el-tag :type="sourceTypeMap[previewMaterial.sourceType]?.tagType || 'info'" size="small">
              {{ sourceTypeMap[previewMaterial.sourceType]?.label || previewMaterial.sourceType }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="情感分数">
            {{ (previewMaterial.sentimentScore * 100).toFixed(0) }}%
          </el-descriptions-item>
          <el-descriptions-item label="采集时间">{{ previewMaterial.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">
            <div class="preview-content">{{ previewMaterial.content }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="来源链接" :span="2">
            <el-link type="primary" :href="previewMaterial.sourceUrl" target="_blank">
              {{ previewMaterial.sourceUrl }}
            </el-link>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, ChatDotRound, VideoCamera, ChatLineRound, QuestionFilled } from '@element-plus/icons-vue'
import { mockMaterials, mockProducts } from '@/api/mock'
import type { Material } from '@/types/material'

const route = useRoute()

const materials = ref<Material[]>([...mockMaterials])
const filterAsin = ref('')
const filterSource = ref('')
const sentimentRange = ref([0, 100])
const refreshing = ref(false)
const previewVisible = ref(false)
const previewMaterial = ref<Material | null>(null)

const productOptions = mockProducts.map(p => ({ asin: p.asin, title: p.title }))

const sourceTypeMap: Record<string, { label: string; tagType: 'success' | 'warning' | 'info' | 'danger' }> = {
  amazon_review: { label: 'Amazon 评论', tagType: 'success' },
  youtube: { label: 'YouTube', tagType: 'danger' },
  reddit: { label: 'Reddit', tagType: 'warning' },
  quora: { label: 'Quora', tagType: 'info' }
}

const sourceStats = computed(() => [
  {
    type: 'amazon_review', label: 'Amazon 评论',
    count: materials.value.filter(m => m.sourceType === 'amazon_review').length,
    color: '#67c23a', icon: ChatDotRound
  },
  {
    type: 'youtube', label: 'YouTube',
    count: materials.value.filter(m => m.sourceType === 'youtube').length,
    color: '#f56c6c', icon: VideoCamera
  },
  {
    type: 'reddit', label: 'Reddit',
    count: materials.value.filter(m => m.sourceType === 'reddit').length,
    color: '#e6a23c', icon: ChatLineRound
  },
  {
    type: 'quora', label: 'Quora',
    count: materials.value.filter(m => m.sourceType === 'quora').length,
    color: '#909399', icon: QuestionFilled
  }
])

const filteredMaterials = computed(() => {
  let result = [...materials.value]
  if (filterAsin.value) {
    result = result.filter(m => m.asin === filterAsin.value)
  }
  if (filterSource.value) {
    result = result.filter(m => m.sourceType === filterSource.value)
  }
  const [min, max] = sentimentRange.value
  result = result.filter(m => {
    const score = m.sentimentScore * 100
    return score >= min && score <= max
  })
  return result
})

function getSentimentColor(score: number) {
  if (score >= 0.8) return '#67c23a'
  if (score >= 0.6) return '#e6a23c'
  return '#f56c6c'
}

function handlePreview(material: Material) {
  previewMaterial.value = material
  previewVisible.value = true
}

function handleOpenSource(material: Material) {
  window.open(material.sourceUrl, '_blank')
}

async function handleRefresh() {
  refreshing.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  refreshing.value = false
  ElMessage.success('素材刷新完成')
}

onMounted(() => {
  const asin = route.query.asin as string
  if (asin) {
    filterAsin.value = asin
  }
})
</script>

<style scoped>
.materials-page {
  max-width: 1400px;
}

.filter-card {
  margin-bottom: 20px;
}

.filters {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 13px;
  color: #909399;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  display: flex;
}

.summary-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.summary-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-info {
  display: flex;
  flex-direction: column;
}

.summary-count {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.summary-label {
  font-size: 12px;
  color: #909399;
}

.content-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.sentiment-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sentiment-value {
  font-size: 12px;
  color: #606266;
  font-weight: 600;
}

.preview-content {
  line-height: 1.8;
  color: #303133;
}
</style>
