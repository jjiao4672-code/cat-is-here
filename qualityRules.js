(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.AdlerQuality = rules;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const safetyPatterns = [
    /自杀|轻生|结束生命|不想再?活|活不下去|伤害自己|自残|割腕|跳楼|从.{0,8}(?:楼上?|桥上?|高处)跳下去|不能保证.*安全/i,
    /杀人|杀了(?:他|她|他们)|伤害(?:别人|他人)|报复(?:他|她|他们)/i,
    /家暴|被打|(?:伴侣|对象|家人).{0,4}打我|暴力威胁|被跟踪|跟踪我|强迫我|无法自由离开|不让我(?:安全)?离开|不让我走/i,
    /suicid|kill myself|end my life|don'?t want to (?:be alive|live)|self[- ]?harm|hurt myself|can'?t keep myself safe/i,
    /kill (?:him|her|them|someone)|hurt (?:him|her|them|someone)|harm someone|domestic violence|(?:partner|spouse).{0,8}(?:hits?|hurts?) me|being stalked|forced me|cannot leave safely/i
  ];
  const clinicalPatterns = [
    /你(?:患有|就是|一定是).{0,8}(?:抑郁症|焦虑症|强迫症|创伤后应激障碍|人格障碍)/i,
    /(?:诊断为|确诊|人格类型是|依恋类型是|潜意识里(?:就是|一定|其实))/i,
    /you (?:have|definitely have|are).{0,12}(?:depression|anxiety disorder|ocd|ptsd|personality disorder)/i,
    /your (?:attachment type|personality type|subconscious) (?:is|proves|shows)/i
  ];
  const chickenSoupPatterns = [
    /相信自己|一切都会好起来|你已经足够好了|拥抱真实的自己|成为更好的自己|加油你可以/i,
    /believe in yourself|everything will be okay|you are enough|be your best self|just stay positive/i
  ];
  const jargonPatterns = [
    /可核对的连接|维持机制|反事实验证|功能性回避|认知过程|分析表明|模型认为|情绪调节策略/i,
    /verifiable connection|maintenance mechanism|counterfactual validation|functional avoidance|the model (?:shows|indicates)|analysis indicates/i
  ];
  const conceptTerms = ["反复寻求确认", "不确定性不耐受", "拒绝敏感", "反复负性思考", "体验回避", "自我批评", "完美主义式自我评价", "执行功能负荷", "回避性应对"];
  const metaphorMarker = /(?:(?<!不)像(?!不像)|好比|如同|仿佛|就像|like\s+(?:a|an|the)\b|as if\b)/gi;
  const personificationPattern = /(?:想法|担心|情绪|事实|记录|难受|预测).{0,8}(?:跑出来|跑得|坐到|挪到|发亮|说话|躲起来|抓住|走到)|(?:纸|线团|路线).{0,8}(?:告诉|说|压成|理清)/i;
  const mixedImageryPattern = /(?:门铃?|钥匙|房间).{0,80}(?:线团|画纸|航线|迷雾)|(?:线团|画纸|航线|迷雾).{0,80}(?:门铃?|钥匙|房间)/i;
  const scenarioScopes = [
    { name: "relationship", source: /关系|伴侣|对象|男友|女友|丈夫|妻子|婚姻|恋爱|分手|分开|对方|联系|回复|消息|疏远|在乎|朋友|同事|冲突|拒绝|边界|\b(?:relationship|partner|spouse|boyfriend|girlfriend|marriage|reply|message|contact|distant|friend|coworker|conflict|rejection|boundary)\b|break ?up|separat/i, output: /这段关系|关系.{0,10}(?:可靠|结束|变淡|疏远|破裂)|对方|分开|分手|不再在乎|抛下|伴侣|对象|婚姻|恋爱|\b(?:relationship|partner|spouse)\b|break ?up|separat|no longer care|abandon/i },
    { name: "work_or_study", source: /工作|职场|公司|主管|老板|同事|岗位|简历|面试|求职|申请|学习|学校|老师|考试|作业|成绩|任务|截止|评价|评审|\b(?:work|job|company|manager|boss|coworker|role|interview|application|study|school|teacher|exam|assignment|grade|task|deadline|review)\b|\br[ée]sum[ée]\b/i, output: /工作|职场|公司|主管|老板|岗位|简历|面试|求职|学习|学校|老师|考试|作业|成绩|截止|评审|\b(?:work|job|company|manager|boss|role|interview|application|study|school|teacher|exam|assignment|grade|deadline|review)\b|\br[ée]sum[ée]\b/i },
    { name: "family", source: /家庭|家人|父母|父亲|母亲|爸爸|妈妈|孩子|儿子|女儿|兄弟|姐妹|亲人|\b(?:family|parent|father|mother|child|son|daughter|brother|sister|relative)\b/i, output: /家庭|家人|父母|父亲|母亲|爸爸|妈妈|孩子|儿子|女儿|兄弟|姐妹|亲人|\b(?:family|parent|father|mother|child|son|daughter|brother|sister|relative)\b/i },
    { name: "money_or_housing", source: /钱|收入|工资|债务|欠款|房租|住房|房子|搬家|经济|\b(?:money|income|salary|debt|rent|housing|home|financial)\b|move house/i, output: /钱|收入|工资|债务|欠款|房租|住房|房子|搬家|经济|\b(?:money|income|salary|debt|rent|housing|financial)\b|move house/i },
    { name: "health_or_substance", source: /身体|健康|睡眠|失眠|药物|用药|饮酒|酒精|物质使用|疼痛|生病|\b(?:body|health|sleep|insomnia|medication|medicine|drinking|alcohol|substance|pain|illness)\b/i, output: /健康|睡眠|失眠|药物|用药|饮酒|酒精|物质使用|疼痛|生病|\b(?:health|sleep|insomnia|medication|medicine|drinking|alcohol|substance|pain|illness)\b/i }
  ];

  const hasSafetyLanguage = (value) => safetyPatterns.some((pattern) => pattern.test(String(value || "")));

  function redactDirectIdentifiers(value) {
    return String(value || "")
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email removed]")
      .replace(/\+\d(?:[\s()-]*\d){7,14}/g, "[phone removed]")
      .replace(/\b1[3-9]\d{9}\b/g, "[phone removed]")
      .replace(/\b\d{17}[\dXx]\b/g, "[id removed]");
  }

  function summaryIssues(value) {
    const text = String(value || "").trim();
    const issues = [];
    const isChinese = /[\u3400-\u9fff]/.test(text);
    if (!text) issues.push("empty_summary");
    if (isChinese && text.length > 180) issues.push("summary_too_long");
    if (!isChinese && text.split(/\s+/).filter(Boolean).length > 90) issues.push("summary_too_long");
    const sentences = text.split(/[。！？.!?]+/).map((item) => item.trim()).filter(Boolean);
    if (isChinese && sentences.some((item) => item.length > 55)) issues.push("sentence_too_long");
    if (!isChinese && sentences.some((item) => item.split(/\s+/).length > 32)) issues.push("sentence_too_long");
    if (jargonPatterns.some((pattern) => pattern.test(text))) issues.push("jargon_in_summary");
    if (conceptTerms.some((term) => text.includes(term))) issues.push("concept_in_summary");
    if (chickenSoupPatterns.some((pattern) => pattern.test(text))) issues.push("generic_encouragement");
    return [...new Set(issues)];
  }

  function outputIssues(value) {
    const text = typeof value === "string" ? value : JSON.stringify(value || {});
    const issues = [];
    if (clinicalPatterns.some((pattern) => pattern.test(text))) issues.push("diagnostic_or_fixed_claim");
    if (chickenSoupPatterns.some((pattern) => pattern.test(text))) issues.push("generic_encouragement");
    return [...new Set(issues)];
  }

  function ungroundedScenarioIssues(source, value) {
    const sourceText = String(source || "");
    const outputText = typeof value === "string" ? value : JSON.stringify(value || {});
    return scenarioScopes.filter((scope) => !scope.source.test(sourceText) && scope.output.test(outputText)).map((scope) => scope.name);
  }

  function metaphorIssues(value, { safety = false } = {}) {
    const text = String(value || "");
    const markers = text.match(metaphorMarker) || [];
    const issues = [];
    if (safety && (markers.length || personificationPattern.test(text))) issues.push("metaphor_in_safety");
    if (markers.length > 1) issues.push("multiple_metaphors");
    if (mixedImageryPattern.test(text)) issues.push("mixed_imagery");
    if (personificationPattern.test(text)) issues.push("continuous_personification");
    if (markers.length === 1 && !/[。.!；;][\s\S]{4,}/.test(text.slice(text.search(metaphorMarker)))) issues.push("metaphor_without_plain_explanation");
    return [...new Set(issues)];
  }

  return { hasSafetyLanguage, redactDirectIdentifiers, summaryIssues, outputIssues, metaphorIssues, ungroundedScenarioIssues };
});
