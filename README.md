# 认知诊疗室 2.0

> **以哲学为母体、以逻辑为骨架、以多样性破除思想锁**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/xielinde234/cognitive-clinic/actions/workflows/ci.yml/badge.svg)](https://github.com/xielinde234/cognitive-clinic/actions/workflows/ci.yml)
[![tests](https://img.shields.io/badge/tests-8%20passed-brightgreen.svg)](scripts/smoke-test.js)

## 系统简介

认知诊疗室 2.0 是一个基于形式逻辑与哲学方法论的智能研报分析工具，帮助投资者识破媒体上那些似是而非的理财和宏观分析叙事。

### 核心功能

| 功能 | 说明 |
|------|------|
| 🔍 四大逻辑滤网 | 不矛盾律、观念实体化排除、定性先于定量、政治偏误去噪 |
| 📊 五维25分制评分 | 逻辑自洽度、思路多维性、因果定性验证、事实标准透明度、利益政治去噪 |
| 📰 实时研报抓取 | 自动从中金、中信、慧博等机构抓取最新研报 |
| 🔄 反向阅读引擎 | 将受约束的结论颠倒180度理解，提取客观数据 |
| 📁 文件上传分析 | 支持上传 txt/md/csv/pdf 文件进行诊断 |
| 💬 智能对话 | SSE 流式响应，支持历史记录保存 |

## 快速开始

### 前置要求

- Node.js >= 18
- npm 或 yarn

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/yourusername/cognitive-clinic.git
cd cognitive-clinic/webapp

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 API Key
```

### 启动服务

```bash
# 启动服务
npm start
```

访问 http://localhost:3220

## 配置说明

复制 `.env.example` 为 `.env` 并配置：

```bash
# LLM 服务配置（必填）
LLM_BASE_URL=https://token.sensenova.cn/v1
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=sensenova-6.7-flash-lite
```

支持的 LLM 服务：
- [SenseNova](https://www.sensenova.cn/) - 商汤日日新
- [DeepSeek](https://platform.deepseek.com/) - DeepSeek Chat
- [Ollama](https://ollama.com/) - 本地部署（无需 API Key）
- 任何 OpenAI 兼容接口

## 使用指南

### 1. 对话诊断

将研报、财经文章或官方叙事整段粘贴到对话框：
- 文本长度 ≥ 250 字自动进入诊断模式
- 系统会输出：诊断等级 → 五维评分 → 话术翻译 → 反向阅读指示

### 2. 文件上传

点击输入框左侧 📎 按钮上传文件：
- 支持格式：`.txt` `.md` `.csv` `.pdf`
- 文件内容自动填入输入框
- 上传后可预览和删除

### 3. 回答操作

每条 AI 回答下方有三个操作按钮：
- 📋 **复制** - 复制回答内容到剪贴板
- 👍 **答得好** - 点赞
- 👎 **答得不好** - 踩

### 4. 研报浏览器

点击侧边栏 "📰 研报浏览器"：
- 查看自动抓取的最新研报
- 点击研报卡片进行去噪分析
- 查看五维评分和反向阅读指示

### 5. 知识库管理

点击侧边栏 "📚 知识库管理"：
- 查看 65 条方法论条目
- 按类型分类（滤网/话术翻译/方法等）
- 点击展开查看详细内容

## 项目结构

```
cognitive-clinic/
├── webapp/
│   ├── server.js              # Express 服务端
│   ├── lib/
│   │   ├── llm.js            # LLM 调用模块
│   │   ├── vectordb.js       # 向量知识库
│   │   ├── prompt.js         # 提示词组装
│   │   ├── crawler/          # 研报抓取模块
│   │   └── denoiser/         # 去噪引擎
│   ├── public/               # 前端静态文件
│   │   ├── index.html
│   │   ├── app.js
│   │   └── style.css
│   ├── kb/                   # 知识库数据
│   │   └── noise-handbook.json
│   ├── config.json           # LLM 配置（已 gitignore）
│   ├── .env.example          # 环境变量模板
│   └── .gitignore
└── README.md
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/status` | GET | 系统状态 |
| `/api/config` | GET/POST | LLM 配置 |
| `/api/chat` | POST | 对话（SSE 流式） |
| `/api/reports` | GET | 研报列表 |
| `/api/crawl` | POST | 手动触发抓取 |
| `/api/denoise` | POST | 去噪分析 |
| `/api/kb/entries` | GET | 知识库条目 |
| `/api/kb/search` | GET | 知识库搜索 |

## 技术栈

- **后端**: Node.js + Express
- **前端**: 原生 HTML/CSS/JavaScript
- **知识库**: TF-IDF 关键词检索（支持语义向量降级）
- **定时任务**: node-cron

## 参考书籍

本工具基于以下方法论：

1. **《西方哲学史》(希尔贝克版)** - 哲学为母体
2. **《涛动周期论》(周金涛)** - 研报分析框架
3. **《形式逻辑》(华东师大版)** - 逻辑为骨架

## 免责声明

本工具为基于形式逻辑与方法论的文本分析，不构成投资建议；市场有风险，决策需独立。

## License

[MIT](LICENSE)
