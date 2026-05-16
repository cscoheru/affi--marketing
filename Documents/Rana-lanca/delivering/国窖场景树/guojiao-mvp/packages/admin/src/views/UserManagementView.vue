<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-bold text-gray-800">用户管理</h2>
        <p class="text-xs text-gray-400 mt-1">管理系统用户，支持创建、编辑、分配团队和设置权限</p>
      </div>
      <button
        @click="openCreateModal"
        class="px-4 py-2 bg-brand-gold text-white rounded-lg text-sm font-medium hover:bg-brand-gold/90 transition-colors"
      >
        <i class="fa-solid fa-plus mr-2"></i>新增用户
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <div class="text-2xl font-bold text-gray-800">{{ userStats.total }}</div>
        <div class="text-xs text-gray-400 mt-1">总用户数</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <div class="text-2xl font-bold text-blue-600">{{ userStats.l1 }}</div>
        <div class="text-xs text-gray-400 mt-1">大区总</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <div class="text-2xl font-bold text-green-600">{{ userStats.l2 }}</div>
        <div class="text-xs text-gray-400 mt-1">片区经理</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <div class="text-2xl font-bold text-amber-600">{{ userStats.l3 }}</div>
        <div class="text-xs text-gray-400 mt-1">城市经理</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm border p-4">
        <div class="text-2xl font-bold text-purple-600">{{ userStats.l4 + userStats.l5 }}</div>
        <div class="text-xs text-gray-400 mt-1">主管+业代</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border p-4 mb-4">
      <div class="flex gap-4">
        <input
          v-model="filters.keyword"
          placeholder="搜索用户姓名或手机号..."
          class="flex-1 border rounded-md px-3 py-2 text-sm"
        />
        <select v-model="filters.teamLevel" class="border rounded-md px-3 py-2 text-sm">
          <option value="">全部级别</option>
          <option value="1">大区总 (L1)</option>
          <option value="2">片区经理 (L2)</option>
          <option value="3">城市经理 (L3)</option>
          <option value="4">区县主管 (L4)</option>
          <option value="5">业代 (L5)</option>
        </select>
        <select v-model="filters.teamId" class="border rounded-md px-3 py-2 text-sm">
          <option value="">全部团队</option>
          <option v-for="t in allTeams" :key="t.id" :value="t.name">{{ t.name }}</option>
        </select>
        <button @click="loadUsers" class="px-4 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200">筛选</button>
        <button @click="clearFilters" class="px-4 py-2 text-gray-500 text-sm hover:text-gray-700">清除</button>
      </div>
    </div>

    <!-- User Table -->
    <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="bg-gray-50 text-xs text-gray-400">
            <th class="text-left py-3 px-4 font-medium">手机号</th>
            <th class="text-left py-3 px-4 font-medium">昵称</th>
            <th class="text-left py-3 px-4 font-medium">角色</th>
            <th class="text-left py-3 px-4 font-medium">团队</th>
            <th class="text-left py-3 px-4 font-medium">等级</th>
            <th class="text-left py-3 px-4 font-medium">权限</th>
            <th class="text-left py-3 px-4 font-medium">状态</th>
            <th class="text-right py-3 px-4 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id" class="border-t border-gray-100 hover:bg-gray-50">
            <td class="py-3 px-4 font-mono text-sm">{{ user.phone }}</td>
            <td class="py-3 px-4">
              <div class="font-medium text-gray-800">{{ user.nickname }}</div>
            </td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded text-xs" :class="getRoleClass(user.role_name)">
                {{ user.role_name || '普通用户' }}
              </span>
            </td>
            <td class="py-3 px-4">
              <div class="text-sm">
                <span v-if="user.team_name" class="text-gray-700">{{ user.team_name }}</span>
                <span v-else class="text-gray-400">未分配</span>
                <span v-if="user.is_leader" class="ml-1 text-xs text-amber-500">👑</span>
              </div>
              <div v-if="user.parent_team" class="text-xs text-gray-400">{{ user.parent_team }}</div>
            </td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                L{{ user.team_level || '-' }}
              </span>
            </td>
            <td class="py-3 px-4">
              <div class="flex flex-wrap gap-1">
                <span v-for="perm in getUserPermissions(user)" :key="perm"
                  class="px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600">
                  {{ perm }}
                </span>
              </div>
            </td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded text-xs" :class="user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'">
                {{ user.is_active ? '启用' : '禁用' }}
              </span>
            </td>
            <td class="py-3 px-4 text-right whitespace-nowrap">
              <button @click="editUser(user)" class="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded mr-1">编辑</button>
              <button @click="assignTeam(user)" class="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded mr-1">分配团队</button>
              <button @click="deleteUser(user)" class="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded">删除</button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="8" class="py-12 text-center text-gray-400 text-sm">暂无用户数据</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showModal = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div class="p-5 border-b flex items-center justify-between">
          <h3 class="text-base font-bold text-gray-800">{{ editingUser ? '编辑' : '新增' }}用户</h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">手机号 <span class="text-red-400">*</span></label>
            <input v-model="form.phone" :disabled="!!editingUser" placeholder="139xxxxxxx" class="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">昵称 <span class="text-red-400">*</span></label>
            <input v-model="form.nickname" placeholder="输入昵称" class="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div v-if="!editingUser">
            <label class="block text-xs text-gray-500 mb-1">密码 <span class="text-red-400">*</span></label>
            <input v-model="form.password" type="password" placeholder="输入密码" class="w-full border rounded-md px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">角色</label>
            <select v-model="form.role_id" class="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">选择角色</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">用户状态</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2">
                <input type="radio" v-model="form.is_active" :value="true" /> 启用
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" v-model="form.is_active" :value="false" /> 禁用
              </label>
            </div>
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-3">
          <button @click="showModal = false" class="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">取消</button>
          <button @click="saveUser" :disabled="!form.phone || !form.nickname || (!editingUser && !form.password)" class="px-4 py-2 bg-brand-gold text-white rounded-md text-sm font-medium hover:bg-brand-gold/90 disabled:opacity-40">
            {{ editingUser ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Assign Team Modal -->
    <div v-if="showTeamModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showTeamModal = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="p-5 border-b">
          <h3 class="text-base font-bold text-gray-800">分配团队 - {{ assigningUser?.nickname }}</h3>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-xs text-gray-500 mb-1">选择团队</label>
            <select v-model="teamForm.team_name" class="w-full border rounded-md px-3 py-2 text-sm">
              <option value="">选择团队</option>
              <optgroup v-for="level in [1,2,3,4]" :key="level" :label="`L${level}`">
                <option v-for="t in getTeamsByLevel(level)" :key="t.id" :value="t.name">{{ t.name }}</option>
              </optgroup>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">团队等级</label>
            <select v-model="teamForm.team_level" class="w-full border rounded-md px-3 py-2 text-sm">
              <option value="1">L1 - 大区</option>
              <option value="2">L2 - 片区</option>
              <option value="3">L3 - 城市</option>
              <option value="4">L4 - 区县</option>
              <option value="5">L5 - 业代</option>
            </select>
          </div>
          <div>
            <label class="flex items-center gap-2">
              <input type="checkbox" v-model="teamForm.is_leader" /> 设为团队负责人
            </label>
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-3">
          <button @click="showTeamModal = false" class="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">取消</button>
          <button @click="saveTeamAssignment" :disabled="!teamForm.team_name" class="px-4 py-2 bg-brand-gold text-white rounded-md text-sm font-medium hover:bg-brand-gold/90 disabled:opacity-40">
            确认分配
          </button>
        </div>
      </div>
    </div>

    <!-- Permission Modal -->
    <div v-if="showPermModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50" @click.self="showPermModal = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="p-5 border-b">
          <h3 class="text-base font-bold text-gray-800">权限设置 - {{ permUser?.nickname }}</h3>
        </div>
        <div class="p-5 space-y-3">
          <div v-for="perm in allPermissions" :key="perm.key" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div class="font-medium text-sm">{{ perm.label }}</div>
              <div class="text-xs text-gray-400">{{ perm.description }}</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="permForm.permissions" :value="perm.key" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-gold"></div>
            </label>
          </div>
        </div>
        <div class="p-5 border-t flex justify-end gap-3">
          <button @click="showPermModal = false" class="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">取消</button>
          <button @click="savePermissions" class="px-4 py-2 bg-brand-gold text-white rounded-md text-sm font-medium hover:bg-brand-gold/90">
            保存权限
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { authHeaders } from '@/api/client'
import { useFeatureFlagStore } from '@/stores/featureFlagStore'

const API_BASE = import.meta.env.VITE_API_BASE || ''
const flagStore = useFeatureFlagStore()

// Permission definitions
const allPermissions = [
  { key: 'admin.user_management.create', label: '创建用户', description: '可以创建新用户' },
  { key: 'admin.user_management.edit', label: '编辑用户', description: '可以编辑用户信息' },
  { key: 'admin.user_management.delete', label: '删除用户', description: '可以删除用户' },
  { key: 'admin.user_management.assign', label: '分配团队', description: '可以为用户分配团队' },
  { key: 'admin.user_management.permission', label: '权限管理', description: '可以设置用户权限' },
  { key: 'admin.team_management.view', label: '查看团队', description: '可以查看团队信息' },
  { key: 'admin.team_management.edit', label: '编辑团队', description: '可以编辑团队' },
]

// State
const users = ref<any[]>([])
const roles = ref<any[]>([])
const allTeams = ref<any[]>([])
const showModal = ref(false)
const showTeamModal = ref(false)
const showPermModal = ref(false)
const editingUser = ref<any>(null)
const assigningUser = ref<any>(null)
const permUser = ref<any>(null)

const form = reactive({
  phone: '',
  nickname: '',
  password: '',
  role_id: '',
  is_active: true,
})

const teamForm = reactive({
  team_name: '',
  team_level: 5,
  is_leader: false,
})

const permForm = reactive({
  permissions: [] as string[],
})

const filters = reactive({
  keyword: '',
  teamLevel: '',
  teamId: '',
})

const userStats = computed(() => {
  const stats = { total: users.value.length, l1: 0, l2: 0, l3: 0, l4: 0, l5: 0 }
  users.value.forEach(u => {
    const level = u.team_level || 0
    if (level === 1) stats.l1++
    else if (level === 2) stats.l2++
    else if (level === 3) stats.l3++
    else if (level === 4) stats.l4++
    else if (level >= 5) stats.l5++
  })
  return stats
})

// Permission check
function hasPermission(key: string): boolean {
  return flagStore.isEnabled(key)
}

function getUserPermissions(user: any): string[] {
  // Return simplified permission labels for display
  return []
}

// Helper functions
function getRoleClass(role: string): string {
  const map: Record<string, string> = {
    '系统管理员': 'bg-red-50 text-red-600',
    '编辑': 'bg-blue-50 text-blue-600',
    '查看者': 'bg-gray-100 text-gray-600',
    '普通用户': 'bg-gray-50 text-gray-500',
  }
  return map[role] || 'bg-gray-50 text-gray-500'
}

function getTeamsByLevel(level: number) {
  return allTeams.value.filter(t => t.team_level === level)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// Load data
async function loadUsers() {
  try {
    const res = await fetch(`${API_BASE}/admin/api/users`, { headers: authHeaders() })
    const data = await res.json()
    users.value = data.items || data.users || []
  } catch (e) {
    console.error('Failed to load users:', e)
  }
}

async function loadRoles() {
  try {
    const res = await fetch(`${API_BASE}/admin/api/roles`, { headers: authHeaders() })
    const data = await res.json()
    roles.value = data.items || data.roles || []
  } catch (e) {
    console.error('Failed to load roles:', e)
  }
}

async function loadTeams() {
  try {
    const res = await fetch(`${API_BASE}/admin/api/team/list`, { headers: authHeaders() })
    const data = await res.json()
    allTeams.value = data.teams || []
  } catch (e) {
    console.error('Failed to load teams:', e)
  }
}

// Modal actions
function openCreateModal() {
  editingUser.value = null
  form.phone = ''
  form.nickname = ''
  form.password = ''
  form.role_id = ''
  form.is_active = true
  showModal.value = true
}

function editUser(user: any) {
  editingUser.value = user
  form.phone = user.phone
  form.nickname = user.nickname
  form.password = ''
  form.role_id = user.role_id || ''
  form.is_active = user.is_active !== false
  showModal.value = true
}

function assignTeam(user: any) {
  assigningUser.value = user
  teamForm.team_name = user.team_name || ''
  teamForm.team_level = user.team_level || 5
  teamForm.is_leader = user.is_leader || false
  showTeamModal.value = true
}

function deleteUser(user: any) {
  if (!confirm(`确定删除用户 ${user.nickname}？`)) return
  // Implementation would call DELETE /admin/api/users/{id}
  alert('删除功能需要后端支持')
}

// Save actions
async function saveUser() {
  if (!form.phone || !form.nickname) return

  const method = editingUser.value ? 'PUT' : 'POST'
  const url = editingUser.value
    ? `${API_BASE}/admin/api/users/${editingUser.value.id}`
    : `${API_BASE}/api/auth/register`

  const body = editingUser.value
    ? { nickname: form.nickname, role_id: form.role_id, is_active: form.is_active }
    : { phone: form.phone, nickname: form.nickname, password: form.password, role_id: form.role_id }

  try {
    const res = await fetch(url, {
      method,
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      showModal.value = false
      loadUsers()
    }
  } catch (e) {
    console.error('Failed to save user:', e)
  }
}

async function saveTeamAssignment() {
  if (!assigningUser.value || !teamForm.team_name) return

  try {
    const res = await fetch(`${API_BASE}/admin/api/team/assign`, {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: assigningUser.value.id,
        team_name: teamForm.team_name,
        team_level: parseInt(teamForm.team_level),
        is_leader: teamForm.is_leader,
      }),
    })
    if (res.ok) {
      showTeamModal.value = false
      loadUsers()
    }
  } catch (e) {
    console.error('Failed to assign team:', e)
  }
}

function savePermissions() {
  alert('权限保存功能需要后端支持')
  showPermModal.value = false
}

function clearFilters() {
  filters.keyword = ''
  filters.teamLevel = ''
  filters.teamId = ''
  loadUsers()
}

// Lifecycle
onMounted(() => {
  loadUsers()
  loadRoles()
  loadTeams()
})
</script>