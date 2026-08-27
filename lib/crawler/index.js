/**
 * 研报抓取调度器
 * 自动从中金、中信、慧博等机构抓取最新研报
 */
const CICCCrawler = require('./cicc')
const CITICCrawler = require('./citic')
const HiborCrawler = require('./hibor')
const fs = require('fs')
const path = require('path')

class ReportCrawler {
  constructor() {
    this.sources = {
      cicc: new CICCCrawler(),
      citic: new CITICCrawler(),
      hibor: new HiborCrawler(),
    }
    this.dbPath = path.join(__dirname, '..', '..', 'db', 'reports.json')
    this.reports = this.loadReports()
  }

  loadReports() {
    try {
      if (fs.existsSync(this.dbPath)) {
        return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'))
      }
    } catch (e) {
      console.error('[crawler] Failed to load reports:', e.message)
    }
    return []
  }

  saveReports() {
    try {
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.reports, null, 2), 'utf8')
    } catch (e) {
      console.error('[crawler] Failed to save reports:', e.message)
    }
  }

  async crawlAll() {
    console.log('[crawler] Starting crawl for all sources...')

    const results = await Promise.allSettled(
      Object.entries(this.sources).map(async ([name, crawler]) => {
        try {
          const reports = await crawler.fetch()
          console.log(`[crawler] ${name}: fetched ${reports.length} reports`)
          return { name, reports }
        } catch (e) {
          console.error(`[crawler] ${name} failed:`, e.message)
          return { name, reports: [] }
        }
      })
    )

    const allReports = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value.reports)

    // 去重并合并
    const existingIds = new Set(this.reports.map(r => r.id))
    const newReports = allReports.filter(r => !existingIds.has(r.id))

    this.reports = [...newReports, ...this.reports].slice(0, 500) // 保留最近500条
    this.saveReports()

    console.log(`[crawler] Crawl complete: ${newReports.length} new reports`)
    return newReports
  }

  getReports(options = {}) {
    let reports = [...this.reports]

    if (options.source) {
      reports = reports.filter(r => r.source === options.source)
    }

    if (options.limit) {
      reports = reports.slice(0, options.limit)
    }

    return reports
  }

  getReportById(id) {
    return this.reports.find(r => r.id === id)
  }
}

module.exports = ReportCrawler
