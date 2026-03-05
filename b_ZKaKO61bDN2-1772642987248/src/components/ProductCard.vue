<template>
  <el-card class="product-card" shadow="hover" :body-style="{ padding: '0' }">
    <div class="card-image-wrapper">
      <el-image :src="product.imageUrl" fit="cover" class="card-image">
        <template #error>
          <div class="image-placeholder">
            <el-icon :size="32"><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      <div class="card-badge">
        <el-tag
          :type="statusMap[product.status]?.type || 'info'"
          size="small"
          effect="dark"
        >
          {{ statusMap[product.status]?.label || product.status }}
        </el-tag>
      </div>
      <div class="potential-score" v-if="product.potentialScore">
        <span class="score-value">{{ product.potentialScore }}</span>
        <span class="score-label">潜力</span>
      </div>
    </div>
    <div class="card-content">
      <h3 class="card-title" :title="product.title">{{ product.title }}</h3>
      <div class="card-meta">
        <span class="price">${{ product.price.toFixed(2) }}</span>
        <div class="rating-info">
          <el-rate
            :model-value="product.rating"
            disabled
            :size="'small'"
            :colors="['#f7ba2a', '#f7ba2a', '#f7ba2a']"
          />
          <span class="review-count">{{ product.reviewCount }} 评论</span>
        </div>
      </div>
      <div class="card-tags">
        <el-tag size="small" type="info" effect="plain">{{ product.category }}</el-tag>
        <el-tag size="small" effect="plain">ASIN: {{ product.asin.slice(0, 6) }}...</el-tag>
      </div>
      <div class="card-actions">
        <el-button size="small" @click="$emit('materials', product)">
          <el-icon><Folder /></el-icon>
          查看素材
        </el-button>
        <el-button size="small" type="primary" @click="$emit('generate', product)">
          <el-icon><MagicStick /></el-icon>
          生成内容
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { Product } from '@/types/product'
import { Picture, Folder, MagicStick } from '@element-plus/icons-vue'

defineProps<{
  product: Product
}>()

defineEmits<{
  materials: [product: Product]
  generate: [product: Product]
}>()

const statusMap: Record<string, { type: 'success' | 'warning' | 'info' | 'danger'; label: string }> = {
  pending: { type: 'info', label: '待评测' },
  researching: { type: 'warning', label: '研究中' },
  covered: { type: 'success', label: '已覆盖' },
  ignored: { type: 'danger', label: '已忽略' }
}
</script>

<style scoped>
.product-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.card-image-wrapper {
  position: relative;
  height: 180px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.card-image {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #c0c4cc;
}

.card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
}

.potential-score {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.65);
  border-radius: 8px;
  padding: 4px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-value {
  font-size: 16px;
  font-weight: 700;
  color: #67c23a;
}

.score-label {
  font-size: 10px;
  color: #ffffff;
  opacity: 0.8;
}

.card-content {
  padding: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 10px;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.price {
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.review-count {
  font-size: 12px;
  color: #909399;
}

.card-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-actions .el-button {
  flex: 1;
}
</style>
