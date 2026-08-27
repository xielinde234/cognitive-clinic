<template>
  <div class="report-browser">
    <header class="topbar">
      <h2>📰 研报浏览器</h2>
      <p>实时抓取中金、中信、慧博等机构研报，自动进行政治因素剥离与反向阅读分析</p>
    </header>

    <div class="toolbar">
      <div class="filter-group">
        <button
          v-for="source in sources"
          :key="source.id"
          :class="['filter-btn', { active: selectedSource === source.id }]"
          @click="selectedSource = source.id"
        >
          {{ source.icon }} {{ source.label }}
        </button>
      </div>
      <button class="action-btn" @click="refreshReports" :disabled="loading">
        {{ loading ? '⏳ 抓取中…' : '🔄 刷新研报' }}
      </button>
    </div>

    <div class="reports-grid">
      <div
        v-for="report in filteredReports"
        :key="report.id"
        class="report-card"
        @click="analyzeReport(report)"
      >
        <div class="report-header">
          <span class="report-source">{{ getSourceLabel(report.source) }}</span>
          <span class="report-date">{{ formatDate(report.date) }}</span>
        </div>
        <h3 class="report-title">{{ report.title }}</h3>
        <p class="report-excerpt">{{ report.excerpt }}</p>
        <div class="report-meta">
          <span v-if="report.author">作者：{{ report.author }}</span>
          <span :class="['diagnostic-badge', getBadgeClass(report.diagnosticScore)]">
            {{ getBadgeLabel(report.diagnosticScore) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 分析详情弹窗 -->
    <div v-if="selectedReport" class="modal-overlay" @click.self="selectedReport = null">
      <div class="modal-content">
        <button class="close-btn" @click="selectedReport = null">✕</button>
        <h2>{{ selectedReport.title }}</h2>
        <div class="modal-body">
          <DiagnosticReport v-if="analysisResult" :data="analysisResult" />
          <div v-else-if="analyzing" class="analyzing">
            <div class="spinner"></div>
            <p>正在进行政治因素剥离与反向阅读分析…</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DiagnosticReport from './DiagnosticReport.vue'

const sources = [
  { id: 'all', icon: '📋', label: '全部' },
  { id: 'cicc', icon: '🏛️', label: '中金公司' },
  { id: 'citic', icon: '🏦', label: '中信证券' },
  { id: 'hibor', icon: '📊', label: '慧博投研' },
]

const selectedSource = ref('all')
const reports = ref([])
const loading = ref(false)
const selectedReport = ref(null)
const analysisResult = ref(null)
const analyzing = ref(false)

const filteredReports = computed(() => {
  if (selectedSource.value === 'all') return reports.value
  return reports.value.filter(r => r.source === selectedSource.value)
})

async function fetchReports() {
  loading.value = true
  try {
    const res = await fetch('/api/reports')
    const data = await res.json()
    reports.value = data.reports || []
  } catch (e) {
    console.error('Failed to fetch reports:', e)
  } finally {
    loading.value = false
  }
}

async function refreshReports() {
  loading.value = true
  try {
    await fetch('/api/crawl', { method: 'POST' })
    await fetchReports()
  } catch (e) {
    console.error('Failed to crawl reports:', e)
  } finally {
    loading.value = false
  }
}

async function analyzeReport(report) {
  selectedReport.value = report
  analysisResult.value = null
  analyzing.value = true

  try {
    const res = await fetch('/api/denoise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: report.id }),
    })
    const data = await res.json()
    analysisResult.value = data
  } catch (e) {
    console.error('Failed to analyze report:', e)
  } finally {
    analyzing.value = false
  }
}

function getSourceLabel(source) {
  const labels = {
    cicc: '中金公司',
    citic: '中信证券',
    hibor: '慧博投研',
  }
  return labels[source] || source
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getBadgeClass(score) {
  if (score >= 21) return 'badge-good'
  if (score >= 15) return 'badge-medium'
  if (score >= 10) return 'badge-bad'
  return 'badge-toxic'
}

function getBadgeLabel(score) {
  if (score >= 21) return '深度理性'
  if (score >= 15) return '局部污染'
  if (score >= 10) return '高度噪音'
  return '思维毒素'
}

onMounted(() => {
  fetchReports()
})
</script>

<style scoped>
.report-browser {
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px;
  border-bottom: 1px solid var(--line);
}

.filter-group {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn:hover {
  border-color: var(--brand1);
  color: var(--brand1);
}

.filter-btn.active {
  background: var(--brand1);
  color: #fff;
  border-color: var(--brand1);
}

.action-btn {
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, var(--brand1), var(--brand2));
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reports-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  align-content: start;
}

.report-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.2s;
}

.report-card:hover {
  border-color: var(--brand1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.report-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.report-source {
  font-size: 12px;
  color: var(--brand1);
  font-weight: 600;
}

.report-date {
  font-size: 12px;
  color: var(--soft);
}

.report-title {
  font-size: 15px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.report-excerpt {
  font-size: 13px;
  color: var(--soft);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.report-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--soft);
}

.diagnostic-badge {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.badge-good {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.badge-medium {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.badge-bad {
  background: rgba(249, 115, 22, 0.1);
  color: #ea580c;
}

.badge-toxic {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  background: var(--card);
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--line);
  cursor: pointer;
  font-size: 16px;
  z-index: 10;
}

.modal-content h2 {
  padding: 20px 24px;
  border-bottom: 1px solid var(--line);
  font-size: 18px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  max-height: calc(90vh - 80px);
}

.analyzing {
  text-align: center;
  padding: 60px 20px;
  color: var(--soft);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--line);
  border-top-color: var(--brand1);
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
