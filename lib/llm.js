'use strict';
/**
 * OpenAI 兼容 LLM 客户端：云端（DeepSeek/Qwen/GLM/OpenAI）与本地（Ollama/llama.cpp server）通吃
 * 配置来源优先级：环境变量 > config.json
 */
const fs = require('fs');
const path = require('path');

// 加载 .env 文件（如果存在）
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
} catch (_) { /* 忽略 .env 加载错误 */ }

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

const DEFAULTS = {
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2048,
};

function loadConfig() {
  let cfg = { ...DEFAULTS };
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    cfg = { ...cfg, ...raw };
  } catch (_) { /* 无配置文件，用默认值 */ }
  if (process.env.LLM_BASE_URL) cfg.baseUrl = process.env.LLM_BASE_URL;
  if (process.env.LLM_API_KEY) cfg.apiKey = process.env.LLM_API_KEY;
  if (process.env.LLM_MODEL) cfg.model = process.env.LLM_MODEL;
  return cfg;
}

function saveConfig(patch) {
  const cfg = { ...loadConfig(), ...patch };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
  // apiKey 不回传前端明文
  return { ...cfg, apiKey: mask(cfg.apiKey) };
}

function mask(k) {
  if (!k) return '';
  return k.length <= 8 ? '****' : k.slice(0, 4) + '****' + k.slice(-4);
}

/** 判断是否本地服务（无需 API Key）：localhost / 127.0.0.1 */
function isLocal(baseUrl) {
  return /\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/i.test(baseUrl || '');
}

/** 流式对话：onDelta(text) 逐段回调；返回完整文本 */
async function chatStream({ system, messages, onDelta, temperature }) {
  const cfg = loadConfig();
  if (!cfg.apiKey && !isLocal(cfg.baseUrl)) {
    throw new Error('未配置 LLM。请在设置里填写 API 地址与密钥（本地服务可留空密钥）。');
  }
  const body = {
    model: cfg.model,
    messages: [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...messages,
    ],
    stream: true,
    temperature: temperature ?? cfg.temperature,
    max_tokens: cfg.maxTokens,
  };
  const url = cfg.baseUrl.replace(/\/$/, '') + '/chat/completions';
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`;

  // 上游超时保护：本地模型长推理给足时间，云端 90s
  const timeoutMs = isLocal(cfg.baseUrl) ? 300000 : 90000;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: ac.signal });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error(`LLM 响应超时（${timeoutMs / 1000}s），请检查模型服务是否正常`);
    throw e;
  }
  if (!res.ok) {
    clearTimeout(timer);
    const text = await res.text().catch(() => '');
    throw new Error(`LLM ${res.status}: ${text.slice(0, 300)}`);
  }

  let full = '';
  const decoder = new TextDecoder();
  let buf = '';
  try {
    for await (const chunk of res.body) {
      buf += decoder.decode(chunk, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const data = t.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const j = JSON.parse(data);
          // OpenAI 格式: choices[0].delta.content；兼容 choices[0].text
          const delta = j.choices?.[0]?.delta?.content || j.choices?.[0]?.text || '';
          if (delta) {
            full += delta;
            onDelta && onDelta(delta);
          }
        } catch (_) { /* 忽略不完整行 */ }
      }
    }
  } finally {
    clearTimeout(timer);
  }
  return full;
}

module.exports = { chatStream, loadConfig, saveConfig, mask, isLocal };
