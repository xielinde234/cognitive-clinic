<template>
  <div id="app-root" :data-theme="theme" :data-accent="accent">
    <!-- 侧边栏 -->
    <aside id="sidebar" :class="{ open: sidebarOpen }">
      <div class="logo">
        <div class="logo-mark">诊</div>
        <div>
          <h1>认知诊疗室</h1>
          <p class="sub">v2.0 · 以逻辑为骨架</p>
        </div>
      </div>

      <!-- 状态面板 -->
      <StatusPanel />

      <!-- 功能入口 -->
      <nav class="nav-menu">
        <button
          v-for="item in menuItems"
          :key="item.id"
          :class="['nav-item', { active: currentView === item.id }]"
          @click="currentView = item.id"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <!-- 诊断档案 -->
      <HistoryPanel />

      <footer>本地方法论库 · 四大滤网 · 五维评分</footer>
    </aside>

    <!-- 主内容区 -->
    <main id="main">
      <!-- 移动端菜单按钮 -->
      <button class="mobile-menu-btn" @click="sidebarOpen = !sidebarOpen">☰</button>

      <!-- 聊天视图 -->
      <ChatPanel v-if="currentView === 'chat'" />

      <!-- 研报浏览器 -->
      <ReportBrowser v-else-if="currentView === 'reports'" />

      <!-- 知识库管理 -->
      <KBManager v-else-if="currentView === 'kb'" />

      <!-- 设置页面 -->
      <Settings v-else-if="currentView === 'settings'" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSettingsStore } from './stores/settings'
import StatusPanel from './components/StatusPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import ChatPanel from './components/ChatPanel.vue'
import ReportBrowser from './components/ReportBrowser.vue'
import KBManager from './components/KBManager.vue'
import Settings from './components/Settings.vue'

const settingsStore = useSettingsStore()

const currentView = ref('chat')
const sidebarOpen = ref(false)

const theme = computed(() => settingsStore.theme)
const accent = computed(() => settingsStore.accent)

const menuItems = [
  { id: 'chat', icon: '💬', label: '对话诊断' },
  { id: 'reports', icon: '📰', label: '研报浏览器' },
  { id: 'kb', icon: '📚', label: '知识库管理' },
  { id: 'settings', icon: '⚙️', label: '系统设置' },
]
</script>

<style scoped>
#app-root {
  display: flex;
  height: 100vh;
  background: var(--bg);
  color: var(--ink);
}

/* 侧边栏 */
#sidebar {
  width: 300px;
  flex-shrink: 0;
  background: var(--card);
  border-right: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  padding: 22px 18px;
  gap: 18px;
  overflow-y: auto;
  transition: left 0.3s;
}

@media (max-width: 900px) {
  #sidebar {
    position: fixed;
    z-index: 100;
    left: -320px;
  }
  #sidebar.open {
    left: 0;
  }
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-mark {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--brand1), var(--brand2));
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(47, 111, 237, 0.35);
}

.logo h1 {
  font-size: 19px;
  letter-spacing: 0.5px;
}

.logo .sub {
  font-size: 11.5px;
  color: var(--soft);
  margin-top: 2px;
}

/* 导航菜单 */
.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: transparent;
  color: var(--ink);
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.nav-item:hover {
  background: var(--bg);
}

.nav-item.active {
  background: linear-gradient(135deg, rgba(47, 111, 237, 0.1), rgba(123, 92, 245, 0.1));
  color: var(--brand1);
  font-weight: 600;
}

.nav-icon {
  font-size: 18px;
}

#sidebar footer {
  margin-top: auto;
  font-size: 11px;
  color: var(--soft);
  text-align: center;
}

/* 主内容区 */
#main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.mobile-menu-btn {
  display: none;
  position: fixed;
  top: 14px;
  left: 14px;
  z-index: 50;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--card);
  font-size: 20px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
