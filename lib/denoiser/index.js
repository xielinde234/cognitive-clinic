/**
 * 去噪引擎
 * 对研报进行政治因素剥离与反向阅读分析
 */
const LogicChecker = require('./logic-checker')
const ReificationDetector = require('./reification-detector')
const ReverseReader = require('./reverse-reader')

class DenoisingEngine {
  constructor() {
    this.logicChecker = new LogicChecker()
    this.reificationDetector = new ReificationDetector()
    this.reverseReader = new ReverseReader()
  }

  async denoise(report) {
    // Step 1: 逻辑一致性检查
    const logicResult = this.logicChecker.check(report.content)

    // Step 2: 观念实体化检测
    const reificationResult = this.reificationDetector.detect(report.content)

    // Step 3: 政治因素识别
    const politicalNoise = this.detectPoliticalNoise(report.content)

    // Step 4: 反向阅读（如果需要）
    let reverseReading = null
    if (logicResult.needsReverse || politicalNoise.isBiased) {
      reverseReading = this.reverseReader.process(report)
    }

    // Step 5: 提取对比数据
    const comparison = this.extractComparisonData(report)

    // Step 6: 计算总分
    const score = this.calculateScore(logicResult, reificationResult, politicalNoise)

    return {
      reportId: report.id,
      title: report.title,
      source: report.source,
      logic: logicResult,
      reification: reificationResult,
      politicalNoise,
      reverseReading,
      comparison,
      score: score.total,
      dimensions: score.dimensions,
      grade: score.grade,
      actions: this.getRecommendations(score.total),
    }
  }

  detectPoliticalNoise(content) {
    const indicators = [
      { pattern: /稳中向好/g, weight: 0.3 },
      { pattern: /进退有度/g, weight: 0.3 },
      { pattern: /一分为二/g, weight: 0.4 },
      { pattern: /既要.*又要/g, weight: 0.3 },
      { pattern: /挑战与机遇/g, weight: 0.2 },
      { pattern: /高质量发展/g, weight: 0.15 },
      { pattern: /韧性/g, weight: 0.2 },
      { pattern: /长期向好/g, weight: 0.3 },
    ]

    let totalWeight = 0
    const found = []

    for (const indicator of indicators) {
      const matches = content.match(indicator.pattern)
      if (matches) {
        totalWeight += indicator.weight * matches.length
        found.push(matches[0])
      }
    }

    return {
      isBiased: totalWeight > 0.5,
      weight: Math.min(totalWeight, 1),
      indicators: found,
    }
  }

  extractComparisonData(report) {
    if (!report.metrics) return null

    // 提取官方数据
    const official = {
      labels: ['民营企业信心', '消费增速', '房地产投资', '非标融资'],
      values: [
        report.metrics.confidenceIndex || 8,
        report.metrics.growthRate || 6.5,
        report.metrics.investmentGrowth || 2.5,
        report.metrics.nonStandard || 4,
      ],
    }

    // 生成修正数据（反向阅读逻辑）
    const adjusted = {
      labels: official.labels,
      values: [
        -Math.abs(official.values[0] - 10),  // 信心指数反转
        official.values[1] * 0.3,            // 消费增速打折
        -Math.abs(official.values[2] + 5),   // 投资反转为负
        -Math.abs(official.values[3] + 9),   // 非标反转为负
      ],
    }

    return { official, adjusted }
  }

  calculateScore(logicResult, reificationResult, politicalNoise) {
    // 五维评分
    const dimensions = {
      logic: 5 - logicResult.issues.length,           // 逻辑自洽度
      diversity: 5 - reificationResult.count,          // 思路多维性
      causation: this.checkCausation(logicResult),     // 因果定性验证
      factStandard: 5 - politicalNoise.weight * 3,    // 事实标准透明度
      debiased: 5 - (politicalNoise.isBiased ? 3 : 0), // 利益政治去噪
    }

    // 确保分数在1-5之间
    for (const key of Object.keys(dimensions)) {
      dimensions[key] = Math.max(1, Math.min(5, Math.round(dimensions[key])))
    }

    const total = Object.values(dimensions).reduce((a, b) => a + b, 0)

    let grade = '思维毒素'
    if (total >= 21) grade = '深度理性'
    else if (total >= 15) grade = '局部污染'
    else if (total >= 10) grade = '高度噪音'

    return { total, dimensions, grade }
  }

  checkCausation(logicResult) {
    // 基于逻辑检查结果评估因果链
    const hasCausation = logicResult.issues.some(i => i.includes('传导') || i.includes('因果'))
    return hasCausation ? 2 : 4
  }

  getRecommendations(score) {
    if (score >= 21) {
      return [
        '该分析逻辑高度严密，可纳入投资决策参考',
        '仍建议交叉验证关键数据来源',
        '注意结论适用的前提条件',
      ]
    }
    if (score >= 15) {
      return [
        '采纳其结构性分析与事实描述',
        '对其收益测算、点位预测一律打折对待',
        '找出实体化最严重的段落单独免疫处理',
      ]
    }
    if (score >= 10) {
      return [
        '立即启动反向阅读法',
        '采纳其底层客观困难数据',
        '将投资结论颠倒180度理解',
        '对其淡化处理的段落加倍重视',
      ]
    }
    return [
      '逻辑混乱的话术拼凑',
      '建议直接拉黑该信源',
      '防止污染决策工具箱',
    ]
  }
}

module.exports = DenoisingEngine
