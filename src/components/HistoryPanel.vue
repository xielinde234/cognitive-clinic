<template>
  <div class="panel hist-panel">
    <h3>🩺 诊断档案</h3>
    <select class="sel hist-sel" v-model="selectedId">
      <option value="">— 选择恢复诊断 —</option>
      <option v-for="session in sessions" :key="session.id" :value="session.id">
        {{ session.isDiag ? '🩺' : '💬' }} {{ session.title }} · {{ formatDate(session.ts) }} · {{ session.msgs.length }}条
      </option>
    </select>
    <div class="hist-actions">
      <button class="ghost-btn sm" @click="$emit('newChat')">🆕 新诊疗</button>
      <button class="ghost-btn sm" @click="deleteSelected">🗑 删除选中</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useChatStore } from '../stores/chat'

const emit = defineEmits(['newChat', 'loadSession'])

const chatStore = useChatStore()
const selectedId = ref('')

const sessions = computed(() => chatStore.sessions)

function formatDate(ts) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function deleteSelected() {
  if (selectedId.value) {
    chatStore.deleteSession(selectedId.value)
    selectedId.value = ''
  }
}

// 监听选择变化
function onSelectionChange() {
  if (selectedId.value) {
    chatStore.loadSession(selectedId.value)
    emit('loadSession', selectedId.value)
  }
}

// 使用watch监听selectedId变化
import { watch } from 'vue'
watch(selectedId, () => {
  onSelectionChange()
})
</script>

<style scoped>
.hist-panel h3 {
  font-size: 12.5px;
  color: var(--soft);
  font-weight: 500;
  margin-bottom: 9px;
}

.hist-sel {
  width: 100%;
  min-width: 0;
  font-size: 12.5px;
  padding: 8px 11px;
  border-radius: 11px;
  border: 1.5px solid var(--line);
  background: var(--bg);
  color: var(--ink);
  outline: none;
}

.hist-sel option {
  background: var(--card);
  color: var(--ink);
}

.hist-actions {
  display: flex;
  gap: 7px;
  margin-top: 9px;
}

.ghost-btn.sm {
  flex: 1;
  padding: 7px 4px;
  font-size: 12px;
  border-radius: 9px;
  border: 1.5px solid var(--line);
  background: #fff;
  color: var(--soft);
  cursor: pointer;
}

.ghost-btn.sm:hover {
  border-color: var(--brand1);
  color: var(--brand1);
}
</style>
