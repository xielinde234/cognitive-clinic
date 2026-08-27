<template>
  <div :class="['message', message.role]">
    <div v-if="message.role === 'assistant'" class="avatar ai">诊</div>
    <div class="body">
      <div v-if="message.role === 'user'" class="bubble user-msg">{{ truncatedContent }}</div>
      <div v-else class="bubble md" v-html="renderedContent"></div>
      <div v-if="isDiagnostic && message.metadata" class="diagnostic-panel">
        <DiagnosticReport :data="message.metadata" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '../utils/markdown'
import DiagnosticReport from './DiagnosticReport.vue'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const truncatedContent = computed(() => {
  const content = props.message.content || ''
  if (content.length > 600) {
    return content.slice(0, 600) + `\n…（共 ${content.length} 字）`
  }
  return content
})

const renderedContent = computed(() => {
  return renderMarkdown(props.message.content || '')
})

const isDiagnostic = computed(() => {
  return (props.message.content || '').length >= 250
})
</script>

<style scoped>
.message {
  max-width: var(--chat-width, 860px);
  margin: 0 auto 22px;
  padding: 0 28px;
  display: flex;
  gap: 12px;
}

.message.user {
  justify-content: flex-end;
}

.avatar {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #fff;
  flex-shrink: 0;
}

.avatar.ai {
  background: linear-gradient(135deg, var(--brand1), var(--brand2));
}

.body {
  flex: 1;
  min-width: 0;
}

.bubble {
  background: var(--card);
  font-size: 14.5px;
  border: 1px solid var(--line);
  border-radius: 4px 18px 18px 18px;
  padding: 16px 20px;
  line-height: 1.85;
  white-space: pre-wrap;
  word-break: break-word;
}

.bubble.user-msg {
  background: transparent;
  border: none;
  padding-left: 34px;
  color: var(--ink);
  border-radius: 18px 4px 18px 18px;
}

.bubble :deep(strong) {
  color: var(--brand1);
}

.bubble :deep(p) {
  margin: 0 0 8px;
}

.bubble :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
