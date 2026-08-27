<template>
  <div class="diagnostic-report">
    <h3>📊 诊断报告</h3>

    <!-- 诊断总评 -->
    <div class="section summary">
      <div :class="['grade-badge', gradeClass]">{{ gradeLabel }}</div>
      <div class="total-score">总分：{{ data.totalScore }}/25</div>
    </div>

    <!-- 五维雷达图 -->
    <div class="section">
      <h4>五维评分</h4>
      <ScoreRadar :scores="data.dimensions" />
    </div>

    <!-- 对比图表 -->
    <div v-if="data.comparison" class="section">
      <h4>📊 官方数据 vs 去噪修正</h4>
      <ComparisonChart :data="data.comparison" />
    </div>

    <!-- 话术翻译 -->
    <div v-if="data.toxins?.length" class="section">
      <h4>🔍 话术翻译</h4>
      <div class="toxin-list">
        <div v-for="(toxin, i) in data.toxins" :key="i" class="toxin-item">
          <div class="toxin-original">原文：{{ toxin.original }}</div>
          <div class="toxin-law">违反：{{ toxin.violation }}</div>
          <div class="toxin-real">去噪：{{ toxin.realMeaning }}</div>
        </div>
      </div>
    </div>

    <!-- 反向阅读指示 -->
    <div v-if="data.reverseReading" class="section reverse-section">
      <h4>🔄 反向阅读指示</h4>
      <div class="reverse-box">
        <div class="reverse-label">应采纳的客观数据：</div>
        <ul>
          <li v-for="(item, i) in data.reverseReading.adopt" :key="i">{{ item }}</li>
        </ul>
        <div class="reverse-label">应颠倒理解的结论：</div>
        <ul>
          <li v-for="(item, i) in data.reverseReading.reverse" :key="i">{{ item }}</li>
        </ul>
      </div>
    </div>

    <!-- 处置指南 -->
    <div class="section action-section">
      <h4>✅ 处置指南</h4>
      <ul class="action-list">
        <li v-for="(action, i) in data.actions" :key="i">{{ action }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ScoreRadar from './ScoreRadar.vue'
import ComparisonChart from './ComparisonChart.vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const gradeClass = computed(() => {
  const score = props.data.totalScore
  if (score >= 21) return 'grade-good'
  if (score >= 15) return 'grade-medium'
  if (score >= 10) return 'grade-bad'
  return 'grade-toxic'
})

const gradeLabel = computed(() => {
  const score = props.data.totalScore
  if (score >= 21) return '🟢 深度理性'
  if (score >= 15) return '🟡 局部污染'
  if (score >= 10) return '🟠 高度噪音 → 建议反向阅读'
  return '🔴 思维毒素 → 直接拉黑'
})
</script>

<style scoped>
.diagnostic-report {
  margin-top: 20px;
  padding: 20px;
  background: var(--card);
  border-radius: 16px;
  border: 1px solid var(--line);
}

.section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px dashed var(--line);
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section h4 {
  font-size: 14px;
  color: var(--brand1);
  margin-bottom: 12px;
}

.summary {
  display: flex;
  align-items: center;
  gap: 16px;
}

.grade-badge {
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.grade-good {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.15));
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.grade-medium {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.15));
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.grade-bad {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(249, 115, 22, 0.15));
  color: #ea580c;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.grade-toxic {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.15));
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.total-score {
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}

.toxin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toxin-item {
  padding: 12px;
  background: var(--bg);
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.toxin-original {
  color: var(--ink);
  margin-bottom: 4px;
}

.toxin-law {
  color: var(--soft);
  font-size: 12px;
}

.toxin-real {
  color: var(--brand1);
  font-weight: 500;
  margin-top: 4px;
}

.reverse-section .reverse-box {
  padding: 14px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 12px;
}

.reverse-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand1);
  margin: 8px 0 4px;
}

.reverse-label:first-child {
  margin-top: 0;
}

.reverse-box ul {
  margin: 0;
  padding-left: 20px;
}

.reverse-box li {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 4px;
}

.action-list {
  margin: 0;
  padding-left: 20px;
}

.action-list li {
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 6px;
}
</style>
