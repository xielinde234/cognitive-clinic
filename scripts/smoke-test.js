'use strict';
/**
 * 去噪引擎冒烟测试（CI 用）
 * 无需 LLM、无需网络、不依赖模型缓存，验证核心去噪逻辑可运行
 */
const DenoisingEngine = require('../lib/denoiser');

let passed = 0;
let failed = 0;

function assert(name, cond, detail) {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.error(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
}

(async () => {
  const engine = new DenoisingEngine();
  console.log('\n🧪 认知诊疗室 去噪引擎冒烟测试\n');

  // 用例 1：含政治话术 + 因果倒置的"假研报"
  const toxicReport = {
    id: 'test-1',
    title: '测试：政治话术研报',
    source: 'test',
    content: '尽管民营企业投资数据有所下滑，但信心指数调研显示预期正在改善。历史规律表明，社融见底后市场必然迎来大反弹。我们要一分为二地看：虽然面临需求不足的困难，但也蕴藏着高质量发展的历史机遇。强烈推荐买入。'
  };

  const r1 = await engine.denoise(toxicReport);
  assert('返回结构完整', r1 && typeof r1.score === 'number' && r1.dimensions);
  assert('低分识别毒性（score < 15）', r1.score < 15, `score=${r1.score}`);
  assert('五维评分都有值', r1.dimensions && ['logic','diversity','causation','factStandard','debiased'].every(k => typeof r1.dimensions[k] === 'number'));
  assert('给出处置建议', Array.isArray(r1.actions) && r1.actions.length > 0);
  assert('毒性文本被标记反向阅读', r1.reverseReading !== null);

  // 用例 2：中性/高质量研报
  const cleanReport = {
    id: 'test-2',
    title: '测试：数据驱动研报',
    source: 'test',
    content: '根据审计财报数据，该公司过去三年营业收入复合增长率为15%，毛利率稳定在40%左右。现金流健康，负债率低于行业均值。这些数据均来自公开披露的年度审计报告。'
  };

  const r2 = await engine.denoise(cleanReport);
  assert('中性文本评分较高（score >= 15）', r2.score >= 15, `score=${r2.score}`);
  assert('中性文本不强制反向阅读', r2.reverseReading === null || r2.reverseReading === undefined);

  // 用例 3：政治偏误检测能力
  const politicalReport = {
    id: 'test-3',
    title: '测试：官方叙事',
    source: 'test',
    content: '当前经济整体稳中向好，长期向好的基本面没有改变，我们要一分为二看待短期波动。'
  };
  const r3 = await engine.denoise(politicalReport);
  assert('识别政治话术噪音', r3.politicalNoise && r3.politicalNoise.isBiased === true, JSON.stringify(r3.politicalNoise));

  console.log(`\n📊 结果：${passed} 通过 / ${failed} 失败\n`);
  process.exit(failed > 0 ? 1 : 0);
})().catch((e) => {
  console.error('❌ 测试异常:', e);
  process.exit(1);
});
