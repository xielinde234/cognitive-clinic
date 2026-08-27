/**
 * 形式逻辑检查器
 * 检查文本中的逻辑矛盾和违例
 */
class LogicChecker {
  constructor() {
    this.patterns = {
      contradiction: [
        { regex: /既.*又.*|一方面.*另一方面/g, desc: '排中率违例：双重表述' },
        { regex: /虽然.*但是.*却/g, desc: '转折矛盾：论述与预期背离' },
        { regex: /表面上.*实际上|名义上.*实际上/g, desc: '表里不一：表面与实质矛盾' },
      ],
      nonSelfConsistent: [
        { regex: /过程.*风险.*结论.*看好/g, desc: '过程悲观、结论乐观' },
        { regex: /数据.*下滑.*预期.*改善/g, desc: '硬数据差、软数据好' },
        { regex: /债务.*承压.*前景.*光明/g, desc: '风险与结论背离' },
      ],
    }
  }

  check(content) {
    const issues = []
    let needsReverse = false

    // 检查逻辑矛盾
    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const matches = content.match(pattern.regex)
        if (matches) {
          issues.push(`${pattern.desc}：发现${matches.length}处`)
          if (type === 'nonSelfConsistent') {
            needsReverse = true
          }
        }
      }
    }

    // 检查结论与论述的逻辑关系
    const conclusionSentences = this.extractConclusion(content)
    const analysisSentences = this.extractAnalysis(content)

    if (conclusionSentences.length > 0 && analysisSentences.length > 0) {
      const conclusionSentiment = this.analyzeSentiment(conclusionSentences.join(' '))
      const analysisSentiment = this.analyzeSentiment(analysisSentences.join(' '))

      // 如果结论和分析的情感倾向相反，说明存在矛盾
      if (conclusionSentiment !== analysisSentiment && conclusionSentiment === 'positive') {
        issues.push('结论与分析过程的情感倾向相反，可能存在逻辑背离')
        needsReverse = true
      }
    }

    return {
      issues,
      needsReverse,
      issueCount: issues.length,
    }
  }

  extractConclusion(content) {
    // 提取最后几句话作为结论
    const sentences = content.split(/[。！？]/).filter(s => s.trim())
    return sentences.slice(-3)
  }

  extractAnalysis(content) {
    // 提取中间部分作为分析过程
    const sentences = content.split(/[。！？]/).filter(s => s.trim())
    const start = Math.floor(sentences.length * 0.2)
    const end = Math.floor(sentences.length * 0.8)
    return sentences.slice(start, end)
  }

  analyzeSentiment(text) {
    const positiveWords = ['增长', '提升', '改善', '向好', '复苏', '反弹', '乐观']
    const negativeWords = ['下滑', '下降', '恶化', '承压', '萎缩', '衰退', '悲观']

    let positiveCount = 0
    let negativeCount = 0

    for (const word of positiveWords) {
      if (text.includes(word)) positiveCount++
    }

    for (const word of negativeWords) {
      if (text.includes(word)) negativeCount++
    }

    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }
}

module.exports = LogicChecker
