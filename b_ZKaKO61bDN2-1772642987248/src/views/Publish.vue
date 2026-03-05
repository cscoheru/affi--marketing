<template>
  <div class="publish-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1>发布中心</h1>
      <el-button type="primary" @click="showPublishDialog = true">
        <el-icon><Upload /></el-icon>
        一键发布
      </el-button>
    </div>

    <!-- Stats Row -->
    <div class="publish-stats">
      <div class="pstat-item">
        <div class="pstat-icon" style="background-color: rgba(64,158,255,0.1); color: #409eff">
          <el-icon :size="20"><Clock /></el-icon>
        </div>
        <div class="pstat-info">
          <span class="pstat-value">{{ queueStats.pending }}</span>
          <span class="pstat-label">待发布</span>
        </div>
      </div>
      <div class="pstat-item">
        <div class="pstat-icon" style="background-color: rgba(230,162,60,0.1); color: #e6a23c">
          <el-icon :size="20"><Loading /></el-icon>
        </div>
        <div class="pstat-info">
          <span class="pstat-value">{{ queueStats.running }}</span>
          <span class="pstat-label">发布中</span>
        </div>
      </div>
      <div class="pstat-item">
        <div class="pstat-icon" style="background-color: rgba(103,194,58,0.1); color: #67c23a">
          <el-icon :size="20"><CircleCheck /></el-icon>
        </div>
        <div class="pstat-info">
          <span class="pstat-value">{{ queueStats.success }}</span>
          <span class="pstat-label">已成功</span>
        </div>
      </div>
      <div class="pstat-item">
        <div class="pstat-icon" style="background-color: rgba(245,108,108,0.1); color: #f56c6c">
          <el-icon :size="20"><CircleClose /></el-icon>
        </div>
        <div class="pstat-info">
          <span class="pstat-value">{{ queueStats.failed }}</span>
          <span class="pstat-label">失败</span>
        </div>
      </div>
    </div>

    <!-- Publish Queue -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">发布队列 ({{ queue.length }})</span>
          <el-button size="small" @click="handleBatchPublish" :disabled="!hasPending">批量发布</el-button>
        </div>
      </template>
      <el-table :data="queue" stripe>
        <el-table-column prop="title" label="内容标题" min-width="240" />
        <el-table-column prop="platforms" label="目标平台" width="250">
          <template #default="{ row }">
            <div class="platform-tags">
              <el-tag v-for="p in row.platforms" :key="p" size="small" effect="plain" class="platform-tag">
                {{ p }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small" effect="dark">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" link type="primary" @click="handleViewLog(row)">日志</el-button>
            <el-button
              v-if="row.status === 'failed'"
              size="small" link type="warning" @click="handleRetry(row)"
            >
              重试
            </el-button>
            <el-button
              v-if="row.status === 'success' && row.results.length"
              size="small" link type="success" @click="handleViewResult(row)"
            >
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Platform Config -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <span class="card-title">平台配置</span>
      </template>
      <el-table :data="platforms" stripe>
        <el-table-column prop="name" label="平台名称" width="200">
          <template #default="{ row }">
            <div class="platform-name-cell">
              <el-icon :size="18"><component :is="row.icon" /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '已启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="200">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" style="margin-right: 12px" />
            <el-button size="small" @click="handleConfigPlatform(row)">配置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Publish Logs -->
    <el-card shadow="never" class="section-card">
      <template #header>
        <span class="card-title">发布日志</span>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="log in logs"
          :key="log.id"
          :timestamp="log.timestamp"
          :type="log.type"
          placement="top"
        >
          {{ log.message }}
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- Publish Dialog -->
    <el-dialog v-model="showPublishDialog" title="一键发布" width="520px" destroy-on-close>
      <el-form :model="publishForm" label-width="100px">
        <el-form-item label="选择内容" required>
          <el-select v-model="publishForm.contentId" placeholder="选择要发布的内容" style="width: 100%">
            <el-option
              v-for="c in approvedContents"
              :key="c.id"
              :label="c.title"
              :value="c.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标平台" required>
          <el-checkbox-group v-model="publishForm.platforms">
            <el-checkbox
              v-for="p in enabledPlatforms"
              :key="p.name"
              :label="p.name"
              :value="p.name"
            >
              {{ p.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-radio-group v-model="publishForm.timing">
            <el-radio value="now">立即发布</el-radio>
            <el-radio value="scheduled">定时发布</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPublishDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPublish">确认发布</el-button>
      </template>
    </el-dialog>

    <!-- Log Detail Dialog -->
    <el-dialog v-model="showLogDialog" title="发布详情" width="520px">
      <template v-if="selectedTask">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="内容">{{ selectedTask.title }}</el-descriptions-item>
          <el-descriptions-item label="平台">
            <el-tag v-for="p in selectedTask.platforms" :key="p" size="small" style="margin-right: 4px">{{ p }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusType(selectedTask.status)" size="small">{{ statusLabel(selectedTask.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedTask.createdAt }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="selectedTask.results.length" style="margin-top: 16px">
          <h4 style="margin-bottom: 8px; color: #303133">发布结果</h4>
          <div v-for="r in selectedTask.results" :key="r.platform" class="result-item">
            <el-tag :type="r.status === 'success' ? 'success' : 'danger'" size="small">{{ r.platform }}</el-tag>
            <el-link v-if="r.url" type="primary" :href="r.url" target="_blank">{{ r.url }}</el-link>
            <span v-if="r.error" class="error-text">{{ r.error }}</span>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Clock, Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { mockPublishQueue, mockPlatforms, mockPublishLogs, mockContents } from '@/api/mock'
import type { PublishTask, Platform, PublishLog } from '@/types/publish'

const queue = ref<PublishTask[]>([...mockPublishQueue])
const platforms = ref<Platform[]>([...mockPlatforms])
const logs = ref<PublishLog[]>([...mockPublishLogs])

const showPublishDialog = ref(false)
const showLogDialog = ref(false)
const selectedTask = ref<PublishTask | null>(null)

const publishForm = ref({
  contentId: null as number | null,
  platforms: [] as string[],
  timing: 'now'
})

const approvedContents = mockContents.filter(c => c.status === 'approved' || c.status === 'published')
const enabledPlatforms = computed(() => platforms.value.filter(p => p.enabled))
const hasPending = computed(() => queue.value.some(q => q.status === 'pending'))

const queueStats = computed(() => ({
  pending: queue.value.filter(q => q.status === 'pending').length,
  running: queue.value.filter(q => q.status === 'running').length,
  success: queue.value.filter(q => q.status === 'success').length,
  failed: queue.value.filter(q => q.status === 'failed').length,
}))

function statusType(status: string) {
  const map: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    success: 'success',
    failed: 'danger'
  }
  return map[status] || 'info'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: '待发布',
    running: '发布中',
    success: '已成功',
    failed: '失败'
  }
  return map[status] || status
}

function handleViewLog(task: PublishTask) {
  selectedTask.value = task
  showLogDialog.value = true
}

function handleViewResult(task: PublishTask) {
  selectedTask.value = task
  showLogDialog.value = true
}

function handleRetry(task: PublishTask) {
  const index = queue.value.findIndex(q => q.id === task.id)
  if (index !== -1) {
    queue.value[index] = { ...queue.value[index], status: 'running', results: [] }
    ElMessage.info('正在重新发布...')
    setTimeout(() => {
      queue.value[index] = {
        ...queue.value[index],
        status: 'success',
        results: queue.value[index].platforms.map(p => ({ platform: p, status: 'success' as const, url: `https://${p.toLowerCase()}.com/post/${Date.now()}` }))
      }
      ElMessage.success('发布成功')
    }, 2000)
  }
}

function handleBatchPublish() {
  queue.value = queue.value.map(q =>
    q.status === 'pending' ? { ...q, status: 'running' } : q
  )
  ElMessage.info('批量发布已启动')
}

function handleConfigPlatform(platform: Platform) {
  ElMessage.info(`配置 ${platform.name} 平台（功能开发中）`)
}

function handleSubmitPublish() {
  if (!publishForm.value.contentId || publishForm.value.platforms.length === 0) {
    ElMessage.warning('请选择内容和目标平台')
    return
  }
  const content = approvedContents.find(c => c.id === publishForm.value.contentId)
  const newTask: PublishTask = {
    id: queue.value.length + 1,
    contentId: publishForm.value.contentId,
    title: content?.title || '',
    platforms: publishForm.value.platforms,
    status: 'pending',
    results: [],
    createdAt: new Date().toLocaleString('zh-CN')
  }
  queue.value.unshift(newTask)
  logs.value.unshift({
    id: logs.value.length + 1,
    timestamp: new Date().toLocaleString('zh-CN'),
    type: 'info',
    message: `新增发布任务：${content?.title} -> ${publishForm.value.platforms.join(', ')}`
  })
  showPublishDialog.value = false
  publishForm.value = { contentId: null, platforms: [], timing: 'now' }
  ElMessage.success('发布任务已创建')
}
</script>

<style scoped>
.publish-page {
  max-width: 1400px;
}

.publish-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.pstat-item {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.pstat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pstat-info {
  display: flex;
  flex-direction: column;
}

.pstat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.pstat-label {
  font-size: 12px;
  color: #909399;
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.platform-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.platform-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #303133;
  font-weight: 500;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.result-item:last-child {
  border-bottom: none;
}

.error-text {
  color: #f56c6c;
  font-size: 13px;
}
</style>
