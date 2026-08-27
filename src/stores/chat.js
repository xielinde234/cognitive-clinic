import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // 对话消息
  const messages = ref([])

  // 当前会话
  const currentSession = ref(null)

  // 诊断历史（存储在localStorage）
  const sessions = ref([])
  try {
    sessions.value = JSON.parse(localStorage.getItem('clinichistory') || '[]')
  } catch {
    sessions.value = []
  }

  // 状态
  const isStreaming = ref(false)
  const streamingContent = ref('')

  function addUserMessage(text) {
    messages.value.push({
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    })
  }

  function addAssistantMessage(text, metadata = {}) {
    messages.value.push({
      id: Date.now(),
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
      metadata,
    })
  }

  function updateStreamingMessage(text) {
    streamingContent.value = text
  }

  function finalizeStreamingMessage() {
    if (streamingContent.value) {
      addAssistantMessage(streamingContent.value)
      streamingContent.value = ''
    }
  }

  function clearMessages() {
    messages.value = []
    currentSession.value = null
  }

  // 历史记录管理
  function saveSession() {
    if (!currentSession.value) {
      currentSession.value = {
        id: Date.now(),
        ts: Date.now(),
        title: messages.value[0]?.content?.slice(0, 24) || '新诊断',
        isDiag: (messages.value[0]?.content?.length || 0) >= 250,
        msgs: [],
      }
      sessions.value.push(currentSession.value)
    }

    currentSession.value.msgs = messages.value.map(m => ({
      role: m.role,
      content: m.content,
    }))

    localStorage.setItem('clinichistory', JSON.stringify(sessions.value.slice(-50)))
  }

  function loadSession(sessionId) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      currentSession.value = session
      messages.value = session.msgs.map((m, i) => ({
        id: Date.now() + i,
        ...m,
        timestamp: Date.now(),
      }))
    }
  }

  function deleteSession(sessionId) {
    sessions.value = sessions.value.filter(s => s.id !== sessionId)
    if (currentSession.value?.id === sessionId) {
      clearMessages()
    }
    localStorage.setItem('clinichistory', JSON.stringify(sessions.value))
  }

  return {
    messages,
    currentSession,
    sessions,
    isStreaming,
    streamingContent,
    addUserMessage,
    addAssistantMessage,
    updateStreamingMessage,
    finalizeStreamingMessage,
    clearMessages,
    saveSession,
    loadSession,
    deleteSession,
  }
})
