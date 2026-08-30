(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.AdlerAssessment = api;
})(globalThis, function () {
  const opt = (id, label, score) => ({ id, label, ...(score === undefined ? {} : { score }) });
  const q = (id, kicker, title, hint, options, extra = {}) => ({ id, kicker, title, hint, options, max: extra.max || 1, ...extra });
  const frequency = [opt("none", "完全没有", 0), opt("days", "有几天", 1), opt("often", "超过一半时间", 2), opt("daily", "几乎每天", 3), opt("unsure", "不确定"), opt("skip", "不愿回答")];
  const impact = [opt("none", "基本能完成", 0), opt("some", "比平时困难", 1), opt("clear", "需要勉强完成", 2), opt("unable", "重要事情无法完成", 3), opt("unsure", "说不清")];
  const questions = {
    CONSENT_01: q("CONSENT_01", "先把边界说清楚", "猫会先确认安全，再陪你分开事实和猜测。你愿意继续吗？", "安全判断在浏览器完成；继续后，本轮结构化回答和主动填写的文字会发送给 AI。它不能替代诊断、治疗或危机干预。", [opt("continue", "我准备好了，继续"), opt("exit", "今天先不继续")]),
    SAFE_01: q("SAFE_01", "先确认安全", "你现在是否担心自己可能伤害自己、结束生命或伤害别人？", "安全比完成整理重要。", [opt("safe", "没有，我现在能保证安全"), opt("risk", "有这样的念头或冲动"), opt("unsure", "我不确定自己是否安全"), opt("skip", "不愿回答")]),
    SAFE_02: q("SAFE_02", "继续确认安全", "这种风险是否可能在今天或很快发生？", "不需要描述方法或细节。", [opt("no", "不是迫近的"), opt("yes", "是，可能很快发生"), opt("unsure", "不确定")]),
    SAFE_03: q("SAFE_03", "最后一项安全确认", "你是否已经准备了方法、物品、地点或时间，或感到难以控制行动？", "不需要描述方法或细节。", [opt("no", "没有准备，我还能控制行动"), opt("yes", "有准备或很难控制"), opt("unsure", "不确定")]),
    NEED_01: q("NEED_01", "先决定怎么开始", "你现在更需要猫先做什么？", "由你决定这一轮先缓一缓、理清，还是找下一小步。", [opt("settle", "先让我缓一缓"), opt("clarify", "帮我把事情理清"), opt("next", "帮我决定下一小步"), opt("unsure", "我也说不清，先从事情开始")]),
    GROUND_01: q("GROUND_01", "先缓一缓", "先不用分析，给自己半分钟落到此刻。", "感觉不合适可以立即跳过。", [opt("done", "可以了，继续整理"), opt("skip", "先跳过，直接开始")]),
    ENTRY_01: q("ENTRY_01", "第 1 步：发生的线索", "发生了什么？", "只处理眼前这一件具体事件。先写你能观察到的线索，不急着解释原因。", [opt("relationship_change", "某个人的回应、态度或关系发生了变化"), opt("conflict_boundary", "发生了冲突、拒绝、分离或边界摩擦"), opt("major_change_loss", "经历了重大变化、失落或身份转换"), opt("task_evaluation", "面对任务、截止期、评价或不确定要求"), opt("real_conditions", "钱、住房、工作、学习或照护出现压力"), opt("body_sleep_substance", "身体、睡眠、药物、饮酒或物质使用发生变化"), opt("memory_reminder", "一段记忆、消息或相似场景突然勾起反应"), opt("no_clear_event", "没有明显事件，难受像是自己慢慢升起来"), opt("cannot_recall", "我暂时想不起具体发生了什么")]),
    UNDERSTANDING_01: q("UNDERSTANDING_01", "只核对猫新增的猜测", "猫猜你可能有些不安或难受。猫听对了吗？", "猫只核对你没有明确说出的部分。不准确就直接改，猫会按你的说法继续。", [opt("yes", "对，继续"), opt("partly", "有一点对，我想补充"), opt("no", "不对，我来纠正"), opt("explicit", "感受已经由我说清楚，直接继续")]),
    FIRST_01: q("FIRST_01", "第 2 步：最先出现了什么", "这件事发生后，你最先注意到哪种变化？", "如果几种同时出现，先选最早的一种。", [opt("body_first", "身体先有反应"), opt("thought_first", "脑中先出现反复想法"), opt("action_urge", "马上想做或停止做某件事"), opt("relationship_feeling", "对某个人或群体的感觉发生变化"), opt("function_impact", "日常生活受到影响"), opt("multiple", "几种变化同时出现"), opt("unclear", "暂时说不清")]),
    BODY_01: q("BODY_01", "身体追问", "最早出现的身体变化是什么？", "突然、严重或无法解释时，结果会提醒医疗复核。", [opt("arousal", "心跳加快、呼吸变急或胸口不适"), opt("tense", "身体紧绷、发抖、疼痛或坐立不安"), opt("stomach", "胃部不适、恶心或食欲变化"), opt("heavy", "疲惫、沉重、无力或行动变慢"), opt("sleep", "睡眠发生变化"), opt("unreal", "麻木、恍惚或感觉不真实"), opt("other", "其他／说不清")]),
    ACTION_01: q("ACTION_01", "行动追问", "你最先想做什么？", "先记录冲动，不急着评价自己。", [opt("reassure", "反复确认、检查或追问"), opt("avoid", "回避、拖延、取消或离开"), opt("fight", "争辩、反击、指责或证明自己"), opt("please", "讨好、道歉、沉默或压住需要"), opt("control", "抓紧规则、计划、别人或细节"), opt("withdraw", "隔离自己、麻木或关掉感觉"), opt("solve", "直接处理现实问题"), opt("support", "找人陪伴、商量或求助"), opt("freeze", "僵住"), opt("unsure", "说不清")]),
    ACTION_REALITY_01: q("ACTION_REALITY_01", "行动确认", "这是实际做出的动作，还是当时只是想这样做？", "分清想法和事实。", [opt("done", "实际做了"), opt("urge_only", "只想这样做，没有做"), opt("partial", "做了一部分"), opt("unsure", "记不清")]),
    RELATION_01: q("RELATION_01", "关系追问", "关系中最接近发生了什么？", "不需要证明谁对谁错。", [opt("reduced_reply", "对方回应减少或态度改变"), opt("conflict", "出现冲突、误解或拒绝"), opt("separation", "关系变远、结束或可能失去"), opt("boundary", "我的边界被侵犯"), opt("judged", "担心被评价、比较或排斥"), opt("lonely", "感到孤单、没有连接"), opt("care", "承担了过多照护或责任"), opt("unsure", "说不清")]),
    FUNCTION_01: q("FUNCTION_01", "功能追问", "哪些事情最难维持？最多选择 2 项。", "选择现实中受影响的部分。", [opt("work", "工作或学习"), opt("sleep", "睡眠、饮食或精力"), opt("basic", "基本自理"), opt("care", "照护责任"), opt("contact", "与人联系"), opt("decision", "作出决定"), opt("safety", "安全"), opt("unsure", "说不清")], { max: 2 }),
    EMOTION_01: q("EMOTION_01", "可选：给体验找个词", "如果现在要给这份体验找一个最接近的词，你愿意选吗？", "不确定可以跳过；不影响路由。", [opt("low", "低落、失落或提不起兴趣"), opt("anger", "生气、委屈或被冒犯"), opt("fear", "焦虑、紧绷或担心"), opt("shame", "羞耻、自责或觉得不够好"), opt("lonely", "孤独、想靠近又想躲开"), opt("numb_confused", "空、麻木或和自己失去连接"), opt("confused", "混乱、不知道该往哪里走"), opt("other", "其他"), opt("skip", "说不清，先跳过")]),
    MEANING_01: q("MEANING_01", "第 3 步：当时怎样理解", "事情发生时，你脑中最先出现的判断或预感是什么？", "先把它当作一种可能，后面再核对。", [opt("uncertain", "我不知道接下来会怎样"), opt("unsafe", "重要的人、关系、健康或生活可能不安全"), opt("rejected", "对方可能不在意我、会拒绝或离开我"), opt("selfworth", "这说明我不够好、没能力或不值得"), opt("control", "我必须马上阻止坏结果"), opt("unfair", "我被不公平对待，却没有选择权"), opt("hopeless", "事情不会变好，我看不到路"), opt("reality", "眼前现实本身已经很困难"), opt("body", "没有明确想法，只有身体或行动反应"), opt("unsure", "说不清")]),
    FEELING_01: q("FEELING_01", "第 3 步：当时的感受", "有了这个解释后，你最接近什么感受？", "只说这次情境。说不清也可以。", [opt("fear", "担心、害怕或紧绷"), opt("sad", "难过、失落或孤单"), opt("anger", "生气、委屈或被冒犯"), opt("shame", "羞耻、自责或觉得自己不够好"), opt("numb", "麻木、混乱或没有明显感觉"), opt("other", "其他感受"), opt("unsure", "还不知道")]),
    MEANING_CHECK_01: q("MEANING_CHECK_01", "解释复核", "这句话更接近哪一种？", "把事实、判断和预测分开。", [opt("fact", "事实"), opt("judgment", "根据现有信息的判断"), opt("prediction", "对未来的预测"), opt("self", "自我评价"), opt("other_said", "别人明确说过的话"), opt("automatic", "自动出现且暂时分不清")]),
    FEAR_01: q("FEAR_01", "第 4 步：最难承受的后果", "如果事情真像你当时想的那样，最让你难以承受的是什么？", "先选最接近的一项，不必分析原因。", [opt("basic_safety", "失去安全、健康、金钱或基本生活"), opt("abandoned", "被拒绝、抛下或只能独自面对"), opt("failure", "失败、错过机会或承担严重后果"), opt("humiliated", "被否定、羞辱或让别人失望"), opt("loss_control", "失去控制，事情继续恶化"), opt("harm_relation", "发生冲突，伤害别人或破坏关系"), opt("boundary_loss", "被限制、被侵犯，无法保护边界"), opt("no_future", "看不到方向，觉得以后也不会改善"), opt("current_loss", "当前现实损失本身已经很难承受"), opt("no_further", "没有更远的后果，只是当下已经很难受"), opt("unsure", "说不清")]),
    VALUE_01: q("VALUE_01", "第 5 步：正在保护什么", "这份担心背后，你最想保护或重视什么？", "保护目标没有对错；它会帮助我们找到更合适的方向。", [opt("connection", "关系与连接"), opt("safety", "安全与现实稳定"), opt("dignity", "尊严、自我价值或被尊重"), opt("boundaries", "选择权与边界"), opt("competence", "把事情做好、承担责任"), opt("certainty", "确定感与可预测性"), opt("care", "不伤害别人、照顾重要的人"), opt("unsure", "暂时说不清")]),
    LOOP_01: q("LOOP_01", "第 4 步：做了什么", "带着这种感受，你做了什么，或没有做什么？", "只记录实际发生的动作，不评价你。", [opt("reassure", "反复确认、检查或追问"), opt("avoid", "回避、拖延、取消或离开"), opt("ruminate", "反复思考、复盘或争论"), opt("criticize", "责怪自己、逼迫自己"), opt("control", "控制别人或细节"), opt("please", "讨好、压住需要"), opt("fight", "反击、证明自己"), opt("withdraw", "远离、关闭感觉"), opt("solve", "处理现实问题"), opt("support", "寻求支持"), opt("freeze", "僵住"), opt("none", "当时没有采取行动"), opt("unsure", "说不清")]),
    PAYOFF_01: q("PAYOFF_01", "第 6 步：短期作用", "做完这个动作后，当时最明显的变化是什么？", "短期有作用，不代表长期一定合适。", [opt("relief", "难受减轻"), opt("clarity", "信息更清楚"), opt("control", "控制感增加"), opt("support", "得到回应或支持"), opt("avoid_risk", "避开风险"), opt("progress", "现实推进"), opt("numb", "暂时麻木"), opt("none", "没有变化"), opt("worse", "更难受"), opt("unsure", "说不清")]),
    COST_01: q("COST_01", "第 6 步：后续结果", "过了一段时间，这个动作又带来了什么？最多选择 2 项。", "没有明显影响也可以选择。", [opt("improved", "问题改善"), opt("repeat", "需要重复确认"), opt("delay", "任务推迟"), opt("repaired", "关系修复"), opt("tense", "关系更紧张"), opt("tired", "更疲惫"), opt("narrow", "生活范围变窄"), opt("clearer", "更清楚边界或下一步"), opt("none", "没有明显影响"), opt("unsure", "看不出来")], { max: 2 }),
    PATTERN_01: q("PATTERN_01", "第 7 步：是否重复", "这种情况以前出现过吗？", "重复出现值得记录，但不代表人格或根因。", [opt("first", "第一次"), opt("occasional", "偶尔"), opt("often", "最近经常"), opt("long", "持续很久"), opt("unsure", "记不清")]),
    PATTERN_CONTEXT_01: q("PATTERN_CONTEXT_01", "重复情境", "还在哪些情境中出现过？最多选择 2 项。", "选最接近的情境。", [opt("same_relationship", "同类关系"), opt("different_relationship", "不同人际关系"), opt("tasks", "工作学习任务"), opt("evaluation", "评价竞争"), opt("reality", "金钱、健康或现实不确定"), opt("alone", "独处和自我评价"), opt("many", "很多情境"), opt("unsure", "想不起来")], { max: 2 }),
    TIME_01: q("TIME_01", "第 8 步：持续时间", "这次困扰持续多久？", "按这次困扰的大致时间选择。", [opt("days", "今天或几天", 0), opt("brief", "不到 2 周", 0), opt("weeks", "2～4 周", 1), opt("months", "1～6 个月", 2), opt("long", "超过 6 个月", 3), opt("years", "反复多年", 3), opt("unsure", "说不清")]),
    FUNC_01: q("FUNC_01", "第 8 步：日常影响", "它对工作、学习、照护或日常事务影响多大？", "先看现实影响，不只看情绪强度。", impact),
    FUNC_02: q("FUNC_02", "基本生活复核", "吃饭、洗漱、离开床铺、出门或照顾安全等基本事项是否受影响？", "基本生活明显受影响时，支持级别会优先上调。", impact),
    MED_01: q("MED_01", "身体复核", "这些变化是否可能与疾病、疼痛、药物、停药、激素变化或睡眠剥夺有关？", "心理反思不能替代医疗评估。", [opt("no", "没有明显关联"), opt("yes", "可能有关"), opt("unsure", "不确定")]),
    RES_01: q("RES_01", "现实支持", "现在是否有一个你能联系、且相对安全的人？", "这个答案只决定支持建议。", [opt("yes", "有"), opt("maybe", "可能有"), opt("no", "没有"), opt("unsure", "不确定")]),
    SUPPORT_01: q("SUPPORT_01", "必要的支持复核", "这件事持续和影响日常的程度，更接近哪一种？", "只在反复出现或现实负担较高时询问。", [opt("manageable", "虽然难受，基本还能完成日常", 0), opt("repeated", "反复出现，但大多还能应付", 1), opt("hard", "已经明显妨碍工作、学习或照护", 2), opt("basic", "吃饭、洗漱、起床或安全也难以维持", 3), opt("unsure", "说不清")]),
    REL_02: q("REL_02", "现实安全", "目前有持续的威胁、控制、跟踪、强迫、暴力或无法自由离开吗？", "现实危险不能被解释成你的心理问题。", [opt("no", "没有"), opt("yes", "有"), opt("unsure", "不确定")]),
    EXT_SAFE: q("EXT_SAFE", "现实安全", "目前是否有正在发生的暴力或其他现实危险？", "不需要描述细节。", [opt("no", "没有"), opt("yes", "有"), opt("unsure", "不确定")])
  };
  questions.TRIGGER_01 = questions.ENTRY_01;
  const needsSupportCheck = (state) => ["often", "long"].some((value) => state.answers.PATTERN_01?.includes(value)) || ["real_conditions", "major_change_loss"].some((value) => state.answers.ENTRY_01?.includes(value));
  const needsMedicalCheck = (state) => state.answers.ENTRY_01?.includes("body_sleep_substance") || state.answers.FIRST_01?.includes("body_first");
  const nextFor = (state, id) => ({
    CONSENT_01: "SAFE_01",
    SAFE_01: state.answers.SAFE_01?.includes("safe") ? "NEED_01" : "SAFE_02",
    SAFE_02: state.answers.SAFE_02?.includes("no") ? "RES_01" : "SAFE_03",
    SAFE_03: "RES_01",
    NEED_01: state.answers.NEED_01?.includes("settle") ? "GROUND_01" : "ENTRY_01",
    GROUND_01: "ENTRY_01",
    ENTRY_01: "UNDERSTANDING_01",
    UNDERSTANDING_01: ["relationship_change", "conflict_boundary"].includes(state.answers.ENTRY_01?.[0]) ? "REL_02" : "MEANING_01",
    REL_02: "MEANING_01",
    EXT_SAFE: "MEANING_01",
    FIRST_01: ({ body_first: "BODY_01", action_urge: "ACTION_01", relationship_feeling: "RELATION_01", function_impact: "FUNCTION_01" }[state.answers.FIRST_01?.[0]] || "MEANING_01"),
    BODY_01: "MEANING_01",
    ACTION_01: "MEANING_01",
    ACTION_REALITY_01: "MEANING_01",
    RELATION_01: "MEANING_01",
    FUNCTION_01: "MEANING_01",
    EMOTION_01: "MEANING_01",
    MEANING_01: "FEELING_01",
    FEELING_01: "LOOP_01",
    MEANING_CHECK_01: "FEELING_01",
    FEAR_01: "VALUE_01",
    VALUE_01: "LOOP_01",
    LOOP_01: "PAYOFF_01",
    PAYOFF_01: "COST_01",
    COST_01: "PATTERN_01",
    PATTERN_01: needsMedicalCheck(state) ? "MED_01" : needsSupportCheck(state) ? "SUPPORT_01" : null,
    MED_01: needsSupportCheck(state) ? "SUPPORT_01" : null
  }[id] || null);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const picked = (s, id) => s.answers[id] || [];
  const labels = (s, id) => picked(s, id).map((v) => questions[id]?.options.find((o) => o.id === v)?.label).filter(Boolean).join("、") || "尚未确认";
  const protectedPart = { abandoned: "关系与连接", humiliated: "尊严与价值", loss_control: "确定感与掌控感", boundary_loss: "选择权与边界", basic_safety: "安全与现实资源", no_future: "方向与可能性" };
  const directions = { connection: "更坦然地沟通，也保留自己的生活节奏", safety: "先获得可靠信息和现实支持", dignity: "不靠自责也能表达需要", boundaries: "保护边界，同时保留选择空间", competence: "用一个可完成的动作靠近任务", certainty: "允许暂时不知道，同时继续生活", care: "照顾关系，也不把全部责任揽到自己身上", unsure: "先观察哪种新动作能增加一点选择" };
  const actions = { reassure: "下一次只做一次清楚确认，并把重复确认延迟 10～15 分钟。", avoid: "把要回避的事缩成 10 分钟内可停止的一步。", ruminate: "写下事实、预测和下一条需要的信息。", criticize: "把自责改成一个事实和一个可调整动作。", control: "只选一件自己能控制的事，其他部分改成请求。", please: "先写下一项真实需要或一个低风险边界。", fight: "先离开争执现场，记录事实和你想保护的边界。", withdraw: "给安全的人发一句真实近况，或恢复一项日常活动。", solve: "保留现实处理，但设一个停止收集信息、开始行动的条件。", support: "告诉可信任的人你需要陪伴还是一起想办法。", freeze: "先做一个身体上可完成的最小动作。" };
  const safetyResult = (type) => type === "EXIT" ? { type, title: "这次先停在这里", summary: "你没有义务完成这次反思。需要时可以重新回来。", support: "已退出", action: "离开页面或稍后再回来。", evidence: [], alternatives: [], escalation: "如果你担心当前安全，请立即联系当地紧急服务。" } : type === "EXT_SAFE" ? { type, title: "先处理现实安全", summary: "普通问题整理先停在这里。现实威胁不能被解释成你的心理问题。", support: "S4 立即安全支持", action: "优先去相对安全的地方，联系可信任的人和当地专业或紧急支持；不要独自对抗施害者。", evidence: ["你报告了现实威胁"], alternatives: [], escalation: "危险正在发生时，请联系当地紧急服务。" } : { type, title: type === "SAFE_URGENT" ? "现在先保证安全" : "今天先找一个真实的人", summary: "普通问题整理先停在这里。现在最重要的是现实中的陪伴和安全支持。", support: type === "SAFE_URGENT" ? "S4 立即安全支持" : "S3 尽快真人支持", action: "联系可信任的人陪着你，并联系当地紧急服务或危机支持。不要独处。", evidence: ["无法确认当前安全"], alternatives: [], escalation: "如果危险可能很快发生、已有准备或难以控制行动，请立即联系当地紧急服务。" };
  function createAssessment() { return { path: ["CONSENT_01"], answers: {}, terminal: null, completed: false }; }
  function currentQuestion(s) { return s.completed || s.terminal ? null : questions[s.path[s.path.length - 1]]; }
  function submitAnswer(input, values) { const s = clone(input); const question = currentQuestion(s); const chosen = Array.isArray(values) ? values : [values]; if (!question || !chosen.length || chosen.length > question.max || chosen.some((id) => !question.options.some((o) => o.id === id))) throw new Error("Invalid answer"); s.answers[question.id] = chosen; if (question.id === "ENTRY_01") s.answers.TRIGGER_01 = chosen; if (question.id === "CONSENT_01" && chosen.includes("exit")) { s.terminal = "EXIT"; s.completed = true; return s; } if (question.id === "SAFE_01" && chosen.includes("skip")) { s.terminal = "SAFE_UNCLEAR"; s.completed = true; return s; } if (question.id === "SAFE_02" && chosen.includes("no")) { s.terminal = "SAFE_SUPPORT"; s.completed = true; return s; } if (question.id === "SAFE_03") { s.terminal = chosen.includes("no") ? "SAFE_SUPPORT" : "SAFE_URGENT"; s.completed = true; return s; } if ((question.id === "REL_02" || question.id === "EXT_SAFE") && chosen.some((id) => ["yes", "unsure"].includes(id))) { s.terminal = "EXT_SAFE"; s.completed = true; return s; } const next = nextFor(s, question.id); if (next) s.path.push(next); else s.completed = true; return s; }
  function goBack(input) { const s = clone(input); if (s.path.length <= 1) return s; s.terminal = null; s.completed = false; const id = s.path.pop(); delete s.answers[id]; return s; }
  function buildResult(s) { if (!s.completed) throw new Error("Assessment is not complete"); if (s.terminal) return safetyResult(s.terminal); const func = Math.max(0, ...picked(s, "SUPPORT_01").map((v) => questions.SUPPORT_01.options.find((o) => o.id === v)?.score || 0)); const support = func >= 3 ? "S3 尽快专业支持" : func >= 2 ? "S2 建议专业评估" : "S1 自助 + 观察"; const event = labels(s, "ENTRY_01"); const meaning = labels(s, "MEANING_01"); const feeling = labels(s, "FEELING_01"); const action = labels(s, "LOOP_01"); const payoff = labels(s, "PAYOFF_01"); const cost = labels(s, "COST_01"); const result = `${payoff}；稍后${cost}`; const hypothesis = `可能是：当线索还不完整时，你把它解释成“${meaning}”，感到${feeling}，于是${action}；这仍需用现实信息验证。`; const unknown = "现有信息还不能确定这个解释是否完整，也不知道当时还有哪些现实因素在起作用。"; const move = actions[picked(s, "LOOP_01")[0]] || "第一步：先记录一个可观察事实，再决定是否行动。"; const context = ["real_conditions", "body_sleep_substance"].includes(picked(s, "ENTRY_01")[0]) ? "现实条件、身体和睡眠也可能是重要因素" : "关系事实、睡眠、身体状态和现实环境也可能造成相似体验"; return { type: "reflection", primary: "single_event", secondary: null, support, title: "这次先看这一件事", summary: `线索是${event}。你当时解释为${meaning}，感到${feeling}，接着${action}，结果是${result}。`, evidence: [`发生的线索：${event}`, `用户当前解释：${meaning}`, `感受：${feeling}`, `做了或没有做：${action}`, `结果：${result}`], alternatives: [context, "这是一个可修改、可否定的可能猜测，不是诊断或唯一原因"], pathway: { trigger: event, meaning, feeling, move: action, result, payoff, cost, recurrence: labels(s, "PATTERN_01"), hypothesis, unknown }, action: move, escalation: support === "S1 自助 + 观察" ? "如果持续、加重、明显影响生活或出现安全担忧，请联系专业人员。" : "建议把这些具体回答带给合格的心理或医疗专业人员。", cycle: [`发生的线索：${event}`, `你的解释：${meaning}`, `感受：${feeling}`, `做了或没有做：${action}`, `带来的结果：${result}`, `待验证猜测：${hypothesis}`, `仍然不知道什么：${unknown}`] }; }
  const coreQuestions = ["ENTRY_01", "UNDERSTANDING_01", "MEANING_01", "FEELING_01", "LOOP_01", "PAYOFF_01", "COST_01", "PATTERN_01"];
  function progress(s) { const answered = coreQuestions.filter((id) => picked(s, id).length).length; const supportExtra = s.path.includes("SUPPORT_01") ? 1 : 0; const total = coreQuestions.length + supportExtra; const current = s.completed ? total : Math.min(total, answered + (coreQuestions.includes(currentQuestion(s)?.id) || currentQuestion(s)?.id === "SUPPORT_01" ? 1 : 0)); return { current, total, percent: s.completed ? 100 : Math.min(96, Math.round((current / total) * 100)) }; }
  const answerLabels = (s, id) => labels(s, id);
  return { createAssessment, currentQuestion, submitAnswer, goBack, buildResult, progress, answerLabels, coreQuestions: [...coreQuestions] };
});
