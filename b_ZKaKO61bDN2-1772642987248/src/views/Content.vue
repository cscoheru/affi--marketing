<template>
  <div class="content-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1>内容管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><MagicStick /></el-icon>
        AI 生成内容
      </el-button>
    </div>

    <!-- Tabs -->
    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="`全部 (${allContents.length})`" name="all">
          <ContentTable
            :contents="allContents"
            @edit="handleEdit"
            @review="handleReview"
            @publish="handlePublish"
            @delete="handleDelete"
          />
        </el-tab-pane>
        <el-tab-pane :label="`草稿 (${draftContents.length})`" name="draft">
          <ContentTable
            :contents="draftContents"
            @edit="handleEdit"
            @review="handleReview"
            @delete="handleDelete"
          />
        </el-tab-pane>
        <el-tab-pane :label="`待审核 (${reviewingContents.length})`" name="reviewing">
          <ContentTable
            :contents="reviewingContents"
            @edit="handleEdit"
            @review="handleReview"
            @delete="handleDelete"
          />
        </el-tab-pane>
        <el-tab-pane :label="`已发布 (${publishedContents.length})`" name="published">
          <ContentTable
            :contents="publishedContents"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- AI Generate Dialog -->
    <el-dialog v-model="showCreateDialog" title="AI 生成内容" width="600px" destroy-on-close>
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="选择产品" required>
          <el-select v-model="createForm.productAsin" placeholder="选择产品" style="width: 100%">
            <el-option
              v-for="p in productOptions"
              :key="p.asin"
              :label="p.title"
              :value="p.asin"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="内容类型" required>
          <el-radio-group v-model="createForm.type">
            <el-radio value="review">评测文章</el-radio>
            <el-radio value="science">科普文章</el-radio>
            <el-radio value="guide">购买指南</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="AI 模型">
          <el-select v-model="createForm.model" style="width: 100%">
            <el-option label="Claude 3.5 Sonnet" value="claude-3-5-sonnet" />
            <el-option label="GPT-4" value="gpt-4" />
            <el-option label="GPT-4o" value="gpt-4o" />
          </el-select>
        </el-form-item>
        <el-form-item label="写作风格">
          <el-select v-model="createForm.style" style="width: 100%">
            <el-option label="专业严谨" value="professional" />
            <el-option label="轻松活泼" value="casual" />
            <el-option label="详细对比" value="comparison" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标字数">
          <el-slider v-model="createForm.wordCount" :min="500" :max="5000" :step="100" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleGenerate" :loading="generating">
          开始生成
        </el-button>
      </template>
    </el-dialog>

    <!-- Review Dialog -->
    <el-dialog v-model="showReviewDialog" title="内容审核" width="800px" destroy-on-close>
      <template v-if="reviewingContent">
        <div class="review-header">
          <h2 class="review-title">{{ reviewingContent.title }}</h2>
          <div class="review-meta">
            <el-tag size="small">{{ typeLabel[reviewingContent.type] }}</el-tag>
            <span class="meta-item">{{ reviewingContent.wordCount }} 字</span>
            <span class="meta-item" v-if="reviewingContent.aiScore">
              AI 置信度: {{ reviewingContent.aiScore }}%
            </span>
          </div>
        </div>
        <el-divider />
        <div class="review-body" v-html="reviewingContent.html || reviewingContent.content"></div>
        <el-divider />
        <el-form :model="reviewForm" label-width="100px">
          <el-form-item label="审核结果" required>
            <el-radio-group v-model="reviewForm.decision">
              <el-radio value="approve">
                <span style="color: #67c23a">通过</span>
              </el-radio>
              <el-radio value="reject">
                <span style="color: #f56c6c">拒绝</span>
              </el-radio>
              <el-radio value="revision">
                <span style="color: #e6a23c">需修改</span>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input
              v-model="reviewForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入审核意见..."
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交审核</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog v-model="showEditDialog" title="编辑内容" width="800px" destroy-on-close>
      <template v-if="editingContent">
        <el-form :model="editingContent" label-width="80px">
          <el-form-item label="标题">
            <el-input v-model="editingContent.title" />
          </el-form-item>
          <el-form-item label="类型">
            <el-radio-group v-model="editingContent.type">
              <el-radio value="review">评测文章</el-radio>
              <el-radio value="science">科普文章</el-radio>
              <el-radio value="guide">购买指南</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="内容">
            <el-input
              v-model="editingContent.content"
              type="textarea"
              :rows="15"
              placeholder="编辑内容..."
            />
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick } from '@element-plus/icons-vue'
import ContentTable from '@/components/ContentTable.vue'
import { mockContents, mockProducts } from '@/api/mock'
import type { Content } from '@/types/content'

const route = useRoute()

const contents = ref<Content[]>([...mockContents])
const activeTab = ref('all')
const showCreateDialog = ref(false)
const showReviewDialog = ref(false)
const showEditDialog = ref(false)
const generating = ref(false)
const reviewingContent = ref<Content | null>(null)
const editingContent = ref<Content | null>(null)

const productOptions = mockProducts.map(p => ({ asin: p.asin, title: p.title }))

const createForm = ref({
  productAsin: '',
  type: 'review' as 'review' | 'science' | 'guide',
  model: 'claude-3-5-sonnet',
  style: 'professional',
  wordCount: 2000
})

const reviewForm = ref({
  decision: 'approve' as 'approve' | 'reject' | 'revision',
  comment: ''
})

const typeLabel: Record<string, string> = {
  review: '评测文章',
  science: '科普文章',
  guide: '购买指南'
}

const allContents = computed(() => contents.value)
const draftContents = computed(() => contents.value.filter(c => c.status === 'draft'))
const reviewingContents = computed(() => contents.value.filter(c => c.status === 'reviewing'))
const publishedContents = computed(() => contents.value.filter(c => c.status === 'published'))

async function handleGenerate() {
  if (!createForm.value.productAsin) {
    ElMessage.warning('请选择产品')
    return
  }
  generating.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))

  const product = mockProducts.find(p => p.asin === createForm.value.productAsin)
  const newContent: Content = {
    id: contents.value.length + 1,
    slug: `generated-${Date.now()}`,
    asin: createForm.value.productAsin,
    title: `${product?.title || '未知产品'} - ${typeLabel[createForm.value.type]}`,
    type: createForm.value.type,
    content: `AI 生成的 ${typeLabel[createForm.value.type]} 内容...`,
    html: `<p>AI 生成的 ${typeLabel[createForm.value.type]} 内容，基于 ${product?.title} 的素材分析。</p>`,
    status: 'draft',
    aiGenerated: true,
    humanReviewed: false,
    aiScore: Math.floor(Math.random() * 15 + 80),
    wordCount: createForm.value.wordCount,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10)
  }
  contents.value.unshift(newContent)
  generating.value = false
  showCreateDialog.value = false
  ElMessage.success('内容生成成功')
}

function handleEdit(content: Content) {
  editingContent.value = { ...content }
  showEditDialog.value = true
}

function saveEdit() {
  if (!editingContent.value) return
  const index = contents.value.findIndex(c => c.id === editingContent.value!.id)
  if (index !== -1) {
    contents.value[index] = { ...editingContent.value, updatedAt: new Date().toISOString().slice(0, 10) }
  }
  showEditDialog.value = false
  ElMessage.success('内容已保存')
}

function handleReview(content: Content) {
  reviewingContent.value = content
  reviewForm.value = { decision: 'approve', comment: '' }
  showReviewDialog.value = true
}

function submitReview() {
  if (!reviewingContent.value) return
  const index = contents.value.findIndex(c => c.id === reviewingContent.value!.id)
  if (index !== -1) {
    if (reviewForm.value.decision === 'approve') {
      contents.value[index] = { ...contents.value[index], status: 'approved', humanReviewed: true }
      ElMessage.success('内容已批准')
    } else if (reviewForm.value.decision === 'reject') {
      contents.value[index] = { ...contents.value[index], status: 'draft', humanReviewed: true }
      ElMessage.info('内容已退回')
    } else {
      ElMessage.warning('内容需要修改')
    }
  }
  showReviewDialog.value = false
}

function handlePublish(content: Content) {
  ElMessageBox.confirm('确定要发布此内容吗？', '确认发布', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    const index = contents.value.findIndex(c => c.id === content.id)
    if (index !== -1) {
      contents.value[index] = { ...contents.value[index], status: 'published' }
    }
    ElMessage.success('内容已发布')
  }).catch(() => {})
}

function handleDelete(content: Content) {
  ElMessageBox.confirm('确定要删除此内容吗？此操作不可恢复。', '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    contents.value = contents.value.filter(c => c.id !== content.id)
    ElMessage.success('内容已删除')
  }).catch(() => {})
}

onMounted(() => {
  if (route.query.action === 'generate') {
    showCreateDialog.value = true
    if (route.query.asin) {
      createForm.value.productAsin = route.query.asin as string
    }
  }
})
</script>

<style scoped>
.content-page {
  max-width: 1400px;
}

.review-header {
  margin-bottom: 8px;
}

.review-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.review-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-item {
  font-size: 13px;
  color: #909399;
}

.review-body {
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
  line-height: 1.8;
  color: #303133;
}
</style>
