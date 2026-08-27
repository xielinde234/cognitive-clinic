/**
 * 反向阅读引擎
 * 对受政治约束的研报进行反向解读
 */
class ReverseReader {
  process(report) {
    // 分离论述与结论
    const { analysis, conclusion } = this.separateAnalysisAndConclusion(report.content)

    // 提取客观数据
    const objectiveData = this.extractObjectiveData(report.content)

    // 生成反向结论
    const reverseConclusion = this.generateReverseConclusion(conclusion, report)

    // 识别被淡化的内容
    const downplayed = this.identifyDownplayed(report.content)

    return {
      originalConclusion: conclusion.slice(0, 200),
      adopt: objectiveData.slice(0, 5),
      reverse: reverseConclusion,
      downplayed: downplayed.slice(0, 3),
      confidence: this.calculateConfidence(report),
    }
  }

  separateAnalysisAndConclusion(content) {
    // 简单的分离逻辑：前70%作为分析，后30%作为结论
    const sentences = content.split(/[。！？]/).filter(s => s.trim())
    const splitIndex = Math.floor(sentences.length * 0.7)

    return {
      analysis: sentences.slice(0, splitIndex).join('。'),
      conclusion: sentences.slice(splitIndex).join('。'),
    }
  }

  extractObjectiveData(content) {
    const data = []

    // 提取百分比数据
    const percentMatches = content.match(/[\d.]+%/g) || []
    if (percentMatches.length > 0) {
      data.push(`增长/变化数据：${percentMatches.slice(0, 3).join('、')}`)
    }

    // 提取绝对数值
    const numberMatches = content.match(/\d+(?:\.\d+)?(?:万亿|亿|万)/g) || []
    if (numberMatches.length > 0) {
      data.push(`规模数据：${numberMatches.slice(0, 3).join('、')}`)
    }

    // 提取行业/领域数据
    const industryMatches = content.match(/(?:房地产|制造业|服务业|消费|投资|出口)[^。，]{0,20}(?:增长|下降|提升|萎缩)/g) || []
    if (industryMatches.length > 0) {
      data.push(`行业数据：${industryMatches.slice(0, 2).join('；')}`)
    }

    return data
  }

  generateReverseConclusion(conclusion, report) {
    const reverseMap = {
      '看好': '谨慎',
      '乐观': '悲观',
      '买入': '观望',
      '推荐': '风险提示',
      '复苏': '磨底',
      '反弹': '继续承压',
      '增长': '放缓',
      '改善': '恶化',
    }

    let reverseConclusion = conclusion

    for (const [key, value] of Object.entries(reverseMap)) {
      if (conclusion.includes(key)) {
        reverseConclusion = reverseConclusion.replace(new RegExp(key, 'g'), value)
      }
    }

    // 如果没有匹配到关键词，添加通用反向标记
    if (reverseConclusion === conclusion) {
      reverseConclusion = `[反向解读] ${conclusion.slice(0, 100)}...（需结合实际经济结构调整判断）`
    }

    return reverseConclusion
  }

  identifyDownplayed(content) {
    const downplayed = []

    // 识别被放在括号或脚注的内容
    const footnoteMatches = content.match(/（[^）]*）|\([^)]*\)/g) || []
    if (footnoteMatches.length > 0) {
      downplayed.push(`括号/脚注内容：${footnoteMatches.slice(0, 2).join('、')}`)
    }

    // 识别"但是"后面的内容（通常被淡化）
    const butMatches = content.match(/但是[^。，]{10,50}/g) || []
    if (butMatches.length > 0) {
      downplayed.push(`转折后内容：${butMatches[0]}`)
    }

    return downplayed
  }

  calculateConfidence(report) {
    // 基于来源和内容质量计算置信度
    let confidence = 0.5

    if (report.source === 'cicc' || report.source === 'citic') {
      confidence += 0.2 // 头部机构数据可信度高
    }

    if (report.content && report.content.length > 1000) {
      confidence += 0.1 // 内容越详细越可信
    }

    return Math.min(confidence, 0.9)
  }
}

module.exports = ReverseReader
