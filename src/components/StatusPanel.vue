<template>
  <div class="panel status-panel">
    <div class="row">
      <span>方法论库</span>
      <b :class="kbReady ? 'ok' : ''">{{ kbReady ? `${chunks} 条方法` : '加载中…' }}</b>
    </div>
    <div class="row">
      <span>检索方式</span>
      <b>{{ retrievalMode === 'embedding' ? '语义向量' : '关键词' }}</b>
    </div>
    <div class="row">
      <span>LLM</span>
      <b :class="llmReady ? 'ok' : 'warn'">{{ llmReady ? llmModel : '未配置 ⚠️' }}</b>
    </div>
    <button class="ghost-btn" @click="$emit('openSettings')">⚙️ 设置</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineEmits(['openSettings'])

const kbReady = ref(false)
const chunks = ref(0)
const retrievalMode = ref('')
const llmReady = ref(false)
const llmModel = ref('')

onMounted(async () => {
  try {
    const res = await fetch('/api/status')
    const data = await res.json()
    kbReady.value = data.kbReady
    chunks.value = data.chunks
    retrievalMode.value = data.retrieval
    llmReady.value = data.llm.hasKey || /127\.0\.0\.1|localhost/.test(data.llm.baseUrl)
    llmModel.value = data.llm.model
  } catch (e) {
    console.error('Failed to fetch status:', e)
  }
})
</script>

<style scoped>
.status-panel {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px;
}

.row {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  padding: 4px 0;
}

.row span {
  color: var(--soft);
}

.row b {
  font-weight: 600;
}

.row b.ok {
  color: #0FA968;
}

.row b.warn {
  color: #E67E22;
}

.ghost-btn {
  margin-top: 10px;
  width: 100%;
  padding: 9px 20px;
  border-radius: 11px;
  cursor: pointer;
  font-size: 13px;
  border: 1.5px solid var(--line);
  background: #fff;
  color: var(--soft);
}

.ghost-btn:hover {
  border-color: var(--brand1);
  color: var(--brand1);
}
</style>
