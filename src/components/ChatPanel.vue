<template>
  <div class="chat-panel">
    <header class="topbar">
      <span>粘贴研报/长文自动进入完整诊断（五维打分+反向阅读）；短问题直接解答方法论</span>
    </header>

    <div class="messages" ref="messagesRef">
      <!-- 欢迎屏 -->
      <div v-if="!messages.length" class="welcome">
        <div class="big-logo">诊</div>
        <h2>给每一篇叙事做一次病理化验</h2>
        <p>
          四大逻辑滤网 + 五维25分制评分已就绪。<br>
          把研报、财经文章、官方叙事<b>整段粘贴</b>进来——我会给出：<br>
          诊断等级 → 逐维打分（附原文证据）→ 话术翻译 → 传导链校验 → 反向阅读指示。
        </p>
        <div class="examples">
          <button
            v-for="(ex, i) in examples"
            :key="i"
            class="example-btn"
            @click="send(ex.text)"
          >
            {{ ex.icon }} {{ ex.label }}
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <template v-for="msg in messages" :key="msg.id">
        <MessageBubble :message="msg" />
      </template>

      <!-- 流式消息 -->
      <div v-if="isStreaming" class="message ai">
        <div class="avatar ai">诊</div>
        <div class="body">
          <div class="stage-note">{{ streamingStatus }}</div>
          <div class="bubble md" v-html="renderMarkdown(streamingContent)"></div>
          <div v-if="streamingSources.length" class="sources">
            <div class="src-title">📚 引用条目</div>
            <span
              v-for="(src, i) in streamingSources"
              :key="i"
              class="src-chip"
              :title="src.excerpt"
            >
              {{ src.title }} <i>{{ src.score?.toFixed(2) }}</i>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="composer">
      <textarea
        ref="inputRef"
        v-model="input"
        rows="1"
        placeholder="粘贴研报全文开始诊断，或直接提问…（Enter 发送 / Shift+Enter 换行）"
        @keydown="handleKeydown"
        @input="autoGrow"
      />
      <button class="send-btn" :disabled="isStreaming || !input.trim()" @click="send()">
        ➤
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useSSE } from '../composables/useSSE'
import { renderMarkdown } from '../utils/markdown'
import MessageBubble from './MessageBubble.vue'

const chatStore = useChatStore()
const { sendMessage, isStreaming, streamingContent, streamingStatus, streamingSources } = useSSE()

const messages = ref([])
const input = ref('')
const messagesRef = ref(null)
const inputRef = ref(null)

const examples = [
  { icon: '📰', label: '假研报（含四类毒素）', text: '【示例·研报】尽管民营企业投资数据有所下滑，但信心指数调研显示预期正在改善。历史规律表明，社融见底后市场必然迎来大反弹，当前流动性充沛，强烈推荐买入。' },
  { icon: '🗣', label: '官方叙事样本', text: '我们要一分为二地看当前经济：虽然面临需求不足的困难，但也蕴藏着高质量发展的历史机遇。' },
  { icon: '📖', label: '什么是观念实体化？', text: '什么是观念实体化？' },
  { icon: '🔄', label: '中金倒置何时适用？', text: '中金倒置法什么时候该用？会不会误伤？' },
  { icon: '🧭', label: '定性先于定量？', text: '定性先于定量是什么意思？' },
]

// 监听消息变化
watch(() => chatStore.messages, (newMessages) => {
  messages.value = newMessages
  scrollToBottom()
}, { deep: true })

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  })
}

function autoGrow(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 220) + 'px'
}

function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

async function send(text) {
  const content = text || input.value.trim()
  if (!content || isStreaming.value) return

  input.value = ''
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  chatStore.addUserMessage(content)
  chatStore.saveSession()

  await sendMessage(content)
  chatStore.saveSession()
  scrollToBottom()
}
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.topbar {
  padding: 14px 28px;
  font-size: 12.5px;
  color: var(--soft);
  border-bottom: 1px solid var(--line);
  background: var(--panel);
  backdrop-filter: blur(8px);
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 26px 0;
}

.welcome {
  text-align: center;
  padding-top: 12vh;
}

.big-logo {
  width: 76px;
  height: 76px;
  margin: 0 auto 18px;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--brand1), var(--brand2));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 14px 34px rgba(47, 111, 237, 0.35);
}

.welcome h2 {
  font-size: 22px;
  margin-bottom: 10px;
}

.welcome p {
  color: var(--soft);
  font-size: 13.5px;
  line-height: 1.8;
  max-width: 480px;
  margin: 0 auto;
}

.examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.example-btn {
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.15s;
}

.example-btn:hover {
  border-color: var(--brand1);
  color: var(--brand1);
  background: linear-gradient(135deg, rgba(47, 111, 237, 0.05), rgba(123, 92, 245, 0.05));
}

.composer {
  max-width: var(--chat-width, 860px);
  width: calc(100% - 56px);
  margin: 0 auto;
  padding: 0 0 26px;
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.composer textarea {
  flex: 1;
  resize: none;
  border: 1.5px solid var(--line);
  border-radius: 16px;
  padding: 13px 18px;
  font-size: var(--chat-size, 15px);
  color: var(--ink);
  background: var(--card);
  font-family: inherit;
  outline: none;
  max-height: 160px;
  line-height: 1.6;
  transition: border-color 0.15s;
}

.composer textarea:focus {
  border-color: var(--brand1);
  box-shadow: 0 0 0 3px rgba(47, 111, 237, 0.1);
}

.send-btn {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  background: linear-gradient(135deg, var(--brand1), var(--brand2));
  color: #fff;
  font-size: 18px;
  box-shadow: 0 6px 14px rgba(47, 111, 237, 0.35);
  transition: transform 0.1s;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.send-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
