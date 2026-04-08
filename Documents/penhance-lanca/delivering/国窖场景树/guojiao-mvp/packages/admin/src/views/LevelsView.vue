<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm text-gray-500">等级配置管理</h3>
      <button @click="openCreate" class="px-4 py-2 bg-brand-gold text-white rounded-md text-sm font-medium hover:bg-brand-gold/90">
        <i class="fa-solid fa-plus mr-1"></i>新建等级
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="text-center py-12 text-gray-400 text-sm">加载中...</div>

    <!-- Level Cards -->
    <div v-else class="space-y-3">
      <div v-for="row in store.items" :key="row.id" class="border border-gray-200 rounded-lg overflow-hidden bg-white">
        <!-- Level Row (clickable) -->
        <div class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
          @click="toggleExpand(row.id)">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold text-white text-sm font-bold shrink-0">
            {{ row.level }}
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-gray-800">{{ row.shortName }}</span>
              <span class="text-xs text-gray-400">{{ row.fullName }}</span>
            </div>
            <div class="text-xs text-gray-400 mt-0.5">{{ row.period }}</div>
          </div>
          <!-- Sub-level count badge -->
          <span v-if="asArray(row.subLevels).length"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-gold/10 text-brand-gold shrink-0">
            {{ asArray(row.subLevels).length }} 关
          </span>
          <!-- Expand arrow -->
          <i :class="expandedId === row.id ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right'"
            class="text-gray-300 text-xs shrink-0 transition-transform"></i>
        </div>

        <!-- Expanded: Sub-levels -->
        <div v-if="expandedId === row.id" class="border-t border-gray-100 bg-gray-50/50">
          <!-- Sub-level list -->
          <div v-if="asArray(row.subLevels).length" class="p-4 space-y-2">
            <div v-for="(sub, idx) in asArray(row.subLevels)" :key="sub.id || idx"
              class="flex items-start gap-3 px-3 py-2.5 bg-white rounded-lg border border-gray-100">
              <div class="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold bg-brand-gold/10 text-brand-gold shrink-0 mt-0.5">
                {{ sub.id?.split('-')[1] || idx + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-xs font-medium text-gray-700">{{ sub.title }}</div>
                <div class="text-[10px] text-gray-400 mt-0.5">{{ sub.description }}</div>
                <div v-if="asArray(sub.challenges).length" class="mt-1.5">
                  <div class="text-[10px] font-bold text-gray-400 mb-1">
                    <i class="fa-solid fa-crosshairs mr-0.5"></i>挑战
                  </div>
                  <ul class="space-y-0.5">
                    <li v-for="c in asArray(sub.challenges)" :key="c" class="text-[11px] text-gray-500 flex items-start gap-1.5">
                      <i class="fa-solid fa-circle text-[4px] text-gray-300 mt-1.5 shrink-0"></i>
                      <span>{{ c }}</span>
                    </li>
                  </ul>
                </div>
                <div v-if="asArray(sub.loots).length" class="mt-1.5 flex flex-wrap gap-1">
                  <span v-for="l in asArray(sub.loots)" :key="l"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-brand-gold/5 text-brand-gold border border-brand-gold/10">
                    {{ l }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="px-4 py-6 text-center text-gray-400 text-xs">
            暂无子关卡，点击编辑添加
          </div>

          <!-- 关联技能 -->
          <div class="px-4 pb-3">
            <div class="flex items-center gap-2 mb-2">
              <i class="fa-solid fa-graduation-cap text-xs text-brand-gold"></i>
              <span class="text-xs font-bold text-gray-600">关联技能</span>
            </div>
            <div v-if="getLevelSkills(row.level).length" class="flex flex-wrap gap-1.5">
              <span v-for="s in getLevelSkills(row.level)" :key="s.skill_item_id"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border"
                :class="s.is_required ? 'bg-brand-gold/10 text-brand-gold border-brand-gold/20' : 'bg-gray-50 text-gray-600 border-gray-200'">
                <i class="fa-solid fa-circle-check text-[8px]" v-if="s.is_required"></i>
                {{ s.skill_name || s.skill_item_id }}
              </span>
            </div>
            <div v-else class="text-xs text-gray-300">暂无关联技能，请在技能管理中配置</div>
          </div>

          <!-- Action buttons -->
          <div class="flex items-center gap-2 px-4 pb-3 pt-1">
            <button @click.stop="openEdit(row)"
              class="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50">
              <i class="fa-solid fa-pen mr-1"></i>编辑
            </button>
            <button @click.stop="handleDelete(row)"
              class="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-md hover:bg-red-50">
              <i class="fa-solid fa-trash-can mr-1"></i>删除
            </button>
            <div class="ml-auto">
              <PublishToggle table="levels" :id="row.id" :published="row.isPublished" @changed="loadData" />
            </div>
          </div>
        </div>

        <!-- Collapsed: show edit/delete on hover row actions -->
        <div v-else class="flex items-center justify-end gap-2 px-4 pb-2">
          <button @click.stop="openEdit(row)"
            class="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50">
            <i class="fa-solid fa-pen mr-1"></i>编辑
          </button>
          <button @click.stop="handleDelete(row)"
            class="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-md hover:bg-red-50">
            <i class="fa-solid fa-trash-can mr-1"></i>删除
          </button>
          <PublishToggle table="levels" :id="row.id" :published="row.isPublished" @changed="loadData" />
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Modal :open="modalOpen" :title="editingId ? '编辑等级' : '新建等级'" @close="closeModal" width="lg">
      <form @submit.prevent="handleSave" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">等级序号</label>
            <input v-model.number="form.level" type="number" required min="1"
              class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">时间周期</label>
            <input v-model="form.period" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="如 0-30天" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">简称</label>
            <input v-model="form.shortName" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">全称</label>
            <input v-model="form.fullName" required class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">挑战任务（每行一条）</label>
          <textarea v-model="form.challenges" rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="任务1&#10;任务2&#10;任务3"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">掉落锦囊（每行一条）</label>
          <textarea v-model="form.loots" rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder="锦囊1&#10;锦囊2"></textarea>
        </div>

        <!-- 子关卡管理 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block text-sm font-medium text-gray-700">
              <i class="fa-solid fa-layer-group mr-1 text-brand-gold"></i>二级通关
            </label>
            <button type="button" @click="addSubLevel"
              class="px-3 py-1 text-xs font-medium text-brand-gold border border-brand-gold/30 rounded-md hover:bg-brand-gold/5">
              <i class="fa-solid fa-plus mr-1"></i>添加子关卡
            </button>
          </div>

          <div v-if="form.subLevels.length === 0" class="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
            暂无子关卡，点击上方按钮添加
          </div>

          <div v-for="(sub, idx) in form.subLevels" :key="idx"
            class="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-gray-500">子关卡 {{ idx + 1 }}</span>
              <button type="button" @click="removeSubLevel(idx)"
                class="text-xs text-red-400 hover:text-red-600">
                <i class="fa-solid fa-trash-can mr-1"></i>删除
              </button>
            </div>
            <div class="grid grid-cols-3 gap-3 mb-2">
              <div>
                <label class="block text-xs text-gray-500 mb-1">ID</label>
                <input v-model="sub.id" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="1-1" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">标题</label>
                <input v-model="sub.title" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="基础认知营" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">描述</label>
                <input v-model="sub.description" class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" placeholder="简短描述" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-500 mb-1">通关挑战（每行一条）</label>
                <textarea v-model="sub.challenges" rows="2"
                  class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  placeholder="挑战1&#10;挑战2"></textarea>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">通关锦囊（每行一条）</label>
                <textarea v-model="sub.loots" rows="2"
                  class="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  placeholder="锦囊1&#10;锦囊2"></textarea>
              </div>
            </div>
          </div>
        </div>
      </form>
      <template #footer>
        <button @click="closeModal" class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">取消</button>
        <button @click="handleSave" class="px-4 py-2 text-sm text-white bg-brand-gold rounded-md hover:bg-brand-gold/90">
          {{ editingId ? '保存' : '创建' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Modal from '@/components/common/Modal.vue'
import PublishToggle from '@/components/common/PublishToggle.vue'
import { useEntityStore } from '@/stores/entities'
import { adminCreate, adminUpdate, adminDelete, authHeaders } from '@/api/client'

const API_BASE = import.meta.env.VITE_API_BASE || ''

interface SubLevelForm {
  id: string
  title: string
  description: string
  challenges: string
  loots: string
}

const store = useEntityStore('levels')
const expandedId = ref<number | null>(null)
const skillMapData = ref<any[]>([])

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

async function loadSkillMap() {
  try {
    const res = await fetch(`${API_BASE}/admin/api/skill-level-map`, { headers: authHeaders() })
    if (res.ok) {
      const data = await res.json()
      skillMapData.value = data.mappings || []
    }
  } catch (e) { console.error(e) }
}

function getLevelSkills(levelId: number) {
  return skillMapData.value.filter(m => m.level_id === levelId)
}

const modalOpen = ref(false)
const editingId = ref<number | null>(null)
const form = ref({
  level: 1, shortName: '', fullName: '', period: '',
  challenges: '', loots: '', subLevels: [] as SubLevelForm[],
})

function linesToArray(text: string): string[] {
  return text.split('\n').map(s => s.trim()).filter(Boolean)
}

function loadData() { store.fetchList() }

function addSubLevel() {
  const nextNum = form.value.subLevels.length + 1
  form.value.subLevels.push({
    id: `${form.value.level}-${nextNum}`,
    title: '',
    description: '',
    challenges: '',
    loots: '',
  })
}

function removeSubLevel(idx: number) {
  form.value.subLevels.splice(idx, 1)
}

function openCreate() {
  editingId.value = null
  form.value = { level: store.items.length + 1, shortName: '', fullName: '', period: '', challenges: '', loots: '', subLevels: [] }
  modalOpen.value = true
}

function asArray(val: any): any[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') { try { const p = JSON.parse(val); if (Array.isArray(p)) return p } catch { /* */ } }
  return []
}

function openEdit(row: any) {
  editingId.value = row.id
  const subs: SubLevelForm[] = asArray(row.subLevels).map((s: any) => ({
    id: s.id || '',
    title: s.title || '',
    description: s.description || '',
    challenges: asArray(s.challenges).join('\n'),
    loots: asArray(s.loots).join('\n'),
  }))
  form.value = {
    level: row.level, shortName: row.shortName || '', fullName: row.fullName || '',
    period: row.period || '',
    challenges: asArray(row.challenges).join('\n'),
    loots: asArray(row.loots).join('\n'),
    subLevels: subs,
  }
  modalOpen.value = true
}

function closeModal() { modalOpen.value = false }

async function handleSave() {
  const subLevels = form.value.subLevels.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    challenges: linesToArray(s.challenges),
    loots: linesToArray(s.loots),
  })).filter(s => s.title)

  const data = {
    level: form.value.level,
    shortName: form.value.shortName,
    fullName: form.value.fullName,
    period: form.value.period,
    challenges: linesToArray(form.value.challenges),
    loots: linesToArray(form.value.loots),
    subLevels,
  }
  try {
    if (editingId.value) {
      await adminUpdate('levels', editingId.value, data)
    } else {
      await adminCreate('levels', data)
    }
    closeModal()
    loadData()
  } catch (e: any) {
    alert(e.message || '操作失败')
  }
}

async function handleDelete(row: any) {
  if (!confirm(`确认删除等级 ${row.level} "${row.fullName}"？`)) return
  try {
    await adminDelete('levels', row.id)
    loadData()
  } catch (e: any) { alert(e.message || '删除失败') }
}

onMounted(() => { loadData(); loadSkillMap() })
</script>
