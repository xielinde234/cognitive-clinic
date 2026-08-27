<template>
  <div class="kb-manager">
    <header class="topbar">
      <h2>📚 知识库管理</h2>
      <p>查看和管理方法论知识库内容</p>
    </header>

    <div class="kb-content">
      <!-- 统计信息 -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ stats.totalEntries }}</div>
          <div class="stat-label">总条目数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.filters }}</div>
          <div class="stat-label">滤网</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.toxins }}</div>
          <div class="stat-label">话术翻译</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.methods }}</div>
          <div class="stat-label">方法论</div>
        </div>
      </div>

      <!-- 条目列表 -->
      <div class="entries-list">
        <div
          v-for="entry in entries"
          :key="entry.id"
          class="entry-card"
          @click="toggleExpand(entry.id)"
        >
          <div class="entry-header">
            <span :class="['entry-type', `type-${entry.type}`]">{{ getTypeLabel(entry.type) }}</span>
            <h3>{{ entry.title }}</h3>
            <span class="expand-icon">{{ expandedId === entry.id ? '▼' : '▶' }}</span>
          </div>
          <div class="entry-core">{{ entry.core }}</div>
          <div v-if="expandedId === entry.id" class="entry-body">
            <p>{{ entry.body }}</p>
            <div v-if="entry.metaphor" class="metaphor">
              💡 生活比喻：{{ entry.metaphor }}
            </div>
            <div class="tags">
              <span v-for="tag in entry.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const entries = ref([])
const expandedId = ref(null)

const stats = computed(() => {
  const types = {}
  entries.value.forEach(e => {
    types[e.type] = (types[e.type] || 0) + 1
  })
  return {
    totalEntries: entries.value.length,
    filters: types.filter || 0,
    toxins: types.toxin || 0,
    methods: (types.method || 0) + (types.analysis_method || 0),
    dimensions: types.dimension || 0,
    grades: types.grade || 0,
    foundations: types.foundation || 0,
  }
})

function getTypeLabel(type) {
  const labels = {
    filter: '滤网',
    toxin: '话术翻译',
    method: '方法',
    dimension: '评分维度',
    grade: '诊断等级',
    case: '案例',
    foundation: '基础',
    analysis_method: '分析方法',
    scope: '适用范围',
    investment: '投资指南',
  }
  return labels[type] || type
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

async function fetchEntries() {
  try {
    const res = await fetch('/api/kb/browse')
    const data = await res.json()
    // 需要获取完整条目内容
    const fullRes = await fetch('/api/kb/entries')
    const fullData = await fullRes.json()
    entries.value = fullData.entries || []
  } catch (e) {
    console.error('Failed to fetch KB entries:', e)
  }
}

onMounted(() => {
  fetchEntries()
})
</script>

<style scoped>
.kb-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.topbar {
  padding: 20px 28px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  backdrop-filter: blur(8px);
}

.topbar h2 {
  font-size: 20px;
  margin-bottom: 4px;
}

.topbar p {
  font-size: 13px;
  color: var(--soft);
}

.kb-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--brand1);
}

.stat-label {
  font-size: 12px;
  color: var(--soft);
  margin-top: 4px;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.entry-card:hover {
  border-color: var(--brand1);
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.entry-type {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.type-filter { background: rgba(14, 159, 138, 0.1); color: #0E9F8A; }
.type-toxin { background: rgba(239, 68, 68, 0.1); color: #dc2626; }
.type-method { background: rgba(47, 111, 237, 0.1); color: #2F6FED; }
.type-dimension { background: rgba(124, 58, 237, 0.1); color: #7C3AED; }
.type-grade { background: rgba(245, 158, 11, 0.1); color: #d97706; }
.type-foundation { background: rgba(236, 72, 153, 0.1); color: #EC4899; }

.entry-header h3 {
  flex: 1;
  font-size: 14px;
}

.expand-icon {
  color: var(--soft);
  font-size: 12px;
}

.entry-core {
  font-size: 13px;
  color: var(--soft);
  margin-top: 8px;
  line-height: 1.6;
}

.entry-body {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
  font-size: 13px;
  line-height: 1.7;
}

.metaphor {
  margin-top: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(14, 159, 138, 0.05), rgba(53, 208, 165, 0.05));
  border-radius: 10px;
  color: var(--brand1);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--bg);
  font-size: 11px;
  color: var(--soft);
}
</style>
