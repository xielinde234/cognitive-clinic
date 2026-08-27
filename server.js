'use strict';
/**
 * 认知诊疗室 2.0 · 服务端
 * 贴入研报/叙事 → 四大滤网解剖 + 五维评分 + 反向阅读指示（SSE 流式）
 * 新增：实时研报抓取 + 政治因素剥离 + 可视化对比
 * 端口 3220；LLM 走 OpenAI 兼容接口（本地 llama.cpp / 云端均可）
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const VectorDb = require('./lib/vectordb');
const { chatStream, loadConfig, saveConfig, mask, isLocal } = require('./lib/llm');
const { assemble, isDiagnosis } = require('./lib/prompt');
const ReportCrawler = require('./lib/crawler');
const DenoisingEngine = require('./lib/denoiser');
const cron = require('node-cron');

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const kb = new VectorDb();
let kbReady = false;
kb.init().then(() => { kbReady = true; console.log('[server] knowledge base ready'); });

// 初始化研报抓取器
const crawler = new ReportCrawler();
const denoiser = new DenoisingEngine();

// 定时抓取研报（每6小时）
cron.schedule('0 */6 * * *', async () => {
  console.log('[cron] Starting scheduled crawl...');
  try {
    await crawler.crawlAll();
  } catch (e) {
    console.error('[cron] Crawl failed:', e.message);
  }
});

/* ---------- 状态与配置 ---------- */
app.get('/api/status', (req, res) => {
  const cfg = loadConfig();
  res.json({
    kbReady,
    chunks: kb.chunks.length,
    retrieval: kb.mode,
    llm: { baseUrl: cfg.baseUrl, model: cfg.model, hasKey: !!cfg.apiKey, keyMasked: mask(cfg.apiKey) },
    reports: crawler.getReports({ limit: 1 }).length > 0 ? 'ready' : 'pending',
  });
});

app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  res.json({ baseUrl: cfg.baseUrl, model: cfg.model, hasKey: !!cfg.apiKey, keyMasked: mask(cfg.apiKey), maxTokens: cfg.maxTokens, temperature: cfg.temperature });
});

app.post('/api/config', (req, res) => {
  const { baseUrl, apiKey, model, maxTokens, temperature } = req.body || {};
  const old = loadConfig();
  saveConfig({
    baseUrl: (baseUrl || old.baseUrl).trim(),
    apiKey: apiKey === '' || apiKey == null ? old.apiKey : String(apiKey).trim(),
    model: (model || old.model).trim(),
    maxTokens: Number(maxTokens) > 0 ? Number(maxTokens) : old.maxTokens,
    temperature: temperature != null && !Number.isNaN(Number(temperature)) ? Number(temperature) : old.temperature,
  });
  const now = loadConfig();
  res.json({ ok: true, baseUrl: now.baseUrl, model: now.model, hasKey: !!now.apiKey, keyMasked: mask(now.apiKey) });
});

app.post('/api/test-llm', async (req, res) => {
  try {
    const cfg = loadConfig();
    if (!cfg.apiKey && !isLocal(cfg.baseUrl)) {
      return res.status(400).json({ ok: false, error: '云端服务需要填写 API Key' });
    }
    let reply = '';
    await chatStream({
      system: '你是连通性测试员。收到任何消息都只回复：连接正常',
      messages: [{ role: 'user', content: 'ping' }],
      onDelta: (d) => { reply += d; },
      temperature: 0.1,
    });
    res.json({ ok: true, reply: reply.slice(0, 50) });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message || e) });
  }
});

/* ---------- 知识库目录 ---------- */
app.get('/api/kb/browse', (req, res) => {
  res.json({ entries: kb.browse() });
});

app.get('/api/kb/entries', (req, res) => {
  // 返回完整条目内容
  try {
    const handbookPath = path.join(__dirname, 'kb', 'noise-handbook.json');
    const handbook = JSON.parse(fs.readFileSync(handbookPath, 'utf8'));
    res.json({ entries: handbook.entries || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/kb/search', async (req, res) => {
  const q = String(req.query.q || '');
  const n = Math.min(10, Number(req.query.n) || 6);
  if (!q.trim() || !kbReady) return res.json({ hits: [] });
  const hits = await kb.search(q, n);
  res.json({
    hits: hits.map(({ text, ...r }) => ({ ...r, excerpt: text.slice(0, 140) })),
  });
});

/* ---------- 研报抓取 API ---------- */
app.get('/api/reports', (req, res) => {
  const { source, limit } = req.query;
  const reports = crawler.getReports({
    source,
    limit: limit ? parseInt(limit) : 50,
  });
  res.json({ reports });
});

app.get('/api/reports/:id', (req, res) => {
  const report = crawler.getReportById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json({ report });
});

app.post('/api/crawl', async (req, res) => {
  try {
    const newReports = await crawler.crawlAll();
    res.json({ ok: true, count: newReports.length });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------- 去噪分析 API ---------- */
app.post('/api/denoise', async (req, res) => {
  try {
    const { reportId, text } = req.body || {};

    let report;
    if (reportId) {
      report = crawler.getReportById(reportId);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
    } else if (text) {
      // 直接分析用户提供的文本
      report = {
        id: `user-${Date.now()}`,
        source: 'user',
        title: text.slice(0, 50) + '...',
        content: text,
      };
    } else {
      return res.status(400).json({ error: '请提供 reportId 或 text' });
    }

    const result = await denoiser.denoise(report);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ---------- 诊断/问答（SSE 流式） ---------- */
app.post('/api/chat', async (req, res) => {
  const { messages = [] } = req.body || {};
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return res.status(400).json({ error: '消息不能为空' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let hits = [];
    if (kbReady) {
      send('status', { stage: 'retrieval', message: isDiagnosis(lastUser.content) ? '调取滤网与评分标准…' : '翻阅方法论手册…' });
      const q = lastUser.content.length > 1500 ? lastUser.content.slice(0, 1500) : lastUser.content;
      hits = await kb.search(q, 6);
      send('sources', { hits: hits.map(({ text, ...r }) => ({ ...r, excerpt: text.slice(0, 120) })) });
    }
    const { system, messages: llmMessages } = assemble({
      question: lastUser.content,
      history: messages.slice(0, -1),
      hits,
    });
    send('status', { stage: 'generating', message: isDiagnosis(lastUser.content) ? '解剖中…' : '思考中…' });

    let gotDelta = false;
    let out = await chatStream({
      system,
      messages: llmMessages,
      onDelta: (d) => { gotDelta = true; send('delta', { text: d }); },
    });
    if (!gotDelta) {
      console.warn('[chat] LLM returned no delta, sending fallback');
      send('delta', { text: '（模型未返回内容，请尝试缩短文本或检查模型服务）' });
    }
    // 诊断报告截断续写
    for (let round = 0; isDiagnosis(lastUser.content) && out.length > 80 && !out.includes('不构成投资建议') && round < 2; round++) {
      send('status', { stage: 'generating', message: `继续生成${round > 0 ? '（第二轮）' : ''}…` });
      try {
        const more = await chatStream({
          system,
          messages: [
            ...llmMessages,
            { role: 'assistant', content: out },
            { role: 'user', content: '你的诊断报告写到一半停了。请从中断处直接继续，补完尚未输出的板块和最后的免责声明，不要重复已说过的内容。' },
          ],
          onDelta: (d) => send('delta', { text: d }),
        });
        if (!more) break;
      } catch (_) { break; }
    }
    send('done', {});
  } catch (err) {
    send('error', { message: String(err.message || err) });
  }
  res.end();
});

/* ---------- 统计 API ---------- */
app.get('/api/stats', (req, res) => {
  const reports = crawler.getReports();
  const stats = {
    totalReports: reports.length,
    bySource: {},
    recentCrawl: reports[0]?.fetchedAt || null,
  };

  reports.forEach(r => {
    stats.bySource[r.source] = (stats.bySource[r.source] || 0) + 1;
  });

  res.json(stats);
});

const PORT = process.env.PORT || 3220;
app.listen(PORT, () => {
  console.log(`[server] 认知诊疗室 2.0 running at http://localhost:${PORT}`);
  console.log(`[server] Features: LLM chat, KB search, report crawling, denoising analysis`);
});
