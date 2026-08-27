<template>
  <div class="settings-page">
    <header class="sp-head">
      <h2>⚙️ 设置</h2>
      <button class="ghost-btn" @click="$emit('close')">✕ 关闭</button>
    </header>

    <section class="set-section">
      <h3>🧠 模型服务</h3>
      <p class="sec-note">本地服务（llama.cpp / Ollama）无需密钥；云端需填 API Key</p>
      <div class="field-grid">
        <label>
          API 地址
          <input v-model="config.baseUrl" placeholder="http://127.0.0.1:8080/v1">
        </label>
        <label>
          模型名
          <input v-model="config.model" placeholder="local-gguf / deepseek-chat …">
        </label>
        <label class="span2">
          API Key <span class="opt">（本地服务留空即可）</span>
          <input v-model="config.apiKey" type="password" autocomplete="off" placeholder="sk-… 留空则保持已保存密钥不变">
        </label>
      </div>
      <div class="row-actions">
        <button class="primary-btn" @click="saveConfig">💾 保存配置</button>
        <button class="ghost-btn" @click="testConnection">🔌 测试连接</button>
        <span :class="['test-result', testStatus]">{{ testMessage }}</span>
      </div>
    </section>

    <section class="set-section">
      <h3>🎨 界面外观</h3>
      <div class="appearance-row">
        <span class="ap-label">主题色</span>
        <div class="accent-row">
          <button
            v-for="a in accents"
            :key="a.id"
            :class="['accent-sw', { active: accent === a.id }]"
            :style="{ background: `linear-gradient(135deg, ${a.c1}, ${a.c2})` }"
            @click="setAccent(a.id)"
          ></button>
        </div>
      </div>
      <div class="appearance-row">
        <span class="ap-label">明暗模式</span>
        <div class="seg-group">
          <button :class="{ active: theme === 'light' }" @click="setTheme('light')">☀️ 浅色</button>
          <button :class="{ active: theme === 'dark' }" @click="setTheme('dark')">🌙 深色</button>
          <button :class="{ active: theme === 'auto' }" @click="setTheme('auto')">🖥️ 跟随系统</button>
        </div>
      </div>
      <div class="appearance-row">
        <span class="ap-label">字号大小</span>
        <div class="seg-group">
          <button :class="{ active: fontSize === '13.5px' }" @click="setFontSize('13.5px')">小</button>
          <button :class="{ active: fontSize === '15px' }" @click="setFontSize('15px')">标准</button>
          <button :class="{ active: fontSize === '16.5px' }" @click="setFontSize('16.5px')">大</button>
          <button :class="{ active: fontSize === '18px' }" @click="setFontSize('18px')">特大</button>
        </div>
      </div>
    </section>

    <section class="set-section about-sec">
      <h3>📖 关于</h3>
      <p>
        认知诊疗室 2.0 —— 以形式逻辑为骨架的去噪识别工具：<br>
        四大滤网解剖媒体与研报叙事，五维25分制自动评分，<br>
        高度噪音自动给出反向阅读指示。新增实时研报抓取与可视化对比图表。
      </p>
      <p class="dim">v2.0.0 · 基于博主"以哲学为母体、以逻辑为骨架、以多样性破除思想锁"的方法论</p>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'

defineEmits(['close'])

const settingsStore = useSettingsStore()

const config = ref({
  baseUrl: '',
  model: '',
  apiKey: '',
})

const testStatus = ref('')
const testMessage = ref('')

const accents = settingsStore.accents
const theme = ref(settingsStore.theme)
const accent = ref(settingsStore.accent)
const fontSize = ref(settingsStore.fontSize)

onMounted(async () => {
  try {
    const res = await fetch('/api/config')
    const data = await res.json()
    config.value.baseUrl = data.baseUrl
    config.value.model = data.model
  } catch (e) {
    console.error('Failed to load config:', e)
  }
})

async function saveConfig() {
  try {
    const patch = { ...config.value }
    if (!patch.apiKey) delete patch.apiKey

    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    testStatus.value = 'ok'
    testMessage.value = '✅ 已保存'
  } catch (e) {
    testStatus.value = 'bad'
    testMessage.value = `❌ ${e.message}`
  }
}

async function testConnection() {
  await saveConfig()
  testStatus.value = ''
  testMessage.value = '⏳ 正在连接…'

  try {
    const res = await fetch('/api/test-llm', { method: 'POST' })
    const data = await res.json()
    if (data.ok) {
      testStatus.value = 'ok'
      testMessage.value = `✅ 连接成功 · 回复「${data.reply}」`
    } else {
      testStatus.value = 'bad'
      testMessage.value = `❌ ${data.error}`
    }
  } catch (e) {
    testStatus.value = 'bad'
    testMessage.value = `❌ ${e}`
  }
}

function setTheme(v) {
  theme.value = v
  settingsStore.setTheme(v)
}

function setAccent(v) {
  accent.value = v
  settingsStore.setAccent(v)
}

function setFontSize(v) {
  fontSize.value = v
  settingsStore.setFontSize(v)
}
</script>

<style scoped>
.settings-page {
  height: 100%;
  overflow-y: auto;
  background: var(--bg);
}

.sp-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  border-bottom: 1px solid var(--line);
}

.sp-head h2 {
  font-size: 21px;
}

.set-section {
  max-width: 800px;
  margin: 20px auto;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 22px 24px;
}

.set-section h3 {
  font-size: 15.5px;
  margin-bottom: 6px;
}

.sec-note {
  font-size: 12px;
  color: var(--soft);
  margin-bottom: 16px;
  line-height: 1.6;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 16px;
}

.field-grid label {
  font-size: 12.5px;
  color: var(--soft);
  display: block;
}

.field-grid .span2 {
  grid-column: span 2;
}

.field-grid input {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 13px;
  border: 1.5px solid var(--line);
  border-radius: 11px;
  font-size: 13.5px;
  outline: none;
  background: var(--bg);
  color: var(--ink);
  font-family: inherit;
}

.field-grid input:focus {
  border-color: var(--brand1);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-btn, .ghost-btn {
  padding: 9px 20px;
  border-radius: 11px;
  cursor: pointer;
  font-size: 13px;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, var(--brand1), var(--brand2));
  color: #fff;
}

.ghost-btn {
  border: 1.5px solid var(--line);
  background: #fff;
  color: var(--soft);
}

.test-result {
  font-size: 12.5px;
}

.test-result.ok {
  color: #0FA968;
}

.test-result.bad {
  color: #E74C3C;
}

.appearance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 0;
  border-bottom: 1px dashed var(--line);
  gap: 16px;
  flex-wrap: wrap;
}

.appearance-row:last-of-type {
  border-bottom: none;
}

.ap-label {
  font-size: 13.5px;
  font-weight: 500;
}

.accent-row {
  display: flex;
  gap: 9px;
}

.accent-sw {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.4);
  transition: transform 0.12s, border-color 0.15s;
}

.accent-sw:hover {
  transform: scale(1.12);
}

.accent-sw.active {
  border-color: var(--ink);
}

.seg-group {
  display: inline-flex;
  border: 1.5px solid var(--line);
  border-radius: 11px;
  overflow: hidden;
}

.seg-group button {
  padding: 8px 15px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--soft);
  font-family: inherit;
  border-right: 1px solid var(--line);
}

.seg-group button:last-child {
  border-right: none;
}

.seg-group button.active {
  background: var(--brand1);
  color: #fff;
  font-weight: 600;
}

.about-sec p {
  font-size: 13px;
  line-height: 1.8;
  color: var(--soft);
}

.about-sec .dim {
  font-size: 12px;
  margin-top: 12px;
}
</style>
