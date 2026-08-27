# Cognitive Clinic 2.0

> **Philosophy as the foundation, logic as the skeleton, diversity to break mental locks**

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Introduction

Cognitive Clinic 2.0 is an intelligent research-report analysis tool based on formal logic and philosophical methodology. It helps investors break through the superficial and specious financial and macroeconomic narratives found in media.

### Core Features

| Feature | Description |
|---------|-------------|
| 🔍 Four-Layer Logic Filters | Law of non-contradiction, reification elimination, quality-before-quantity, and political bias de-noising |
| 📊 Five-Dimension 25-Point Scoring | Logical consistency, multi-perspective thinking, causal qualitative validation, factual standard transparency, and interest/political de-noising |
| 📰 Real-Time Report Crawling | Automatically fetches the latest research reports from CICC, CITIC, Hibor, etc. |
| 🔄 Reverse-Reading Engine | Inverts constrained conclusions 180 degrees and extracts objective data |
| 📁 File Upload Analysis | Upload txt/md/csv/pdf files for diagnosis |
| 💬 Intelligent Chat | SSE streaming responses with history saved |

## Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/cognitive-clinic.git
cd cognitive-clinic

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and fill in your API Key
```

### Start the Server

```bash
npm start
```

Visit http://localhost:3220

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# LLM Service Config (required)
LLM_BASE_URL=https://token.sensenova.cn/v1
LLM_API_KEY=sk-your-api-key-here
LLM_MODEL=sensenova-6.7-flash-lite
```

Supported LLM services:
- [SenseNova](https://www.sensenova.cn/) - SenseTime DailyNew
- [DeepSeek](https://platform.deepseek.com/) - DeepSeek Chat
- [Ollama](https://ollama.com/) - Local deployment (no API key required)
- Any OpenAI-compatible endpoint

## Usage Guide

### 1. Chat Diagnosis

Paste an entire research report, financial article, or official narrative into the chat box:
- Text ≥ 250 characters automatically enters diagnosis mode
- Outputs: diagnosis level → five-dimension scoring → rhetoric translation → reverse-reading guidance

### 2. File Upload

Click the 📎 button left of the input box to upload files:
- Supported formats: `.txt` `.md` `.csv` `.pdf`
- File content is auto-filled into the input box
- Preview and delete uploaded files

### 3. Response Actions

Each AI response has three action buttons:
- 📋 **Copy** - Copy the response content to clipboard
- 👍 **Good Answer** - thumbs up
- 👎 **Bad Answer** - thumbs down

### 4. Report Browser

Click "📰 Report Browser" in the sidebar:
- View the latest auto-crawled reports
- Click a report card to run de-noising analysis
- View five-dimension scoring and reverse-reading guidance

### 5. Knowledge Base

Click "📚 Knowledge Base" in the sidebar:
- Browse the 65 methodology entries
- Filter by type (filters / rhetoric translations / methods, etc.)
- Click to expand and view detailed content

## Project Structure

```
cognitive-clinic/
├── server.js              # Express server
├── lib/
│   ├── llm.js            # LLM client module
│   ├── vectordb.js       # Vector knowledge base
│   ├── prompt.js         # Prompt assembly
│   ├── crawler/          # Report crawler module
│   └── denoiser/         # De-noising engine
├── public/               # Frontend static files
│   ├── index.html
│   ├── app.js
│   └── style.css
├── kb/                   # Knowledge base data
│   └── noise-handbook.json
├── config.json           # LLM config (gitignored)
├── .env.example          # Environment variable template
└── .gitignore
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | System status |
| `/api/config` | GET/POST | LLM configuration |
| `/api/chat` | POST | Chat (SSE streaming) |
| `/api/reports` | GET | Report list |
| `/api/crawl` | POST | Trigger manual crawl |
| `/api/denoise` | POST | De-noising analysis |
| `/api/kb/entries` | GET | Knowledge base entries |
| `/api/kb/search` | GET | Knowledge base search |

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Knowledge Base**: TF-IDF keyword retrieval (falls back from semantic vectors)
- **Scheduled Tasks**: node-cron

## Reference Books

This tool is based on the following methodologies:

1. **《A History of Philosophy》(Hillberg Edition)** - Philosophy as the foundation
2. **《Cycles Theory》(Zhou Jintao)** - Research analysis framework
3. **《Formal Logic》(East China Normal University Press)** - Logic as the skeleton

## Disclaimer

This tool provides textual analysis based on formal logic and methodology, and does not constitute investment advice. Markets carry risk; decide independently.

## License

[MIT](LICENSE)
