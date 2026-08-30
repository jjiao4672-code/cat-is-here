const questions = [
  {
    id: "emotion",
    kicker: "猫先听听现在",
    title: "猫先不讲道理。你现在最明显的感受是什么？",
    hint: "挑最靠近的一两项就好，猫允许人类一时说不精准。",
    max: 2,
    options: [
      { label: "焦虑", tags: ["fear", "control"] },
      { label: "委屈", tags: ["belonging", "pleasing"] },
      { label: "生气", tags: ["control", "blame"] },
      { label: "羞耻", tags: ["inferiority", "perfection"] },
      { label: "失望", tags: ["recognition", "avoidance"] },
      { label: "麻木", tags: ["avoidance", "disconnect"] },
      { label: "嫉妒", tags: ["comparison", "recognition"] },
      { label: "拖延/逃避", tags: ["avoidance", "perfection"] },
      { label: "空虚", tags: ["disconnect", "belonging"] },
      { label: "有自伤或轻生念头", tags: ["crisis"], crisis: true }
    ]
  },
  {
    id: "domain",
    kicker: "猫看看事情落在哪里",
    title: "这团难受，主要是从生活的哪一处滚过来的？",
    hint: "猫从阿德勒那里学到，困扰要放回真实生活里看。",
    max: 1,
    options: [
      { label: "工作/学习", tags: ["work"] },
      { label: "亲密关系", tags: ["love"] },
      { label: "家庭", tags: ["belonging"] },
      { label: "朋友/社交", tags: ["friendship"] },
      { label: "自我期待", tags: ["self"] },
      { label: "金钱/未来", tags: ["security"] },
      { label: "身体/外貌", tags: ["comparison"] },
      { label: "不知道，就是难受", tags: ["unclear"] }
    ]
  },
  {
    id: "fear",
    kicker: "猫听见害怕了",
    title: "如果事情真的变糟，你最怕它证明什么？",
    hint: "猫不是说它真的会发生，只是在找脑子里那条偷偷运行的规矩。",
    max: 1,
    options: [
      { label: "我不够好", tags: ["inferiority"] },
      { label: "我会失败", tags: ["perfection", "fear"] },
      { label: "我会被拒绝", tags: ["belonging"] },
      { label: "我会失去控制", tags: ["control"] },
      { label: "别人会看不起我", tags: ["recognition"] },
      { label: "我会让别人失望", tags: ["pleasing"] },
      { label: "一开始就停不下来", tags: ["avoidance"] },
      { label: "我说不清楚", tags: ["unclear"] }
    ]
  },
  {
    id: "impulse",
    kicker: "猫看看你怎么护住自己",
    title: "情绪一上来，你的第一反应更想做什么？",
    hint: "猫不评判这个反应。它多半曾经帮过你，才会一直留下来。",
    max: 2,
    options: [
      { label: "逃开/拖延", tags: ["avoidance"] },
      { label: "反复检查", tags: ["perfection", "control"] },
      { label: "讨好别人", tags: ["pleasing", "belonging"] },
      { label: "证明自己", tags: ["recognition", "comparison"] },
      { label: "控制局面", tags: ["control"] },
      { label: "责怪自己", tags: ["inferiority"] },
      { label: "责怪别人", tags: ["blame"] },
      { label: "假装无所谓", tags: ["disconnect"] }
    ]
  },
  {
    id: "benefit",
    kicker: "猫看看它帮过什么忙",
    title: "保持现在这样，短时间里替你避开了什么？",
    hint: "猫学阿德勒时最惊讶的是：看似麻烦的行为，往往也有一点用处。",
    max: 1,
    options: [
      { label: "避免失败", tags: ["avoidance", "perfection"] },
      { label: "避免冲突", tags: ["pleasing", "belonging"] },
      { label: "避免被评价", tags: ["recognition", "inferiority"] },
      { label: "不用承担选择责任", tags: ["avoidance", "control"] },
      { label: "暂时感觉安全", tags: ["security"] },
      { label: "保住体面", tags: ["recognition"] },
      { label: "保住“我其实可以”的想象", tags: ["inferiority", "perfection"] },
      { label: "我不知道", tags: ["unclear"] }
    ]
  },
  {
    id: "need",
    kicker: "猫想知道你往哪儿去",
    title: "如果事情能松动一点，你真正想得到什么？",
    hint: "不用挑最体面的愿望，挑那个让心里稍微动一下的。",
    max: 1,
    options: [
      { label: "安全感", tags: ["security"] },
      { label: "被认可", tags: ["recognition"] },
      { label: "被理解/归属感", tags: ["belonging"] },
      { label: "自由", tags: ["self"] },
      { label: "掌控感", tags: ["control"] },
      { label: "证明自己有价值", tags: ["inferiority"] },
      { label: "关系恢复", tags: ["love", "friendship"] },
      { label: "终于开始行动", tags: ["work", "avoidance"] }
    ]
  },
  {
    id: "action",
    kicker: "猫和你挑一小步",
    title: "现在这些小行动里，哪一个还没有大到吓跑你？",
    hint: "只选一个五到十分钟能做完的。人类总想一步走很远，猫不这样赶路。",
    max: 1,
    options: [
      { label: "做一个最小任务", tags: ["tiny_task"] },
      { label: "发一条真实消息", tags: ["honest_message"] },
      { label: "允许不完美地开始", tags: ["imperfect_start"] },
      { label: "暂停 10 分钟让身体落地", tags: ["grounding"] },
      { label: "写下我真正害怕的事", tags: ["name_fear"] },
      { label: "找一个人确认现实", tags: ["reality_check"] },
      { label: "暂时不行动，只想先理解", tags: ["reflect"] }
    ]
  }
];

const profiles = {
  avoidance: {
    title: "猫猜你正在用逃避护住自我价值",
    surface: "猫先听见的是拖延、麻木或想离开。它也许在替你推迟那个会被现实评价的时刻。",
    purpose: "猫猜你不开始，是为了暂时保住一种可能：不是你不行，只是你还没有真正开始。",
    frame: "猫从阿德勒那里学到，这像是在绕开工作、学习或自我成长的人生任务。你未必没有动力，只是行动会把自我价值带到现实里。",
    step: "把任务缩到小到无法失败：只打开文件、写第一行、发一个草稿，不要求完成。",
    cycle: ["触发：任务或关系开始要求你给出真实行动。", "解释：如果我做了却不好，就说明我不够好。", "情绪：焦虑、羞耻或麻木。", "保护：拖延、逃开、继续准备。", "代价：压力变大，下一次更难开始。"]
  },
  perfection: {
    title: "猫猜你把高标准用成了安全策略",
    surface: "猫看见你很认真、很谨慎，也看见高标准可能正在把开始往后推。",
    purpose: "只要还在打磨，你就暂时不用面对真实反馈，也不用让那个普通但已经够用的版本被看见。",
    frame: "猫从阿德勒那里听说，这可能是自卑感的一种补偿：用完美保护“我必须很优秀才有价值”的那条私人规矩。",
    step: "发布一个低风险版本：给一个可信的人看 60% 完成度，并明确说只收一个反馈。",
    cycle: ["触发：事情进入要展示、提交或被评价的阶段。", "解释：不够好就等于我不够好。", "情绪：紧张、羞耻、反复怀疑。", "保护：继续修改、反复检查、不提交。", "代价：标准越来越高，行动越来越少。"]
  },
  pleasing: {
    title: "猫猜你把讨好当成了维持连接的办法",
    surface: "猫先听见委屈、忍让和对冲突的害怕，后面可能藏着对失去关系的担心。",
    purpose: "先照顾别人的感受，可以让冲突暂时不发生，也让你不用冒险说出自己的需要。",
    frame: "猫从阿德勒那里学到，共同体感觉不是拿自己去交换关系。好的连接是你看见别人，也让别人有机会看见你。",
    step: "发一条低攻击性的真实消息：我现在有点难受，我需要先确认一件事。",
    cycle: ["触发：别人提出期待，或你感觉自己没有被照顾。", "解释：如果我表达需求，关系可能会变差。", "情绪：委屈、焦虑、生气。", "保护：讨好、压住自己、事后反复想。", "代价：关系表面平静，内心距离更远。"]
  },
  control: {
    title: "猫猜你正在用控制抵挡不确定",
    surface: "猫看见焦虑、生气和反复检查，后面可能是对失控的确实难以忍受。",
    purpose: "抓住细节能暂时降低不确定性，让你感觉局面还在爪子里。",
    frame: "猫从阿德勒那里学到，你只能负责自己的行动，不能替现实、别人和结果签保证书。",
    step: "写下一个你能控制的动作和一个你不能控制的结果。只做前者。",
    cycle: ["触发：结果不确定，别人不按你的预期行动。", "解释：失控就意味着危险或失败。", "情绪：焦虑、生气、紧绷。", "保护：检查、催促、证明、争辩。", "代价：你更累，别人也更难靠近。"]
  },
  recognition: {
    title: "猫猜你被“别人怎么看我”困住了",
    surface: "猫看见嫉妒、羞耻和想证明自己的冲动，那里可能有一只太用力盯着外部评价的眼睛。",
    purpose: "只要证明自己，你就能暂时离开“不够好”的感觉，哪怕只离开一会儿。",
    frame: "猫从阿德勒那里学到，人生任务不是赢过别人，而是参与真实关系，做出真实贡献。",
    step: "做一个不需要掌声的贡献：帮一个人解决具体小问题，或完成一件只有你知道的正事。",
    cycle: ["触发：看见别人进展，或感到自己被比较。", "解释：如果我不够突出，就没有价值。", "情绪：嫉妒、羞耻、急躁。", "保护：证明自己、贬低自己或贬低别人。", "代价：注意力离开真实行动，转向排名和评价。"]
  },
  inferiority: {
    title: "猫猜你把“不够好”当成了默认答案",
    surface: "猫先听见自责、羞耻和无力，像是“不够好”抢先替现实解释了一切。",
    purpose: "先否定自己，可以少受一点被现实否定的冲击，也可以暂时不用承担改变。",
    frame: "猫从阿德勒那里学到，自卑感本身不是罪证。要紧的是，你用它退出人生任务，还是把它变成参与世界的力气。",
    step: "做一件能产生连接的小事：问一个人需不需要帮助，或把你的半成品发给需要它的人。",
    cycle: ["触发：遇到困难、比较或反馈。", "解释：这证明我就是不够好。", "情绪：羞耻、低落、想消失。", "保护：自责、撤退、停止尝试。", "代价：更少证据证明自己能参与现实。"]
  },
  disconnect: {
    title: "猫猜你正在用麻木隔开痛感",
    surface: "猫看见你像是不在乎、空虚或没有感觉，也可能是负荷太高以后把门关上了。",
    purpose: "麻木让你暂时不用处理痛苦、期待和失望。猫不怪这扇门，它大概曾经救过你。",
    frame: "猫从阿德勒那里学到，改变常从重新连接开始：连接身体、一个人，和一个小任务。",
    step: "先不分析，做 3 分钟身体落地：喝水、站起来、看见房间里 5 个物品，然后再决定下一步。",
    cycle: ["触发：困扰太多或太久。", "解释：反正我处理不了。", "情绪：空、钝、远离自己。", "保护：麻木、刷屏、睡觉、假装无所谓。", "代价：短期不痛，长期更难听见自己的需要。"]
  }
};

const domainCopy = {
  work: "猫看这件事主要落在工作或学习上，你需要重新碰到一个真实的小结果。",
  love: "猫看这件事主要落在亲密关系里，你需要在连接中说出真实需要。",
  friendship: "猫看这件事主要落在社交关系里，你需要决定自己怎样参与，而不是怎样讨好所有人。",
  belonging: "猫看这件事碰到了归属感，你需要确认自己能否既留在关系里，也不把自己藏起来。",
  self: "猫看这件事碰到了自我期待，你需要面对一次具体练习，而不是审判整个人。",
  security: "猫看这件事碰到了安全感，你需要把真实风险和脑子里的预演分开。",
  comparison: "猫看这件事碰到了比较，你需要把目光从排名带回自己的脚下。"
};

const state = {
  step: 0,
  answers: {},
  note: "",
  currentResult: null,
  followUp: null
};

const questionPanel = document.querySelector("#questionPanel");
const resultPanel = document.querySelector("#resultPanel");
const followupPanel = document.querySelector("#followupPanel");
const optionsGrid = document.querySelector("#optionsGrid");
const stepLabel = document.querySelector("#stepLabel");
const selectedCount = document.querySelector("#selectedCount");
const progressBar = document.querySelector("#progressBar");
const freeNote = document.querySelector("#freeNote");
const backButton = document.querySelector("#backButton");
const nextButton = document.querySelector("#nextButton");
const resetButton = document.querySelector("#resetButton");
const coachQuestion = document.querySelector("#coachQuestion");
const coachAskButton = document.querySelector("#coachAskButton");
const coachAnswer = document.querySelector("#coachAnswer");
const coachPrompts = document.querySelector(".coach-prompts");
const followupTitle = document.querySelector("#followupTitle");
const followupHint = document.querySelector("#followupHint");
const followupOptions = document.querySelector("#followupOptions");
const followupBackButton = document.querySelector("#followupBackButton");
const followupNextButton = document.querySelector("#followupNextButton");
const confirmStatus = document.querySelector("#confirmStatus");

function renderQuestion() {
  const question = questions[state.step];
  document.querySelector("#questionKicker").textContent = question.kicker;
  document.querySelector("#questionTitle").textContent = question.title;
  document.querySelector("#questionHint").textContent = question.hint;
  stepLabel.textContent = `猫问到第 ${state.step + 1} 题，共 ${questions.length} 题`;
  progressBar.style.width = `${((state.step + 1) / questions.length) * 100}%`;
  backButton.disabled = state.step === 0;
  nextButton.textContent = state.step === questions.length - 1 ? "让猫想一想" : "让猫再问一点";

  const selected = state.answers[question.id] || [];
  selectedCount.textContent = selected.length ? `猫听见了 ${selected.length} 项` : "猫还在等你选";
  optionsGrid.innerHTML = "";

  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `option-card ${selected.includes(index) ? "selected" : ""} ${option.crisis ? "crisis" : ""}`;
    button.textContent = option.label;
    button.addEventListener("click", () => toggleOption(question, index));
    optionsGrid.appendChild(button);
  });
}

function toggleOption(question, index) {
  const selected = state.answers[question.id] || [];
  const exists = selected.includes(index);
  let next = exists ? selected.filter((item) => item !== index) : [...selected, index];
  if (next.length > question.max) {
    next = next.slice(next.length - question.max);
  }
  state.answers[question.id] = next;
  renderQuestion();
}

function collectTags() {
  const counts = {};
  Object.entries(state.answers).forEach(([questionId, indexes]) => {
    const question = questions.find((item) => item.id === questionId);
    indexes.forEach((index) => {
      question.options[index].tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
  });
  return counts;
}

function hasCrisisAnswer() {
  return Object.entries(state.answers).some(([questionId, indexes]) => {
    const question = questions.find((item) => item.id === questionId);
    return indexes.some((index) => question.options[index].crisis);
  });
}

function selectedLabels(questionId) {
  const question = questions.find((item) => item.id === questionId);
  return (state.answers[questionId] || []).map((index) => question.options[index].label);
}

function strongestProfile(counts) {
  const candidates = Object.keys(profiles);
  return candidates.sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0] || "avoidance";
}

function showDynamicFollowUp() {
  state.note = freeNote.value.trim();
  const key = strongestProfile(collectTags());
  const card = OFFLINE_KNOWLEDGE_BASE.followUps[key] || OFFLINE_KNOWLEDGE_BASE.followUps.avoidance;
  state.followUp = { profileKey: key, selectedIndex: null };

  questionPanel.classList.add("hidden");
  resultPanel.classList.add("hidden");
  followupPanel.classList.remove("hidden");
  stepLabel.textContent = "猫的最后一问";
  selectedCount.textContent = "猫还差这一点";
  progressBar.style.width = "100%";
  followupTitle.textContent = card.title;
  followupHint.textContent = card.hint;
  renderFollowUpOptions();
}

function renderFollowUpOptions() {
  const card = OFFLINE_KNOWLEDGE_BASE.followUps[state.followUp.profileKey];
  followupOptions.innerHTML = "";

  card.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `followup-option ${state.followUp.selectedIndex === index ? "selected" : ""}`;
    button.textContent = option.label;
    button.addEventListener("click", () => {
      state.followUp.selectedIndex = index;
      selectedCount.textContent = "猫听清楚了";
      followupNextButton.disabled = false;
      renderFollowUpOptions();
    });
    followupOptions.appendChild(button);
  });

  followupNextButton.disabled = state.followUp.selectedIndex === null;
}

function selectedFollowUp() {
  if (!state.followUp || state.followUp.selectedIndex === null) return null;
  const card = OFFLINE_KNOWLEDGE_BASE.followUps[state.followUp.profileKey];
  return card.options[state.followUp.selectedIndex];
}

function renderResult() {
  state.note = freeNote.value.trim();
  questionPanel.classList.add("hidden");
  followupPanel.classList.add("hidden");
  resultPanel.classList.remove("hidden");

  if (hasCrisisAnswer()) {
    renderCrisisResult();
    return;
  }

  resultPanel.classList.remove("crisis-mode");
  const counts = collectTags();
  const key = strongestProfile(counts);
  const profile = profiles[key];
  const domainTags = ["work", "love", "friendship", "belonging", "self", "security", "comparison"];
  const domain = domainTags.find((tag) => counts[tag]);
  const emotion = selectedLabels("emotion").join("、") || "难受";
  const impulse = selectedLabels("impulse").join("、") || "保护自己";
  const followUp = selectedFollowUp();
  const noteText = state.note ? ` 猫也记得你刚才说：“${state.note}”。` : "";
  const followUpText = followUp ? ` 最后一问里，你选了“${followUp.label}”，所以猫更留意到：${followUp.insight}。` : "";
  state.currentResult = { key, profile, counts, domain, emotion, impulse, note: state.note, followUp, crisis: false };

  document.querySelector("#resultTitle").textContent = profile.title;
  document.querySelector("#resultSummary").textContent =
    `猫把你的选择放在一起看了看：现在的 ${emotion} 可能不只是情绪，也是一套正在工作的保护办法。${followUpText}${noteText}`;
  document.querySelector("#surfaceProblem").textContent = `${profile.surface} 猫还听见，你最明显的冲动是：${impulse}。`;
  document.querySelector("#protectivePurpose").textContent = profile.purpose;
  document.querySelector("#adlerFrame").textContent = `${profile.frame} ${domain ? domainCopy[domain] : ""}`;
  document.querySelector("#nextStep").textContent = actionCopy();

  const cycleList = document.querySelector("#cycleList");
  cycleList.innerHTML = "";
  profile.cycle.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    cycleList.appendChild(li);
  });
  confirmStatus.textContent = "";
  resetCoachAnswer();
}

function renderCrisisResult() {
  resultPanel.classList.add("crisis-mode");
  followupPanel.classList.add("hidden");
  state.currentResult = { key: "crisis", profile: null, counts: collectTags(), domain: null, emotion: "高压或危机状态", impulse: "先保证安全", crisis: true };
  document.querySelector("#resultTitle").textContent = "猫现在不分析，先陪你保证安全";
  document.querySelector("#resultSummary").textContent =
    "如果你有自伤、轻生、失控或正在遭受暴力的风险，现在需要真实的人来到你身边，而不是继续完成分析。";
  document.querySelector("#surfaceProblem").textContent = "猫听见你可能正处在高压或危机状态。";
  document.querySelector("#protectivePurpose").textContent = "先离开危险物品、危险地点和独自一人的状态。";
  document.querySelector("#adlerFrame").textContent = "猫从阿德勒那里学到：勇气不是独自撑住，而是在需要时主动进入连接。";
  document.querySelector("#nextStep").textContent = "请立刻联系身边可信任的人或当地紧急服务。在中国大陆可拨打 120 或 110；其他地区请联系当地急救服务或危机热线。";

  const cycleList = document.querySelector("#cycleList");
  cycleList.innerHTML = "";
  ["放下继续分析的念头。", "联系一个真实的人。", "远离可能伤害自己的工具或环境。", "如果有立即风险，请联系当地急救服务。"].forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    cycleList.appendChild(li);
  });
  resetCoachAnswer();
}

function actionCopy() {
  const action = selectedLabels("action")[0];
  const fallback = "猫只请你做一个五分钟动作，不求完整，也不求漂亮，只求重新碰到现实。";
  const copy = {
    "做一个最小任务": "猫把任务压到五分钟：打开文件、写一句、整理一个按钮，或发一个草稿。做完就停。",
    "发一条真实消息": "猫请你给可信的人发一句真实但不攻击的话：我现在有点卡住，想确认一件事。",
    "允许不完美地开始": "故意做一个六十分版本。今天不求优秀，只让现实有机会回答你。",
    "暂停 10 分钟让身体落地": "先离开屏幕十分钟，喝水、走动、看看房间里的五样东西。猫想让身体先回来。",
    "写下我真正害怕的事": "只写一句：如果我真的开始了，我最怕发生的是……写完便停，不和它辩论。",
    "找一个人确认现实": "找一个人问具体问题，不问“我是不是不行”，只问“这个版本下一步改哪里”。",
    "暂时不行动，只想先理解": "慢慢读完这张卡，只标记一句最像你的话。猫同意，理解也可以是第一步。"
  };
  return copy[action] || fallback;
}

function resetCoachAnswer() {
  coachQuestion.value = "";
  coachAnswer.innerHTML = `
    <span>猫在这里等一句话</span>
    <p>问题可以很短，也可以乱一点。文字只在这个页面里处理，不会保存或上传。</p>
  `;
}

function setCoachAnswer(title, body) {
  const paragraphs = String(body)
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  coachAnswer.innerHTML = `<span>${escapeHtml(title)}</span>${paragraphs}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function generateSmartReply(questionText) {
  return buildCatReply({
    question: questionText,
    result: state.currentResult,
    actionText: actionCopy()
  });
}

nextButton.addEventListener("click", () => {
  const question = questions[state.step];
  if (!(state.answers[question.id] || []).length) {
    selectedCount.textContent = "猫还没听到这一题，请先选一项";
    return;
  }
  if (state.step < questions.length - 1) {
    state.step += 1;
    renderQuestion();
    return;
  }
  if (hasCrisisAnswer()) {
    renderResult();
    return;
  }
  showDynamicFollowUp();
});

backButton.addEventListener("click", () => {
  if (state.step > 0) {
    state.step -= 1;
    renderQuestion();
  }
});

resetButton.addEventListener("click", () => {
  state.step = 0;
  state.answers = {};
  state.note = "";
  state.currentResult = null;
  state.followUp = null;
  freeNote.value = "";
  resultPanel.classList.add("hidden");
  resultPanel.classList.remove("crisis-mode");
  followupPanel.classList.add("hidden");
  questionPanel.classList.remove("hidden");
  renderQuestion();
  resetCoachAnswer();
});

document.querySelector(".confirm-actions").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.action === "restart") {
    resetButton.click();
    return;
  }
  if (!button.dataset.feedback) return;
  document.querySelectorAll(".confirm-actions button").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
  confirmStatus.textContent = button.dataset.feedback === "不太像"
    ? "猫记下了。这个解释只是猜想，不像你的地方比像的地方更重要。"
    : "猫记下了。你不需要立刻改变，先认出这个圈就很好。";
});

followupBackButton.addEventListener("click", () => {
  followupPanel.classList.add("hidden");
  questionPanel.classList.remove("hidden");
  state.step = questions.length - 1;
  renderQuestion();
});

followupNextButton.addEventListener("click", () => {
  if (state.followUp?.selectedIndex === null) return;
  renderResult();
});

coachPrompts.addEventListener("click", (event) => {
  const prompt = event.target.dataset.prompt;
  if (!prompt) return;
  coachQuestion.value = prompt;
  const reply = generateSmartReply(prompt);
  setCoachAnswer(reply.title, reply.body);
});

coachAskButton.addEventListener("click", () => {
  const reply = generateSmartReply(coachQuestion.value);
  setCoachAnswer(reply.title, reply.body);
});

coachQuestion.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    coachAskButton.click();
  }
});

renderQuestion();
