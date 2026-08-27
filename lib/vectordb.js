'use strict';
/**
 * 本地向量知识库：bge-small-zh 中文语义嵌入 + 余弦检索
 * 认知诊疗室版：单库（去噪识别手册），嵌入失败降级 TF-IDF
 */
const fs = require('fs');
const path = require('path');

class VectorDb {
  constructor() {
    this.chunks = [];      // { id, type, title, source, text, tags, vec? }
    this.extractor = null; // transformers.js feature-extraction pipeline
    this.tfidf = null;     // 降级检索器
    this.ready = false;
    this.mode = 'init';
  }

  /** 载入知识库文件并切块 */
  loadKb() {
    const kbDir = path.join(__dirname, '..', 'kb');
    let handbook = { entries: [] };
    try {
      handbook = JSON.parse(fs.readFileSync(path.join(kbDir, 'noise-handbook.json'), 'utf8'));
    } catch (e) {
      console.error('[kb] noise-handbook.json 加载失败:', e.message);
    }

    const typeSrc = { filter: '四大逻辑滤网', toxin: '话术翻译表', method: '验证方法', dimension: '评分维度', grade: '诊断等级', case: '经典案例', foundation: '方法论基座', analysis_method: '分析方法', scope: '反向阅读范围', investment: '投资决策指南' };

    for (const e of handbook.entries || []) {
      const src = `一剑封喉去噪手册·${typeSrc[e.type] || '方法论'}`;
      const full = `${e.title}。${e.core} ${e.body}${e.metaphor ? ' 生活比喻：' + e.metaphor + '。' : ''}`;
      for (const [i, seg] of splitChunks(full).entries()) {
        this.chunks.push({
          id: `${e.id}#${i}`, type: e.type || 'filter', title: e.title,
          chapter: null, source: src, tags: e.tags || [],
          keywords: e.keywords || [], text: seg,
        });
      }
      // 标签与关键词单独成一条轻量索引（提高关键词命中率）
      if ((e.tags || []).length) {
        this.chunks.push({
          id: `${e.id}#meta`, type: e.type || 'filter', title: e.title,
          chapter: null, source: src, tags: e.tags,
          keywords: e.keywords || [],
          text: `${e.title} 相关话题：${(e.tags || []).join('、')}。${(e.keywords || []).join('、')}`,
        });
      }
    }
    console.log(`[kb] loaded ${this.chunks.length} chunks from de-noising handbook`);
  }

  /** 初始化嵌入管线；失败则降级 TF-IDF */
  async init() {
    this.loadKb();
    try {
      this.initTfidf();
      const { pipeline, env } = require('@xenova/transformers');
      env.allowLocalModels = true;
      env.localModelPath = path.join(__dirname, '..', 'models');
      if (!fs.existsSync(path.join(env.localModelPath, 'Xenova', 'bge-small-zh-v1.5'))) {
        env.allowLocalModels = false;
        env.remoteHost = process.env.HF_ENDPOINT || 'https://hf-mirror.com';
      }
      this.extractor = await pipeline(
        'feature-extraction', 'Xenova/bge-small-zh-v1.5',
        { quantized: true }
      );
      // 预计算所有块的向量（分批，避免一次性大张量）
      const BATCH = 16;
      for (let i = 0; i < this.chunks.length; i += BATCH) {
        const batch = this.chunks.slice(i, i + BATCH);
        const texts = batch.map((c) => c.text);
        const out = await this.extractor(texts, { pooling: 'mean', normalize: true });
        const vecs = out.tolist();
        for (let j = 0; j < batch.length; j++) batch[j].vec = vecs[j];
      }
      this.mode = 'embedding';
      this.ready = true;
      console.log(`[kb] embedding ready (${this.chunks.length} chunks, local-first)`);
    } catch (err) {
      this.mode = 'tfidf';
      this.ready = true;
      console.warn('[kb] embedding init failed → TF-IDF fallback:', err.message);
    }
  }

  initTfidf() {
    // 极简字符 bigram TF-IDF 作为降级方案
    const df = new Map();
    const docs = this.chunks.map((c) => {
      const tokens = tokenize(c.text + ' ' + (c.keywords || []).join(' ') + ' ' + (c.tags || []).join(' '));
      const tf = new Map();
      for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
      for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);
      return tf;
    });
    const N = this.chunks.length || 1;
    this.tfidf = docs.map((tf, idx) => ({
      chunk: this.chunks[idx],
      weights: [...tf.entries()].map(([t, f]) => [t, (f / tf.size) * Math.log(N / (1 + (df.get(t) || 0)))]),
    }));
  }

  tfidfSearch(query, k) {
    const tokens = tokenize(query);
    const q = new Map();
    for (const t of tokens) q.set(t, (q.get(t) || 0) + 1);
    const scored = this.tfidf.map((d) => {
      let dot = 0, nq = 0, nd = 0;
      for (const [t, w] of q) { nq += w * w; const dw = d.weights.find(([tt]) => tt === t); if (dw) dot += w * dw[1]; }
      for (const [, w] of d.weights) nd += w * w;
      const sim = dot / (Math.sqrt(nq) * Math.sqrt(nd) + 1e-9);
      return { chunk: d.chunk, score: sim };
    }).sort((a, b) => b.score - a.score).slice(0, k * 3);
    return diversify(scored, k);
  }

  async search(query, k = 6) {
    if (!this.ready) return [];
    if (this.mode === 'embedding' && this.extractor) {
      try {
        const out = await this.extractor(query, { pooling: 'mean', normalize: true });
        const qv = out.tolist()[0];
        const scored = [];
        for (const c of this.chunks) {
          if (!c.vec) continue;
          let dot = 0;
          for (let i = 0; i < qv.length; i++) dot += qv[i] * c.vec[i];
          scored.push({ chunk: c, score: dot });
        }
        scored.sort((a, b) => b.score - a.score);
        return diversify(scored.slice(0, k * 3), k);
      } catch (e) {
        console.warn('[kb] embedding search failed → tfidf:', e.message);
      }
    }
    return this.tfidfSearch(query, k);
  }

  /** 简易目录：按条目去重 */
  browse() {
    const seen = new Map();
    for (const c of this.chunks) {
      if (!seen.has(c.id.split('#')[0])) {
        seen.set(c.id.split('#')[0], { type: c.type, title: c.title, source: c.source });
      }
    }
    return [...seen.values()];
  }
}

/** 同一条目最多占 k 中 2 席，保证来源多样性 */
function diversify(scored, k) {
  const perEntry = new Map();
  const out = [];
  for (const s of scored) {
    const base = s.chunk.id.split('#')[0];
    const n = perEntry.get(base) || 0;
    if (n >= 2) continue;
    perEntry.set(base, n + 1);
    out.push(s);
    if (out.length >= k) break;
  }
  return out.map(({ chunk, score }) => ({ ...chunk, score }));
}

/** 粗粒度切块：按句号聚合到 ~400 字 */
function splitChunks(text, maxLen = 400) {
  const sentences = text.replace(/([。！？；])/g, '$1\n').split('\n').filter((s) => s.trim());
  const chunks = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > maxLen && cur) { chunks.push(cur.trim()); cur = ''; }
    cur += s;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length ? chunks : [text];
}

/** 字符 bigram 分词（中文降级用） */
function tokenize(text) {
  const t = String(text).toLowerCase().replace(/\s+/g, '');
  const out = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out.length ? out : [t];
}

module.exports = VectorDb;
