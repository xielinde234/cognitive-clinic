import { ref } from 'vue'
import { useChatStore } from '../stores/chat'

export function useSSE() {
  const chatStore = useChatStore()
  const isStreaming = ref(false)
  const streamingContent = ref('')
  const streamingStatus = ref('')
  const streamingSources = ref([])

  async function sendMessage(text) {
    if (isStreaming.value) return

    isStreaming.value = true
    streamingContent.value = ''
    streamingStatus.value = '正在检索知识库…'
    streamingSources.value = []

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatStore.messages.slice(0, -1).map(m => ({
            role: m.role,
            content: String(m.content).slice(0, 3000),
          })).concat([{ role: 'user', content: text }]),
        }),
      })

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const events = buf.split('\n\n')
        buf = events.pop() || ''

        for (const evRaw of events) {
          const lines = evRaw.split('\n')
          let event = ''
          let dataStr = ''

          for (const l of lines) {
            if (l.startsWith('event:')) event = l.slice(6).trim()
            else if (l.startsWith('data:')) dataStr += l.slice(5).trim()
          }

          if (!dataStr) continue

          let data
          try {
            data = JSON.parse(dataStr)
          } catch {
            continue
          }

          if (event === 'status') {
            streamingStatus.value = data.message
          } else if (event === 'sources') {
            streamingSources.value = data.hits || []
          } else if (event === 'delta') {
            streamingContent.value += data.text
          } else if (event === 'done') {
            chatStore.addAssistantMessage(streamingContent.value)
            streamingContent.value = ''
            streamingStatus.value = ''
            streamingSources.value = []
          } else if (event === 'error') {
            throw new Error(data.message)
          }
        }
      }
    } catch (e) {
      console.error('Chat error:', e)
      chatStore.addAssistantMessage(`❌ 出错：${e.message}`)
    } finally {
      isStreaming.value = false
    }
  }

  return {
    sendMessage,
    isStreaming,
    streamingContent,
    streamingStatus,
    streamingSources,
  }
}
