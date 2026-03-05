<template>
  <div class="products-page">
    <!-- Page Header -->
    <div class="page-header">
      <h1>产品候选库</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加产品
      </el-button>
    </div>

    <!-- Filters -->
    <el-card class="filter-card" shadow="never">
      <div class="filters">
        <el-input
          v-model="searchText"
          placeholder="搜索产品名称或 ASIN..."
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select v-model="filterCategory" placeholder="全部类别" clearable>
          <el-option label="咖啡机" value="咖啡机" />
          <el-option label="咖啡豆" value="咖啡豆" />
          <el-option label="手冲器具" value="手冲器具" />
          <el-option label="磨豆机" value="磨豆机" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="全部状态" clearable>
          <el-option label="待评测" value="pending" />
          <el-option label="研究中" value="researching" />
          <el-option label="已覆盖" value="covered" />
          <el-option label="已忽略" value="ignored" />
        </el-select>
        <el-select v-model="sortBy" placeholder="排序方式">
          <el-option label="潜力分数" value="potentialScore" />
          <el-option label="价格从低到高" value="priceAsc" />
          <el-option label="价格从高到低" value="priceDesc" />
          <el-option label="评分最高" value="rating" />
        </el-select>
      </div>
    </el-card>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-number">{{ products.length }}</span>
        <span class="stat-label">总产品数</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ products.filter(p => p.status === 'researching').length }}</span>
        <span class="stat-label">研究中</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ products.filter(p => p.status === 'covered').length }}</span>
        <span class="stat-label">已覆盖</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ products.filter(p => p.status === 'pending').length }}</span>
        <span class="stat-label">待评测</span>
      </div>
    </div>

    <!-- Product Grid -->
    <div class="product-grid">
      <ProductCard
        v-for="product in filteredProducts"
        :key="product.id"
        :product="product"
        @materials="handleViewMaterials"
        @generate="handleGenerate"
      />
    </div>

    <el-empty v-if="filteredProducts.length === 0" description="暂无匹配的产品" />

    <!-- Add Product Dialog -->
    <el-dialog v-model="showAddDialog" title="添加产品" width="520px" destroy-on-close>
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="Amazon ASIN" required>
          <el-input v-model="addForm.asin" placeholder="例如：B0DCZY7VR3" />
        </el-form-item>
        <el-form-item label="产品名称" required>
          <el-input v-model="addForm.title" placeholder="输入产品名称" />
        </el-form-item>
        <el-form-item label="产品类别" required>
          <el-select v-model="addForm.category" placeholder="选择类别" style="width: 100%">
            <el-option label="咖啡机" value="咖啡机" />
            <el-option label="咖啡豆" value="咖啡豆" />
            <el-option label="手冲器具" value="手冲器具" />
            <el-option label="磨豆机" value="磨豆机" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格 ($)">
          <el-input-number v-model="addForm.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddProduct">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import ProductCard from '@/components/ProductCard.vue'
import { mockProducts } from '@/api/mock'
import type { Product } from '@/types/product'

const router = useRouter()

const products = ref<Product[]>([...mockProducts])
const searchText = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const sortBy = ref('potentialScore')
const showAddDialog = ref(false)

const addForm = ref({
  asin: '',
  title: '',
  category: '',
  price: 0
})

const filteredProducts = computed(() => {
  let result = [...products.value]

  if (searchText.value) {
    const query = searchText.value.toLowerCase()
    result = result.filter(p =>
      p.title.toLowerCase().includes(query) || p.asin.toLowerCase().includes(query)
    )
  }

  if (filterCategory.value) {
    result = result.filter(p => p.category === filterCategory.value)
  }

  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }

  switch (sortBy.value) {
    case 'potentialScore':
      result.sort((a, b) => b.potentialScore - a.potentialScore)
      break
    case 'priceAsc':
      result.sort((a, b) => a.price - b.price)
      break
    case 'priceDesc':
      result.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break
  }

  return result
})

function handleViewMaterials(product: Product) {
  router.push({ path: '/materials', query: { asin: product.asin } })
}

function handleGenerate(product: Product) {
  router.push({ path: '/content', query: { asin: product.asin, action: 'generate' } })
}

function handleAddProduct() {
  if (!addForm.value.asin || !addForm.value.title || !addForm.value.category) {
    ElMessage.warning('请填写必填字段')
    return
  }
  const newProduct: Product = {
    id: products.value.length + 1,
    asin: addForm.value.asin,
    title: addForm.value.title,
    category: addForm.value.category,
    price: addForm.value.price,
    rating: 0,
    reviewCount: 0,
    imageUrl: '',
    status: 'pending',
    potentialScore: 0,
    createdAt: new Date().toISOString().slice(0, 10)
  }
  products.value.unshift(newProduct)
  showAddDialog.value = false
  addForm.value = { asin: '', title: '', category: '', price: 0 }
  ElMessage.success('产品添加成功')
}
</script>

<style scoped>
.products-page {
  max-width: 1400px;
}

.filter-card {
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
</style>
