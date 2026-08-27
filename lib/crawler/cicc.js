/**
 * 中金公司研报抓取器
 * 从中金官网抓取最新研究报告
 */
const axios = require('axios')
const cheerio = require('cheerio')

class CICCCrawler {
  constructor() {
    this.name = '中金公司'
    this.source = 'cicc'
    this.baseUrl = 'https://www.cicc.com'
    this.researchUrl = '/research/report'
  }

  async fetch() {
    try {
      // 获取研报列表页
      const listResponse = await axios.get(`${this.baseUrl}${this.researchUrl}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
        timeout: 15000,
      })

      const $ = cheerio.load(listResponse.data)
      const reports = []

      // 解析研报列表
      // 注意：实际选择器需要根据中金官网的实际结构调整
      $('.report-item, .research-item, article').each((i, el) => {
        if (i >= 10) return false // 只取前10条

        const $el = $(el)
        const title = $el.find('h3, h4, .title').text().trim()
        const link = $el.find('a').attr('href')
        const date = $el.find('.date, time').text().trim()
        const author = $el.find('.author').text().trim()
        const excerpt = $el.find('.summary, .desc, p').first().text().trim()

        if (title && link) {
          reports.push({
            id: `cicc-${Date.now()}-${i}`,
            source: this.source,
            title,
            url: link.startsWith('http') ? link : `${this.baseUrl}${link}`,
            date: this.parseDate(date),
            author: author || '中金研究部',
            excerpt: excerpt || title,
            content: '', // 稍后抓取详情
            fetchedAt: new Date().toISOString(),
          })
        }
      })

      // 抓取每篇研报的详情
      for (const report of reports.slice(0, 5)) {
        try {
          const detail = await this.fetchDetail(report.url)
          report.content = detail.content
          report.metrics = detail.metrics
        } catch (e) {
          console.error(`[cicc] Failed to fetch detail: ${report.url}`, e.message)
        }
      }

      return reports
    } catch (e) {
      console.error('[cicc] Fetch failed:', e.message)
      return []
    }
  }

  async fetchDetail(url) {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      timeout: 15000,
    })

    const $ = cheerio.load(response.data)

    // 提取正文内容
    const content = [
      $('article, .article-content, .report-content, main').text().trim(),
      $('meta[name="description"]').attr('content') || '',
    ].filter(Boolean).join('\n\n')

    // 尝试提取关键指标
    const metrics = this.extractMetrics(content)

    return { content, metrics }
  }

  extractMetrics(content) {
    const metrics = {
      confidenceIndex: null,
      growthRate: null,
      investmentGrowth: null,
    }

    // 提取百分比数据
    const percentMatches = content.match(/[\d.]+%/g) || []
    if (percentMatches.length > 0) {
      metrics.growthRate = percentMatches[0]
    }

    // 提取PMI等指标
    const pmiMatch = content.match(/PMI[：:]\s*([\d.]+)/i)
    if (pmiMatch) {
      metrics.pmi = parseFloat(pmiMatch[1])
    }

    return metrics
  }

  parseDate(dateStr) {
    if (!dateStr) return new Date().toISOString()

    // 尝试解析各种日期格式
    const patterns = [
      /(\d{4})[年-](\d{1,2})[月-](\d{1,2})/,
      /(\d{4})(\d{2})(\d{2})/,
    ]

    for (const pattern of patterns) {
      const match = dateStr.match(pattern)
      if (match) {
        const [, year, month, day] = match
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }

    return new Date().toISOString().slice(0, 10)
  }
}

module.exports = CICCCrawler
