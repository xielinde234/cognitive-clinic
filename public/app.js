'use strict';
/* 认知诊疗室 2.0 Web 前端 */

const $ = (s) => document.querySelector(s);
const chat = $('#chat');
const input = $('#input');
const sendBtn = $('#send');

let busy = false;
let currentView = 'chat';

/* ========== 导航 ========== */
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    document.querySelectorAll('.main-view').forEach(v => v.classList.remove('active'));
    $(`#main-${view}`).classList.add('active');
    currentView = view;
    if (view === 'reports') loadReports();
    if (view === 'kb') loadKB();
  });
});

/* ========== 状态 ========== */
async function refreshStatus() {
  try {
    const st = await (await fetch('/api/status')).json();
    const kbEl = $('#stKb'), retEl = $('#stRetrieval'), llmEl = $('#stLlm');
    if (st.kbReady) {
      kbEl.textContent = `${st.chunks} 条方法`;
      kbEl.className = 'ok';
      retEl.textContent = st.retrieval === 'embedding' ? '语义向量' : '关键词（降级）';
    } else {
      kbEl.textContent = '加载中…';
    }
    if (st.llm.hasKey || /127\.0\.0\.1|localhost/.test(st.llm.baseUrl)) {
      llmEl.textContent = st.llm.model;
      llmEl.className = 'ok';
    } else {
      llmEl.textContent = '未配置 ⚠️';
      llmEl.className = 'warn';
    }
  } catch (_) {}
}

/* ========== 研报浏览器 ========== */
async function loadReports() {
  const list = $('#reportsList');
  list.innerHTML = '<div class="loading">加载中…</div>';
  try {
    const res = await fetch('/api/reports');
    const data = await res.json();
    if (!data.reports || data.reports.length === 0) {
      list.innerHTML = '<div class="empty-state">暂无研报，点击上方"刷新研报"按钮抓取</div>';
      return;
    }
    list.innerHTML = data.reports.map(r => `
      <div class="report-card" onclick="analyzeReport('${r.id}')">
        <div class="report-meta">
          <span class="report-source">${getSourceLabel(r.source)}</span>
          <span class="report-date">${r.date || '未知日期'}</span>
        </div>
        <h3 class="report-title">${escapeHtml(r.title)}</h3>
        <p class="report-excerpt">${escapeHtml(r.excerpt || '').slice(0, 100)}…</p>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = `<div class="empty-state">加载失败: ${e.message}</div>`;
  }
}

function getSourceLabel(source) {
  const labels = { cicc: '🏛️ 中金', citic: '🏦 中信', hibor: '📊 慧博' };
  return labels[source] || source;
}

async function analyzeReport(reportId) {
  const modal = $('#denoiseModal');
  const result = $('#denoiseResult');
  const title = $('#modalTitle');
  
  modal.classList.remove('hidden');
  title.textContent = '分析中…';
  result.innerHTML = '<div class="loading">正在进行政治因素剥离与反向阅读分析…</div>';
  
  try {
    const res = await fetch('/api/denoise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId })
    });
    const data = await res.json();
    title.textContent = data.title || '去噪分析';
    result.innerHTML = renderDenoiseResult(data);
  } catch (e) {
    result.innerHTML = `<div class="error">分析失败: ${e.message}</div>`;
  }
}

function renderDenoiseResult(data) {
  const gradeClass = data.score >= 21 ? 'good' : data.score >= 15 ? 'medium' : data.score >= 10 ? 'bad' : 'toxic';
  const gradeLabel = data.score >= 21 ? '🟢 深度理性' : data.score >= 15 ? '🟡 局部污染' : data.score >= 10 ? '🟠 高度噪音 → 建议反向阅读' : '🔴 思维毒素 → 直接拉黑';
  
  let html = `
    <div class="denoise-summary">
      <span class="grade-badge ${gradeClass}">${gradeLabel}</span>
      <span class="total-score">总分：${data.score}/25</span>
    </div>
    
    <div class="denoise-section">
      <h4>📊 五维评分</h4>
      <table class="score-table">
        <tr><td>逻辑自洽度</td><td>${data.dimensions.logic}/5</td></tr>
        <tr><td>思路多维性</td><td>${data.dimensions.diversity}/5</td></tr>
        <tr><td>因果定性验证</td><td>${data.dimensions.causation}/5</td></tr>
        <tr><td>事实标准透明度</td><td>${data.dimensions.factStandard}/5</td></tr>
        <tr><td>利益政治去噪</td><td>${data.dimensions.debiased}/5</td></tr>
      </table>
    </div>
  `;
  
  if (data.logic.issues.length > 0) {
    html += `
      <div class="denoise-section">
        <h4>🔍 逻辑检查</h4>
        <ul>${data.logic.issues.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
        ${data.logic.needsReverse ? '<div class="warning">⚠️ 论述与结论存在矛盾，建议启动反向阅读</div>' : ''}
      </div>
    `;
  }
  
  if (data.politicalNoise.isBiased) {
    html += `
      <div class="denoise-section">
        <h4>🏛️ 政治因素剥离</h4>
        <div class="warning">检测到政治话术：${data.politicalNoise.indicators.join('、')}</div>
        <div class="noise-weight">噪音权重：${(data.politicalNoise.weight * 100).toFixed(0)}%</div>
      </div>
    `;
  }
  
  if (data.reverseReading) {
    html += `
      <div class="denoise-section reverse">
        <h4>🔄 反向阅读指示</h4>
        <div class="adopt">
          <strong>✅ 应采纳的客观数据：</strong>
          ${data.reverseReading.adopt.length ? '<ul>' + data.reverseReading.adopt.map(a => `<li>${escapeHtml(a)}</li>`).join('') + '</ul>' : '<p>未发现明确的客观数据披露</p>'}
        </div>
        <div class="reverse-conclusion">
          <strong>🔄 应颠倒理解的结论：</strong>
          <p>${escapeHtml(data.reverseReading.originalConclusion || '')}</p>
          <p class="reversed">→ ${escapeHtml(data.reverseReading.reverse || '')}</p>
        </div>
        <div class="confidence">置信度：${(data.reverseReading.confidence * 100).toFixed(0)}%</div>
      </div>
    `;
  }
  
  html += `
    <div class="denoise-section">
      <h4>✅ 处置指南</h4>
      <ul>${data.actions.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
    </div>
    <div class="disclaimer">> 本诊断为基于形式逻辑与方法论的文本分析，不构成投资建议；市场有风险，决策需独立。</div>
  `;
  
  return html;
}

function closeDenoiseModal() {
  $('#denoiseModal').classList.add('hidden');
}

/* ========== 知识库管理 ========== */
async function loadKB() {
  const list = $('#kbList');
  list.innerHTML = '<div class="loading">加载中…</div>';
  try {
    const res = await fetch('/api/kb/entries');
    const data = await res.json();
    const entries = data.entries || [];
    
    const typeLabels = {
      filter: '滤网', toxin: '话术翻译', method: '方法', 
      dimension: '评分维度', grade: '诊断等级', case: '案例',
      foundation: '基础', analysis_method: '分析方法', scope: '适用范围',
      investment: '投资指南'
    };
    
    list.innerHTML = entries.map(e => `
      <div class="kb-card" onclick="this.classList.toggle('expanded')">
        <div class="kb-header">
          <span class="kb-type type-${e.type}">${typeLabels[e.type] || e.type}</span>
          <h3>${escapeHtml(e.title)}</h3>
        </div>
        <p class="kb-core">${escapeHtml(e.core)}</p>
        <div class="kb-body">
          <p>${escapeHtml(e.body)}</p>
          ${e.metaphor ? `<div class="metaphor">💡 比喻：${escapeHtml(e.metaphor)}</div>` : ''}
          <div class="tags">${(e.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = `<div class="empty-state">加载失败: ${e.message}</div>`;
  }
}

/* ========== Markdown 渲染 ========== */
function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function mdToHtml(md) {
  let html = escapeHtml(md);
  html = html.replace(/^#{1,4}\s+(.*)$/gm, '<strong>$1</strong>');
  html = html.replace(/^&gt;\s?(.*)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  const tableHtml = buildTables(html);
  const lines = tableHtml.html.split('\n');
  const out = [];
  let inList = false;
  let ti = 0;
  for (const line of lines) {
    if (line.trim() === '\u0000TABLE\u0000') {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(tableHtml.tables[ti++] || '');
      continue;
    }
    const li = line.match(/^\s*[-·*]\s+(.*)/);
    const li2 = line.match(/^\s*\d+[.、]\s+(.*)/);
    if (li || li2) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${(li || li2)[1]}</li>`);
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      if (line.trim()) out.push(`<p>${line}</p>`);
      else out.push('');
    }
  }
  if (inList) out.push('</ul>');
  let result = out.join('').replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, (m, inner) => `<div class="disclaimer">${inner}</div>`);
  result = result.replace(/<div class="disclaimer">[\s\S]*?<\/div>(?=[\s\S]*<div class="disclaimer">)/g, '');
  return result;
}

function buildTables(html) {
  const tables = [];
  const lines = html.split('\n');
  const outLines = [];
  let i = 0;
  const isRow = (l) => /^\s*\|.+\|\s*$/.test(l);
  while (i < lines.length) {
    if (isRow(lines[i]) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const rows = [lines[i]];
      i += 2;
      while (i < lines.length && isRow(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(rows[0]);
      let t = '<table class="md-table"><thead><tr>';
      t += head.map((h) => `<th>${h}</th>`).join('');
      t += '</tr></thead><tbody>';
      for (const r of rows.slice(1)) {
        const cs = cells(r);
        t += '<tr>' + head.map((_, k2) => `<td>${cs[k2] || ''}</td>`).join('') + '</tr>';
      }
      t += '</tbody></table>';
      tables.push(t);
      outLines.push('\u0000TABLE\u0000');
    } else {
      outLines.push(lines[i]);
      i++;
    }
  }
  return { html: outLines.join('\n'), tables };
}

/* ========== 消息 DOM ========== */
function scrollBottom() { chat.scrollTop = chat.scrollHeight; }

function addUserMsg(text) {
  const div = document.createElement('div');
  div.className = 'msg user';
  div.innerHTML = `<div class="bubble"></div>`;
  div.querySelector('.bubble').textContent = text.length > 600 ? text.slice(0, 600) + `\n…（共 ${text.length} 字）` : text;
  chat.appendChild(div);
  scrollBottom();
}

function addAiMsgShell() {
  const div = document.createElement('div');
  div.className = 'msg ai';
  div.innerHTML = `
    <div class="avatar">诊</div>
    <div class="body">
      <div class="stage-note"></div>
      <div class="bubble md"></div>
      <div class="actions hidden">
        <button class="action-btn copy-btn" title="复制回答">📋 复制</button>
        <button class="action-btn thumb-up" title="答得好">👍</button>
        <button class="action-btn thumb-down" title="答得不好">👎</button>
      </div>
      <div class="sources"></div>
    </div>`;
  chat.appendChild(div);
  scrollBottom();
  return div;
}

function setBodyHtml(shell, html) {
  shell.querySelector('.bubble').innerHTML = html;
}

function renderSources(shell, hits) {
  if (!hits || !hits.length) return;
  const box = shell.querySelector('.sources');
  box.innerHTML = `<div class="src-title">📚 引用条目</div>` + hits.map((h) =>
    `<span class="src-chip" title="${escapeHtml(h.excerpt || '')}">${escapeHtml(h.title)}<i>${Number(h.score).toFixed(2)}</i></span>`
  ).join('');
}

/* ========== 流式请求 ========== */
async function streamInto(shell, payload, onDone) {
  const note = shell.querySelector('.stage-note');
  let full = '';
  let sourcesShown = false;
  let gotDelta = false;

  const watchdog = setTimeout(() => {
    if (!gotDelta) {
      note.textContent = '';
      setBodyHtml(shell,
        `<strong style="color:#E67E22">等待超时：</strong>模型 45 秒没有返回内容。请稍后重试。<br><br><button class="ghost-btn" onclick="location.reload()">刷新重试</button>`);
    }
  }, 45000);

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const events = buf.split('\n\n');
      buf = events.pop() || '';
      for (const evRaw of events) {
        const lines = evRaw.split('\n');
        let event = '', dataStr = '';
        for (const l of lines) {
          if (l.startsWith('event:')) event = l.slice(6).trim();
          else if (l.startsWith('data:')) dataStr += l.slice(5).trim();
        }
        if (!dataStr) continue;
        let data; try { data = JSON.parse(dataStr); } catch (_) { continue; }

        if (event === 'status') {
          note.textContent = data.message;
        } else if (event === 'sources') {
          if (!sourcesShown) { renderSources(shell, data.hits); sourcesShown = true; }
        } else if (event === 'delta') {
          if (!gotDelta) { gotDelta = true; clearTimeout(watchdog); }
          full += data.text;
          setBodyHtml(shell, mdToHtml(full) + '<span class="cursor"></span>');
        } else if (event === 'done') {
          clearTimeout(watchdog);
          setBodyHtml(shell, mdToHtml(full));
          recordMsg('assistant', full);
          note.textContent = '';
          // 显示操作按钮
          const actions = shell.querySelector('.actions');
          actions.classList.remove('hidden');
          // 绑定按钮事件
          setupActionButtons(shell, full);
          if (onDone) onDone(full);
          scrollBottom();
          return full;
        } else if (event === 'error') {
          clearTimeout(watchdog);
          setBodyHtml(shell,
            `<strong style="color:#E74C3C">出错：</strong>${escapeHtml(data.message)}<br><br><button class="ghost-btn" onclick="document.getElementById('settingsPage').classList.remove('hidden')">打开设置检查模型服务</button>`);
          note.textContent = '';
          throw new Error(data.message);
        }
      }
    }
  } finally {
    clearTimeout(watchdog);
  }
  if (!full) setBodyHtml(shell, '<em>（模型没有返回内容）</em>');
  return full;
}

/* ========== 操作按钮 ========== */
function setupActionButtons(shell, content) {
  const copyBtn = shell.querySelector('.copy-btn');
  const thumbUp = shell.querySelector('.thumb-up');
  const thumbDown = shell.querySelector('.thumb-down');
  
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(content);
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => { copyBtn.textContent = '📋 复制'; }, 2000);
    } catch (e) {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copyBtn.textContent = '✅ 已复制';
      setTimeout(() => { copyBtn.textContent = '📋 复制'; }, 2000);
    }
  });
  
  thumbUp.addEventListener('click', () => {
    thumbUp.classList.add('active');
    thumbDown.classList.remove('active');
    thumbUp.textContent = '👍 已赞';
    setTimeout(() => { thumbUp.textContent = '👍'; }, 1500);
  });
  
  thumbDown.addEventListener('click', () => {
    thumbDown.classList.add('active');
    thumbUp.classList.remove('active');
    thumbDown.textContent = '👎 已踩';
    setTimeout(() => { thumbDown.textContent = '👎'; }, 1500);
  });
}

/* ========== 文件上传 ========== */
const uploadBtn = $('#uploadBtn');
const fileInput = $('#fileInput');
const filePreview = $('#filePreview');
let uploadedFiles = [];

uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  
  files.forEach(file => {
    if (uploadedFiles.some(f => f.name === file.name)) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      uploadedFiles.push({ name: file.name, content, size: file.size });
      renderFilePreview();
      
      // 将文件内容插入到输入框
      const prefix = uploadedFiles.length === 1 ? '' : '\n\n';
      input.value += prefix + `【文件：${file.name}】\n${content}`;
      autoGrow();
    };
    
    if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      // PDF 或其他二进制文件，只显示文件名
      uploadedFiles.push({ name: file.name, content: `[文件 ${file.name} 已上传，但无法直接读取内容]`, size: file.size });
      renderFilePreview();
      input.value += `\n【文件：${file.name}】`;
      autoGrow();
    }
  });
  
  // 清空 input 以允许重新选择相同文件
  fileInput.value = '';
});

function renderFilePreview() {
  if (uploadedFiles.length === 0) {
    filePreview.classList.add('hidden');
    filePreview.innerHTML = '';
    return;
  }
  
  filePreview.classList.remove('hidden');
  filePreview.innerHTML = uploadedFiles.map((f, i) => `
    <div class="file-chip">
      <span class="file-name">📄 ${escapeHtml(f.name)}</span>
      <span class="file-size">(${formatFileSize(f.size)})</span>
      <button class="file-remove" data-index="${i}">✕</button>
    </div>
  `).join('');
  
  // 绑定删除按钮
  filePreview.querySelectorAll('.file-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index);
      uploadedFiles.splice(idx, 1);
      renderFilePreview();
    });
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ========== 诊断档案 ========== */
const HKEY = 'clinichistory';
let sessions = [];
try { sessions = JSON.parse(localStorage.getItem(HKEY) || '[]'); } catch (_) { sessions = []; }
let curSession = null;

function persistSessions() {
  try { localStorage.setItem(HKEY, JSON.stringify(sessions.slice(-50))); } catch (_) {}
}
function ensureSession(firstText) {
  if (!curSession) {
    curSession = {
      id: Date.now(), ts: Date.now(),
      title: firstText ? firstText.replace(/\s+/g, ' ').slice(0, 24) : '新诊断',
      isDiag: (firstText || '').length >= 250,
      msgs: [],
    };
    sessions.push(curSession);
    persistSessions();
    renderHistList();
  }
}
function recordMsg(role, content) {
  if (!content) return;
  ensureSession('');
  curSession.msgs.push({ role, content });
  persistSessions();
  renderHistList();
}
function renderHistList() {
  const sel = $('#histSel');
  const keep = sel.value;
  sel.innerHTML = '<option value="">— 选择恢复诊断 —</option>' +
    sessions.slice().reverse().map((s) => {
      const d = new Date(s.ts);
      const tag = s.isDiag ? '🩺' : '💬';
      return `<option value="${s.id}">${tag} ${escapeHtml(s.title)} · ${d.getMonth() + 1}/${d.getDate()} · ${s.msgs.length}条</option>`;
    }).join('');
  if ([...sel.options].some((o) => o.value === keep)) sel.value = keep;
}
$('#histSel').addEventListener('change', (e) => {
  const id = Number(e.target.value);
  const s = sessions.find((x) => x.id === id);
  if (!s) return;
  curSession = s;
  chat.innerHTML = '';
  for (const m of s.msgs) {
    if (m.role === 'user') addUserMsg(m.content);
    else {
      const shell = addAiMsgShell();
      setBodyHtml(shell, mdToHtml(m.content));
    }
  }
  scrollBottom();
});
$('#btnNewChat').addEventListener('click', () => {
  curSession = null;
  chat.innerHTML = '';
  showWelcome();
});
$('#btnDelHist').addEventListener('click', () => {
  const v = Number($('#histSel').value);
  if (!v) return;
  sessions = sessions.filter((x) => x.id !== v);
  if (curSession && curSession.id === v) { curSession = null; chat.innerHTML = ''; showWelcome(); }
  persistSessions();
  renderHistList();
});

/* ========== 发送 ========== */
async function handleSend(text) {
  text = (text || '').trim();
  if (busy || !text) return;
  busy = true; sendBtn.disabled = true;
  input.value = ''; autoGrow();
  uploadedFiles = [];
  renderFilePreview();

  const w = $('#welcome');
  if (w) w.remove();

  addUserMsg(text);
  ensureSession(text);
  recordMsg('user', text);

  const shell = addAiMsgShell();
  const hist = (curSession ? curSession.msgs.slice(-8, -1) : [])
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 3000) }));
  try {
    await streamInto(shell, { messages: [...hist, { role: 'user', content: text }] }, () => {});
  } catch (_) {}
  busy = false; sendBtn.disabled = false;
  refreshStatus();
}

/* ========== 欢迎屏 ========== */
function showWelcome() {
  chat.innerHTML = `
  <div id="welcome">
    <div class="big-logo">诊</div>
    <h2>给每一篇叙事做一次病理化验</h2>
    <p>四大逻辑滤网 + 五维25分制评分已就绪。<br>
    把研报、财经文章、官方叙事<b>整段粘贴</b>进来——我会给出：<br>
    诊断等级 → 逐维打分（附原文证据）→ 话术翻译 → 传导链校验 → 反向阅读指示。<br>
    <span style="font-size:12px;color:var(--soft)">短问题也可以直接问：什么是观念实体化？中金倒置何时适用？</span></p>
  </div>`;
}
showWelcome();

/* ========== 输入区事件 ========== */
sendBtn.addEventListener('click', () => handleSend(input.value));
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input.value); }
});
function autoGrow() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 220) + 'px';
}
input.addEventListener('input', autoGrow);

document.querySelectorAll('.ex').forEach((b) => {
  b.addEventListener('click', () => { if (!busy) handleSend(b.dataset.q); });
});

/* ========== 研报抓取 ========== */
$('#btnCrawl').addEventListener('click', async () => {
  const btn = $('#btnCrawl');
  btn.disabled = true;
  btn.textContent = '⏳ 抓取中…';
  try {
    await fetch('/api/crawl', { method: 'POST' });
    await loadReports();
  } catch (e) {
    alert('抓取失败: ' + e.message);
  }
  btn.disabled = false;
  btn.textContent = '🔄 刷新研报';
});

/* ========== 设置页 ========== */
const ACCENTS = [
  { id: 'teal', c1: '#0E9F8A', c2: '#35D0A5' },
  { id: 'indigo', c1: '#2F6FED', c2: '#7B5CF5' },
  { id: 'cyan', c1: '#0891B2', c2: '#22D3EE' },
  { id: 'rose', c1: '#E84C88', c2: '#B14CF0' },
  { id: 'graphite', c1: '#3D4657', c2: '#6B7A99' },
];
const UI_DEFAULTS = { accent: 'teal', mode: 'light', font: 'system', size: '15px', width: '900px' };
let ui = { ...UI_DEFAULTS, ...(JSON.parse(localStorage.getItem('clinicui') || '{}')) };

function applyUi() {
  document.documentElement.dataset.accent = ui.accent;
  const dark = ui.mode === 'dark' || (ui.mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.dataset.theme = dark ? 'dark' : 'light';
  if (ui.font !== 'system') document.body.dataset.font = ui.font;
  else delete document.body.dataset.font;
  document.documentElement.style.setProperty('--chat-size', ui.size);
  document.documentElement.style.setProperty('--chat-width', ui.width);
  localStorage.setItem('clinicui', JSON.stringify(ui));
}
function buildAppearanceControls() {
  const ar = $('#accentRow');
  ar.innerHTML = '';
  for (const a of ACCENTS) {
    const b = document.createElement('button');
    b.className = 'accent-sw' + (ui.accent === a.id ? ' active' : '');
    b.title = a.id;
    b.style.background = `linear-gradient(135deg, ${a.c1}, ${a.c2})`;
    b.onclick = () => { ui.accent = a.id; applyUi(); buildAppearanceControls(); };
    ar.appendChild(b);
  }
  for (const [selId, key] of [['#modeSeg', 'mode'], ['#sizeSeg', 'size']]) {
    $(selId).querySelectorAll('button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.v === ui[key]);
      btn.onclick = () => { ui[key] = btn.dataset.v; applyUi(); buildAppearanceControls(); };
    });
  }
}

async function openSettings() {
  const cfg = await (await fetch('/api/config')).json();
  $('#cfgBaseUrl').value = cfg.baseUrl;
  $('#cfgModel').value = cfg.model;
  $('#cfgApiKey').value = '';
  $('#cfgApiKey').placeholder = cfg.hasKey ? `已保存（${cfg.keyMasked}），留空则不修改` : 'sk-…';
  $('#testResult').textContent = '';
  $('#settingsPage').classList.remove('hidden');
}
$('#btnSettings').addEventListener('click', openSettings);
$('#settingsClose').addEventListener('click', () => $('#settingsPage').classList.add('hidden'));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $('#settingsPage').classList.add('hidden');
});

$('#cfgSave').addEventListener('click', async () => {
  const patch = { baseUrl: $('#cfgBaseUrl').value.trim(), model: $('#cfgModel').value.trim() };
  const key = $('#cfgApiKey').value.trim();
  if (key) patch.apiKey = key;
  const r = await (await fetch('/api/config', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })).json();
  const el = $('#testResult');
  el.textContent = `✅ 已保存 · ${r.model}`;
  el.className = 'test-result ok';
  refreshStatus();
});

$('#cfgTest').addEventListener('click', async () => {
  await $('#cfgSave').click();
  const el = $('#testResult');
  el.textContent = '⏳ 正在连接…';
  el.className = 'test-result';
  try {
    const r = await (await fetch('/api/test-llm', { method: 'POST' })).json();
    if (r.ok) {
      el.textContent = `✅ 连接成功 · 回复「${r.reply}」`;
      el.className = 'test-result ok';
    } else {
      el.textContent = `❌ ${r.error}`;
      el.className = 'test-result bad';
    }
  } catch (err) {
    el.textContent = `❌ ${err}`;
    el.className = 'test-result bad';
  }
});

applyUi();
buildAppearanceControls();
renderHistList();
refreshStatus();
