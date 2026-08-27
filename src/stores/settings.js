import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // 从localStorage恢复设置
  const saved = JSON.parse(localStorage.getItem('clinicui') || '{}')

  const theme = ref(saved.theme || 'light')
  const accent = ref(saved.accent || 'teal')
  const fontSize = ref(saved.fontSize || '15px')
  const fontFamily = ref(saved.fontFamily || 'system')
  const chatWidth = ref(saved.chatWidth || '860px')

  // LLM配置
  const llmConfig = ref({
    baseUrl: '',
    model: '',
    hasKey: false,
    keyMasked: '',
  })

  // 主题色预设
  const accents = [
    { id: 'teal', c1: '#0E9F8A', c2: '#35D0A5' },
    { id: 'indigo', c1: '#2F6FED', c2: '#7B5CF5' },
    { id: 'cyan', c1: '#0891B2', c2: '#22D3EE' },
    { id: 'rose', c1: '#E84C88', c2: '#B14CF0' },
    { id: 'graphite', c1: '#3D4657', c2: '#6B7A99' },
  ]

  // 自动保存
  watch([theme, accent, fontSize, fontFamily, chatWidth], () => {
    localStorage.setItem('clinicui', JSON.stringify({
      theme: theme.value,
      accent: accent.value,
      fontSize: fontSize.value,
      fontFamily: fontFamily.value,
      chatWidth: chatWidth.value,
    }))
  }, { deep: true })

  function setTheme(v) { theme.value = v }
  function setAccent(v) { accent.value = v }
  function setFontSize(v) { fontSize.value = v }
  function setFontFamily(v) { fontFamily.value = v }
  function setChatWidth(v) { chatWidth.value = v }
  function setLlmConfig(v) { llmConfig.value = v }

  return {
    theme, accent, fontSize, fontFamily, chatWidth,
    llmConfig, accents,
    setTheme, setAccent, setFontSize, setFontFamily, setChatWidth, setLlmConfig,
  }
})
