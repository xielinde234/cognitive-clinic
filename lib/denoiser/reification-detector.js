/**
 * 观念实体化检测器
 * 检测文本中是否存在将特定观念实体化的倾向
 */
class ReificationDetector {
  constructor() {
    this.patterns = [
      // 必然性表述
      { regex: /必然|必然性|一定会|肯定会|必定/g, type: 'necessity' },
      // 铁律/规律
      { regex: /铁律|规律|定理|公理|永恒/g, type: 'law' },
      // 唯一性
      { regex: /唯一|只有|只能|必须|不可或缺/g, type: 'uniqueness' },
      // 历史必然
      { regex: /历史.*必然|趋势.*不可阻挡|大势所趋/g, type: 'historical' },
      // 绝对化
      { regex: /绝对|完全|彻底|100%/g, type: 'absolute' },
    ]
  }

  detect(content) {
    const findings = []
    let count = 0

    for (const pattern of this.patterns) {
      const matches = content.match(pattern.regex)
      if (matches) {
        findings.push({
          type: pattern.type,
          matches: matches,
          count: matches.length,
        })
        count += matches.length
      }
    }

    // 检查是否缺乏可能性表述
    const possibilityWords = ['可能', '或许', '大概', '或然', '条件']
    const hasPossibility = possibilityWords.some(w => content.includes(w))

    if (count > 2 && !hasPossibility) {
      findings.push({
        type: 'no_possibility',
        matches: ['未发现可能性表述'],
        count: 1,
      })
      count++
    }

    return {
      count: Math.min(count, 5), // 最多扣5分
      findings,
      isReified: count > 2,
    }
  }
}

module.exports = ReificationDetector
