<template>
  <el-table :data="contents" stripe style="width: 100%" @row-click="handleRowClick">
    <el-table-column prop="title" label="标题" min-width="260">
      <template #default="{ row }">
        <div class="title-cell">
          <span class="title-text">{{ row.title }}</span>
          <el-tag v-if="row.aiGenerated" size="small" type="warning" effect="plain" class="ai-tag">AI</el-tag>
        </div>
      </template>
    </el-table-column>
    <el-table-column prop="type" label="类型" width="100">
      <template #default="{ row }">
        <el-tag :type="typeColorMap[row.type] || 'info'" size="small">
          {{ typeLabel[row.type] || row.type }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="status" label="状态" width="100">
      <template #default="{ row }">
        <el-tag :type="statusColorMap[row.status] || 'info'" size="small" effect="dark">
          {{ statusLabel[row.status] || row.status }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column prop="wordCount" label="字数" width="80" align="center">
      <template #default="{ row }">
        <span class="word-count">{{ row.wordCount }}</span>
      </template>
    </el-table-column>
    <el-table-column label="审核" width="80" align="center">
      <template #default="{ row }">
        <el-icon v-if="row.humanReviewed" color="#67c23a" :size="18"><CircleCheck /></el-icon>
        <el-icon v-else color="#c0c4cc" :size="18"><Clock /></el-icon>
      </template>
    </el-table-column>
    <el-table-column prop="updatedAt" label="更新时间" width="120" />
    <el-table-column label="操作" width="220" fixed="right">
      <template #default="{ row }">
        <el-button size="small" link type="primary" @click.stop="$emit('edit', row)">
          编辑
        </el-button>
        <el-button
          v-if="row.status === 'draft' || row.status === 'reviewing'"
          size="small" link type="warning" @click.stop="$emit('review', row)"
        >
          审核
        </el-button>
        <el-button
          v-if="row.status === 'approved'"
          size="small" link type="success" @click.stop="$emit('publish', row)"
        >
          发布
        </el-button>
        <el-button size="small" link type="danger" @click.stop="$emit('delete', row)">
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import type { Content } from '@/types/content'
import { CircleCheck, Clock } from '@element-plus/icons-vue'

defineProps<{
  contents: Content[]
}>()

const emit = defineEmits<{
  edit: [content: Content]
  review: [content: Content]
  publish: [content: Content]
  delete: [content: Content]
  rowClick: [content: Content]
}>()

const typeColorMap: Record<string, string> = {
  review: '',
  science: 'success',
  guide: 'warning'
}

const typeLabel: Record<string, string> = {
  review: '评测文章',
  science: '科普文章',
  guide: '购买指南'
}

const statusColorMap: Record<string, string> = {
  draft: 'info',
  reviewing: 'warning',
  approved: '',
  published: 'success'
}

const statusLabel: Record<string, string> = {
  draft: '草稿',
  reviewing: '待审核',
  approved: '已批准',
  published: '已发布'
}

function handleRowClick(row: Content) {
  emit('rowClick', row)
}
</script>

<style scoped>
.title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-weight: 500;
  color: #303133;
}

.ai-tag {
  flex-shrink: 0;
}

.word-count {
  font-size: 13px;
  color: #909399;
}
</style>
