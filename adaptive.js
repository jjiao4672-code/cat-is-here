(() => {
  const DB_NAME = "adlerlens-observations";
  const STORE = "observations";
  const CYCLE_STORE = "cycles";
  const CHECKIN_STORE = "checkins";
  const $ = (selector) => document.querySelector(selector);
  const params = new URLSearchParams(location.search);
  const COMPETITION_MODE = params.get("demo") === "competition";
  const HOSTED_COMPETITION = COMPETITION_MODE && ["1", "true", "yes"].includes(String(params.get("hosted") || "").toLowerCase());
  const COMPETITION_EN = COMPETITION_MODE && params.get("lang") === "en";
  const RELATIONSHIP_DEMO = params.get("demo") === "relationship";
  const DEMO_MODE = RELATIONSHIP_DEMO || COMPETITION_MODE;
  const NETWORK_CONSENT_KEY = "adlerlens-network-consent-v1";
  const COMPETITION_CASES = {
    relationship: {
      en: "I feel like we've grown more distant lately. I keep wanting to ask what is happening, but I have not brought it up.",
      zh: "我感觉我们最近变疏远了。我一直想问清楚，却还没有开口。"
    },
    job_search: {
      en: "I sent many job applications and have not received a response.",
      zh: "我投了很多简历，一直没有收到回应。"
    }
  };
  const engine = globalThis.AdlerAssessment;
  const quality = globalThis.AdlerQuality;
  if (!engine) throw new Error("Local assessment engine is unavailable");
  if (!quality) throw new Error("Quality rules are unavailable");

  const hasNetworkConsent = () => { if (COMPETITION_MODE) return true; if (RELATIONSHIP_DEMO) return false; try { return localStorage.getItem(NETWORK_CONSENT_KEY) === "yes"; } catch { return false; } };
  const createAssessment = () => {
    let assessment = engine.createAssessment();
    assessment = engine.submitAnswer(assessment, ["continue"]);
    assessment = engine.submitAnswer(assessment, ["safe"]);
    return engine.submitAnswer(assessment, ["unsure"]);
  };

  let state = createAssessment();
  let selected = [];
  let currentResult = null;
  let openingNote = "";
  let openingWasTyped = false;
  let answerNotes = {};
  let deepQuestions = [];
  let deepAnswers = [];
  let deepIndex = 0;
  let selectedFollow = null;
  let deepSynthesis = null;
  let deepDiveEnhanced = false;
  let deepDiveDismissed = false;
  let deepUpdatedFields = [];
  let deepUpdateSummary = "";
  let mapRequestState = "idle";
  let mapRequestError = "";
  let feedback = null;
  let savedRecordId = null;
  let selectedExperiment = null;
  let selectedExperimentOriginal = null;
  let activeCycle = null;
  let pendingStage = null;
  let completionNextStep = null;
  let closingFeedbackCheckins = [];
  let mapReturnView = "question";
  let journalPage = 0;
  let journalCheckins = [];
  let confusionStart = 5;
  let clarityAfter = 5;
  let groundingTimer = null;
  let editingCycleExperiment = false;
  let rememberForCat = false;
  let sessionCheckins = [];
  let similarityDismissed = false;
  let pendingSimilarRecord = null;
  let competitionInputSynthetic = false;
  let competitionCase = "relationship";
  let competitionInputStep = "event";
  let competitionInputChoice = "";
  let interviewRound = 0;
  let interviewSynthetic = false;
  let interviewPartial = false;
  let interviewFailure = "";
let interviewQuestion = null;
let interviewSummary = "";
  let interviewSummaryConfirmed = false;
  let interviewEditingIndex = -1;
  let cognitiveUpdate = "";
  let actionOutcome = "";

  const invalidVisibleValue = /^(?:undefined|null|\[object\s+Object\]|n\/?a|tbd|todo|placeholder|待填写|待补充)$/i;
  const punctuationOnly = /^[\s\p{P}\p{S}]+$/u;
  const semanticMissing = /^(?:尚未确认|还没说到|还不知道|not yet confirmed|not asked yet|not yet known)$/i;
  const validVisible = (value) => typeof value === "string" && Boolean(value.trim()) && !invalidVisibleValue.test(value.trim().replace(/\s+/g, " ")) && !punctuationOnly.test(value.trim());
  const missingText = (asked = false) => COMPETITION_EN ? (asked ? "Not yet known" : "Not asked yet") : (asked ? "还不知道" : "还没说到");
  const safeVisible = (value, asked = false) => validVisible(value) ? value.trim() : missingText(asked);
  const answeredFields = () => new Set(deepAnswers.map((answer) => answer.targetField).filter(Boolean));

  function updateLandingEntry() {
    const button = $("#enterDeskButton");
    if (!button) return;
    button.textContent = "我准备好了";
  }

  function enterDesk({ animate = true } = {}) {
    const root = document.documentElement;
    const landing = $("#landingScreen");
    const app = $(".app-shell");
    const finish = () => {
      root.classList.remove("landing-visible", "landing-exiting");
      landing.hidden = true;
      landing.setAttribute("aria-hidden", "true");
      app.removeAttribute("inert");
      app.removeAttribute("aria-hidden");
      document.querySelector(".question-panel:not(.hidden) button, .desk-state-panel:not(.hidden) button, .result-panel:not(.hidden) button")?.focus({ preventScroll: true });
    };
    app.removeAttribute("inert");
    app.removeAttribute("aria-hidden");
    if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    root.classList.add("landing-exiting");
    setTimeout(finish, 720);
  }

  const today = () => new Date().toLocaleDateString("sv-SE");
  const dateAtNoon = (value) => new Date(`${value}T12:00:00`);
  const addDays = (value, days) => { const date = dateAtNoon(value); date.setDate(date.getDate() + days); return date.toLocaleDateString("sv-SE"); };
  const dayDifference = (from, to) => Math.floor((dateAtNoon(to) - dateAtNoon(from)) / 86_400_000);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char]);
  const hasSafetyLanguage = quality.hasSafetyLanguage;
  const displayLabels = { yes: "已完成", partial: "做了一部分", no: "这次没有做", not_applicable: "今天没有适用情境", supports: "和原来的担心更一致", weakens: "和原来的担心不一致", alternative: "更符合其他原因", unclear: "暂时无法判断", mild: "出现了相近但更轻的情况" };
  const displayLabel = (value) => displayLabels[value] || value || "尚未记录";

  function normalizeExperiment(experiment = {}) {
    const action = String(experiment.action || experiment.description || "").trim();
    const en = COMPETITION_EN;
    const value = {
      id: experiment.id || "observe_only",
      title: experiment.title || (en ? "Observe one thing" : "只观察并记录"),
      prediction: String(experiment.prediction || (en ? "Don’t decide the outcome in advance." : "这次只观察，不预设结果。")).trim(),
      action,
      observableOutcome: String(experiment.observableOutcome || (action ? (en ? "Record whether a new fact appears, what I did, and what still remains unknown." : "记录行动后是否出现新事实，以及困扰是持续上升、回落还是不变。") : "")).trim(),
      continueCondition: String(experiment.continueCondition || (en ? "Continue while the step stays safe, within my control, and likely to teach me something." : "动作由我控制、没有增加风险，而且能带来新的现实信息时继续。")).trim(),
      fallback: String(experiment.fallback || (en ? "Stop if risk rises or a boundary is unsafe. Otherwise, make the action smaller." : "如果风险升高、边界不安全或动作超出承受范围，就停止并缩小动作。")).trim(),
      resultMeaning: String(experiment.resultMeaning || (en ? "A matching result may keep the guess for now. A different result updates it. Unclear remains unknown." : "结果一致：原猜测暂时保留；结果不同：修正原猜测；仍不清楚：先保留不知道。")).trim(),
      timing: ["now", "later", "not_now"].includes(experiment.timing) ? experiment.timing : "now",
      when: String(experiment.when || ""),
      context: String(experiment.context || ""),
      needsPattern: Boolean(experiment.needsPattern),
      description: action
    };
    if (experiment.aiOriginal) value.aiOriginal = normalizeExperiment(experiment.aiOriginal);
    if (Array.isArray(experiment.userEditedFields)) value.userEditedFields = [...experiment.userEditedFields];
    return value;
  }

  function experimentFromForm() {
    if (!selectedExperiment) return null;
    const value = normalizeExperiment({
      ...selectedExperiment,
      prediction: $("#experimentPrediction").value,
      action: $("#experimentAction").value,
      observableOutcome: $("#experimentOutcome").value,
      continueCondition: $("#experimentContinue").value,
      fallback: $("#experimentFallback").value,
      resultMeaning: $("#experimentMeaning").value,
      timing: $("#experimentTiming").value,
      when: $("#experimentWhen").value,
      context: $("#experimentContext").value,
      needsPattern: $("#needsPattern").checked
    });
    if (!selectedExperimentOriginal) return value;
    const original = normalizeExperiment(selectedExperimentOriginal);
    const userEditedFields = ["prediction", "action", "observableOutcome", "continueCondition", "fallback", "resultMeaning"].filter((key) => value[key] !== original[key]);
    return { ...value, aiOriginal: original, userEditedFields };
  }

  function fillExperimentForm(experiment) {
    const value = normalizeExperiment(experiment);
    $("#experimentPrediction").value = value.prediction;
    $("#experimentAction").value = value.action;
    $("#experimentOutcome").value = value.observableOutcome;
    $("#experimentContinue").value = value.continueCondition;
    $("#experimentFallback").value = value.fallback;
    $("#experimentMeaning").value = value.resultMeaning;
    $("#experimentTiming").value = value.timing;
    $("#experimentWhen").value = value.when;
    $("#experimentContext").value = value.context;
    $("#needsPattern").checked = value.needsPattern;
    $("#experimentSchedule").classList.toggle("hidden", value.timing !== "later");
    $("#experimentFields").classList.remove("hidden");
    return { ...value, ...(experiment?.aiOriginal ? { aiOriginal: experiment.aiOriginal } : {}), ...(experiment?.userEditedFields ? { userEditedFields: experiment.userEditedFields } : {}) };
  }

  const experimentSafeAction = (value) => !/秘密试探|暗中测试|操纵|故意冷落|逼迫对方|secretly test|manipulat/i.test(value);
  const experimentReady = () => Boolean(selectedExperiment && $("#experimentAction").value.trim() && experimentSafeAction($("#experimentAction").value) && $("#experimentOutcome").value.trim() && $("#experimentContinue").value.trim() && $("#experimentFallback").value.trim() && $("#experimentMeaning").value.trim() && ($("#experimentTiming").value !== "later" || ($("#experimentWhen").value && $("#experimentContext").value.trim())));

  const heroCopy = {
    start: ["猫在", "难受的时候，先坐一会儿。\n猫本来就在。", "信息不够时，人很容易反复猜。这里不评判你，只先分开事实和猜测。", "联网范围", "安全判断在当前浏览器完成；继续后，本轮回答会用于联网生成问题地图，历史记录不会自动发送。"],
    questions: ["猫正在整理", "猫正在继续核对信息。", "选最接近的一项。选项说不准时，可以补充一句。", "补充先留在本页", "文字补充只在你主动进入深度分析后发送，也不会自动写入长期记录。"],
    awaiting: ["第一轮已经完成", "基础信息已经整理好了。", "接下来可以补 3 题，也可以直接看初步结果。", "由你决定要不要联网", "点击进入深度分析后，当前结果和本轮补充才会发送给模型。"],
    report: ["猫先整理到这里", "猫有一个猜想，你看看像不像。", "重要判断由你来做。想看依据，可以展开完整问题地图。", "由你决定是否保存", "只有选择“留给小猫”后，确认的摘要、地图、实验和观察才会保存在当前浏览器；逐字对话不会写入记录。"],
    cycle: ["现实核对", "今天只记一件小事。", "不用重做问卷。记录真实发生的事，看看原来的猜想有没有变化。", "按你的选择保存", "使用最短有效观察期；只有需要比较重复模式时才开启七日观察。"],
    safety: ["现在先停一下", "现在先顾好安全。", "普通分析已经停止。请优先联系现实中的人和当地支持。", "安全比分析重要", "安全内容不会交给模型继续猜原因。"]
  };

  function sayInDialogue(text) {
    const title = $("#heroTitle");
    const row = title.closest(".hero-row");
    title.textContent = text;
    title.classList.toggle("dialogue-short", Array.from(text.trim()).length <= 14);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    row.classList.remove("dialogue-changing");
    void row.offsetWidth;
    row.classList.add("dialogue-changing");
  }

  function setHero(mode) {
    const [label, title, description, privacyTitle, privacyDescription] = heroCopy[mode];
    $(".tool-surface").dataset.hero = mode;
    $("#sceneLabel").textContent = label;
    sayInDialogue(mode === "start" ? "你可以带着现在的情绪继续。猫先把边界说清楚，再问一件具体的事。" : title);
    $("#heroDescription").textContent = description;
    $("#privacyTitle").textContent = privacyTitle;
    $("#privacyDescription").textContent = privacyDescription;
  }

  function turnQuestionSheet(panel, direction, render) {
    render();
    return true;
  }

  let dbPromise;
  function openDb() {
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 2);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
        if (!request.result.objectStoreNames.contains(CYCLE_STORE)) request.result.createObjectStore(CYCLE_STORE, { keyPath: "id" });
        if (!request.result.objectStoreNames.contains(CHECKIN_STORE)) request.result.createObjectStore(CHECKIN_STORE, { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function storeRequest(storeName, mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const request = action(tx.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  const allRecords = () => DEMO_MODE ? Promise.resolve([]) : storeRequest(STORE, "readonly", (store) => store.getAll());
  const putRecord = (record) => DEMO_MODE ? Promise.resolve(record.id) : storeRequest(STORE, "readwrite", (store) => store.put(record));
  const deleteRecord = (id) => DEMO_MODE ? Promise.resolve(id) : storeRequest(STORE, "readwrite", (store) => store.delete(id));
  const clearRecords = () => DEMO_MODE ? Promise.resolve() : storeRequest(STORE, "readwrite", (store) => store.clear());
  const getCycle = () => activeCycle ? Promise.resolve(activeCycle) : DEMO_MODE ? Promise.resolve(null) : storeRequest(CYCLE_STORE, "readonly", (store) => store.get("active-cycle"));
  const putCycle = (cycle) => DEMO_MODE || !cycle.remembered ? Promise.resolve(cycle.id) : storeRequest(CYCLE_STORE, "readwrite", (store) => store.put(cycle));
  const clearCycles = () => DEMO_MODE ? Promise.resolve() : storeRequest(CYCLE_STORE, "readwrite", (store) => store.clear());
  const allCheckins = async () => {
    if (DEMO_MODE) return demoCheckins(activeCycle?.startDate);
    const stored = await storeRequest(CHECKIN_STORE, "readonly", (store) => store.getAll());
    return [...new Map([...stored, ...sessionCheckins].map((item) => [item.id, item])).values()];
  };
  const putCheckin = (checkin) => {
    sessionCheckins = [...sessionCheckins.filter((item) => item.id !== checkin.id), checkin];
    return DEMO_MODE || !activeCycle?.remembered ? Promise.resolve(checkin.id) : storeRequest(CHECKIN_STORE, "readwrite", (store) => store.put(checkin));
  };
  const deleteCheckin = (id) => DEMO_MODE ? Promise.resolve(id) : storeRequest(CHECKIN_STORE, "readwrite", (store) => store.delete(id));
  const clearCheckins = () => DEMO_MODE ? Promise.resolve() : storeRequest(CHECKIN_STORE, "readwrite", (store) => store.clear());

  async function latestRecord() {
    const records = await allRecords().catch(() => []);
    return records.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0] || null;
  }

  function setMapScene(open) {
    document.documentElement.classList.toggle("map-visible", open);
    $("#mapHotspot").disabled = open;
    $("#notebookHotspot").disabled = open;
    if (open) clearDeskEffects();
  }

  function setMapAvailability(available) {
    $("#mapHotspot").dataset.available = available ? "true" : "false";
    $("#mapHotspotHint").textContent = available ? "打开问题地图" : "完成问题整理后，地图会收在这里";
  }

  function hideDeskViews() {
    $("#questionPanel").classList.add("hidden");
    $("#followupPanel").classList.add("hidden");
    $("#deskStatePanel").classList.add("hidden");
  }

  function loadRecord(record) {
    if (!record) return false;
    deepUpdatedFields = [];
    deepUpdateSummary = "";
    currentResult = record.result;
    const pathway = record.result?.pathway || {};
    deepSynthesis = { insight: record.insight, map: { protectedValue: pathway.protectedValue || pathway.task || "尚未确认", direction: pathway.direction || "尚未确认", ...(record.map || {}) }, mapSources: record.mapSources || {}, evidenceGaps: record.evidenceGaps || [], alternatives: record.alternatives, concepts: record.concepts, experiments: (record.experiments || []).map(normalizeExperiment), experiment: record.experiment };
    selectedExperiment = record.selectedExperiment ? normalizeExperiment(record.selectedExperiment) : null;
    selectedExperimentOriginal = record.selectedExperiment?.aiOriginal ? normalizeExperiment(record.selectedExperiment.aiOriginal) : selectedExperiment;
    feedback = record.feedback;
    savedRecordId = record.id;
    rememberForCat = true;
    confusionStart = record.metrics?.confusionStart ?? 5;
    clarityAfter = record.metrics?.clarityAfter ?? 5;
    deepDiveEnhanced = Boolean(record.concepts?.length || record.experiments?.length);
    mapRequestState = "ready";
    mapRequestError = "";
    return true;
  }

  async function renderMemory() {
    const entries = await allRecords().catch(() => []);
    let badge = $("#companionStatus");
    if (!badge) { badge = document.createElement("span"); badge.id = "companionStatus"; $(".status-strip").append(badge); }
    badge.textContent = entries.some((item) => item.day === today()) ? "今天有一张留给猫的记录" : `留给猫 ${entries.length} 张记录`;
    let note = $("#returnNote");
    if (!note) { note = document.createElement("p"); note.id = "returnNote"; note.className = "return-note"; $(".privacy-note")?.after(note); }
    note.textContent = "不会自动保存。只有你勾选“留给小猫”，才会在当前浏览器保存确认后的摘要、地图、已问问题、实验和观察；不保存逐字对话，可在“观察记录”中删除。";
  }

  async function offerSimilarRecord() {
    const box = $("#similarMemory");
    box.classList.add("hidden");
    pendingSimilarRecord = null;
    if (DEMO_MODE || similarityDismissed || engine.currentQuestion(state)?.id !== "UNDERSTANDING_01") return;
    const eventType = state.answers.ENTRY_01?.[0];
    pendingSimilarRecord = (await allRecords().catch(() => [])).find((item) => item.eventType === eventType) || null;
    if (!pendingSimilarRecord || engine.currentQuestion(state)?.id !== "UNDERSTANDING_01") return;
    $("#similarMemoryDetail").textContent = "只比较你曾确认并选择保存的记录。";
    box.classList.remove("hidden");
  }

  function inferEntry(text) {
    if (/冲突|拒绝|分离|边界|争吵|暴力|conflict|reject|boundary/i.test(text)) return "conflict_boundary";
    if (/关系|回复|忽略|伴侣|朋友|同事|relationship|reply/i.test(text)) return "relationship_change";
    if (/失去|分手|失业|搬家|离世|身份|重大变化|loss|move|breakup/i.test(text)) return "major_change_loss";
    if (/任务|截止|考试|评价|报告|开始不了|deadline|exam|task/i.test(text)) return "task_evaluation";
    if (/钱|住房|工作量|照护|现实|制度|资源|money|housing|workload/i.test(text)) return "real_conditions";
    if (/睡眠|失眠|疲惫|疼痛|药物|停药|饮酒|物质|sleep|pain|medicine/i.test(text)) return "body_sleep_substance";
    if (/回忆|记忆|想起|往事|remind|memory/i.test(text)) return "memory_reminder";
    return "no_clear_event";
  }

  const hasExplicitFeeling = (text) => /有压力|压力很大|焦虑|担心|害怕|紧张|难过|失落|生气|委屈|愤怒|羞耻|自责|孤独|麻木|混乱|难受|开心|轻松|stressed?|anxious|worried|afraid|sad|angry|upset|lonely|numb|overwhelmed/i.test(String(text || ""));

  function renderQuestion() {
    const question = engine.currentQuestion(state);
    if (!question) return showResult();
    setMapScene(false);
    setHero(question.id === "ENTRY_01" ? "start" : "questions");
    const privacyNote = $(".privacy-note");
    const questionContent = $("#questionPanel .question-sheet-content");
    if (privacyNote.parentElement !== questionContent) questionContent.append(privacyNote);
    questionContent.scrollTop = 0;
    privacyNote.hidden = question.id !== "ENTRY_01";
    if (question.id === "ENTRY_01") {
      $("#privacyTitle").textContent = COMPETITION_EN ? "Data note" : "数据说明";
      $("#privacyDescription").textContent = COMPETITION_EN ? "This response is sent to AI to generate the next question. It is not saved automatically." : "这次回答会发送给 AI 生成下一问，不自动保存。";
    }
    selected = state.answers[question.id] ? [...state.answers[question.id]] : [];
    const progress = engine.progress(state);
    $("#questionKicker").textContent = question.kicker;
    $("#questionTitle").textContent = question.id === "ENTRY_01" ? "猫在。\n发生了什么？" : question.id === "UNDERSTANDING_01" ? `猫听到的是：“${openingNote || engine.answerLabels(state, "ENTRY_01")}”。猫猜你可能有些不安或难受。猫听对了吗？` : question.title;
    $("#questionHint").textContent = question.id === "ENTRY_01" ? "选一个最接近的，也可以直接写。" : question.hint;
    $("#stepLabel").textContent = question.id === "ENTRY_01" ? "眼前这一件事" : ["NEED_01", "GROUND_01"].includes(question.id) ? "先按此刻的需要开始" : `猫正在核对信息 ${progress.current} / 约 ${progress.total}`;
    $("#selectedCount").textContent = selected.length ? `已选择 ${selected.length} 项` : question.id === "ENTRY_01" ? "选项或一句话，任选一种" : question.max > 1 ? `最多选 ${question.max} 项` : "选最接近的一项";
    $("#progressBar").style.width = `${progress.percent}%`;
    $("#backButton").disabled = state.path.length === 1;
    $("#nextButton span").textContent = question.id === "ENTRY_01" ? "发送这件事" : question.id === "RES_01" ? "请猫整理回答" : "让猫继续问";
    $("#optionsGrid").innerHTML = "";
    question.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `option-card ${selected.includes(option.id) ? "selected" : ""} ${option.terminal?.startsWith("SAFE") || option.terminal === "EXT_SAFE" ? "crisis" : ""}`;
      button.textContent = option.label;
      button.addEventListener("click", () => {
        if (selected.includes(option.id)) selected = selected.filter((id) => id !== option.id);
        else selected = question.max > 1 ? [...selected, option.id].slice(-question.max) : [option.id];
        renderQuestionSelection(question);
      });
      $("#optionsGrid").append(button);
    });
    const grounding = question.id === "GROUND_01";
    $("#groundingStep").classList.toggle("hidden", !grounding);
    $("#confusionMetric").classList.toggle("hidden", question.id !== "NEED_01");
    if (question.id === "NEED_01") { $("#confusionLevel").value = confusionStart; $("#confusionOutput").value = confusionStart; }
    const freeWrap = $("#freeNote").closest(".free-note-wrap");
    const allowsNote = !["CONSENT_01", "NEED_01", "GROUND_01"].includes(question.id) && !question.id.startsWith("SAFE_");
    freeWrap.style.display = allowsNote ? "grid" : "none";
    if (allowsNote) {
      freeWrap.querySelector("label").textContent = question.id === "ENTRY_01" ? "写下发生的事" : question.id === "UNDERSTANDING_01" ? "哪里不对？请按你的说法改" : "选项没说准时，可以补充一句（可不写）";
      $("#freeNote").value = answerNotes[question.id] || "";
      $("#freeNote").placeholder = question.id === "ENTRY_01" ? "例如：这周对方回复消息的次数比平时少。" : question.id === "UNDERSTANDING_01" ? "例如：不是生气，更多是失落。" : "补充只留在当前会话；主动进入深度分析后才会发送给 AI。";
    }
    $("#competitionExamples").classList.toggle("hidden", !COMPETITION_MODE || question.id !== "ENTRY_01");
    $("#questionPanel").classList.remove("hidden");
    $("#followupPanel").classList.add("hidden");
    $("#deskStatePanel").classList.add("hidden");
    $("#resultPanel").classList.add("hidden");
    if (question.id === "UNDERSTANDING_01") offerSimilarRecord(); else $("#similarMemory").classList.add("hidden");
  }

  function encouragementFor(questionId) {
    if (questionId === "ENTRY_01") return {
      title: "猫记下这件具体的事了。",
      body: "猫先说说自己听到的，你来纠正。"
    };
    if (questionId === "UNDERSTANDING_01") return { title: "猫按你的说法记下了。", body: "接下来只看你当时怎样解释这件事。" };
    if (questionId === "LOOP_01") return {
      title: "猫记下了你当时的做法。",
      body: "接下来看看它有没有暂时帮到你，后来又带来什么影响。"
    };
    return null;
  }

  function showEncouragement(questionId) {
    const copy = encouragementFor(questionId);
    if (!copy) return renderQuestion();
    renderQuestion();
    sayInDialogue(`${copy.title} ${copy.body}`);
  }

  function buildInterimReflection(assessmentState) {
    const answered = engine.coreQuestions.filter((id) => assessmentState.answers[id]?.length).length;
    if (answered === 3) return `猫记下了目前的信息。发生的线索是：${engine.answerLabels(assessmentState, "ENTRY_01")}。你当时的解释是：${engine.answerLabels(assessmentState, "MEANING_01")}。这两件事先分开看。`;
    if (answered === 6) return `你当时的感受是：${engine.answerLabels(assessmentState, "FEELING_01")}。随后你做了或没有做：${engine.answerLabels(assessmentState, "LOOP_01")}。接下来只看它带来了什么结果。`;
    return "";
  }

  function renderInterimReflection(text) {
    renderQuestion();
    sayInDialogue(text);
  }

  function renderQuestionSelection(question) {
    $("#selectedCount").textContent = COMPETITION_EN ? (selected.length ? `${selected.length} selected` : "Choose the closest thing that happened") : selected.length ? `已选择 ${selected.length} 项` : question.max > 1 ? `最多选 ${question.max} 项` : "选最接近的一项";
    [...$("#optionsGrid").children].forEach((button, index) => button.classList.toggle("selected", selected.includes(question.options[index].id)));
  }

  async function showResult() {
    currentResult = engine.buildResult(state);
    mapReturnView = "question";
    if (currentResult.type !== "reflection" || deepSynthesis) return renderResult();
    if (RELATIONSHIP_DEMO) {
      deepSynthesis = fallbackSynthesis(deepTopic());
      deepDiveEnhanced = true;
      mapRequestState = "ready";
      return renderResult();
    }
    await requestAiMap();
  }

  async function requestAiMap({ attempt = 0 } = {}) {
    mapRequestState = "loading";
    mapRequestError = "";
    renderResult();
    try {
      const competitionEntry = openingNote.trim();
      const requestResult = currentResult;
      deepSynthesis = await postJson("/api/map/analyze", {
        topic: deepTopic(),
        result: requestResult,
        stateAnswers: { ENTRY_01: [competitionEntry] },
        note: openingNote,
        notes: { ENTRY_01: competitionEntry },
        answers: deepAnswers, currentMap: deepSynthesis?.map || {}, partial: interviewPartial, safetyRisk: currentResult.type !== "reflection",
        language: COMPETITION_EN ? "en" : "zh"
      });
      ["meaning", "feeling", "move", "result"].forEach((field) => {
        const answer = [...deepAnswers].reverse().find((item) => item.targetField === field);
        const mapValue = String(deepSynthesis.map?.[field] || "");
        if (answer && (semanticMissing.test(mapValue) || /还没说到|not asked yet/i.test(mapValue))) deepSynthesis.map[field] = answer.unknown ? missingText(true) : answer.answer;
      });
      const suggestedAction = String(deepSynthesis.experiments?.[0]?.action || "");
      if (/记录.{0,20}(?:情绪|想法|感受)|(?:record|write down|note).{0,24}(?:feeling|thought|emotion)/i.test(suggestedAction)
        && !/(?:发送|询问|联系|沟通|比较|核对|修改|投递|尝试|确认|send|ask|contact|compare|check|revise|apply|try)/i.test(suggestedAction)) {
        deepSynthesis.experiments = [(COMPETITION_EN ? competitionSynthesis(competitionCase) : competitionSynthesisZh(competitionCase)).experiments[0]];
      }
      deepDiveEnhanced = true;
      mapRequestState = "ready";
    } catch (error) {
      if (attempt < 2 && /校验|JSON|格式|缺少有效来源|invalid|validation/i.test(String(error.message))) return requestAiMap({ attempt: attempt + 1 });
      mapRequestError = classifyApiError(error.message);
      deepSynthesis = null;
      deepDiveEnhanced = false;
      mapRequestState = "fallback-offered";
    }
    renderResult();
  }

  function classifyApiError(message = "") {
    const text = String(message);
    if (/未配置|未配置|密钥|api.?key|401|403|unauthoriz/i.test(text)) return COMPETITION_EN ? "The server has no usable AI key." : "服务器尚未配置可用的 AI 密钥。";
    if (/地图字段|缺少有效来源|校验|JSON|格式|invalid|validation/i.test(text)) return COMPETITION_EN ? "The AI replied, but its map was not reliable enough to show." : "AI 已返回内容，但问题地图校验未通过，暂不显示。";
    return COMPETITION_EN ? "The AI request could not be completed." : "AI 请求没有完成，可能是网络或服务暂时不可用。";
  }

  function acceptCompetitionFallback() {
    if (mapRequestState !== "fallback-offered") return;
    deepSynthesis = COMPETITION_MODE ? (COMPETITION_EN ? competitionSynthesis(competitionCase) : competitionSynthesisZh(competitionCase)) : fallbackSynthesis(deepTopic());
    deepDiveEnhanced = false;
    mapRequestState = "synthetic";
    feedback = null;
    selectedExperiment = null;
    selectedExperimentOriginal = null;
    renderResult();
  }

  function renderResult() {
    hideDeskViews();
    setMapScene(true);
    $("#resultPanel").classList.remove("hidden", "crisis-mode");
    if (currentResult.type !== "reflection" && currentResult.type !== "EXIT") $("#resultPanel").classList.add("crisis-mode");
    setHero(currentResult.type !== "reflection" && currentResult.type !== "EXIT" ? "safety" : "report");
    $("#progressBar").style.width = "100%";
    $("#stepLabel").textContent = currentResult.type === "reflection" ? "基础问题完成" : "普通分析已停止";
    $("#selectedCount").textContent = currentResult.support;
    const localMap = currentResult.type === "reflection" && mapRequestState === "local";
    const loadingMap = currentResult.type === "reflection" && mapRequestState === "loading";
    const awaitingMap = currentResult.type === "reflection" && !deepSynthesis;
    const fallbackOffered = currentResult.type === "reflection" && mapRequestState === "fallback-offered";
    const syntheticMap = currentResult.type === "reflection" && mapRequestState === "synthetic";
    $("#resultPanel").classList.toggle("awaiting-depth", awaitingMap);
    $("#resultTitle").textContent = fallbackOffered ? "实时回答暂时不可用" : syntheticMap ? "合成示例 · 可修改的问题地图" : localMap ? "猫先整理了一张本地问题地图" : awaitingMap ? "稍等，猫在整理刚才说到的事" : deepDiveEnhanced && currentResult.type === "reflection" ? "猫有一个猜想，你看看像不像" : currentResult.title;
    const asked = answeredFields();
    if (deepSynthesis?.map) {
      deepSynthesis.map = Object.fromEntries(Object.entries(deepSynthesis.map).map(([key, value]) => [key, safeVisible(value, key === "fact" || key === "unknown" || asked.has(key))]));
    }
    const map = deepSynthesis?.map;
    $("#resultSummary").textContent = fallbackOffered ? "实时 AI 没有返回可用结果。固定内容还没有显示；由你决定是否继续查看标注清楚的合成示例。" : syntheticMap ? "这不是实时 AI 回答。它是你明确选择后显示的固定合成示例。" : localMap ? "当前未连接到 AI 服务。这一版只根据你刚才的结构化回答整理，并明确标记为本地版；你可以继续使用，也可以稍后联网重新生成。" : awaitingMap ? "猫正在按线索、解释、感受、行动和结果整理这一件事。" : map && currentResult.type === "reflection" ? `猫只在描述这次情境：发生【${map.fact}】后，你解释为【${map.meaning}】，感到【${map.feeling}】，接着【${map.move}】。你可以修改或否定这张地图。` : currentResult.summary;
    $("#surfaceProblem").textContent = map ? map.fact : currentResult.pathway ? currentResult.pathway.trigger : (currentResult.evidence.length ? currentResult.evidence.join("；") : "这次没有生成普通心理结论。");
    $("#protectivePurpose").textContent = map ? map.meaning : currentResult.pathway ? currentResult.pathway.meaning : "尚未确认";
    $("#feelingResult").textContent = map ? map.feeling : currentResult.pathway?.feeling || "尚未确认";
    $("#actionResult").textContent = map ? map.move : currentResult.pathway?.move || "尚未确认";
    $("#nextStep").textContent = map ? map.result : currentResult.pathway?.result || currentResult.action;
    $("#adlerFrame").textContent = map ? `${map.hypothesis} 这不是诊断，也不是对你或他人动机的结论。` : "安全和现实支持优先于解释。";
    $("#unknownResult").textContent = map ? map.unknown : currentResult.pathway?.unknown || "尚未确认";
    $(".hypothesis-path h3").textContent = currentResult.type === "reflection" ? "展开当前过程" : "现在请按顺序做";
    $(".hypothesis-path").open = currentResult.type !== "reflection";
    const cycle = $("#cycleList"); cycle.innerHTML = "";
    (currentResult.cycle || ["停止普通分析。", currentResult.action, currentResult.escalation]).forEach((text) => { const item = document.createElement("li"); item.textContent = text; cycle.append(item); });
    $("#confirmStatus").textContent = currentResult.type === "reflection" ? (feedback ? "已经记下你的判断。" : "先选一个最接近的答案。") : "这个页面不会把安全风险交给模型判断。";
    $("#clarityLevel").value = clarityAfter;
    $("#clarityOutput").value = clarityAfter;
    [...$(".confirm-actions").querySelectorAll("button")].forEach((button) => button.classList.toggle("selected", button.dataset.feedback === feedback));
    const eligible = currentResult.type === "reflection";
    $("#deepDiveLabel").textContent = syntheticMap ? "合成示例" : fallbackOffered ? "实时 AI 暂不可用" : localMap ? "本地问题地图 · 未联网" : "实时 AI";
    $("#deepDiveTitle").textContent = fallbackOffered ? "实时回答暂时不可用。要继续查看标注清楚的合成示例吗？" : syntheticMap ? "当前显示的是固定合成示例" : localMap ? "当前未连接到 AI 服务" : "稍等，猫在整理刚才说到的事";
    $("#deepDiveDescription").textContent = fallbackOffered ? `${mapRequestError || "模型、API 或网络请求失败"}。不会自动切换。` : syntheticMap ? "你可以继续核对，也可以重试实时 AI。" : localMap ? "本地版已经生成，可以继续核对。AI 服务恢复后，可以随时联网重新生成。" : "基础安全判断已完成；本轮输入正在用于生成可修改的地图。";
    $("#deepDiveButton").textContent = fallbackOffered || syntheticMap || localMap ? "重试实时 AI" : "正在生成……";
    $("#deepDiveButton").disabled = loadingMap;
    $("#skipDeepButton").textContent = "继续查看合成示例";
    $("#skipDeepButton").classList.toggle("hidden", !fallbackOffered);
    $("#setupApiKeyButton").classList.toggle("hidden", HOSTED_COMPETITION || !COMPETITION_MODE || !fallbackOffered);
    $("#deepDiveStatus").textContent = "";
    const competitionControls = COMPETITION_MODE && (fallbackOffered || syntheticMap || loadingMap);
    $("#deepDiveCard").classList.toggle("hidden", !eligible || (Boolean(deepSynthesis) && !localMap && !competitionControls));
    $("#deepResultCard").classList.toggle("hidden", !deepSynthesis);
    $("#deepUpdateCard").classList.toggle("hidden", !deepUpdateSummary);
    $("#deepUpdateSummary").textContent = deepUpdateSummary;
    if (deepSynthesis) renderDeepResult();
    $("#toExperimentButton").disabled = feedback !== "很像" || !mapCanExperiment(map);
    resetCoach();
    updateCompetitionStatus();
    if (COMPETITION_EN) applyCompetitionCopy("result");
  }

  function mapCanExperiment(map = deepSynthesis?.map) {
    return Boolean(map && [map.fact, map.meaning].every((value) => validVisible(value) && !semanticMissing.test(value)));
  }

  function resetCoach() {
    $("#coachQuestion").value = "";
    $("#coachAnswer").innerHTML = mapRequestState === "local" ? "<span>当前使用本地问题地图</span><p>继续追问需要联网；当前地图和七日观察仍然可以正常使用。</p>" : "<span>继续追问是可选的</span><p>问题地图已联网生成；这里只会额外发送当前结果和你主动提交的问题，长期记录不会自动发送。</p>";
  }

  async function postJson(url, body) {
    if (RELATIONSHIP_DEMO) throw new Error("固定关系演示不联网");
    if (!hasNetworkConsent()) throw new Error("请先在边界说明中确认联网范围");
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "联网回答暂时不可用");
    return data;
  }

  const deepTopic = () => state.answers?.TRIGGER_01?.includes("relationship_change") ? "slow_reply" : "general";

  const fallbackQuestions = (topic) => topic === "slow_reply" ? ({ questions: [
    { id: "fact", title: "这一次和对方平时的回复节奏相比，具体有什么不同？", hint: "先只核对可以观察的事实。", options: [{ id: "longer", label: "明显比平时久" }, { id: "tone", label: "时间差不多，但语气或内容变了" }, { id: "unknown", label: "其实不知道对方平时的规律" }, { id: "other", label: "其他情况或不确定" }] },
    { id: "meaning", title: "等待时，身体和脑中最先发生了什么？", hint: "选最早出现、最接近的一项。", options: [{ id: "body", label: "先心慌、紧绷、胃部不适或坐立不安" }, { id: "rejection", label: "先想到对方不在意我或可能离开" }, { id: "mistake", label: "先反复找自己是不是做错了什么" }, { id: "uncertain", label: "只是无法忍受不知道发生了什么" }, { id: "other", label: "其他情况或不确定" }] },
    { id: "response", title: "你随后怎样让自己好受一点？后来又发生了什么？", hint: "看短期作用，也看稍后的结果。", options: [{ id: "check", label: "检查或追问后短暂安心，但很快又想确认" }, { id: "ruminate", label: "反复推演，没有真正得到更多信息" }, { id: "withdraw", label: "假装不在意或退出联系，关系更难说清" }, { id: "solve", label: "正常确认一次后就能回到自己的事情" }, { id: "other", label: "其他情况或不确定" }] }
  ] }) : ({ questions: [
    { id: "fact", title: "如果只描述能被观察到的事实，这次具体发生了什么？", hint: "先把事实与对自己的评价分开。", options: [{ id: "event", label: "发生了一个明确事件或变化" }, { id: "load", label: "任务、责任或现实条件超过了当前容量" }, { id: "body", label: "没有明显事件，身体或情绪先发生变化" }, { id: "pattern", label: "和以前相似的情况再次出现" }, { id: "other", label: "其他情况或不确定" }] },
    { id: "meaning", title: "在难受升高前，身体或脑中最早出现了什么？", hint: "选最早出现的一环，不急着解释原因。", options: [{ id: "body", label: "紧绷、沉重、心慌、疲惫或注意力散开" }, { id: "threat", label: "想到会失败、失去、被评价或事情失控" }, { id: "self", label: "很快变成对自己的否定或责怪" }, { id: "uncertain", label: "主要是不知道接下来会怎样" }, { id: "other", label: "其他情况或不确定" }] },
    { id: "response", title: "你随后怎样保护自己？短时间和稍后分别怎样？", hint: "一个动作可以短期有用，同时留下长期代价。", options: [{ id: "avoid", label: "回避或拖延后暂时轻松，事情随后更难开始" }, { id: "check", label: "检查、推演或控制后短暂安心，之后又需要重复" }, { id: "criticize", label: "逼迫或责怪自己，短时行动但更疲惫" }, { id: "solve", label: "现实问题确实向前推进，没有明显代价" }, { id: "other", label: "其他情况或不确定" }] }
  ] });

  function fallbackSynthesis(topic) {
    const path = currentResult.pathway || {};
    if (topic === "general") return {
      insight: "猫看完了你写的内容。猫有一个猜想，你看看像不像。事情发生后，你很快做出了一个判断，接着做了一件能暂时缓解难受的事。这个做法后来也可能带来影响。目前的信息还不够，猫不能确定这个判断是否准确。",
      map: { fact: path.trigger || "尚未确认", meaning: path.meaning || "尚未确认", feeling: path.feeling || "尚未确认", move: path.move || "尚未确认", result: path.result || "尚未确认", hypothesis: path.hypothesis || "可能是信息还不完整时，当前解释影响了感受和行动；仍需验证。", unknown: path.unknown || "仍然不知道这个解释是否完整，以及还有哪些现实因素在起作用。" },
      alternatives: currentResult.alternatives || ["现实条件、睡眠和身体状态也可能造成相似体验"],
      concepts: [],
      experiments: [{ id: "new_action", title: "先试一个最小动作", prediction: path.hypothesis || "这次先观察，不预设结果。", action: currentResult.action || "第一步：下一次相似困扰出现时，只改变一个最小动作。", observableOutcome: "观察 20 分钟；记录新事实、自己实际做了什么，以及原预测是否发生。", continueCondition: "动作由我控制、没有增加风险，而且能带来新信息时继续。", fallback: "现实风险升高、边界不安全或明显无法承受时停止；否则缩小动作。", resultMeaning: "结果一致就暂时保留猜测；结果不同就修正；仍不清楚也有效。", needsPattern: false }],
      experiment: currentResult.action || "下一次相似困扰出现时，只改变一个最小动作，再记录实际结果。"
    };
    return {
      insight: "猫看完了你写的内容。猫有一个猜想，你看看像不像。对方回复变慢后，你想到关系可能出了问题，于是马上确认。确认让你好受了一会儿，之后你可能更频繁地查看回复。目前还不能确定对方回复变慢的原因。",
      map: { fact: openingNote ? "对方回复节奏发生变化" : path.trigger, meaning: path.meaning, feeling: path.feeling || "担心、害怕或紧绷", move: path.move, result: path.result || "短暂安心，之后更频繁地查看回复", hypothesis: "可能是信息不完整时，把回复变慢解释成关系出了问题，于是反复确认；仍需用后续事实验证。", unknown: "仍然不知道对方回复变慢的原因，也不知道这是否代表长期变化。" },
      alternatives: ["对方的生活状态或这段关系本身确实发生了变化", "一次事件不足以判断长期模式"],
      concepts: [],
      experiments: [{ id: "delay_check", title: "延迟一次确认", prediction: "如果我不马上确认，对方会更加疏远，我的不安会一直上升。", action: "第一步：下一次回复变慢时，先记下预测，再把重复确认延迟 15 分钟。", observableOutcome: "观察 15 分钟；记录有没有新事实、自己实际做了什么，以及对方之后是否正常回应。", continueCondition: "延迟由我控制、没有现实风险，而且能看见新信息时继续。", fallback: "现实风险升高、边界不安全或明显无法承受时停止；否则把动作缩成只写下预测。", resultMeaning: "正常回应会修正‘回复慢等于关系失败’；持续变化会提示需要直接沟通；还不知道就继续保留不确定。", needsPattern: ["often", "long"].includes(state.answers.PATTERN_01?.[0]) }],
      experiment: "下一次回复变慢时，先记录事实、身体反应和第一个预测，把重复确认延迟 15 分钟，再记录结果。"
    };
  }

  function demoAssessment(completed = false) {
    const path = ["CONSENT_01", "SAFE_01", "NEED_01", "ENTRY_01", "UNDERSTANDING_01", "REL_02", "MEANING_01", "FEELING_01", "LOOP_01", "PAYOFF_01", "COST_01", "PATTERN_01", "SUPPORT_01"];
    const answers = {
      CONSENT_01: ["continue"], SAFE_01: ["safe"], NEED_01: ["clarify"], ENTRY_01: ["relationship_change"], TRIGGER_01: ["relationship_change"], REL_02: ["no"],
      UNDERSTANDING_01: ["yes"], MEANING_01: ["rejected"], FEELING_01: ["fear"], LOOP_01: ["reassure"],
      PAYOFF_01: ["relief"], COST_01: ["repeat", "tired"], PATTERN_01: ["often"], SUPPORT_01: ["repeated"]
    };
    if (!completed) return { path: path.slice(0, 4), answers: { CONSENT_01: answers.CONSENT_01, SAFE_01: answers.SAFE_01, NEED_01: answers.NEED_01 }, terminal: null, completed: false };
    return { path, answers, terminal: null, completed: true };
  }

  function demoCheckins(startDate) {
    if (!startDate) return [];
    const rows = [
      [0, 8, 6, "yes", "supports"], [1, 7, 5, "partial", "unclear"], [2, 6, 5, "yes", "weakens"],
      [3, 6, 4, "yes", "alternative"], [4, 5, 4, "yes", "weakens"], [5, 4, 3, "yes", "weakens"], [6, 4, 3, "yes", "weakens"]
    ];
    return rows.map(([offset, distress, functionImpact, experimentDone, evidenceDirection]) => ({
      id: `relationship-demo:${addDays(startDate, offset)}`, cycleKey: "relationship-demo", date: addDays(startDate, offset), mode: "instant",
      eventOccurrence: "yes", distress, distressAfter: Math.max(0, distress - 2), functionImpact, experimentDone, evidenceDirection,
      eventNote: "", experimentResult: "", learning: COMPETITION_EN ? competitionCase === "job_search" ? "One application change was completed; the hiring outcome still does not decide personal worth." : "The invitation was sent. The only reply was: ‘Saturday works.’ The relationship outcome remains unknown." : competitionCase === "job_search" ? "完成了一处申请调整；招聘结果仍不能决定个人价值。" : "邀请已经发出。对方只回复：‘周六可以聊。’关系走向仍然未知。", alternativeHypothesis: ""
    }));
  }

  function competitionSynthesis(caseId = competitionCase) {
    if (caseId === "job_search") return {
      insight: "Cat read what you wrote. No replies arrived. ‘I am not capable enough’ is one way to read the silence, not a known reason for it. Does that fit?",
      map: {
        fact: "Many applications were sent, and no replies arrived.",
        meaning: "My ability is not good enough.",
        feeling: "Anxious, ashamed, and discouraged.",
        move: "Stop sending applications.",
        result: "Right away: brief relief from possible rejection. Later: more anxiety and no new information.",
        hypothesis: "Possibly, the silence started to feel like a verdict on your ability, so stopping brought brief relief. That is still a guess.",
        unknown: "Why employers did not reply, what each role required, and which application change might matter remain unknown."
      },
      alternatives: ["Hiring timing, role fit, or application details may affect replies.", "Silence does not establish a complete judgment of ability."],
      concepts: [],
      experiments: [{ id: "one_application", title: "Send one focused application", prediction: "If I apply again, another silence will prove I am not capable enough.", action: "First step: choose one suitable role and make one specific change to the application.", observableOutcome: "Wait until the response window in the posting ends. Record whether you applied, any reply, and what you still do not know.", continueCondition: "Keep going while each application stays manageable and gives you useful information.", fallback: "Stop if the role is unsuitable or the step becomes too large; otherwise make it smaller.", resultMeaning: "A reply tells you more about fit. No reply still says nothing certain about your worth. Not knowing yet is allowed.", needsPattern: false }]
    };
    return {
      insight: "Cat read what you wrote. Contact has decreased. ‘Asking will end the relationship’ is a fear about what may happen, not a known outcome. Does that fit?",
      map: {
        fact: "Contact has become less frequent lately.",
        meaning: "If I ask about the relationship, the answer may be that we should separate.",
        feeling: "Afraid of hearing a painful answer.",
        move: "Avoid the conversation and analyze the relationship alone.",
        result: "Right away: avoid the feared answer. Later: keep guessing without new relationship information.",
        hypothesis: "Possibly, expecting the worst has made avoiding the conversation feel safer. That is still a guess.",
        unknown: "The other person's actual view and how the conversation would unfold remain unknown."
      },
      alternatives: ["Less contact can have several explanations.", "A conversation may be difficult without automatically ending the relationship."],
      concepts: [],
      experiments: [{ id: "conversation_invite", title: "Prepare one clear invitation", prediction: "If I invite a direct conversation, the relationship will immediately end.", action: "First step: write a clear invitation to talk without blaming the other person, choose when to send it, and send it now if that feels safe.", observableOutcome: "Wait until the time you suggested. Record whether you sent it, the reply, and what you still do not know.", continueCondition: "Keep going while the invitation stays respectful, safe, and within your control.", fallback: "Stop if there is a real safety or boundary risk. Otherwise, draft the message and choose when to send it.", resultMeaning: "An agreed time gives you one fact without deciding the relationship. A refusal gives you different information. No reply leaves the outcome unknown.", needsPattern: false }]
    };
  }

  function competitionSynthesisZh(caseId = competitionCase) {
    if (caseId === "job_search") return {
      insight: "猫看完了你写的内容。猫有一个猜想，你看看像不像。没有收到回复是事实；“我能力不行”是你现在的解释，还不是外部结果已经证明的结论。",
      map: { fact: "投出多份简历后没有收到回复。", meaning: "我的能力不行。", feeling: "焦虑、自卑。", move: "停止继续投递。", result: "当下：暂时避开再次失望。后来：更焦虑，也没有获得新信息。", hypothesis: "可能是把外部沉默变成了对自身能力的判决，于是停止行动会暂时轻松；仍需验证。", unknown: "仍不知道没有回复的具体原因、岗位匹配情况，以及什么调整可能有效。" },
      alternatives: ["招聘节奏、岗位匹配或材料细节也会影响回复。", "没有回复不能独自证明一个人的能力。"], concepts: [],
      experiments: [{ id: "one_application", title: "投出一份有边界的申请", prediction: "如果再投一次，没有回复就说明我能力不行。", action: "第一步：选一个匹配岗位，只准备一处自己能控制的材料调整。", observableOutcome: "观察到岗位标明的回复时间；记录完成的行动、实际回复和仍然不知道的部分。", continueCondition: "动作仍低成本、由自己控制且能带来信息时继续。", fallback: "岗位不合适或步骤太大时停止；否则缩小到只修改一处材料。", resultMeaning: "收到回复会增加匹配信息；没回复仍不能判定个人价值；还不知道也有效。", needsPattern: false }]
    };
    return {
      insight: "猫看完了你写的内容。猫有一个猜想，你看看像不像。最近联系变少是线索；“一开口就会分开”是现在的预测，还不是已经发生的结果。",
      map: { fact: "最近联系变少。", meaning: "如果问清楚，对方可能会说分开。", feeling: "害怕听到坏答案。", move: "回避谈话，自己反复分析。", result: "当下：暂时避开坏答案。后来：一直得不到新的真实信息。", hypothesis: "可能是预想了坏结果，所以不让现实开始；仍需验证。", unknown: "仍不知道对方的真实想法，也不知道谈话实际会走向哪里。" },
      alternatives: ["联系变少可能有不同原因。", "谈话可能困难，但不等于一定会结束关系。"], concepts: [],
      experiments: [{ id: "conversation_invite", title: "先准备一条谈话邀请", prediction: "如果主动邀请谈话，关系会马上结束。", action: "第一步：写一条清楚、不指责的谈话邀请，并决定发送时间；当下安全且能做时，可以发送。", observableOutcome: "观察到约定时间；记录是否发送、实际回复和仍然不知道的部分。", continueCondition: "邀请保持尊重、由自己控制且安全时继续。", fallback: "出现现实安全或边界风险时停止；否则缩小为只写草稿。", resultMeaning: "对方同意时间会增加一条事实，但不能决定关系走向；拒绝会提供另一种信息；没有回复时仍保留不知道。", needsPattern: false }]
    };
  }

  function renderCompetitionUnderstanding() {
    competitionInputStep = "understanding";
    competitionInputChoice = "";
    selected = [];
    setMapScene(false);
    hideDeskViews();
    $("#questionPanel").classList.remove("hidden");
    $("#questionKicker").textContent = COMPETITION_EN ? "CORRECTABLE UNDERSTANDING" : "可以纠正的理解";
    $("#questionTitle").textContent = COMPETITION_EN ? "The full story is not clear yet, but you may already have guessed an outcome. Did Cat hear that right?" : "事情还没说清楚时，你好像先猜了一个结果。猫理解得对吗？";
    $("#questionHint").textContent = COMPETITION_EN ? "This is a guess, not a fact. Correct it before Live AI builds the map." : "这只是猜测，不是事实。进入实时 AI 地图前，你可以纠正。";
    $("#stepLabel").textContent = COMPETITION_EN ? "INPUT · UNDERSTANDING CHECK" : "输入 · 理解确认";
    $("#selectedCount").textContent = COMPETITION_EN ? "Choose one, or write a correction" : "选择一项，或写下纠正";
    $("#optionsGrid").innerHTML = "";
    const choices = COMPETITION_EN ? [["fits", "Fits"], ["partly", "Partly"], ["revise", "Revise"]] : [["fits", "很像"], ["partly", "有一点像"], ["revise", "猫看偏了"]];
    choices.forEach(([id, label]) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "option-card"; button.textContent = label;
      button.addEventListener("click", () => {
        competitionInputChoice = competitionInputChoice === id ? "" : id;
        [...$("#optionsGrid").children].forEach((item) => item.classList.toggle("selected", item === button && competitionInputChoice === id));
        $("#selectedCount").textContent = competitionInputChoice ? (COMPETITION_EN ? `${label} selected` : `已选择：${label}`) : "";
      });
      $("#optionsGrid").append(button);
    });
    const freeNote = $("#freeNote");
    freeNote.closest(".free-note-wrap").style.display = "grid";
    freeNote.previousElementSibling.textContent = COMPETITION_EN ? "What should Cat change? (optional if it fits)" : "猫哪里理解错了？（准确时可不写）";
    freeNote.placeholder = COMPETITION_EN ? "For example: I was frustrated, not afraid." : "例如：不是害怕，更多是失落。";
    freeNote.value = "";
    $("#backButton").disabled = false;
    $("#backButton span").textContent = COMPETITION_EN ? "Back" : "返回";
    $("#nextButton span").textContent = COMPETITION_EN ? "Generate Problem Map with Live AI" : "用实时 AI 生成问题地图";
  }

  function updateCompetitionStatus() {
    const apiUnavailable = mapRequestState === "fallback-offered";
    ["#setupApiKeyStatusLink", "#setupApiKeyNavLink"].forEach((selector) => {
      const link = $(selector);
      if (!link) return;
      link.classList.toggle("hidden", HOSTED_COMPETITION || !apiUnavailable);
      link.textContent = COMPETITION_EN ? "Add API key" : "添加 API 密钥";
    });
    if (!COMPETITION_MODE) return;
    const status = COMPETITION_EN
      ? mapRequestState === "synthetic" ? "Synthetic example · Nothing saved" : mapRequestState === "fallback-offered" ? "Live AI unavailable · No example shown" : mapRequestState === "loading" ? "Live AI · Generating" : `Live AI · ${competitionInputSynthetic ? "Example input" : "Edited input"} · Nothing saved`
      : mapRequestState === "synthetic" ? "合成示例 · 不保存" : mapRequestState === "fallback-offered" ? "实时 AI 暂不可用 · 尚未显示兜底" : mapRequestState === "loading" ? "实时 AI · 正在生成" : `实时 AI · ${competitionInputSynthetic ? "合成示例输入" : "已编辑输入"} · 不保存`;
    const navStatus = $("#demoNav span");
    const topStatus = $(".status-strip span");
    if (navStatus) navStatus.textContent = status;
    if (topStatus) topStatus.textContent = status;
  }

  function applyCompetitionCopy(view) {
    if (!COMPETITION_EN) return;
    const set = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
    const responseStatus = mapRequestState === "synthetic" ? "Synthetic example · Nothing saved" : mapRequestState === "fallback-offered" ? "Live AI unavailable · No example shown" : mapRequestState === "loading" ? "Live AI · Generating" : `Live AI · ${competitionInputSynthetic ? "Example input" : "Edited input"} · Nothing saved`;
    document.documentElement.lang = "en";
    document.title = "Cat Is Here | Competition Demo";
    $(".landing-art").alt = "Cat waits behind a desk among sunlit plants";
    $(".hero-row").setAttribute("aria-label", "Reflect with Cat");
    $(".desk-illustration img").alt = "Cat beside a reflection notebook";
    $(".desk-illustration figcaption").textContent = "Cat does not decide for you. Cat stays with what actually happened.";
    set("#app-title", "Cat Is Here");
    set(".landing-header span", "CAT IS HERE");
    $("#demoNav").setAttribute("aria-label", "Competition demo navigation");
    $(".progress-wrap").setAttribute("aria-label", "Progress");
    set("#demoNav span", responseStatus);
    $(".competition-only")?.classList.remove("hidden");
    document.querySelectorAll("[data-competition-label]").forEach((button) => { button.textContent = button.dataset.competitionLabel; });
    set("#landingTitle", "Cat is here.");
    set("#landingPromise", "You don't have to know what it means yet. Start with what happened.");
    set("#enterDeskButton", "I'm ready");
    set("#landingTrust", "You choose what to save · AI-assisted reflection · Not therapy or crisis support");
    set("#landingAiDetailsButton", "How Cat uses AI");
    set("#networkPrivacyEyebrow", "Competition walkthrough");
    set("#networkPrivacyTitle", "How Cat uses AI");
    set("#closeNetworkPrivacyButton", "Close");
    set("#networkPrivacyDescription", "This walkthrough starts with a labeled, editable synthetic example and uses Live AI by default.");
    const privacyItems = ["The current edited input is sent to the configured model to generate a correctable Problem Map.", "Safety routing runs in this browser; no verbatim conversation or competition walkthrough data is saved.", "If Live AI fails, fixed synthetic output appears only after you explicitly choose it, stays labeled, and can be replaced by retrying Live AI."];
    $("#networkPrivacyList").innerHTML = "";
    privacyItems.forEach((copy) => { const item = document.createElement("li"); item.textContent = copy; $("#networkPrivacyList").append(item); });
    $("#revokeNetworkConsentButton").hidden = true;
    set(".status-strip span", responseStatus);
    set("#notebookHotspot span", "Open 7-Day Check");
    set("#mapHotspotHint", "Problem Map available after Input");
    if (view === "question") {
      set("#sceneLabel", "INPUT");
      set("#heroTitle", "Cat is here.\nWhat happened?");
      set("#heroDescription", "Choose the closest option, or describe one thing that happened.");
      set("#stepLabel", "ONE EVENT");
      set("#selectedCount", "Choose an option or write one sentence");
      set("#questionKicker", "INPUT · WHAT HAPPENED");
      set("#questionTitle", "Cat is here.\nWhat happened?");
      set("#questionHint", "Choose the closest option, or write your own.");
      const optionLabels = ["Something changed in a relationship or response", "A conflict, rejection, separation, or boundary issue", "A major change, loss, or transition", "A task, deadline, review, or evaluation", "Pressure from money, housing, work, study, or caregiving", "A change in my body, sleep, medication, drinking, or substance use", "A memory, message, or familiar situation came back", "No single event stands out", "I can’t recall yet"];
      [...$("#optionsGrid").children].forEach((button, index) => { button.classList.remove("hidden"); button.textContent = optionLabels[index] || button.textContent; });
      $("#freeNote").maxLength = 320;
      $("#freeNote").previousElementSibling.textContent = "Write what happened";
      $("#freeNote").placeholder = "For example: They replied fewer times this week than usual.";
      set("#privacyTitle", "Data note");
      set("#privacyDescription", "This response is sent to AI to generate the next question. It is not saved automatically.");
      set("#competitionExampleLabel", "Use an example if helpful:");
      $("#competitionExamples").setAttribute("aria-label", "Example input");
      document.querySelector('[data-example-case="relationship"]').textContent = "Relationship";
      document.querySelector('[data-example-case="job_search"]').textContent = "Job search";
      set("#backButton span", "Back");
      $("#backButton").disabled = true;
      set("#nextButton span", "Send this event");
      return;
    }
    if (view === "result") {
      $("#closeResultButton").setAttribute("aria-label", "Close the Problem Map");
      $("#answerCoreCard").setAttribute("aria-label", "Current reflection structure");
      set("#resultPanel .result-step", "2 OF 4 · PROBLEM MAP");
      if (mapRequestState === "loading") {
        set("#sceneLabel", "PROBLEM MAP · LIVE AI");
        set("#heroTitle", "Cat is building an editable map.");
        set("#heroDescription", "The labeled synthetic input is being sent to the configured model.");
        set("#stepLabel", "PROBLEM MAP · LIVE AI");
        set("#selectedCount", "Generating a correctable response");
        set("#resultTitle", "Live AI is organizing this event");
        set("#resultSummary", "Cat is separating the clue, interpretation, feeling, action, result, and what remains unknown.");
        set("#deepDiveLabel", "LIVE AI");
        set("#deepDiveTitle", "Generating an editable Problem Map");
        set("#deepDiveDescription", "No fixed response is being shown.");
        set("#deepDiveButton", "Generating…");
        return;
      }
      if (mapRequestState === "fallback-offered") {
        set("#sceneLabel", "PROBLEM MAP · LIVE AI UNAVAILABLE");
        set("#heroTitle", "The live response did not arrive.");
        set("#heroDescription", "No fixed output has been shown. You choose what happens next.");
        set("#stepLabel", "PROBLEM MAP · CHOOSE THE NEXT SOURCE");
        set("#selectedCount", "Live AI unavailable");
        set("#resultTitle", "Live response is unavailable. Continue with a labeled synthetic example?");
        set("#resultSummary", "The app will not switch sources silently.");
        set("#deepDiveLabel", "LIVE AI UNAVAILABLE");
        set("#deepDiveTitle", "Live response is unavailable. Continue with a labeled synthetic example?");
        set("#deepDiveDescription", "The model, API, or network request failed. No fixed output has been shown.");
        set("#skipDeepButton", "Continue with synthetic example");
        set("#setupApiKeyButton", "Add API key");
        set("#deepDiveButton", "Retry Live AI");
        return;
      }
      if (!deepSynthesis) return;
      set("#sceneLabel", "PROBLEM MAP · A GUESS YOU CAN CHANGE");
      set("#heroTitle", "Separate what happened from what it might mean.");
      set("#heroDescription", "You can change this map when you learn more.");
      set("#stepLabel", "PROBLEM MAP · 2 OF 4");
      set("#selectedCount", mapRequestState === "synthetic" ? "Synthetic example · fixed output" : "Live AI · editable output");
      set("#resultPanel .result-step", "2 OF 4 · PROBLEM MAP");
      const defaultSyntheticInput = openingNote === COMPETITION_CASES[competitionCase].en;
      const exampleTitle = competitionCase === "job_search" ? "No reply ≠ a verdict on ability" : "A feared ending is not the same as a known ending";
      set("#resultTitle", mapRequestState === "synthetic" ? `Synthetic example · ${exampleTitle}` : defaultSyntheticInput ? exampleTitle : "One event, one guess you can change");
      set("#resultSummary", mapRequestState === "synthetic" ? "This fixed output is the labeled example you selected. It appeared only after your choice and is not a response to edited personal input." : `This map came from Live AI. What happened: ${deepSynthesis.map.fact} Change anything Cat misunderstood.`);
      const coreLabels = ["What happened", "What I thought", "What I felt", "What I did or did not do", "What happened right away and later", "Cat's guess (you decide)", "Still unknown"];
      document.querySelectorAll("#answerCoreCard .result-grid span").forEach((node, index) => { node.textContent = coreLabels[index]; });
      set("#surfaceProblem", deepSynthesis.map.fact);
      set("#protectivePurpose", deepSynthesis.map.meaning);
      set("#feelingResult", deepSynthesis.map.feeling);
      set("#actionResult", deepSynthesis.map.move);
      set("#nextStep", deepSynthesis.map.result);
      set("#adlerFrame", `${deepSynthesis.map.hypothesis} Change it or reject it.`);
      set("#unknownResult", deepSynthesis.map.unknown);
      set(".evidence-disclosure > summary", "View and edit the full Problem Map");
      set(".deep-result-head > div > span", "A GUESS YOU CAN CHANGE");
      set(".deep-result-head h3", "Problem Map");
      set(".local-chip", "You decide");
      set("#alternativesList h3", "Other explanations remain possible");
      $(".hypothesis-path")?.classList.add("hidden");
      $(".concepts-wrap")?.classList.add("hidden");
      $("#continueDeepButton")?.classList.toggle("hidden", deepAnswers.filter((answer) => answer.id?.startsWith("ROUND_")).length >= 4);
      $("#resultPanel .reflection-metric")?.classList.add("hidden");
      $(".coach-disclosure")?.classList.add("hidden");
      set("#resultPanel .disclaimer", "Cat Is Here supports self-reflection. It is not psychotherapy, medical diagnosis, or crisis intervention. If there is an immediate risk of self-harm, suicide, or violence, contact a trusted person and local emergency or crisis support now.");
      set("#resultPanel .confirm-card .result-step", "MAP CHECK");
      set("#resultPanel .confirm-card h3", "Did Cat put this in the right order?");
      set("#resultPanel .confirm-card > p", "You can edit any step. Only confirmed parts move into an action.");
      const choices = ["Fits", "Partly", "Revise"];
      [...$(".confirm-actions").children].forEach((button, index) => { button.textContent = choices[index]; });
      set("#confirmStatus", "Keep this guess for now. See what happens next.");
      set("#toExperimentButton", "Think of one small action");
      set("#finishAtMapButton", "Stop here for today");
      set("#applyMapCorrectionButton", "Change the affected parts");
      if (mapRequestState === "synthetic") {
        set("#deepDiveLabel", "SYNTHETIC EXAMPLE");
        set("#deepDiveTitle", "This is fixed synthetic output");
        set("#deepDiveDescription", "It appeared only after your choice. Retry Live AI at any time.");
        set("#deepDiveButton", "Retry Live AI");
      }
      return;
    }
    if (view === "experiment") {
      set("#sceneLabel", "EXPERIMENT · CHANGE ONE THING");
      set("#heroTitle", "Turn the worry into something you can check.");
      set("#heroDescription", "Change one small action, then record what actually happens.");
      set("#stepLabel", "EXPERIMENT · 3 OF 4");
      set("#selectedCount", "Synthetic case · editable experiment");
      set("#experimentStep .result-step", "3 OF 4 · EXPERIMENT");
      set("#experimentStep h2", "What will we change this time?");
      set("#experimentStep > p", competitionCase === "job_search" ? "A hiring silence does not automatically prove lack of ability. Test one controllable change." : "A feared ending is still a prediction. Let one small, controllable action add reality.");
      $("#experimentStep .experiment-guide")?.classList.add("hidden");
      $(".experiment-proposal")?.classList.remove("hidden");
      const labels = ["1. Prediction", "2. First step", "3. Observation time and record", "4. Continue when", "5. Stop or make it smaller", "6. What different results mean", "Timing"];
      document.querySelectorAll("#experimentFields > label:not(.remember-choice)").forEach((node, index) => { node.textContent = labels[index] || ""; });
      $("#experimentTiming").classList.remove("hidden");
      $("#experimentTiming").previousElementSibling.classList.remove("hidden");
      $("#needsPattern").closest("label").classList.add("hidden");
      $("#rememberForCat").closest("label").classList.add("hidden");
      $("#experimentFields > small").classList.add("hidden");
      set("#deskExperimentMapButton", "Back to Problem Map");
      set("#startCycleButton", "Use this plan");
      return;
    }
    set("#sceneLabel", "7-DAY REALITY CHECK");
    set("#heroTitle", "Observations, not more guessing.");
    set("#heroDescription", "Compare the prediction with situations that actually occurred.");
    set("#stepLabel", "7-DAY REALITY CHECK · 4 OF 4");
    set("#selectedCount", "7 observations · synthetic case");
    set("#cycleDayLabel", "7-Day Reality Check · Complete");
    set("#cycleExperimentSummary", `Experiment: ${activeCycle.experiment.action}`);
    set("#cycleDashboard .desk-cycle-status article:first-child span", "TODAY");
    set("#todayCheckinStatus", "Recorded");
    set("#cycleDashboard .desk-cycle-status article:last-child span", "EVIDENCE WINDOW");
    set("#cycleProgressStatus", "7 / 7 recorded · 7 target situations");
    set("#startCheckinButton", "Check-in complete");
    set("#cycleDashboardStatus", competitionCase === "job_search" ? "This synthetic example separates hiring outcomes from a verdict on personal ability." : "The invitation was sent. The reply was only: ‘Saturday works.’ The relationship outcome remains unknown.");
    set("#competitionClosingLetter p", competitionCase === "job_search" ? "Original judgment: no replies meant I was not capable enough. Actual observation: you completed one application change that you controlled. The next hiring response remains unknown and does not decide personal worth." : "Original judgment: asking would make the relationship end. Actual observation: you sent a clear invitation, and the reply was only ‘Saturday works.’ You completed the controllable step by starting the conversation. Where the relationship will go remains unknown.");
    set("#competitionClosingLetter small", "The step still counts, even without the reply or relief you hoped for.");
    $("#cycleDashboard .cycle-more-actions")?.classList.add("hidden");
    $("#competitionClosingLetter")?.classList.remove("hidden");
  }

  function prepareDemoResult(note = "") {
    state = demoAssessment(true);
    const defaultNote = COMPETITION_CASES[competitionCase][COMPETITION_EN ? "en" : "zh"];
    openingNote = note.trim() || openingNote || $("#freeNote")?.value.trim() || defaultNote;
    competitionInputSynthetic = openingNote === defaultNote;
    currentResult = engine.buildResult(state);
    deepSynthesis = COMPETITION_MODE ? null : fallbackSynthesis("slow_reply");
    deepDiveEnhanced = !COMPETITION_MODE;
    mapRequestState = COMPETITION_MODE ? "idle" : "ready";
    mapRequestError = "";
    deepDiveDismissed = false;
    feedback = COMPETITION_MODE ? null : "很像";
    selectedExperiment = deepSynthesis ? normalizeExperiment(deepSynthesis.experiments[0]) : null;
    selectedExperimentOriginal = selectedExperiment;
  }

  async function showDemoView(view, { reveal = true } = {}) {
    const safeView = ["question", "result", "experiment", "week"].includes(view) ? view : "question";
    if (reveal && COMPETITION_MODE && document.documentElement.classList.contains("landing-visible")) enterDesk({ animate: false });
    if (safeView !== "week" && $("#journalDialog").open) closeJournal({ restore: false, focus: false });
    if (reveal) { const url = new URL(location.href); url.searchParams.set("view", safeView); history.replaceState(null, "", url); }
    [...document.querySelectorAll("[data-demo-view]")].forEach((button) => button.classList.toggle("selected", button.dataset.demoView === safeView));
    activeCycle = null;
    if (safeView === "question") {
      state = createAssessment(); openingNote = ""; answerNotes = {}; currentResult = null; deepSynthesis = null; feedback = null; selectedExperiment = null; selectedExperimentOriginal = null; mapRequestState = "idle"; mapRequestError = ""; competitionInputSynthetic = false; competitionInputStep = "event"; competitionInputChoice = ""; deepAnswers = []; interviewRound = 0; interviewSynthetic = false; interviewQuestion = null; interviewSummary = ""; interviewSummaryConfirmed = false; interviewEditingIndex = -1;
      renderQuestion();
    } else if (safeView === "result") {
      if (!currentResult) { await showDemoView("question"); $("#selectedCount").textContent = COMPETITION_EN ? "Complete Input before opening the Problem Map" : "先完成输入，问题地图才会出现"; return; }
      if (COMPETITION_MODE && mapRequestState === "idle") await requestAiMap(); else renderResult();
    } else if (safeView === "experiment") {
      if (!currentResult || !deepSynthesis || feedback !== "很像") { await showDemoView("question"); $("#selectedCount").textContent = COMPETITION_EN ? "Confirm the Problem Map before opening the action" : "先确认问题地图，再进入小动作"; return; }
      if (COMPETITION_MODE && mapRequestState === "idle") await requestAiMap();
      if (!deepSynthesis) return;
      selectedExperiment = selectedExperiment || normalizeExperiment(deepSynthesis.experiments[0]);
      selectedExperimentOriginal = selectedExperimentOriginal || selectedExperiment;
      showDeskExperiment();
    } else {
      if (!currentResult || !selectedExperiment) { await showDemoView("question"); $("#selectedCount").textContent = COMPETITION_EN ? "Complete the action flow before opening the result" : "先完成小动作流程，再看结果"; return; }
      if (COMPETITION_MODE && mapRequestState === "idle") await requestAiMap();
      if (!deepSynthesis) return;
      selectedExperiment = selectedExperiment || normalizeExperiment(deepSynthesis.experiments[0]);
      selectedExperimentOriginal = selectedExperimentOriginal || selectedExperiment;
      const startDate = addDays(today(), -6);
      activeCycle = {
        id: "active-cycle", cycleKey: "relationship-demo", status: "completed", startDate, endDate: today(),
        topic: COMPETITION_EN ? (competitionCase === "job_search" ? "No job replies became a judgment about ability" : "Fear of a bad answer kept the conversation from starting") : (competitionCase === "job_search" ? "没有求职回复变成了对能力的判决" : "害怕坏答案，所以一直没有开始谈话"), feedback, map: deepSynthesis.map,
        concepts: deepSynthesis.concepts, alternatives: deepSynthesis.alternatives, insight: deepSynthesis.insight, result: currentResult,
        experiment: selectedExperiment, reports: { 3: { title: "三日阶段观察" }, 7: { title: "七日观察报告" } },
        closingFeedback: COMPETITION_EN
          ? competitionCase === "job_search"
            ? { title: "Closing Letter", opening: "Cat read the recorded outcome.", specificWins: [{ text: "You prepared one application change that you controlled.", sourceRefs: [today()] }], learning: "A hiring reply can add information about fit. Silence still cannot settle personal worth.", selfRecognition: "You acted before having a guarantee and kept the external outcome separate from a complete judgment of yourself.", nextChoice: "Use the next real response to update the application, not your value.", completionNote: "No reply, no immediate relief, or still not knowing is information, not failure." }
            : { title: "Closing Letter", opening: "Cat read the recorded outcome.", specificWins: [{ text: "You sent a clear invitation to talk. The reply was only: ‘Saturday works.’", sourceRefs: [today()] }], learning: "You still do not know where the conversation will lead. You no longer have to rely only on guessing.", selfRecognition: "You found that even while afraid, you could take the part you controlled and ask reality for information.", nextChoice: "Go into the conversation with the invitation you already made; do not decide its ending in advance.", completionNote: "The relationship outcome remains unknown. Success here was sending the invitation and receiving one real fact, not getting an ideal answer." }
          : competitionCase === "job_search"
            ? { title: "猫的回信", opening: "猫看完了这次记录。", specificWins: [{ text: "你完成了一处自己能控制的申请调整。", sourceRefs: [today()] }], learning: "招聘回复可以提供匹配信息。沉默仍不能决定你的价值。", selfRecognition: "你没有等到完全确定才做一步，也没有把一次外部结果写成对自己的完整判决。", nextChoice: "下一次用真实回复调整材料，不用它评定自己的价值。", completionNote: "没有回复、情绪没缓解或还不知道，都不是失败。" }
            : { title: "猫的回信", opening: "猫看完了这次记录。", specificWins: [{ text: "你发出了清楚的谈话邀请，对方只回复：‘周六可以聊。’", sourceRefs: [today()] }], learning: "你还不知道谈话会走向哪里。但你已经不用只靠猜了。", selfRecognition: "你发现，即使害怕，你也能主动去确认事实。", nextChoice: "按已经发出的邀请进入谈话，不先替它决定结局。", completionNote: "关系结果仍然未知。这次完成的是自己能控制的邀请，不依赖对方给出理想答案。" }
      };
      if (COMPETITION_EN) await renderCycleDashboard(); else await openJournal();
    }
    applyCompetitionCopy(safeView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function initDemo() {
    document.documentElement.classList.add("demo-mode");
    if (COMPETITION_MODE) {
      document.documentElement.classList.add("competition-mode");
      $(".competition-only")?.classList.remove("hidden");
      $("#demoNav").setAttribute("aria-label", COMPETITION_EN ? "Competition demo navigation" : "比赛演示导航");
    }
    $("#demoNav").classList.remove("hidden");
    $("#historyButton").hidden = true;
    $("#resetButton").hidden = true;
    $("#networkPrivacyButton").hidden = true;
    updateCompetitionStatus();
    $("#demoNav").addEventListener("click", (event) => {
      if (event.target.closest("#demoResetButton")) return resetEverything();
      const view = event.target.closest("[data-demo-view]")?.dataset.demoView;
      if (view) showDemoView(view);
    });
    showDemoView(params.get("view"), { reveal: COMPETITION_MODE ? params.has("view") : true });
  }

  function beginEventInterview(eventChoice, eventText, eventIsSpecific = false) {
    openingNote = eventText || eventChoice;
    openingWasTyped = eventIsSpecific;
    answerNotes = { ENTRY_01: openingNote };
    state.answers.ENTRY_01 = eventChoice ? [eventChoice] : [inferEntry(openingNote)];
    state.answers.TRIGGER_01 = [...state.answers.ENTRY_01];
    currentResult = {
      type: "reflection",
      support: COMPETITION_EN ? "Reflection, not diagnosis" : "自我反思，不是诊断",
      title: COMPETITION_EN ? "One specific event" : "眼前这一件事",
      summary: openingNote,
      evidence: [openingNote],
      alternatives: [],
      pathway: { trigger: openingNote, meaning: missingText(), feeling: missingText(), move: missingText(), result: missingText(), hypothesis: missingText(), unknown: missingText(true) },
      cycle: []
    };
    deepAnswers = [];
    deepSynthesis = null;
    interviewRound = 0;
    interviewSummary = "";
    interviewSummaryConfirmed = false; interviewEditingIndex = -1;
    interviewPartial = false;
    interviewSynthetic = RELATIONSHIP_DEMO;
    interviewFailure = "";
    feedback = null;
    selectedExperiment = null;
    selectedExperimentOriginal = null;
    if (!DEMO_MODE) { try { localStorage.setItem(NETWORK_CONSENT_KEY, "yes"); } catch {} }
    requestNextInterviewQuestion();
  }

  const syntheticInterview = (caseId, round, language = COMPETITION_EN ? "en" : "zh") => {
    const en = language === "en";
    const relationship = [
      { targetField: "meaning", reflection: en ? "You have noticed more distance and have not asked about it yet." : "你注意到关系变疏远了，也还没有开口。", question: en ? "Before you ask, what answer are you most afraid of hearing?" : "没开口之前，你最担心对方会说什么？", options: en ? ["They want to separate", "They no longer care", "I do not know yet"] : ["他说想分开", "他说已经不在乎了", "我还不知道"] },
      { targetField: "feeling", reflection: en ? "You are predicting that the conversation may end the relationship. That has not happened yet." : "你预想谈话可能会让关系结束。这件事目前还没有发生。", question: en ? "When that prediction appears, what feeling is strongest?" : "想到这个结果时，最明显的感受是什么？", options: en ? ["Fear", "Sadness", "No clear feeling"] : ["害怕", "难过", "没有明显感受"] },
      { targetField: "move", reflection: en ? "Fear is the clearest feeling you named." : "你说得最清楚的是害怕。", question: en ? "What has that fear led you to do or not do?" : "这个害怕让你做了什么，或者没有做什么？", options: en ? ["Avoid the conversation", "Analyze it alone", "No action taken"] : ["回避这次谈话", "自己反复分析", "没有采取行动"] },
      { targetField: "result", reflection: en ? "You have held back from the conversation and kept analyzing it alone." : "你没有开始谈话，而是自己反复分析。", question: en ? "What did that change right away, and what happened later?" : "这样做当下带来了什么，后来又怎样？", options: en ? ["Brief relief, then more guessing", "No new information", "I do not know yet"] : ["当下轻松一点，后来猜得更多", "一直没有得到新信息", "我还不知道"] }
    ];
    const jobs = [
      { targetField: "meaning", reflection: en ? "You sent applications and received no replies." : "你投出了简历，也没有收到回复。", question: en ? "What did the silence start to mean to you?" : "这些沉默让你开始怎样理解自己或这件事？", options: en ? ["My ability is not enough", "The roles may not fit", "I do not know yet"] : ["我的能力不行", "岗位可能不匹配", "我还不知道"] },
      { targetField: "feeling", reflection: en ? "You started reading the silence as a judgment of your ability." : "你开始把沉默理解成对自己能力的判断。", question: en ? "What feeling followed that interpretation?" : "有了这个解释后，最明显的感受是什么？", options: en ? ["Anxious", "Ashamed", "No clear feeling"] : ["焦虑", "自卑", "没有明显感受"] },
      { targetField: "move", reflection: en ? "Anxiety and shame followed that judgment." : "这个判断之后，你感到焦虑和自卑。", question: en ? "What did you do or stop doing next?" : "接下来你做了什么，或者停止做了什么？", options: en ? ["Stopped applying", "Kept checking replies", "No action taken"] : ["停止继续投递", "反复查看回复", "没有采取行动"] },
      { targetField: "result", reflection: en ? "You stopped applying after the silence felt like a verdict." : "沉默像一份判决时，你停止了继续投递。", question: en ? "What changed right away, and what happened later?" : "停止投递后，当下怎样，后来又怎样？", options: en ? ["Brief relief, then more anxiety", "No new information", "I do not know yet"] : ["当下轻松，后来更焦虑", "没有得到新信息", "我还不知道"] }
    ];
    const item = (caseId === "job_search" ? jobs : relationship)[Math.min(round - 1, 3)];
    return { ...item, options: item.options.map((label, index) => ({ id: /不知道|do not know/i.test(label) ? "unknown" : `option_${index + 1}`, label })), readyForMap: false };
  };

  function renderInterviewLoading() {
    setMapScene(false);
    hideDeskViews();
    $("#resultPanel").classList.add("hidden");
    $("#questionPanel").classList.add("hidden");
    $("#followupPanel").classList.remove("hidden", "interview-error");
    $("#followupKicker").textContent = COMPETITION_EN ? `LIVE AI · QUESTION ${Math.min(interviewRound + 1, 8)}` : `实时 AI · 第 ${Math.min(interviewRound + 1, 8)} 问`;
    $(".followup-mark").textContent = COMPETITION_EN ? "Cat" : "猫";
    $("#followupBackButton span").textContent = COMPETITION_EN ? "Back" : "上一题";
    $("#followupReflection").textContent = COMPETITION_EN ? "Here is what Cat heard so far." : "猫先把你刚才说的放在这里。";
    $("#followupTitle").textContent = COMPETITION_EN ? "One more thing" : "猫先停一下，看看刚才还缺哪一点";
    $("#followupHint").textContent = COMPETITION_EN ? "Only this event and your confirmed answers are being sent." : "只发送这件事和你已经确认的回答。";
    $("#followupOptions").innerHTML = "";
    $("#followupNextButton").classList.add("hidden");
    $("#finishFollowupsButton").classList.add("hidden");
    $("#followupNote").closest(".free-note-wrap").classList.add("hidden");
    updateCompetitionStatus();
  }

  function renderInterviewFailure() {
    $("#followupPanel").classList.add("interview-error");
    $("#followupKicker").textContent = COMPETITION_EN ? "LIVE AI UNAVAILABLE" : "实时 AI 暂不可用";
    $("#followupReflection").textContent = COMPETITION_EN ? "No fixed question has been shown." : "尚未显示固定问题。";
    $("#followupTitle").textContent = COMPETITION_EN ? "Live response is unavailable. Continue with a labeled synthetic example?" : "实时回答暂时不可用。要继续查看标注清楚的合成示例吗？";
    $("#followupHint").textContent = COMPETITION_EN ? "The model, API, or network request failed. The app did not switch sources." : interviewFailure;
    const options = $("#followupOptions"); options.innerHTML = "";
    const retry = document.createElement("button"); retry.type = "button"; retry.className = "followup-option"; retry.textContent = COMPETITION_EN ? "Retry Live AI" : "重试实时 AI"; retry.addEventListener("click", requestNextInterviewQuestion);
    const fallback = document.createElement("button"); fallback.type = "button"; fallback.className = "followup-option"; fallback.textContent = COMPETITION_EN ? "Continue with synthetic example" : "继续查看合成示例"; fallback.addEventListener("click", () => { interviewSynthetic = true; mapRequestState = "synthetic"; renderInterviewQuestion(syntheticInterview(competitionCase, interviewRound + 1)); });
    options.append(retry, fallback);
    if (!HOSTED_COMPETITION) {
      const setup = document.createElement("a"); setup.className = "api-key-link followup-api-link"; setup.href = "/api-setup.html"; setup.textContent = COMPETITION_EN ? "Add API key" : "添加 API 密钥"; options.append(setup);
    }
    $("#followupNextButton").classList.add("hidden");
    $("#finishFollowupsButton").classList.add("hidden");
    $("#followupNote").closest(".free-note-wrap").classList.add("hidden");
    updateCompetitionStatus();
  }

  async function requestNextInterviewQuestion({ retry = false } = {}) {
    const missing = ["meaning", "feeling", "move", "result"].find((field) => !deepAnswers.some((answer) => answer.targetField === field));
    if (interviewRound >= 8) return missing ? renderRequiredGap(missing) : renderUserSummaryPrompt();
    if (interviewSynthetic) return interviewRound >= 4 ? (missing ? renderRequiredGap(missing) : renderUserSummaryPrompt()) : renderInterviewQuestion(syntheticInterview(competitionCase, interviewRound + 1));
    renderInterviewLoading();
    mapRequestState = "loading";
    try {
      const data = await postJson("/api/map/followups", {
        topic: deepTopic(), event: openingNote, eventChoice: state.answers.ENTRY_01?.[0] || "", eventIsSpecific: openingWasTyped, priorAnswers: deepAnswers,
        round: interviewRound + 1, language: COMPETITION_EN ? "en" : "zh", safetyRisk: false
      });
      const duplicateQuestion = deepAnswers.some((answer) => String(answer.question || "").replace(/[\s?？]/g, "").toLowerCase() === String(data.question || "").replace(/[\s?？]/g, "").toLowerCase());
      const repeatedField = deepAnswers.some((answer) => answer.targetField === data.targetField);
      const usefulSecondPass = data.targetField === "meaning" && ["counterevidence", "alternative"].includes(data.mode) && !deepAnswers.some((answer) => answer.mode === data.mode);
      if (duplicateQuestion || (repeatedField && !usefulSecondPass)) return missing ? renderRequiredGap(missing) : renderUserSummaryPrompt();
      if (data.readyForMap && deepAnswers.length >= 2) {
        const requiredGap = ["meaning", "feeling", "move", "result"].find((field) => !deepAnswers.some((answer) => answer.targetField === field));
        if (requiredGap) return renderRequiredGap(requiredGap);
        return renderUserSummaryPrompt();
      }
      interviewQuestion = data;
      mapRequestState = "ready";
      renderInterviewQuestion(data);
    } catch (error) {
      if (!retry && /校验|JSON|格式|下一问|invalid|validation/i.test(String(error.message))) return requestNextInterviewQuestion({ retry: true });
      interviewFailure = classifyApiError(error.message);
      mapRequestState = "fallback-offered";
      renderInterviewFailure();
    }
  }

  function renderUserSummaryPrompt() {
    interviewQuestion = { mode: "user_summary", question: COMPETITION_EN ? "What do you see more clearly in this one event now?" : "这次具体的事，你现在看见了什么？", options: [] };
    setMapScene(false); hideDeskViews(); $("#resultPanel").classList.add("hidden"); $("#questionPanel").classList.add("hidden"); $("#followupPanel").classList.remove("hidden", "interview-error");
    $("#followupKicker").textContent = COMPETITION_EN ? "YOUR OWN SUMMARY" : "先由你总结";
    $(".followup-mark").textContent = COMPETITION_EN ? "Cat" : "猫";
    $("#followupReflection").textContent = COMPETITION_EN ? "Write it first. Cat will reflect it back." : "先由你写，猫只把你的话短短复述一遍。";
    $("#followupTitle").textContent = interviewQuestion.question;
    $("#followupHint").textContent = COMPETITION_EN ? "One or two sentences is enough. There is no right answer." : "写一两句就够了，没有标准答案。";
    $("#followupOptions").innerHTML = "";
    const freeWrap = $("#followupNote").closest(".free-note-wrap"); freeWrap.classList.remove("hidden"); freeWrap.querySelector("label").textContent = COMPETITION_EN ? "Write it in your own words" : "用你自己的话写";
    $("#followupNote").value = ""; $("#followupNote").placeholder = COMPETITION_EN ? "I noticed…" : "我看见……";
    $("#followupNextButton").classList.remove("hidden"); $("#followupNextButton").disabled = true; $("#followupNextButton span").textContent = COMPETITION_EN ? "Continue" : "继续";
    $("#finishFollowupsButton").classList.add("hidden"); updateCompetitionStatus();
  }

  function renderRequiredGap(field) {
    const en = COMPETITION_EN;
    const copy = {
      meaning: { reflection: en ? "We still need the interpretation you made about this event." : "还需要说清楚，你当时把这件事理解成了什么。", question: en ? "What did this event seem to mean to you at the time?" : "当时你觉得，这件事说明了什么？", options: en ? ["The situation may have changed", "I needed more information", "I do not know yet"] : ["情况可能发生了变化", "我当时需要更多信息", "我还不知道"] },
      feeling: { reflection: en ? "We have the event and your judgment, but not how it felt." : "事情和想法有了，还没说到你的感受。", question: en ? "When you thought that, what did you feel?" : "这样想的时候，你有什么感受？", options: en ? ["Anxious or tense", "Sad or discouraged", "I do not know yet"] : ["焦虑或紧张", "失落或泄气", "我还不知道"] },
      move: { reflection: en ? "We have not heard what you did or stopped doing yet." : "刚才还没有说到你做了什么，或者停下了什么。", question: en ? "What did you do or stop doing next?" : "接下来你做了什么，或者停止了什么？", options: en ? ["I took one concrete action", "I did not take an action", "I do not know yet"] : ["我做了一个具体动作", "我没有采取行动", "我还不知道"] },
      result: { reflection: en ? "The immediate and later result is still missing." : "当下和后来的结果还没有说到。", question: en ? "What changed right away, and what happened later?" : "这样做当下带来了什么，后来又怎样？", options: en ? ["Something changed over time", "There was no clear change", "I do not know yet"] : ["前后出现了一些变化", "没有明显变化", "我还不知道"] }
    }[field];
    const modes = { meaning: "question", feeling: "feeling", move: "action", result: "result" };
    renderInterviewQuestion({ ...copy, targetField: field, mode: modes[field], options: copy.options.map((label, i) => ({ id: /不知道|do not know/i.test(label) ? "unknown" : `gap_${i + 1}`, label })) });
  }

  function renderSummaryConfirmation() {
    interviewQuestion = { mode: "summary_confirm", question: COMPETITION_EN ? "Does Cat's short reflection sound right?" : "猫这样理解，对吗？", options: [{ id: "yes", label: COMPETITION_EN ? "Yes, that's it" : "听对了" }, { id: "edit", label: COMPETITION_EN ? "Not quite, let me edit" : "不完全对，我改一下" }] };
    $("#followupKicker").textContent = COMPETITION_EN ? "CHECK TOGETHER" : "一起核对";
    $("#followupReflection").textContent = COMPETITION_EN ? `You wrote: “${interviewSummary}”` : `你写的是：“${interviewSummary}”`;
    $("#followupTitle").textContent = interviewQuestion.question; $("#followupHint").textContent = COMPETITION_EN ? "Cat won’t add anything you didn’t say." : "猫不会替你加上没有写出的结论。";
    const options = $("#followupOptions"); options.innerHTML = ""; selectedFollow = null;
    interviewQuestion.options.forEach((option) => { const b = document.createElement("button"); b.type = "button"; b.className = "followup-option"; b.textContent = option.label; b.addEventListener("click", () => { selectedFollow = selectedFollow === option.id ? null : option.id; [...options.children].forEach((x) => x.classList.toggle("selected", x === b && selectedFollow === option.id)); $("#followupNextButton").disabled = !selectedFollow; }); options.append(b); });
    $("#followupNote").closest(".free-note-wrap").classList.add("hidden"); $("#followupNextButton span").textContent = COMPETITION_EN ? "Use this summary" : "用这段总结"; $("#followupNextButton").disabled = true;
  }

  function renderInterviewQuestion(question) {
    interviewQuestion = question;
    setMapScene(false);
    hideDeskViews();
    $("#resultPanel").classList.add("hidden");
    $("#questionPanel").classList.add("hidden");
    $("#followupPanel").classList.remove("hidden", "interview-error");
    $("#followupKicker").textContent = interviewSynthetic ? (COMPETITION_EN ? `SYNTHETIC EXAMPLE · QUESTION ${interviewRound + 1}` : `合成示例 · 第 ${interviewRound + 1} 问`) : (COMPETITION_EN ? `LIVE AI · QUESTION ${interviewRound + 1}` : `实时 AI · 第 ${interviewRound + 1} 问`);
    $(".followup-mark").textContent = COMPETITION_EN ? "Cat" : "猫";
    $("#followupBackButton span").textContent = COMPETITION_EN ? "Back" : "上一题";
    $("#followupReflection").textContent = safeVisible(question.reflection, true);
    $("#followupTitle").textContent = safeVisible(question.question, true);
    $("#followupHint").textContent = COMPETITION_EN ? "Choose the closest answer, or say it in your own words." : "选一个最接近的。也可以按自己的话说。";
    const options = $("#followupOptions"); options.innerHTML = "";
    selectedFollow = null;
    (question.options || []).forEach((option) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "followup-option"; button.textContent = safeVisible(option.label, true); button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => { selectedFollow = selectedFollow === option.id ? null : option.id; [...options.children].forEach((item) => { const active = item === button && selectedFollow === option.id; item.classList.toggle("selected", active); item.setAttribute("aria-pressed", String(active)); }); $("#followupNextButton").disabled = !selectedFollow && !$("#followupNote").value.trim(); });
      options.append(button);
    });
    const freeWrap = $("#followupNote").closest(".free-note-wrap"); freeWrap.classList.remove("hidden");
    freeWrap.querySelector("label").textContent = COMPETITION_EN ? "None of these fit. I’ll write my own." : "都不太像，我自己说";
    const savedAnswer = String(question.savedAnswer || "");
    const savedOption = (question.options || []).find((option) => option.label === savedAnswer);
    selectedFollow = savedOption?.id || null;
    [...options.children].forEach((item, index) => item.classList.toggle("selected", Boolean(savedOption && question.options[index].id === savedOption.id)));
    $("#followupNote").value = savedOption ? "" : savedAnswer;
    $("#followupNote").placeholder = "";
    $("#followupNextButton").classList.remove("hidden");
    $("#followupNextButton").disabled = true;
    $("#followupNextButton span").textContent = COMPETITION_EN ? "Send this answer" : "发送这条回答";
    $("#finishFollowupsButton").classList.add("hidden");
    updateCompetitionStatus();
  }

  async function finishInterviewMap({ partial = false } = {}) {
    interviewPartial = Boolean(partial || deepAnswers.length < 4);
    mapReturnView = "question";
    if (interviewSynthetic) {
      const base = COMPETITION_EN ? competitionSynthesis(competitionCase) : competitionSynthesisZh(competitionCase);
      if (interviewPartial) {
        const byField = Object.fromEntries(deepAnswers.filter((answer) => answer.targetField).map((answer) => [answer.targetField, answer.unknown ? missingText(true) : answer.answer]));
        const canGuess = Boolean(byField.meaning && byField.move && !semanticMissing.test(byField.meaning) && !semanticMissing.test(byField.move));
        base.map = {
          fact: openingNote,
          meaning: byField.meaning || missingText(), feeling: byField.feeling || missingText(), move: byField.move || missingText(), result: byField.result || missingText(),
          hypothesis: canGuess ? base.map.hypothesis : missingText(), unknown: missingText(true)
        };
        base.mapSources = Object.fromEntries(Object.keys(base.map).map((key) => [key, key === "fact" ? ["ENTRY_01"] : deepAnswers.filter((answer) => answer.targetField === key).map((answer) => answer.id)]));
        base.insight = COMPETITION_EN ? "Cat organized only what you have said so far. Unasked parts stay marked. You decide whether to continue." : "猫只整理了你已经说到的部分。还没问到的地方继续标着，由你决定要不要继续。";
      }
      deepSynthesis = base;
      mapRequestState = "synthetic";
      deepDiveEnhanced = false;
      return renderResult();
    }
    await requestAiMap();
  }

  async function startDeepBatch() {
    const correction = $("#mapCorrection")?.value.trim();
    if (correction) {
      if (hasSafetyLanguage(correction)) { $("#saveStatus").textContent = "这段补充可能关系到安全，请先使用现实支持。"; return; }
      deepAnswers.push({ id: "USER_CORRECTION", question: "用户对问题地图的修正", answer: "用户主动补充", note: correction });
      $("#mapCorrection").value = "";
    }
    $("#continueDeepButton").disabled = true;
    deepDiveDismissed = false;
    $("#saveStatus").textContent = "猫正在根据当前地图的缺口准备 3 道补充题……";
    const topic = deepTopic();
    try {
      const data = await postJson("/api/map/followups", { topic, result: currentResult, map: deepSynthesis?.map, evidenceGaps: deepSynthesis?.evidenceGaps, note: openingNote, notes: answerNotes, priorAnswers: deepAnswers, safetyRisk: currentResult.type !== "reflection" });
      deepQuestions = data.questions;
    } catch (error) {
      deepQuestions = fallbackQuestions(topic).questions;
      $("#saveStatus").textContent = "当前未连接到 AI 服务，先使用本地补充题；稍后仍可联网重新生成地图。";
    }
    deepIndex = 0; selectedFollow = null;
    $("#continueDeepButton").disabled = false;
    renderFollowup();
  }

  function renderFollowup() {
    const question = deepQuestions[deepIndex];
    setMapScene(false);
    $("#followupPanel .question-sheet-content").scrollTop = 0;
    $("#followupPanel").classList.remove("is-synthesizing");
    $("#resultPanel").classList.add("hidden");
    $("#questionPanel").classList.add("hidden");
    $("#followupPanel").classList.remove("hidden");
    $("#followupKicker").textContent = `深挖问题 ${deepIndex + 1} / ${deepQuestions.length}`;
    $("#followupTitle").textContent = question.title;
    $("#followupHint").textContent = question.hint;
    $("#followupOptions").innerHTML = "";
    selectedFollow = null;
    $("#followupNote").value = "";
    question.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "followup-option"; button.textContent = option.label;
      button.addEventListener("click", () => {
        selectedFollow = selectedFollow === option.id ? null : option.id;
        [...$("#followupOptions").children].forEach((item) => item.classList.toggle("selected", item === button && selectedFollow === option.id));
        $("#followupNextButton").disabled = !selectedFollow && !$("#followupNote").value.trim();
      });
      $("#followupOptions").append(button);
    });
    $("#followupNextButton").disabled = true;
    $("#followupNextButton span").textContent = deepIndex === deepQuestions.length - 1 ? "请猫整理补充回答" : "下一道补充题";
  }

  async function synthesizeDeepDive() {
    $("#followupPanel").classList.add("is-synthesizing");
    $("#followupTitle").textContent = "猫正在根据补充回答更新问题地图";
    $("#followupHint").textContent = "这会形成可修改的工作假设，不会宣布唯一根因。";
    $("#followupOptions").innerHTML = "";
    $("#followupNextButton").disabled = true;
    const topic = deepTopic();
    const previousMap = { ...(deepSynthesis?.map || {}) };
    try {
      deepSynthesis = DEMO_MODE ? fallbackSynthesis(topic) : await postJson("/api/map/analyze", { topic, result: currentResult, stateAnswers: state.answers, note: openingNote, notes: answerNotes, answers: deepAnswers, currentMap: previousMap, safetyRisk: currentResult.type !== "reflection" });
    } catch (error) {
      deepSynthesis = deepSynthesis || fallbackSynthesis(topic);
      deepDiveEnhanced = false;
      mapRequestState = "local";
      deepUpdatedFields = [];
      deepUpdateSummary = "补充回答还留在当前会话。本地地图继续可用；联网恢复后可以带上这些回答重新生成。";
      renderResult();
      return;
    }
    deepUpdatedFields = Object.keys(mapLabels).filter((key) => String(previousMap[key] || "") !== String(deepSynthesis.map?.[key] || ""));
    deepUpdateSummary = deepUpdatedFields.length ? `根据刚才的回答，更新了：${deepUpdatedFields.map((key) => mapLabels[key]).join("、")}。一句话总结和详细字段都已更新。` : "刚才的回答已经重新核对过。目前的信息没有改变原来的判断，所以地图暂时保持不变。";
    deepDiveEnhanced = true;
    $("#followupNote").value = "";
    selectedExperiment = null;
    selectedExperimentOriginal = null;
    feedback = null;
    renderResult();
  }

  const mapLabels = { fact: "发生了什么", meaning: "我当时怎么想", feeling: "我有什么感受", move: "我做了什么 / 没做什么", result: "结果怎样（当下 / 后来）", hypothesis: "猫的猜想，等你判断", unknown: "还不知道" };
  const competitionMapLabels = { fact: "What happened", meaning: "What I thought", feeling: "What I felt", move: "What I did or did not do", result: "What happened right away and later", hypothesis: "Cat's guess (you decide)", unknown: "Still unknown" };
  const sourceLabels = { ENTRY_01: "发生的线索", UNDERSTANDING_01: "你的纠正", MEANING_01: "当时怎样解释", FEELING_01: "当时的感受", LOOP_01: "做了或没有做", PAYOFF_01: "短期结果", COST_01: "稍后结果", PATTERN_01: "是否重复", USER_CORRECTION: "你的修正" };
  const sourceText = (refs = []) => refs.map((ref) => {
    if (sourceLabels[ref]) return sourceLabels[ref];
    const answer = deepAnswers.find((item) => item.id === ref);
    return answer?.answer ? `你的回答“${answer.answer.slice(0, 28)}${answer.answer.length > 28 ? "…" : ""}”` : "这次谈话中的回答";
  }).filter((value, index, list) => list.indexOf(value) === index).slice(0, 2).join("、");

  function renderDeepResult() {
    const alternatives = $("#alternativesList"); alternatives.innerHTML = "";
    alternatives.classList.toggle("hidden", COMPETITION_MODE);
    if (deepSynthesis.alternatives?.length) {
      const title = document.createElement("h3"); title.textContent = COMPETITION_EN ? "Other explanations remain possible" : "也可能不是这样"; alternatives.append(title);
      deepSynthesis.alternatives.forEach((text) => { const item = document.createElement("p"); item.textContent = text; alternatives.append(item); });
    }
    const fields = $("#deepMapFields"); fields.innerHTML = "";
    Object.entries(mapLabels).forEach(([key, label], index) => {
      const wrap = document.createElement("div"); wrap.className = `deep-map-field map-field-${key} ${["hypothesis", "unknown"].includes(key) ? "map-after-layer" : "map-chain-node"}`;
      if (deepUpdatedFields.includes(key)) wrap.classList.add("just-updated");
      const visibleLabel = COMPETITION_EN ? competitionMapLabels[key] : label;
      const title = document.createElement("label"); title.htmlFor = `map-${key}`; title.textContent = `${index < 5 ? `${index + 1}. ` : ""}${visibleLabel}`;
      const input = document.createElement("textarea"); input.id = `map-${key}`; input.dataset.mapKey = key; input.maxLength = 240; input.value = safeVisible(deepSynthesis.map[key], key === "fact" || key === "unknown" || answeredFields().has(key));
      if (deepUpdatedFields.includes(key)) { const changed = document.createElement("span"); changed.className = "map-updated-label"; changed.textContent = COMPETITION_EN ? "Changed to your words" : "按你的话改了"; wrap.append(changed); }
      input.addEventListener("change", () => saveObservation({ silent: true }).catch(() => {}));
      wrap.append(title, input); fields.append(wrap);
    });
    const concepts = $("#conceptList"); concepts.innerHTML = "";
    (deepSynthesis.concepts || []).forEach((concept) => {
      const item = document.createElement("article"); item.className = "concept-item";
      const name = document.createElement("strong"); name.textContent = concept.name;
      const level = document.createElement("span"); level.className = "concept-level"; level.textContent = concept.level;
      const detail = document.createElement("p"); detail.textContent = `${concept.explanation} 依据：${concept.evidence || "尚不足"}；还缺：${concept.missing || "更多事件记录"}`;
      item.append(name, level, detail); concepts.append(item);
    });
    const experiments = (deepSynthesis.experiments || []).slice(0, 1).map(normalizeExperiment);
    if (!experiments.length) experiments.push(normalizeExperiment(fallbackSynthesis(deepTopic()).experiments[0]));
    deepSynthesis.experiments = experiments;
    const options = $("#experimentOptions"); options.innerHTML = "";
    experiments.forEach((experiment) => {
      const button = document.createElement("button"); button.type = "button"; button.className = `experiment-option ${selectedExperiment?.id === experiment.id ? "selected" : ""}`;
      const title = document.createElement("strong"); title.textContent = experiment.title;
      const description = document.createElement("span"); description.textContent = COMPETITION_EN ? `${experiment.action} Look for: ${experiment.observableOutcome}` : `${experiment.action} 判据：${experiment.observableOutcome}`;
      button.append(title, description);
      button.addEventListener("click", () => {
        selectedExperimentOriginal = normalizeExperiment(experiment);
        selectedExperiment = fillExperimentForm(selectedExperimentOriginal);
        $("#restoreExperimentButton").classList.add("hidden");
        [...options.children].forEach((item) => item.classList.toggle("selected", item === button));
        $("#startCycleButton").disabled = !experimentReady();
        saveObservation({ silent: true }).catch(() => {});
      });
      options.append(button);
    });
    if (selectedExperiment) selectedExperiment = fillExperimentForm(selectedExperiment);
    else {
      ["#experimentPrediction", "#experimentAction", "#experimentOutcome", "#experimentContinue", "#experimentFallback", "#experimentMeaning"].forEach((selector) => { $(selector).value = ""; });
      $("#experimentFields").classList.add("hidden");
    }
    $("#restoreExperimentButton").classList.toggle("hidden", !selectedExperiment?.userEditedFields?.length);
    $("#startCycleButton").disabled = !experimentReady();
    const answeredQuestions = deepAnswers.filter((item) => item.id?.startsWith("ROUND_")).length;
    $("#continueDeepButton").disabled = answeredQuestions >= 4;
    $("#continueDeepButton").textContent = COMPETITION_EN ? (answeredQuestions >= 4 ? "That’s enough for now" : "Ask one more question") : (answeredQuestions >= 4 ? "这次先问到这里" : "继续问清楚");
    $("#mapCorrectionWrap").classList.toggle("hidden", !["有一点像", "不太像"].includes(feedback));
  }

  function showDeskExperiment({ editCycle = false } = {}) {
    editingCycleExperiment = Boolean(editCycle && activeCycle);
    if (editingCycleExperiment) {
      selectedExperimentOriginal = normalizeExperiment(activeCycle.experiment?.aiOriginal || activeCycle.experiment);
      selectedExperiment = fillExperimentForm(activeCycle.experiment);
    }
    setMapScene(false);
    hideDeskViews();
    $("#resultPanel").classList.add("hidden");
    $("#deskStatePanel").classList.remove("hidden");
    document.querySelectorAll(".journey-step").forEach((section) => section.classList.add("hidden"));
    $("#experimentStep").classList.remove("hidden");
    $("#cycleDashboard").classList.add("hidden");
    setHero("report");
    if (deepSynthesis) renderDeepResult();
    $("#rememberForCat").checked = rememberForCat;
    $("#startCycleButton").disabled = !experimentReady();
    $("#startCycleButton").textContent = editingCycleExperiment ? "保存实验调整" : "确认这张实验卡";
    $("#cancelCycleExperimentButton").classList.toggle("hidden", !editingCycleExperiment);
    $("#saveStatus").textContent = editingCycleExperiment ? "修改会从今天起生效，之前的记录仍保留原实验版本。" : "";
    $("#stepLabel").textContent = editingCycleExperiment ? "调整当前小实验" : "问题地图已确认 · 整理一个小实验";
    $("#progressBar").style.width = "100%";
    $("#selectedCount").textContent = rememberForCat ? "已选择留给小猫" : "这次不会自动保存";
    if (COMPETITION_EN) {
      $("#sceneLabel").textContent = "ONE SMALL ACTION";
      $("#heroTitle").textContent = "Cat has a guess. You decide what to test.";
      $("#heroDescription").textContent = "Start with an action you control. Cat offers a draft only if you ask.";
      $("#stepLabel").textContent = "ACTION";
      $("#selectedCount").textContent = "Nothing saved";
      $("#experimentStep .result-step").textContent = "PROBLEM MAP CONFIRMED · ONE SMALL ACTION";
      $("#experimentStep h2").textContent = "What small step could give you new information?";
      $("#experimentStep > p").textContent = "Choose something you control and can stop at any time. The outcome does not need to be ideal.";
      $("#experimentProposal").previousElementSibling.textContent = "Write the first step you would try";
      $("#experimentProposal").placeholder = "One small action";
      $("#experimentProposal").nextElementSibling.textContent = "Keep it within your control. You can stop at any time. It should give you new information.";
      $("#useOwnExperimentButton").textContent = "Check this action";
      $("#showCatSuggestionButton").textContent = "I can’t think of one yet";
      const labels = ["Original worry", "What I’ll do", "What I’ll look for", "Keep going if", "Stop if", "What each result might mean", "Can I do this now?"];
      document.querySelectorAll("#experimentFields > label:not(.remember-choice)").forEach((node, index) => { node.textContent = labels[index] || node.textContent; });
      $("#experimentTiming").options[0].textContent = "Do it now"; $("#experimentTiming").options[1].textContent = "Schedule it"; $("#experimentTiming").options[2].textContent = "Not now";
      $("#needsPattern").closest("label").classList.add("hidden");
      $("#rememberForCat").closest("label").classList.add("hidden");
      $("#experimentFields > small").classList.add("hidden");
      $("#startCycleButton").textContent = editingCycleExperiment ? "Save changes" : "Use this plan";
      $("#deskExperimentMapButton").textContent = "Back to Problem Map";
    }
    mapReturnView = "experiment";
  }

  function showJourneyStep(id) {
    setMapScene(false);
    hideDeskViews();
    $("#resultPanel").classList.add("hidden");
    $("#deskStatePanel").classList.remove("hidden");
    $("#experimentStep").classList.add("hidden");
    $("#cycleDashboard").classList.add("hidden");
    document.querySelectorAll(".journey-step").forEach((section) => section.classList.toggle("hidden", section.id !== id));
    $(".desk-state-content").scrollTop = 0;
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function startActionBranch() {
    selectedExperiment = experimentFromForm();
    if (!selectedExperiment || !experimentReady()) return;
    if (selectedExperiment.needsPattern && !DEMO_MODE) return startCycle();
    if (selectedExperiment.timing === "later") {
      $("#todoSummary").textContent = `${selectedExperiment.when || missingText(true)}，在“${selectedExperiment.context || missingText(true)}”做：${selectedExperiment.action}`;
      if (COMPETITION_EN) { $("#todoStep .result-step").textContent = "SCHEDULE IT"; $("#todoStep h2").textContent = "Choose when and where you’ll do it."; $("#todoSummary").textContent = `${selectedExperiment.when || missingText(true)}, in ${selectedExperiment.context || missingText(true)}: ${selectedExperiment.action}`; $("#copyTodoButton").textContent = "Copy task"; $("#todoDoneButton").textContent = "Come back after I try it"; $("#todoEndButton").textContent = "Stop here today"; }
      return showJourneyStep("todoStep");
    }
    if (selectedExperiment.timing === "not_now") { if (COMPETITION_EN) { $("#blockedStep .result-step").textContent = "NOT NOW"; $("#blockedStep h2").textContent = "This step may still be too large, or not right for now."; $("#blockedPart").previousElementSibling.textContent = "Where did you stop?"; $("#shrinkFromBlockButton").textContent = "Make the action smaller"; $("#blockedEndButton").textContent = "Stop here today"; } return showJourneyStep("blockedStep"); }
    $("#actionPreparation").value = "";
    showJourneyStep("actionWaitStep");
    if (COMPETITION_EN) {
      $("#actionWaitStatus").textContent = "DO IT NOW";
      $("#actionWaitTitle").textContent = "Cat is here while you do it.";
      $("#actionWaitCopy").textContent = "When you are done, tell Cat only what actually happened.";
      $("#actionPreparation").previousElementSibling.textContent = "A quick note for this step (not saved)";
      $("#actionDoneButton").textContent = "I did it"; $("#actionNotDoneButton").textContent = "I did not do it"; $("#actionShrinkButton").textContent = "Make the action smaller";
    }
  }

  function openObservation() {
    $("#observationPrediction").textContent = safeVisible(selectedExperiment?.prediction, true);
    $("#observationActual").value = actionOutcome;
    cognitiveUpdate = "";
    document.querySelectorAll('input[name="cognitiveUpdate"]').forEach((input) => { input.checked = false; });
    $("#observationStatus").textContent = "";
    showJourneyStep("observationStep");
    if (COMPETITION_EN) {
      $("#observationStep .result-step").textContent = "OBSERVE AND UPDATE";
      $("#observationStep h2").textContent = "Compare your original worry with what actually happened.";
      $("#observationPrediction").previousElementSibling.textContent = "Original worry";
      $("#observationActual").previousElementSibling.textContent = "What actually happened";
      $(".update-choices legend").textContent = "How does the original worry look now?";
      const choices = ["This time matched what I feared", "Some parts matched and some did not", "This time did not match what I feared", "It is still too early to tell", "I want to write my own view"];
      document.querySelectorAll('.update-choices input[name="cognitiveUpdate"]').forEach((input, index) => { input.parentElement.lastChild.textContent = ` ${choices[index]}`; });
      $("#cognitiveUpdateCustomLabel").textContent = "My view now";
      $("#finishObservationButton").textContent = "Review what this changes";
    }
  }

  function showJourneyClosing({ pending = false } = {}) {
    const actual = pending ? missingText(true) : safeVisible($("#observationActual").value, true);
    const custom = $("#cognitiveUpdateCustom").value.trim();
    const updateLabels = COMPETITION_EN
      ? { same: "This time matched what I feared.", mixed: "Some parts matched and some did not.", different: "This time did not match what I feared.", unknown: "It is still too early to tell.", custom }
      : { same: "这次发生的和我担心的一样。", mixed: "有一部分一样，也有不同。", different: "这次发生的和我担心的不一样。", unknown: "现在还看不出来。", custom };
    const update = pending ? missingText(true) : safeVisible(updateLabels[cognitiveUpdate], true);
    const controllableOnly = !pending && /已发|发送|写完|完成|did|sent|prepared/i.test(actual) && /还没|等待|未知|unknown|wait/i.test(actual);
    const summary = pending
      ? (COMPETITION_EN ? "No action was required today. The map can stay here." : "今天不必勉强行动。这张地图可以先放在这里。")
      : controllableOnly
        ? (COMPETITION_EN ? "You completed the part you could decide. The external response still has to come from reality." : "你已经完成了自己能决定的部分。对方怎样回应，还要等现实给出信息。")
        : (COMPETITION_EN ? `You completed one controllable action and used what happened to update your judgment: ${update}` : `你完成了一个自己能决定的动作，也按实际发生更新了判断：${update}`);
    $("#journeyOriginal").textContent = safeVisible(selectedExperiment?.prediction || deepSynthesis?.map?.meaning, true);
    $("#journeyActual").textContent = actual;
    $("#journeyUpdate").textContent = update;
    $("#journeyUnknown").textContent = safeVisible(deepSynthesis?.map?.unknown, true);
    $("#journeySummary").textContent = summary;
    $("#journeySaveNote").textContent = COMPETITION_MODE ? (COMPETITION_EN ? "Competition mode does not save data." : "比赛模式始终不保存数据。") : "只保存你确认过的地图、实验、实际行动、观察和总结，不保存完整对话。";
    showJourneyStep("journeyClosingStep");
    if (COMPETITION_EN) {
      $("#journeyClosingStep .result-step").textContent = "REFLECTION COMPLETE";
      $("#journeyClosingStep h2").textContent = "That’s enough for now.";
      const labels = ["Original judgment", "What actually happened", "My view now", "Still unknown", "Cat's summary"];
      document.querySelectorAll(".closing-summary-list dt").forEach((node, index) => { node.textContent = labels[index]; });
      $(".save-choices legend").textContent = "Save anything from this session?";
      const saves = ["Save this with Cat", "Don’t save", "Come back after I try it"];
      document.querySelectorAll('.save-choices input[name="journeySave"]').forEach((input, index) => { input.parentElement.lastChild.textContent = ` ${saves[index]}`; });
      $("#journeyClosingLine").textContent = "That’s enough for today. If this comes up again, Cat will be here.";
      $("#finishJourneyButton").textContent = pending ? "End this reflection" : "Finish";
    }
  }

  async function saveCycleExperiment() {
    if (!activeCycle || !experimentReady()) { $("#saveStatus").textContent = "请至少写清行动和可观察判据。"; return; }
    const previous = normalizeExperiment(activeCycle.experiment);
    const next = experimentFromForm();
    const changed = ["prediction", "action", "observableOutcome", "continueCondition", "fallback", "resultMeaning", "timing", "when", "context", "needsPattern"].some((key) => previous[key] !== next[key]);
    if (!changed) { editingCycleExperiment = false; return renderCycleDashboard(); }
    const changedAt = new Date().toISOString();
    activeCycle.experimentHistory = [...(activeCycle.experimentHistory || []), { version: activeCycle.experimentVersion || 1, experiment: previous, endedAt: changedAt }];
    activeCycle.experimentVersion = (activeCycle.experimentVersion || 1) + 1;
    activeCycle.experiment = { ...next, version: activeCycle.experimentVersion, changedAt };
    activeCycle.observationDays = next.needsPattern ? 7 : 1;
    activeCycle.endDate = addDays(activeCycle.startDate, activeCycle.observationDays - 1);
    await putCycle(activeCycle);
    editingCycleExperiment = false;
    await saveObservation({ silent: true });
    await renderCycleDashboard();
    $("#cycleDashboardStatus").textContent = `实验已调整为第 ${activeCycle.experimentVersion} 版；之前的打卡仍保留。`;
  }

  function editedMap() {
    const values = Object.fromEntries([...document.querySelectorAll("[data-map-key]")].map((input) => [input.dataset.mapKey, input.value.trim()]));
    return Object.fromEntries(Object.keys(mapLabels).map((key) => [key, values[key] || deepSynthesis?.map?.[key] || "尚未确认"]));
  }

  async function saveObservation({ silent = false } = {}) {
    if (!deepSynthesis) return;
    if (!feedback) {
      if (!silent) {
        $("#saveStatus").textContent = "请先在下方确认：很像、部分像、不太像或想补充。";
        $(".confirm-card").scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    const now = new Date().toISOString();
    rememberForCat = !DEMO_MODE && Boolean($("#rememberForCat")?.checked);
    clarityAfter = Number($("#clarityLevel").value);
    const id = savedRecordId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    const finalMap = editedMap();
    const changedFields = Object.keys(finalMap).filter((key) => finalMap[key] !== deepSynthesis.map[key]);
    const record = {
      id, day: today(), createdAt: savedRecordId ? undefined : now, updatedAt: now, feedback,
      eventType: state.answers.ENTRY_01?.[0] || "unknown",
      eventSummary: finalMap.fact,
      askedQuestions: state.path.map((questionId) => ({ id: questionId, title: engine.currentQuestion({ ...state, path: [questionId], completed: false, terminal: null })?.title || questionId })),
      result: { type: currentResult.type, primary: currentResult.primary, secondary: currentResult.secondary, support: currentResult.support, title: currentResult.title, summary: currentResult.summary, evidence: currentResult.evidence, alternatives: currentResult.alternatives, action: currentResult.action, escalation: currentResult.escalation, cycle: currentResult.cycle, pathway: currentResult.pathway },
      insight: deepSynthesis.insight, map: finalMap, mapSources: deepSynthesis.mapSources, evidenceGaps: deepSynthesis.evidenceGaps, alternatives: deepSynthesis.alternatives,
      correction: { feedback, changedFields },
      concepts: deepSynthesis.concepts, experiments: deepSynthesis.experiments,
      selectedExperiment: experimentFromForm(),
      experiment: experimentFromForm()?.action || "",
      metrics: { confusionStart, clarityAfter: Number($("#clarityLevel").value) },
      resumeStage: selectedExperiment ? "experiment" : "map-confirmed"
    };
    if (savedRecordId && rememberForCat) {
      const existing = (await allRecords()).find((item) => item.id === savedRecordId);
      if (existing?.createdAt) record.createdAt = existing.createdAt;
    }
    if (rememberForCat) {
      await putRecord(record);
      savedRecordId = id;
    }
    setMapAvailability(true);
    if (!silent) $("#saveStatus").textContent = rememberForCat ? "已留给小猫：确认后的摘要、地图、已问问题和实验。逐字对话没有写入记录。" : "本轮继续，但不会写入浏览器记录。";
    if (rememberForCat) renderMemory();
    return record;
  }

  async function renderHistory() {
    const list = $("#historyList"); list.innerHTML = "";
    const records = (await allRecords()).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    if (!records.length) { const empty = document.createElement("p"); empty.className = "empty-history"; empty.textContent = "还没有主动保存的观察。"; list.append(empty); return; }
    records.forEach((record) => {
      const item = document.createElement("article"); item.className = "history-item";
      const title = document.createElement("h3"); title.textContent = `${record.day} · ${record.result?.title || "一次观察"}`;
      const insight = document.createElement("p"); insight.textContent = record.insight;
      const concepts = document.createElement("p"); concepts.textContent = `候选概念：${(record.concepts || []).map((concept) => `${concept.name}（${concept.level}）`).join("、") || "尚未形成"}`;
      const actions = document.createElement("div"); actions.className = "actions";
      const load = document.createElement("button"); load.className = "secondary-button"; load.type = "button"; load.textContent = "载入查看和修改";
      load.addEventListener("click", () => {
        loadRecord(record); mapReturnView = activeCycle ? "cycle" : "experiment"; $("#historyDialog").close(); renderResult();
      });
      const remove = document.createElement("button"); remove.className = "secondary-button"; remove.type = "button"; remove.textContent = "删除";
      remove.addEventListener("click", async () => { if (!confirm("删除这张结构化观察记录？删除后无法恢复。")) return; await deleteRecord(record.id); await renderHistory(); renderMemory(); });
      actions.append(load, remove); item.append(title, insight, concepts, actions); list.append(item);
    });
  }

  async function startCycle() {
    if (!feedback) { $("#saveStatus").textContent = "请先确认问题地图像不像。"; $(".confirm-card").scrollIntoView({ behavior: "smooth" }); return; }
    if (!experimentReady()) { $("#saveStatus").textContent = "请至少写清行动和可观察判据；预测不明确时可以只观察。"; $("#experimentStep").scrollIntoView({ behavior: "smooth" }); return; }
    const existing = await getCycle();
    if (existing?.status === "active") { $("#saveStatus").textContent = "当前已有一个七日主题；第一版暂不同时开启第二个。"; return; }
    const record = await saveObservation();
    if (!record) return;
    const startDate = today();
    activeCycle = {
      id: "active-cycle",
      cycleKey: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      status: "active",
      startDate,
      observationDays: experimentFromForm().needsPattern ? 7 : 1,
      endDate: addDays(startDate, experimentFromForm().needsPattern ? 6 : 0),
      remembered: rememberForCat,
      topic: currentResult.title,
      feedback,
      correction: record.correction,
      map: record.map,
      mapSources: record.mapSources,
      evidenceGaps: record.evidenceGaps,
      concepts: record.concepts,
      alternatives: record.alternatives,
      insight: record.insight,
      result: record.result,
      experiment: experimentFromForm(),
      experimentVersion: 1,
      experimentHistory: [],
      metrics: record.metrics,
      reports: {},
      createdAt: new Date().toISOString(),
      previousCycle: existing ? { topic: existing.topic, map: existing.map, reports: existing.reports } : null
    };
    activeCycle.recordId = rememberForCat ? record.id : null;
    await putCycle(activeCycle);
    $("#saveStatus").textContent = activeCycle.experiment.timing === "not_now" ? "这次先不做。计划留在当前会话，准备好时再回来。" : activeCycle.experiment.timing === "later" ? `已记下：${activeCycle.experiment.when}，在“${activeCycle.experiment.context}”做第一步。` : "先完成一个由你控制的准备动作，再记下真实信息。";
    await renderCycleDashboard();
    if (activeCycle.experiment.timing === "now") await openCheckin(today(), "instant");
  }

  async function cycleCheckins() {
    if (!activeCycle) return [];
    return (await allCheckins()).filter((item) => item.cycleKey === activeCycle.cycleKey);
  }

  async function renderCycleDashboard() {
    activeCycle = activeCycle || await getCycle();
    if (!activeCycle) { $("#cycleDashboard").classList.add("hidden"); return false; }
    editingCycleExperiment = false;
    const checkins = await cycleCheckins();
    setMapScene(false);
    setHero("cycle");
    const elapsed = dayDifference(activeCycle.startDate, today());
    const cycleDays = activeCycle.observationDays || 7;
    const dayNumber = Math.min(cycleDays, Math.max(1, elapsed + 1));
    const eventDays = checkins.filter((item) => ["yes", "mild"].includes(item.eventOccurrence)).length;
    const extensionDone = activeCycle.extension ? checkins.filter((item) => item.date >= activeCycle.extension.startDate && ["yes", "mild"].includes(item.eventOccurrence)).length : 0;
    const extensionRemaining = activeCycle.extension ? Math.max(0, activeCycle.extension.targetEvents - extensionDone) : 0;
    hideDeskViews();
    $("#notebookHotspot").hidden = cycleDays === 1;
    $("#deskOpenJournalButton").hidden = cycleDays === 1;
    $("#deskStatePanel").classList.remove("hidden");
    $("#experimentStep").classList.add("hidden");
    $("#cycleDashboard").classList.remove("hidden");
    $("#resultPanel").classList.add("hidden");
    $("#cycleDayLabel").textContent = activeCycle.status === "completed" ? "这轮现实核对已完成" : activeCycle.extension ? `延长观察 · 还需 ${extensionRemaining} 个目标情境日` : cycleDays === 1 ? "一次现实核对" : `第 ${dayNumber} 天 / ${cycleDays}`;
    $("#cycleTopicTitle").textContent = activeCycle.topic;
    activeCycle.experiment = normalizeExperiment(activeCycle.experiment);
    $("#cycleExperimentSummary").textContent = `当前实验${activeCycle.experimentVersion > 1 ? `（第 ${activeCycle.experimentVersion} 版）` : ""}：${activeCycle.experiment.action}`;
    $("#stepLabel").textContent = cycleDays === 1 ? "一次现实核对" : `七日观察 · 第 ${dayNumber} 天`;
    $("#progressBar").style.width = `${Math.round((dayNumber / cycleDays) * 100)}%`;
    const todayRecord = checkins.find((item) => item.date === today());
    $("#todayCheckinStatus").textContent = todayRecord ? "已记录，可以修改" : activeCycle.status === "completed" ? "周期已完成" : "尚未记录";
    $("#cycleProgressStatus").textContent = activeCycle.extension ? `已新增 ${extensionDone} / ${activeCycle.extension.targetEvents} 个目标情境日` : cycleDays === 1 ? `${checkins.length ? "已获得一次现实信息" : "等待一次现实信息"}` : `${checkins.length} / ${cycleDays} 天有记录 · ${eventDays} 天出现目标情境`;
    $("#startCheckinButton").textContent = todayRecord ? "修改今日打卡" : "开始今日打卡";
    $("#startCheckinButton").disabled = activeCycle.status === "completed" || elapsed < 0 || (elapsed >= cycleDays && !activeCycle.extension);
    const yesterday = addDays(today(), -1);
    const canRecall = activeCycle.status === "active" && yesterday >= activeCycle.startDate && yesterday <= activeCycle.endDate && !checkins.some((item) => item.date === yesterday);
    $("#recallCheckinButton").classList.toggle("hidden", !canRecall);
    const reportStage = null;
    const needsClosingFeedback = !DEMO_MODE && activeCycle.status === "completed" && !activeCycle.closingFeedback;
    $("#stageReportButton").classList.toggle("hidden", !reportStage && !needsClosingFeedback);
    if (needsClosingFeedback) { $("#stageReportButton").dataset.stage = "closing"; $("#stageReportButton").textContent = "生成猫的七日回信"; }
    else if (reportStage) { $("#stageReportButton").dataset.stage = String(reportStage); $("#stageReportButton").textContent = `生成第 ${reportStage} 天报告`; }
    const canComplete = activeCycle.status === "active" && (cycleDays === 1 ? checkins.length > 0 : elapsed >= cycleDays - 1) && (!activeCycle.extension || extensionRemaining === 0);
    $("#completeCycleButton").classList.toggle("hidden", !canComplete);
    const missingCount = Array.from({ length: Math.min(cycleDays, Math.max(0, elapsed)) }, (_, index) => addDays(activeCycle.startDate, index)).filter((date) => !checkins.some((item) => item.date === date)).length;
    $("#cycleDashboardStatus").textContent = activeCycle.status === "completed" ? (activeCycle.closingFeedback ? "这轮已经结束，猫的七日回信已收进手账。" : "这轮已经结束；AI 回信待生成，记录仍然完整保留。") : activeCycle.extension ? `延长观察按出现目标情境的日子计算，还需要 ${extensionRemaining} 天。` : missingCount ? `前几天有 ${missingCount} 天未记录；已有记录仍然有效。` : eventDays < 2 && elapsed >= 6 ? "目标情境记录还少，可以如实结束，也可以延长观察。" : "今天没有出现目标情境，也可以一键记下。";
    $("#resetButton").textContent = activeCycle.status === "completed" ? "开始新的分析" : cycleDays === 1 ? "回到这次核对" : "回到七日观察";
    mapReturnView = "cycle";
    return true;
  }

  function localCycleSummary(checkins) {
    const eventRecords = checkins.filter((item) => ["yes", "mild"].includes(item.eventOccurrence));
    const eventCount = eventRecords.length;
    const supports = eventRecords.filter((item) => item.evidenceDirection === "supports").length;
    const weakens = eventRecords.filter((item) => item.evidenceDirection === "weakens").length;
    const alternatives = eventRecords.filter((item) => item.evidenceDirection === "alternative").length;
    const unclear = eventRecords.filter((item) => item.evidenceDirection === "unclear").length;
    const unclassified = eventRecords.filter((item) => !item.evidenceDirection).length;
    const done = checkins.filter((item) => item.experimentDone === "yes").length;
    const partial = checkins.filter((item) => item.experimentDone === "partial").length;
    const blocked = checkins.filter((item) => item.experimentDone === "no").length;
    const updated = weakens + alternatives > 0 ? "至少有一次实际观察和原判断不同；你亲自试过，也看到自己能用行动修正猜测。" : unclear > 0 ? "目前还不知道；你面对了不确定，也看到了自己可以先处理能决定的部分。" : supports > 0 ? "这轮观察暂时和原判断一致；你已经做过一次，下次仍可以先验证再判断。" : "目标情境记录还少，现在不必下结论。";
    return {
      eventCount, supports, weakens, alternatives, unclear, unclassified, done, partial, blocked,
      lines: [
        `原来的判断：${normalizeExperiment(activeCycle.experiment).prediction}`,
        `实际观察：记录 ${checkins.length} 次；${supports} 次与原判断一致，${weakens} 次不一致，${alternatives} 次更符合其他原因，${unclear} 次还不知道。`,
        `我更新了什么：${updated}`,
        `仍然不知道什么：${activeCycle.map?.unknown || "目前的信息还不能说明原判断是否完整。"}`,
        `你实际完成了什么：${done} 次完成自己能控制的行动，${partial} 次做了一部分。`,
        `下次先做什么：${normalizeExperiment(activeCycle.experiment).action}。先行动验证，再判断。`
      ]
    };
  }

  function renderClosingFeedback(feedback) {
    $("#closingFeedbackCard").classList.remove("hidden");
    $("#closingFeedbackState").textContent = "基于真实记录生成 · 不是完成度评分";
    $("#closingFeedbackTitle").textContent = feedback.title || "猫的七日回信";
    $("#closingFeedbackOpening").textContent = feedback.opening || "";
    $("#closingOriginalPrediction").textContent = normalizeExperiment(activeCycle?.experiment).prediction;
    const wins = $("#closingFeedbackWins"); wins.innerHTML = "";
    (feedback.specificWins || []).forEach((win) => { const item = document.createElement("li"); item.textContent = `${win.text}（${win.sourceRefs.join("、")}）`; wins.append(item); });
    $("#closingFeedbackLearning").textContent = feedback.learning || "";
    $("#closingFeedbackRecognition").textContent = feedback.selfRecognition || "";
    $("#closingFeedbackNext").textContent = feedback.nextChoice || "";
    $("#closingFeedbackNote").textContent = feedback.completionNote || "";
    $("#retryClosingFeedbackButton").classList.add("hidden");
  }

  async function requestClosingFeedback(checkins = closingFeedbackCheckins) {
    closingFeedbackCheckins = checkins;
    $("#closingFeedbackCard").classList.remove("hidden");
    $("#closingFeedbackState").textContent = "稍等，猫在看这七天留下的记录……";
    $("#closingFeedbackTitle").textContent = "猫的七日回信";
    $("#closingFeedbackOpening").textContent = "结案已经保存。回信生成失败也不会丢失记录。";
    $("#closingOriginalPrediction").textContent = normalizeExperiment(activeCycle?.experiment).prediction;
    $("#closingFeedbackWins").innerHTML = "";
    ["#closingFeedbackLearning", "#closingFeedbackRecognition", "#closingFeedbackNext", "#closingFeedbackNote"].forEach((selector) => { $(selector).textContent = ""; });
    $("#retryClosingFeedbackButton").classList.add("hidden");
    const cycleKey = activeCycle.cycleKey;
    try {
      const feedback = await postJson("/api/cycle/closing-feedback", {
        cycle: { topic: activeCycle.topic, map: activeCycle.map, experiment: activeCycle.experiment, observationDays: activeCycle.observationDays || 7, localCompletion: activeCycle.localCompletion },
        checkins,
        safetyRisk: false
      });
      const stored = await getCycle();
      if (stored?.cycleKey === cycleKey) {
        stored.closingFeedback = feedback;
        stored.closingFeedbackStatus = "ready";
        await putCycle(stored);
        if (activeCycle?.cycleKey === cycleKey) activeCycle = stored;
      }
      renderClosingFeedback(feedback);
    } catch (error) {
      const stored = await getCycle().catch(() => null);
      if (stored?.cycleKey === cycleKey) { stored.closingFeedbackStatus = "pending"; await putCycle(stored); }
      $("#closingFeedbackState").textContent = "回信待生成";
      $("#closingFeedbackOpening").textContent = `${error.message}。结案和七天记录已经保存，可以稍后重试。`;
      $("#retryClosingFeedbackButton").classList.remove("hidden");
    }
  }

  async function finishClosingFeedback() {
    $("#cycleCompleteDialog").close();
    if (completionNextStep === "new") reset();
    else await renderCycleDashboard();
  }

  async function openCycleCompletion() {
    const checkins = await cycleCheckins();
    const summary = localCycleSummary(checkins);
    const target = $("#localCycleSummary"); target.innerHTML = "";
    summary.lines.forEach((line) => { const paragraph = document.createElement("p"); paragraph.textContent = line; target.append(paragraph); });
    document.querySelectorAll('input[name="hypothesisDecision"], input[name="cycleNextStep"]').forEach((input) => { input.checked = false; });
    $("#hypothesisRevision").value = activeCycle.localCompletion?.revision || "";
    completionNextStep = null;
    closingFeedbackCheckins = checkins;
    const singleCheck = (activeCycle.observationDays || 7) === 1;
    const enoughEvents = summary.eventCount >= (singleCheck ? 1 : 2);
    document.querySelector('input[name="cycleNextStep"][value="extend"]').closest("label").classList.toggle("hidden", singleCheck);
    $("#cycleCompleteKicker").textContent = enoughEvents ? "先保存结论，再生成 AI 回信" : "记录已经保存 · 信息量仍然有限";
    $("#cycleCompleteTitle").textContent = enoughEvents ? "这一轮可以停在这里" : singleCheck ? "这次还没有得到现实信息" : "这七天的信息还比较少";
    $("#cycleCompletionHint").textContent = enoughEvents ? `记录到 ${summary.eventCount} 个目标情境，可以据此更新暂时判断。` : singleCheck ? "可以保留“还不知道”，也可以把动作缩小后再试。" : `只记录到 ${summary.eventCount} 个出现目标情境的日子。可以结束，但结论会明确标记“信息不足”；也可以再观察三个目标情境日。`;
    $("#localCycleSummary").classList.remove("hidden");
    $("#hypothesisDecision").classList.remove("hidden");
    $("#cycleNextStep").classList.remove("hidden");
    $("#confirmCycleCompleteButton").classList.remove("hidden");
    $("#confirmCycleCompleteButton").textContent = "保存这次理解更新";
    $("#closingFeedbackCard").classList.add("hidden");
    $("#cycleCompleteStatus").textContent = "";
    $("#cycleCompleteDialog").showModal();
  }

  async function openPendingClosingFeedback() {
    completionNextStep = "end";
    closingFeedbackCheckins = await cycleCheckins();
    $("#cycleCompleteKicker").textContent = "这一轮已经可靠保存";
    $("#cycleCompleteTitle").textContent = "猫想留一封回信给你";
    $("#cycleCompletionHint").textContent = "";
    $("#localCycleSummary").classList.add("hidden");
    $("#hypothesisDecision").classList.add("hidden");
    $("#cycleNextStep").classList.add("hidden");
    $("#confirmCycleCompleteButton").classList.add("hidden");
    $("#cycleCompleteStatus").textContent = "";
    if (!$("#cycleCompleteDialog").open) $("#cycleCompleteDialog").showModal();
    await requestClosingFeedback(closingFeedbackCheckins);
  }

  async function completeCycleLocally() {
    const decision = document.querySelector('input[name="hypothesisDecision"]:checked')?.value;
    const nextStep = document.querySelector('input[name="cycleNextStep"]:checked')?.value;
    const revision = $("#hypothesisRevision").value.trim();
    if (!decision || !nextStep) { $("#cycleCompleteStatus").textContent = "请先选择怎样看猜想，以及接下来怎么做。"; return; }
    if (decision === "revise" && !revision) { $("#cycleCompleteStatus").textContent = "请写一句修改后的暂时猜想。"; return; }
    const checkins = await cycleCheckins();
    const summary = localCycleSummary(checkins);
    activeCycle.localCompletion = { ...summary, decision, revision, nextStep, completedAt: new Date().toISOString() };
    if (nextStep === "extend") {
      activeCycle.status = "active";
      activeCycle.extension = { targetEvents: 3, startDate: addDays(today(), 1) };
    } else {
      activeCycle.status = "completed";
      activeCycle.extension = null;
      activeCycle.completedAt = new Date().toISOString();
    }
    await putCycle(activeCycle);
    if (activeCycle.remembered && activeCycle.recordId) {
      const record = (await allRecords()).find((item) => item.id === activeCycle.recordId);
      if (record) await putRecord({ ...record, observationResults: checkins.map(({ date, eventOccurrence, experimentDone, experimentResult, learning, evidenceDirection }) => ({ date, eventOccurrence, experimentDone, experimentResult, learning, evidenceDirection })), updatedAt: new Date().toISOString() });
    }
    completionNextStep = nextStep;
    updateLandingEntry();
    if (nextStep === "extend") { $("#cycleCompleteDialog").close(); return renderCycleDashboard(); }
    $("#cycleCompleteKicker").textContent = "这一轮已经可靠保存";
    $("#cycleCompleteTitle").textContent = "猫想留一封回信给你";
    $("#cycleCompletionHint").textContent = "";
    $("#localCycleSummary").classList.add("hidden");
    $("#hypothesisDecision").classList.add("hidden");
    $("#cycleNextStep").classList.add("hidden");
    $("#confirmCycleCompleteButton").classList.add("hidden");
    $("#cycleCompleteStatus").textContent = "";
    await requestClosingFeedback(checkins);
  }

  async function restoreDesk() {
    setMapScene(false);
    activeCycle = await getCycle().catch(() => null);
    if (activeCycle) { setMapAvailability(true); return renderCycleDashboard(); }
    const record = await latestRecord();
    if (record?.feedback) {
      loadRecord(record);
      setMapAvailability(true);
      return showDeskExperiment();
    }
    setMapAvailability(false);
    renderQuestion();
    return false;
  }

  async function openLatestMap(origin = "question") {
    if (activeCycle?.result) {
      currentResult = activeCycle.result;
      const storedExperiment = activeCycle.experiment;
      activeCycle.experiment = normalizeExperiment(activeCycle.experiment);
      deepSynthesis = { insight: activeCycle.insight, map: activeCycle.map, mapSources: activeCycle.mapSources || {}, evidenceGaps: activeCycle.evidenceGaps || [], alternatives: activeCycle.alternatives, concepts: activeCycle.concepts, experiments: [activeCycle.experiment], experiment: activeCycle.experiment.action };
      selectedExperiment = activeCycle.experiment;
      selectedExperimentOriginal = storedExperiment?.aiOriginal ? normalizeExperiment(storedExperiment.aiOriginal) : normalizeExperiment(activeCycle.experiment);
      feedback = activeCycle.feedback;
    } else {
      const record = await latestRecord();
      if (!loadRecord(record)) return false;
    }
    mapReturnView = origin;
    renderResult();
    scrollTo({ top: 0, behavior: "auto" });
    return true;
  }

  function journalTransform() {
    const from = $("#notebookHotspot").getBoundingClientRect();
    const to = $("#journalBook").getBoundingClientRect();
    return `translate(${from.left + from.width / 2 - to.left - to.width / 2}px, ${from.top + from.height / 2 - to.top - to.height / 2}px) scale(${Math.max(.12, from.width / to.width)}, ${Math.max(.12, from.height / to.height)}) rotate(-8deg)`;
  }

  function appendJournalField(page, label, value) {
    const row = document.createElement("div"); row.className = "journal-field";
    const title = document.createElement("strong"); title.textContent = label;
    const text = document.createElement("p"); text.textContent = value || (COMPETITION_EN ? "Not recorded yet" : "暂未记录");
    row.append(title, text); page.append(row);
  }

  function renderJournalOverview() {
    const hasCycle = Boolean(activeCycle);
    const checkins = journalCheckins;
    const elapsed = hasCycle ? dayDifference(activeCycle.startDate, today()) : -1;
    const dayNumber = hasCycle ? Math.min(7, Math.max(1, elapsed + 1)) : 0;
    $("#journalOverviewDayLabel").textContent = hasCycle ? (activeCycle.status === "completed" ? "七日观察已完成" : `第 ${dayNumber} 天 / 7`) : "七日观察";
    $("#journalOverviewTitle").textContent = hasCycle ? activeCycle.topic : "还没有开始观察";
    $("#journalOverviewExperiment").textContent = hasCycle ? `当前实验：${normalizeExperiment(activeCycle.experiment).action}` : "先完成一次问题整理，选定一个想验证的小实验。";

    const track = $("#journalSevenDayTrack"); track.innerHTML = "";
    for (let index = 0; index < 7; index += 1) {
      const date = hasCycle ? addDays(activeCycle.startDate, index) : "";
      const record = hasCycle ? checkins.find((item) => item.date === date) : null;
      const isToday = date === today();
      const missed = hasCycle && date < today() && !record;
      const cell = document.createElement("div");
      cell.className = `day-cell ${record ? "done" : ""} ${missed ? "missed" : ""} ${isToday ? "today" : ""}`;
      const title = document.createElement("strong"); title.textContent = `第 ${index + 1} 天`;
      const status = document.createElement("span");
      status.textContent = !hasCycle ? "未开始" : record ? (record.mode === "recall" ? "回忆补记" : "已记录") : missed ? "未记录" : isToday ? "今天" : date.slice(5);
      cell.append(title, status); track.append(cell);
    }

    const trends = $("#journalMiniTrends"); trends.innerHTML = "";
    [{ key: "distress", label: "行动前" }, { key: "distressAfter", label: "行动后" }].forEach(({ key, label }) => {
      const row = document.createElement("div"); row.className = "trend-row";
      const name = document.createElement("strong"); name.textContent = label; row.append(name);
      for (let index = 0; index < 7; index += 1) {
        const date = hasCycle ? addDays(activeCycle.startDate, index) : "";
        const record = hasCycle ? checkins.find((item) => item.date === date) : null;
        const cell = document.createElement("div"); cell.className = "trend-value";
        if (record && ["yes", "mild"].includes(record.eventOccurrence) && Number.isFinite(record[key])) {
          const bar = document.createElement("span"); bar.style.height = `${Math.max(6, record[key] * 8)}%`;
          const value = document.createElement("small"); value.textContent = record[key]; cell.append(bar, value);
        } else cell.textContent = "-";
        row.append(cell);
      }
      trends.append(row);
    });

    const cards = $("#journalChangeCards"); cards.innerHTML = "";
    const supported = checkins.filter((item) => item.evidenceDirection === "supports").length;
    const weakened = checkins.filter((item) => item.evidenceDirection === "weakens").length;
    const alternative = checkins.filter((item) => item.evidenceDirection === "alternative").length;
    const unclear = checkins.filter((item) => item.evidenceDirection === "unclear").length;
    const experiment = hasCycle ? normalizeExperiment(activeCycle.experiment) : null;
    const updated = weakened + alternative > 0 ? "实际观察至少有一次不同于原判断；修正猜测让你更了解自己在这类情境中的反应。" : unclear > 0 ? "目前还不知道；保留不确定，也是在更准确地认识这次反应。" : supported > 0 ? "目前的观察与原判断较一致，但它仍是情境中的暂时理解。" : "实际观察还少，现在不必给自己下结论。";
    const summaries = hasCycle ? [
      ["原来的判断", experiment.prediction],
      ["实际观察", `${supported} 次与原判断一致，${weakened} 次不一致，${alternative} 次更符合其他原因，${unclear} 次还不知道。`],
      ["我更新了什么", updated],
      ["下次先做什么", `${experiment.action} 先验证，再判断。`]
    ] : [["原来的判断", "先完成问题整理，再写下暂时判断。"], ["实际观察", "真实发生的事会留在这里。"], ["我更新了什么", "有记录后再看理解是否需要调整。"], ["下次先做什么", "先做一个低风险验证，再判断。"]];
    summaries.forEach(([title, text]) => {
      const card = document.createElement("article"); const heading = document.createElement("strong"); const body = document.createElement("p");
      heading.textContent = title; body.textContent = text; card.append(heading, body); cards.append(card);
    });

    $("#journalOverviewStatus").textContent = hasCycle ? `${checkins.length} / 7 天有记录；未记录的日子不会影响已有记录。` : "七天记录会在这里排成一张表。";
    $("#viewCycleMapButton").classList.toggle("hidden", !hasCycle);
    $("#journalCoverNextButton").classList.toggle("hidden", !hasCycle);
    const todayRecord = hasCycle ? checkins.find((item) => item.date === today()) : null;
    $("#journalStartButton").textContent = !hasCycle ? "先去整理问题" : todayRecord ? "修改今日打卡" : "开始今日打卡";
    $("#journalStartButton").disabled = hasCycle && (activeCycle.status === "completed" || elapsed < 0 || (elapsed > 6 && !activeCycle.extension));
  }

  function renderJournalDay(page, dayIndex) {
    page.innerHTML = "";
    const content = document.createElement("div"); content.className = "journal-day-content";
    const number = document.createElement("span"); number.className = "journal-page-number"; number.textContent = dayIndex === 7 ? (COMPETITION_EN ? "Letter" : "回信") : String(dayIndex + 1);
    page.append(content, number);
    if (dayIndex === 7) {
      const eyebrow = document.createElement("span"); eyebrow.className = "journal-day-kicker"; eyebrow.textContent = COMPETITION_EN ? "CLOSING LETTER" : "回信";
      const letter = activeCycle.closingFeedback;
      const title = document.createElement("h2"); title.textContent = letter?.title || (activeCycle.status === "completed" ? "七天走到了这里" : "第七天后再来整理");
      const body = document.createElement("p"); body.textContent = letter?.opening || activeCycle.localCompletion?.lines?.join(" ") || activeCycle.reports?.[7]?.summary || `目前记录了 ${journalCheckins.length} 天。缺失不会自动补齐，已有记录会保留下来。`;
      content.append(eyebrow, title, body);
      appendJournalField(content, "原来的判断", normalizeExperiment(activeCycle.experiment).prediction);
      if (letter) {
        appendJournalField(content, "实际观察", (letter.specificWins || []).map((item) => item.text).join("；"));
        appendJournalField(content, "我更新了什么", letter.learning);
        appendJournalField(content, "这次多理解的一点", letter.selfRecognition);
        appendJournalField(content, "下次先做什么", letter.nextChoice);
      }
      if (activeCycle.localCompletion) {
        appendJournalField(content, "对原来判断的决定", { keep: "保留原来的判断", revise: "修改原来的判断", shelve: "目前信息还不够，暂时不判断" }[activeCycle.localCompletion.decision]);
        if (activeCycle.localCompletion.revision) appendJournalField(content, "修改后的猜想", activeCycle.localCompletion.revision);
      }
      return;
    }
    const date = addDays(activeCycle.startDate, dayIndex);
    const record = journalCheckins.find((item) => item.date === date);
    const future = date > today();
    const eyebrow = document.createElement("span"); eyebrow.className = "journal-day-kicker"; eyebrow.textContent = `第 ${dayIndex + 1} 天 · ${date}`;
    const title = document.createElement("h2"); title.textContent = record ? (record.mode === "recall" ? "回忆补记" : "今天的记录") : future ? "还没到这一天" : date === today() ? "今天还没有记录" : "这一天留白了";
    content.append(eyebrow, title);
    if (!record) {
      const note = document.createElement("p"); note.className = "journal-blank-note"; note.textContent = future ? "到日期后再记录真实发生的事情。" : "空白也保留，不替你编造发生过的内容。";
      content.append(note);
      if (date === today() && activeCycle.status === "active") {
        const button = document.createElement("button"); button.type = "button"; button.className = "primary-button journal-checkin-button"; button.textContent = "开始今日打卡";
        button.addEventListener("click", () => openCheckin(date, "instant")); content.append(button);
      }
      return;
    }
    appendJournalField(content, "目标情境", record.eventOccurrence === "no" ? "今天没有出现" : record.eventNote || activeCycle.map?.fact);
    appendJournalField(content, "困扰强度", `${record.distress} / 10`);
    if (Number.isFinite(record.distressAfter)) appendJournalField(content, "行动后困扰", `${record.distressAfter} / 10（变化 ${record.distressAfter - record.distress >= 0 ? "+" : ""}${record.distressAfter - record.distress}）`);
    appendJournalField(content, "实验执行", displayLabel(record.experimentDone));
    appendJournalField(content, "实际结果", record.experimentResult);
    appendJournalField(content, "新信息", record.learning);
    appendJournalField(content, "和原来担心的关系", displayLabel(record.evidenceDirection));
    appendJournalField(content, "替代解释", record.alternativeHypothesis);
    appendJournalField(content, "功能影响", `${record.functionImpact} / 10`);
    if (date === today() && activeCycle.status === "active") {
      const button = document.createElement("button"); button.type = "button"; button.className = "secondary-button journal-checkin-button"; button.textContent = "修改今日打卡";
      button.addEventListener("click", () => openCheckin(date, "instant")); content.append(button);
    }
  }

  function renderJournalPage() {
    const hasCycle = Boolean(activeCycle);
    const isCover = journalPage === 0;
    $("#journalBook").classList.toggle("is-spread", !isCover);
    $("#journalCover").classList.toggle("hidden", !isCover);
    $("#journalSpread").classList.toggle("hidden", isCover);
    if (isCover) {
      renderJournalOverview();
      return;
    }
    const mobile = matchMedia("(max-width: 760px)").matches;
    const leftIndex = mobile ? journalPage - 1 : (journalPage - 1) * 2;
    renderJournalDay($("#journalLeftPage"), leftIndex);
    if (!mobile) renderJournalDay($("#journalRightPage"), leftIndex + 1);
    $("#journalPrevButton").disabled = journalPage <= 1;
    const maxPage = mobile ? 8 : 4;
    $("#journalNextButton").disabled = journalPage >= maxPage;
  }

  function setJournalPage(page) {
    const maxPage = matchMedia("(max-width: 760px)").matches ? 8 : 4;
    const next = Math.max(0, Math.min(activeCycle ? maxPage : 0, page));
    if (next === journalPage) return;
    const direction = next > journalPage ? 1 : -1;
    journalPage = next;
    renderJournalPage();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      $(".journal-turn-page").animate([
        { opacity: .75, transform: `perspective(1200px) rotateY(${direction * -78}deg)` },
        { opacity: 0, transform: "perspective(1200px) rotateY(0deg)" }
      ], { duration: 360, easing: "ease-out" });
    }
  }

  async function openJournal({ animate = true } = {}) {
    activeCycle = activeCycle || await getCycle().catch(() => null);
    journalCheckins = activeCycle ? await cycleCheckins() : [];
    journalPage = 0;
    renderJournalPage();
    const dialog = $("#journalDialog");
    if (!dialog.open) dialog.showModal();
    const startTransform = journalTransform();
    document.documentElement.classList.add("journal-visible");
    $("#mapHotspot").disabled = true;
    $("#notebookHotspot").disabled = true;
    dialog.classList.remove("journal-opening", "journal-open");
    void dialog.offsetWidth;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate && !reduced) {
      dialog.classList.add("journal-opening");
      await $("#journalBook").animate([
        { transform: startTransform, opacity: .72 },
        { transform: "none", opacity: 1 }
      ], { duration: 620, easing: "cubic-bezier(.2,.78,.2,1)", fill: "both" }).finished.catch(() => {});
    }
    dialog.classList.remove("journal-opening");
    dialog.classList.add("journal-open");
    $("#closeJournalButton").focus({ preventScroll: true });
  }

  function closeJournal({ restore = true, focus = true } = {}) {
    const dialog = $("#journalDialog");
    if (!dialog.open) return;
    dialog.classList.remove("journal-opening", "journal-open");
    dialog.close();
    document.documentElement.classList.remove("journal-visible");
    $("#mapHotspot").disabled = false;
    $("#notebookHotspot").disabled = false;
    journalPage = 0;
    if (restore) restoreDesk();
    if (focus) $("#notebookHotspot").focus({ preventScroll: true });
  }

  function clearDeskEffects() {
    document.querySelectorAll(".scene-effect").forEach((element) => element.getAnimations().forEach((animation) => animation.cancel()));
  }

  function playDeskEffect(type) {
    const hotspot = document.querySelector(`[data-desk-effect="${type}"]`);
    if (!hotspot || document.documentElement.classList.contains("journal-visible")) return;
    clearDeskEffects();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      hotspot.animate([{ opacity: 1 }, { opacity: .72 }, { opacity: 1 }], { duration: 240 });
      return;
    }
    const animate = (selector, keyframes, options) => hotspot.querySelector(selector)?.animate(keyframes, { fill: "none", ...options });
    if (type === "coffee") {
      animate(".coffee-ripple-one", [{ opacity: .8, transform: "scale(.45)" }, { opacity: 0, transform: "scale(1.25)" }], { duration: 720, easing: "cubic-bezier(.2,.7,.25,1)" });
      animate(".coffee-ripple-two", [{ opacity: 0, transform: "scale(.55)" }, { opacity: .62, offset: .22 }, { opacity: 0, transform: "scale(1.12)" }], { duration: 760, delay: 100, easing: "ease-out" });
      animate(".coffee-steam-one", [{ opacity: 0, transform: "translateY(5px)" }, { opacity: .72, offset: .25 }, { opacity: 0, transform: "translateY(-15px)" }], { duration: 900, delay: 80, easing: "ease-out" });
      animate(".coffee-steam-two", [{ opacity: 0, transform: "translateY(7px)" }, { opacity: .65, offset: .28 }, { opacity: 0, transform: "translateY(-13px)" }], { duration: 920, delay: 190, easing: "ease-out" });
    } else if (type === "flowers") {
      animate(".flower-glint", [{ opacity: .75, transform: "scale(.45)" }, { opacity: 0, transform: "scale(1.35)" }], { duration: 560, easing: "ease-out" });
      [[".flower-petal-one", -18, -26, -25], [".flower-petal-two", 19, -18, 34], [".flower-petal-three", -12, 22, -42]].forEach(([selector, x, y, rotation], index) => {
        animate(selector, [{ opacity: .9, transform: "translate(0,0) rotate(0) scale(.7)" }, { opacity: 0, transform: `translate(${x}px,${y}px) rotate(${rotation}deg) scale(1)` }], { duration: 620, delay: index * 55, easing: "cubic-bezier(.2,.72,.22,1)" });
      });
    } else if (type === "paws") {
      [".paw-print-left", ".paw-print-right"].forEach((selector, index) => {
        animate(selector, [{ opacity: 0 }, { opacity: .76, offset: .28 }, { opacity: 0 }], { duration: 850, delay: index * 90, easing: "cubic-bezier(.2,.72,.28,1)" });
      });
    }
  }

  async function openCheckin(date, mode) {
    const existing = (await cycleCheckins()).find((item) => item.date === date);
    $("#checkinDate").value = date;
    $("#checkinMode").value = mode;
    $("#checkinModeLabel").textContent = mode === "recall" ? "回忆补记 · 可能不如即时记录准确" : "今日即时记录";
    $("#checkinTitle").textContent = `${date} 发生了什么？`;
    $("#checkinTargetContext").textContent = activeCycle.map?.fact || activeCycle.topic || "尚未确认";
    $("#checkinExperimentContext").textContent = normalizeExperiment(activeCycle.experiment).action || "只观察并记录";
    $("#eventOccurrence").value = existing?.eventOccurrence || "";
    $("#eventNote").value = existing?.eventNote || "";
    $("#distressLevel").value = existing?.distress ?? 5;
    $("#distressOutput").value = $("#distressLevel").value;
    $("#distressAfter").value = existing?.distressAfter ?? existing?.distress ?? 5;
    $("#distressAfterOutput").value = $("#distressAfter").value;
    $("#experimentDone").value = existing?.experimentDone || "";
    $("#experimentResult").value = existing?.experimentResult || "";
    $("#checkinLearning").value = existing?.learning || "";
    $("#evidenceDirection").value = existing?.evidenceDirection || "";
    $("#alternativeHypothesis").value = existing?.alternativeHypothesis || "";
    $("#functionLevel").value = existing?.functionImpact ?? 5;
    $("#functionOutput").value = $("#functionLevel").value;
    $("#checkinOptional").open = Boolean(existing?.learning || existing?.evidenceDirection || existing?.alternativeHypothesis || Number.isFinite(existing?.functionImpact));
    $("#checkinStatus").textContent = "";
    updateCheckinBranch();
    $("#checkinDialog").showModal();
  }

  function updateCheckinBranch() {
    const occurrence = $("#eventOccurrence").value;
    const applicable = ["yes", "mild"].includes(occurrence);
    if (applicable && $("#experimentDone").value === "not_applicable") $("#experimentDone").value = "";
    $("#checkinEventFields").classList.toggle("hidden", !applicable);
    $("#checkinExperimentFields").classList.toggle("hidden", !applicable);
    $("#checkinOptional").classList.toggle("hidden", !applicable);
    $("#experimentDone").required = applicable;
    $("#saveCheckinButton").textContent = occurrence === "no" ? "保存：今天没有出现" : "保存今天的记录";
  }

  async function openStageReport(stage) {
    const checkins = await cycleCheckins();
    pendingStage = { stage, checkins };
    $("#stageDialogTitle").textContent = `生成第 ${stage} 天${stage === 3 ? "阶段" : "周期"}报告`;
    $("#stagePreview").textContent = `将发送 ${checkins.length} 条结构化打卡，其中即时记录 ${checkins.filter((item) => item.mode === "instant").length} 条、回忆补记 ${checkins.filter((item) => item.mode === "recall").length} 条；周期内缺失日会明确标记。`;
    $("#stageResult").classList.add("hidden");
    $("#stageResult").innerHTML = "";
    $("#confirmStageButton").disabled = false;
    $("#confirmStageButton").textContent = "确认联网生成";
    $("#stageDialog").showModal();
  }

  function renderStageResult(report) {
    const target = $("#stageResult"); target.innerHTML = ""; target.classList.remove("hidden");
    const title = document.createElement("h3"); title.textContent = report.title;
    const summary = document.createElement("p"); summary.textContent = report.summary;
    const evidenceTitle = document.createElement("h3"); evidenceTitle.textContent = "新增信息";
    const evidence = document.createElement("ul"); (report.newEvidence || []).forEach((text) => { const item = document.createElement("li"); item.textContent = text; evidence.append(item); });
    const changes = document.createElement("p"); changes.textContent = `理解变化：${report.changes.understanding} 行为变化：${report.changes.behavior} 功能变化：${report.changes.function}`;
    const next = document.createElement("p"); next.textContent = `下一步观察：${report.nextFocus}；实验建议：${report.nextExperiment}`;
    target.append(title, summary, evidenceTitle, evidence, changes, next);
  }

  function reset() {
    openingWasTyped = false;
    state = createAssessment(); selected = []; currentResult = null; openingNote = ""; answerNotes = {}; deepQuestions = []; deepAnswers = []; deepIndex = 0; deepSynthesis = null; deepDiveEnhanced = false; deepDiveDismissed = false; deepUpdatedFields = []; deepUpdateSummary = ""; mapRequestState = "idle"; mapRequestError = ""; feedback = null; savedRecordId = null; selectedExperiment = null; selectedExperimentOriginal = null; confusionStart = 5; clarityAfter = 5; editingCycleExperiment = false; rememberForCat = false; similarityDismissed = false; pendingSimilarRecord = null; sessionCheckins = []; interviewRound = 0; interviewSynthetic = false; interviewPartial = false; interviewFailure = ""; interviewQuestion = null; interviewSummary = ""; interviewSummaryConfirmed = false; cognitiveUpdate = ""; actionOutcome = ""; competitionInputSynthetic = false;
    $("#resultPanel").classList.add("hidden", "crisis-mode");
    $("#deskStatePanel").classList.add("hidden");
    $("#cycleDashboard").classList.add("hidden");
    document.querySelectorAll(".journey-step").forEach((section) => section.classList.add("hidden"));
    setMapScene(false);
    $("#notebookHotspot").hidden = false;
    $("#deskOpenJournalButton").hidden = false;
    $("#resetButton").textContent = "重新开始";
    $("#freeNote").value = "";
    renderQuestion();
    if (COMPETITION_EN) applyCompetitionCopy("question");
  }

  async function resetEverything() {
    const message = COMPETITION_EN ? "Clear this session and all saved records, then start again? This cannot be undone." : "清空本轮内容和当前浏览器里的全部记录，然后重新开始？删除后无法恢复。";
    if (!confirm(message)) return;
    await Promise.all([clearRecords(), clearCycles(), clearCheckins()]);
    activeCycle = null;
    reset();
    if (DEMO_MODE) history.replaceState({}, "", `${location.pathname}?demo=${COMPETITION_MODE ? "competition" : "relationship"}&lang=${COMPETITION_EN ? "en" : "zh"}&view=question`);
  }

  async function restartAnalysis() {
    if (activeCycle && !confirm("重新开始会结束当前七日观察，并删除这一轮的打卡记录；已保存的问题地图仍会留在观察记录里。继续吗？")) return;
    const cycleKey = activeCycle?.cycleKey;
    if (cycleKey) {
      const checkins = await allCheckins();
      await Promise.all(checkins.filter((item) => item.cycleKey === cycleKey).map((item) => deleteCheckin(item.id)));
    }
    await clearCycles();
    activeCycle = null;
    reset();
    updateLandingEntry();
  }

  async function closeResultToDesk() {
    $("#resultPanel").classList.add("hidden");
    setMapScene(false);
    if (!feedback || mapReturnView === "question") {
      if (state.completed || state.terminal) state = engine.goBack(state);
      renderQuestion();
    } else if (mapReturnView === "cycle" || activeCycle) await renderCycleDashboard();
    else showDeskExperiment();
    scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  document.querySelectorAll("[data-example-case]").forEach((button) => button.addEventListener("click", () => {
    competitionCase = button.dataset.exampleCase;
    competitionInputSynthetic = true;
    $("#freeNote").value = COMPETITION_CASES[competitionCase][COMPETITION_EN ? "en" : "zh"];
    $("#selectedCount").textContent = COMPETITION_EN ? `${button.textContent} · synthetic example input` : `${button.textContent} · 合成示例输入`;
    document.querySelectorAll("[data-example-case]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    $("#freeNote").focus();
  }));

  document.addEventListener("click", async (event) => {
    if (event.target.closest("#nextButton")) {
      event.stopImmediatePropagation(); event.preventDefault();
      const question = engine.currentQuestion(state);
      if (question?.id === "ENTRY_01") {
        const note = $("#freeNote").value.trim();
        const eventChoice = selected[0] || "";
        if (!eventChoice && !note) { $("#selectedCount").textContent = COMPETITION_EN ? "Choose the closest option, or write one thing that happened." : "选一个最接近的，或者写一句发生的事。"; return; }
        if (hasSafetyLanguage(note)) {
          $("#questionKicker").textContent = COMPETITION_EN ? "SAFETY FIRST" : "现在先处理安全";
          $("#questionTitle").textContent = COMPETITION_EN ? "Use real-world emergency or crisis support now." : "请立即联系可信任的人陪着你，并联系当地紧急服务或危机支持。";
          $("#questionHint").textContent = COMPETITION_EN ? "This content was not sent to AI." : "这段内容没有发送给 AI。";
          $("#optionsGrid").innerHTML = ""; $("#freeNote").closest(".free-note-wrap").classList.add("hidden"); $("#nextButton").classList.add("hidden"); $("#competitionExamples").classList.add("hidden");
          return;
        }
        const optionLabel = question.options.find((option) => option.id === eventChoice)?.label || "";
        competitionInputSynthetic = COMPETITION_MODE && [COMPETITION_CASES.relationship[COMPETITION_EN ? "en" : "zh"], COMPETITION_CASES.job_search[COMPETITION_EN ? "en" : "zh"]].includes(note);
        beginEventInterview(eventChoice, note || optionLabel, Boolean(note));
        return;
      }
      const allowsNote = question && !["CONSENT_01", "NEED_01", "GROUND_01"].includes(question.id) && !question.id.startsWith("SAFE_");
      if (allowsNote) {
        const note = $("#freeNote").value.trim();
        if (hasSafetyLanguage(note)) { $("#selectedCount").textContent = "这句补充可能关系到安全，请先使用明确的安全选项"; return; }
        if (note) answerNotes[question.id] = note; else delete answerNotes[question.id];
        if (question.id === "ENTRY_01") {
          openingNote = note;
          if (!selected.length && note) selected = [inferEntry(note)];
        }
        if (question.id === "UNDERSTANDING_01" && selected.some((value) => ["partly", "no"].includes(value)) && !note) {
          $("#selectedCount").textContent = "请写一句你的纠正，猫会按你的说法继续";
          return;
        }
      }
      if (!selected.length) { $("#selectedCount").textContent = "请先选一项，或在入口写一句"; return; }
      turnQuestionSheet($("#questionPanel"), "next", () => {
        if (!DEMO_MODE && question.id === "CONSENT_01" && selected.includes("continue")) { try { localStorage.setItem(NETWORK_CONSENT_KEY, "yes"); } catch {} }
        if (question.id === "NEED_01") confusionStart = Number($("#confusionLevel").value);
        if (question.id === "GROUND_01" && groundingTimer) { clearInterval(groundingTimer); groundingTimer = null; }
        state = engine.submitAnswer(state, selected);
        if (question.id === "ENTRY_01" && hasExplicitFeeling(openingNote) && engine.currentQuestion(state)?.id === "UNDERSTANDING_01") {
          state = engine.submitAnswer(state, "explicit");
          renderQuestion();
          sayInDialogue("你已经把感受说清楚了。猫按你的话继续，不再替你补一层。");
          return;
        }
        const interim = buildInterimReflection(state);
        if (interim) renderInterimReflection(interim);
        else if (encouragementFor(question.id)) showEncouragement(question.id);
        else renderQuestion();
      });
    }
    if (event.target.closest("#backButton")) {
      event.stopImmediatePropagation(); event.preventDefault();
      if (COMPETITION_MODE && competitionInputStep === "understanding") {
        competitionInputStep = "event";
        renderQuestion();
        applyCompetitionCopy("question");
        $("#freeNote").value = openingNote;
        return;
      }
      turnQuestionSheet($("#questionPanel"), "back", () => { state = engine.goBack(state); if (engine.currentQuestion(state)?.id === "UNDERSTANDING_01" && state.answers.UNDERSTANDING_01?.includes("explicit")) state = engine.goBack(state); renderQuestion(); });
    }
    if (event.target.closest("#resetButton")) {
      event.stopImmediatePropagation(); event.preventDefault();
      if (activeCycle?.status === "active") renderCycleDashboard(); else reset();
    }
  }, true);

  $("#followupNextButton").addEventListener("click", async () => {
    const question = interviewQuestion || deepQuestions[deepIndex];
    const note = $("#followupNote").value.trim();
    if (hasSafetyLanguage(note)) { $("#followupKicker").textContent = COMPETITION_EN ? "SAFETY FIRST" : "现在先处理安全"; $("#followupTitle").textContent = COMPETITION_EN ? "Use real-world emergency or crisis support now." : "请立即联系可信任的人陪着你，并联系当地紧急服务或危机支持。"; $("#followupHint").textContent = COMPETITION_EN ? "This answer was not sent to AI." : "这条回答没有发送给 AI。"; $("#followupOptions").innerHTML = ""; $("#followupNextButton").classList.add("hidden"); return; }
    if (!selectedFollow && !note) { $("#followupHint").textContent = COMPETITION_EN ? "Choose one answer, or say it in your own words." : "请选择一项，或按自己的话说。"; return; }
    const option = question.options.find((item) => item.id === selectedFollow);
    if (interviewQuestion?.mode === "user_summary") {
      if (!note) { $("#followupHint").textContent = COMPETITION_EN ? "Write one or two sentences first." : "先写一两句你的看见。"; return; }
      interviewSummary = note; interviewQuestion = null; renderSummaryConfirmation(); return;
    }
    if (interviewQuestion?.mode === "summary_confirm") {
      if (selectedFollow === "edit") return renderUserSummaryPrompt();
      interviewSummaryConfirmed = true; deepAnswers.push({ id: "USER_SUMMARY", sourceId: "USER_SUMMARY", question: "用户总结", answer: interviewSummary, targetField: "summary" }); interviewQuestion = null; return finishInterviewMap();
    }
    if (interviewQuestion) {
      const answer = note || option?.label;
      const id = `ROUND_${interviewRound + 1}`;
      const record = { id, sourceId: id, question: question.question, questionOptions: question.options || [], targetField: question.targetField, mode: question.mode || "question", answer, unknown: selectedFollow === "unknown" || /还不知道|not yet known|do not know/i.test(answer) };
      if (interviewEditingIndex >= 0) { deepAnswers[interviewEditingIndex] = record; interviewRound = interviewEditingIndex + 1; interviewEditingIndex = -1; }
      else { deepAnswers.push(record); interviewRound += 1; }
      interviewQuestion = null;
      await requestNextInterviewQuestion();
      return;
    }
    const advance = () => { deepAnswers.push({ id: question.id, question: question.title, answer: option?.label || "其他情况", note }); deepIndex += 1; };
    if (deepIndex < deepQuestions.length - 1) turnQuestionSheet($("#followupPanel"), "next", () => { advance(); renderFollowup(); }); else { advance(); await synthesizeDeepDive(); }
  });
  $("#followupNote").addEventListener("input", () => {
    if (interviewQuestion) $("#followupNextButton").disabled = !$("#followupNote").value.trim() && !selectedFollow;
  });

  $("#followupBackButton").addEventListener("click", () => {
    if (currentResult && interviewRound >= 0) {
      if (!interviewRound) { renderQuestion(); if (COMPETITION_EN) applyCompetitionCopy("question"); $("#freeNote").value = openingNote; return; }
      const index = deepAnswers.length - 1;
      const previous = deepAnswers[index];
      if (!previous || !previous.question) return renderResult();
      interviewEditingIndex = index;
      interviewRound = index;
      interviewQuestion = { question: previous.question, options: previous.questionOptions || [], targetField: previous.targetField, mode: previous.mode, reflection: "", savedAnswer: previous.answer };
      renderInterviewQuestion(interviewQuestion);
      return;
    }
    if (deepIndex === 0) return renderResult();
    turnQuestionSheet($("#followupPanel"), "back", () => { deepIndex -= 1; deepAnswers.pop(); renderFollowup(); });
  });
  $("#finishFollowupsButton").addEventListener("click", () => finishInterviewMap({ partial: true }));

  $("#deepDiveButton").addEventListener("click", () => COMPETITION_MODE || mapRequestState === "local" || !deepSynthesis ? requestAiMap() : startDeepBatch());
  $("#closeResultButton").addEventListener("click", () => COMPETITION_EN ? showDemoView("question") : closeResultToDesk());
  $("#skipDeepButton").addEventListener("click", acceptCompetitionFallback);
  $("#setupApiKeyButton").addEventListener("click", () => { window.location.href = "/api-setup.html"; });
  $("#continueDeepButton").addEventListener("click", () => requestNextInterviewQuestion());
  $("#toExperimentButton").addEventListener("click", async () => {
    if (!feedback || !mapCanExperiment()) return;
    await saveObservation({ silent: true });
    showDeskExperiment();
  });
  ["#experimentPrediction", "#experimentAction", "#experimentOutcome", "#experimentContinue", "#experimentFallback", "#experimentMeaning", "#experimentWhen", "#experimentContext"].forEach((selector) => {
    $(selector).addEventListener("input", () => { if (selectedExperiment) selectedExperiment = experimentFromForm(); $("#restoreExperimentButton").classList.toggle("hidden", !selectedExperiment?.userEditedFields?.length); $("#startCycleButton").disabled = !experimentReady(); });
    $(selector).addEventListener("change", () => saveObservation({ silent: true }).catch(() => {}));
  });
  $("#showCatSuggestionButton").addEventListener("click", () => {
    const options = $("#experimentOptions");
    options.classList.remove("hidden");
    $("#saveStatus").textContent = COMPETITION_EN ? "Cat has one suggestion that seeks real feedback. You can use it or write your own." : "猫放了一条能取得现实反馈的建议。你可以用，也可以写自己的。";
  });
  $("#useOwnExperimentButton").addEventListener("click", () => {
    const action = $("#experimentProposal").value.trim();
    if (!action) { $("#saveStatus").textContent = COMPETITION_EN ? "Write one action you control first." : "先写一个你能控制的小动作。"; return; }
    const dependsOnOther = /让.{0,12}(?:回复|答应|改变)|确保|保证|说服|逼问|到底要不要|make .{0,20}(?:reply|agree|change)|ensure|guarantee|convince/i.test(action);
    if (!experimentSafeAction(action) || dependsOnOther || action.length > 180) {
      $("#saveStatus").textContent = COMPETITION_EN ? "That depends on another person's response or is still too large. Keep only the part you can do, such as drafting one clear invitation and choosing when to send it." : "这个动作还把结果系在别人身上，或者仍然太大。先只保留你能决定的部分，例如写一条清楚、不指责的邀请，并决定发送时间。";
      return;
    }
    selectedExperimentOriginal = null;
    selectedExperiment = fillExperimentForm(normalizeExperiment({
      id: "user_action",
      title: COMPETITION_EN ? "Your test action" : "你的验证动作",
      prediction: deepSynthesis?.map?.meaning,
      action: COMPETITION_EN ? `First step: ${action.replace(/^First step:\s*/i, "")}` : `第一步：${action.replace(/^第一步：/, "")}`,
      observableOutcome: COMPETITION_EN ? "Give the step enough time to produce a result. Write down what happened, what you did, and whether your original worry still fits." : "使用能获得有效反馈的最短时间；记录新事实、自己实际做了什么，以及原判断是否需要更新。"
    }));
    $("#startCycleButton").disabled = !experimentReady();
    $("#saveStatus").textContent = COMPETITION_EN ? "This part is yours to control. Check the observation and stopping conditions below." : "这部分由你决定，也可以停止。再核对观察、继续和停止条件。";
  });
  $("#experimentTiming").addEventListener("change", () => {
    $("#experimentSchedule").classList.toggle("hidden", $("#experimentTiming").value !== "later");
    if (selectedExperiment) selectedExperiment = experimentFromForm();
    $("#startCycleButton").disabled = !experimentReady();
  });
  $("#needsPattern").addEventListener("change", () => { if (selectedExperiment) selectedExperiment = experimentFromForm(); });
  $("#rememberForCat").addEventListener("change", () => { rememberForCat = $("#rememberForCat").checked; $("#selectedCount").textContent = rememberForCat ? "已选择留给小猫" : "这次不会自动保存"; });
  $("#restoreExperimentButton").addEventListener("click", () => { if (!selectedExperimentOriginal) return; selectedExperiment = fillExperimentForm(selectedExperimentOriginal); $("#restoreExperimentButton").classList.add("hidden"); $("#startCycleButton").disabled = !experimentReady(); saveObservation({ silent: true }).catch(() => {}); });
  $("#cancelCycleExperimentButton").addEventListener("click", () => { editingCycleExperiment = false; renderCycleDashboard(); });
  $("#startCycleButton").addEventListener("click", () => {
    const action = editingCycleExperiment ? saveCycleExperiment() : startActionBranch();
    if (!action?.catch) return;
    action.catch((error) => { $("#saveStatus").textContent = `保存失败：${error.message}`; });
  });
  $("#actionDoneButton").addEventListener("click", () => { actionOutcome = ""; openObservation(); $("#observationActual").focus(); });
  const showBlocked = () => { $("#blockedPart").value = ""; if (COMPETITION_EN) { $("#blockedStep .result-step").textContent = "NOT DONE"; $("#blockedStep h2").textContent = "This step may still be too large, or not right for now."; $("#blockedPart").previousElementSibling.textContent = "Where did you stop?"; $("#shrinkFromBlockButton").textContent = "Make the action smaller"; $("#blockedEndButton").textContent = "Stop here today"; } showJourneyStep("blockedStep"); $("#blockedPart").focus(); };
  $("#actionNotDoneButton").addEventListener("click", showBlocked);
  $("#actionShrinkButton").addEventListener("click", showBlocked);
  $("#shrinkFromBlockButton").addEventListener("click", () => { showDeskExperiment(); $("#experimentProposal").value = $("#blockedPart").value.trim(); $("#experimentProposal").focus(); $("#saveStatus").textContent = COMPETITION_EN ? "Keep only the first part you can do now." : "只留下现在做得到的第一小步。"; });
  $("#blockedEndButton").addEventListener("click", () => showJourneyClosing({ pending: true }));
  $("#todoEndButton").addEventListener("click", () => showJourneyClosing({ pending: true }));
  $("#todoDoneButton").addEventListener("click", openObservation);
  $("#copyTodoButton").addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#todoSummary").textContent); $("#copyTodoButton").textContent = COMPETITION_EN ? "Copied" : "已复制"; } catch { $("#todoSummary").focus?.(); } });
  document.querySelector(".update-choices").addEventListener("change", (event) => {
    cognitiveUpdate = event.target.value;
    const custom = cognitiveUpdate === "custom";
    $("#cognitiveUpdateCustomLabel").classList.toggle("hidden", !custom);
    $("#cognitiveUpdateCustom").classList.toggle("hidden", !custom);
    if (custom) $("#cognitiveUpdateCustom").focus();
  });
  $("#finishObservationButton").addEventListener("click", () => {
    const actual = $("#observationActual").value.trim();
    if (!actual) { $("#observationStatus").textContent = COMPETITION_EN ? "Write only what actually happened." : "先写实际发生了什么。"; return; }
    if (!cognitiveUpdate || (cognitiveUpdate === "custom" && !$("#cognitiveUpdateCustom").value.trim())) { $("#observationStatus").textContent = COMPETITION_EN ? "Choose how the original worry looks now, or write your own view." : "先判断原来的担心现在怎样，或者按自己的话写。"; return; }
    actionOutcome = actual;
    showJourneyClosing();
  });
  $("#finishJourneyButton").addEventListener("click", async () => {
    const choice = document.querySelector('input[name="journeySave"]:checked')?.value || "discard";
    if (choice === "remember" && !DEMO_MODE) { rememberForCat = true; $("#rememberForCat").checked = true; await saveObservation({ silent: true }); }
    reset(); updateLandingEntry();
  });
  $("#finishAtMapButton").addEventListener("click", () => showJourneyClosing({ pending: true }));

  document.querySelectorAll("[data-desk-effect]").forEach((hotspot) => hotspot.addEventListener("click", () => playDeskEffect(hotspot.dataset.deskEffect)));
  $("#notebookHotspot").addEventListener("click", () => { clearDeskEffects(); openJournal(); });
  $("#mapHotspot").addEventListener("click", async () => {
    const origin = activeCycle ? "cycle" : savedRecordId ? "experiment" : "question";
    if (await openLatestMap(origin)) return;
    const hotspot = $("#mapHotspot"); hotspot.classList.add("is-locked");
    $("#mapHotspotHint").textContent = "完成问题整理后，地图会收在这里";
    setTimeout(() => hotspot.classList.remove("is-locked"), 1200);
  });
  $("#deskExperimentMapButton").addEventListener("click", () => renderResult());
  $("#deskOpenMapButton").addEventListener("click", () => openLatestMap("cycle"));
  $("#deskOpenJournalButton").addEventListener("click", () => openJournal());
  $("#editCycleExperimentButton").addEventListener("click", () => showDeskExperiment({ editCycle: true }));
  $("#closeJournalButton").addEventListener("click", () => closeJournal());
  $("#journalStartButton").addEventListener("click", () => {
    if (!activeCycle) return closeJournal();
    closeJournal({ restore: false, focus: false });
    openCheckin(today(), "instant");
  });
  $("#journalCoverNextButton").addEventListener("click", () => setJournalPage(1));
  $("#journalPrevButton").addEventListener("click", () => setJournalPage(journalPage - 1));
  $("#journalNextButton").addEventListener("click", () => setJournalPage(journalPage + 1));
  $("#journalDialog").addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); setJournalPage(journalPage - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); setJournalPage(journalPage + 1); }
  });
  $("#journalDialog").addEventListener("cancel", (event) => { event.preventDefault(); closeJournal(); });

  $("#viewCycleMapButton").addEventListener("click", () => {
    if (DEMO_MODE) return showDemoView("result");
    closeJournal({ restore: false, focus: false });
    openLatestMap("cycle");
  });
  $("#startCheckinButton").addEventListener("click", () => openCheckin(today(), "instant"));
  $("#restartAnalysisButton").addEventListener("click", () => restartAnalysis().catch((error) => { $("#cycleDashboardStatus").textContent = `重新开始失败：${error.message}`; }));
  $("#recallCheckinButton").addEventListener("click", () => openCheckin(addDays(today(), -1), "recall"));
  $("#stageReportButton").addEventListener("click", (event) => event.currentTarget.dataset.stage === "closing" ? openPendingClosingFeedback() : openStageReport(Number(event.currentTarget.dataset.stage)));
  $("#completeCycleButton").addEventListener("click", () => openCycleCompletion());
  $("#closeCycleCompleteButton").addEventListener("click", () => completionNextStep ? finishClosingFeedback() : $("#cycleCompleteDialog").close());
  $("#confirmCycleCompleteButton").addEventListener("click", () => completeCycleLocally().catch((error) => { $("#cycleCompleteStatus").textContent = `保存失败：${error.message}`; }));
  $("#retryClosingFeedbackButton").addEventListener("click", () => requestClosingFeedback());
  $("#finishClosingFeedbackButton").addEventListener("click", () => finishClosingFeedback());
  $("#closeCheckinButton").addEventListener("click", () => $("#checkinDialog").close());
  $("#reviewSimilarButton").addEventListener("click", () => {
    if (!pendingSimilarRecord) return;
    $("#similarMemoryDetail").textContent = `上次确认的摘要：${pendingSimilarRecord.eventSummary || pendingSimilarRecord.map?.fact || "尚未确认"}`;
  });
  $("#dismissSimilarButton").addEventListener("click", () => {
    similarityDismissed = true;
    pendingSimilarRecord = null;
    $("#similarMemory").classList.add("hidden");
  });
  $("#confusionLevel").addEventListener("input", () => { $("#confusionOutput").value = $("#confusionLevel").value; });
  $("#clarityLevel").addEventListener("input", () => { clarityAfter = Number($("#clarityLevel").value); $("#clarityOutput").value = clarityAfter; });
  $("#groundingTimerButton").addEventListener("click", () => {
    if (groundingTimer) return;
    let remaining = 30;
    $("#groundingTimerButton").disabled = true;
    $("#groundingTimerStatus").textContent = `${remaining} 秒 · 慢慢呼气`;
    groundingTimer = setInterval(() => {
      remaining -= 1;
      $("#groundingTimerStatus").textContent = remaining ? `${remaining} 秒 · 慢慢呼气` : "可以继续整理了";
      if (!remaining) { clearInterval(groundingTimer); groundingTimer = null; $("#groundingTimerButton").disabled = false; $("#groundingTimerButton").textContent = "再做 30 秒"; }
    }, 1000);
  });
  $("#distressLevel").addEventListener("input", () => { $("#distressOutput").value = $("#distressLevel").value; });
  $("#distressAfter").addEventListener("input", () => { $("#distressAfterOutput").value = $("#distressAfter").value; });
  $("#functionLevel").addEventListener("input", () => { $("#functionOutput").value = $("#functionLevel").value; });
  $("#eventOccurrence").addEventListener("change", updateCheckinBranch);
  $("#checkinForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const freeText = [$("#eventNote").value, $("#experimentResult").value, $("#checkinLearning").value, $("#alternativeHypothesis").value].join(" ");
    if (hasSafetyLanguage(freeText)) { $("#checkinStatus").textContent = "这段记录可能关系到现实安全。普通打卡已停止，请联系可信任的人或当地紧急服务。"; return; }
    const date = $("#checkinDate").value;
    const occurrence = $("#eventOccurrence").value;
    const applicable = ["yes", "mild"].includes(occurrence);
    const optionalOpen = applicable && $("#checkinOptional").open;
    const checkin = {
      id: `${activeCycle.cycleKey}:${date}`, cycleKey: activeCycle.cycleKey, date, mode: $("#checkinMode").value,
      eventOccurrence: occurrence, eventNote: applicable ? $("#eventNote").value.trim() : "", distress: applicable ? Number($("#distressLevel").value) : null, distressAfter: applicable ? Number($("#distressAfter").value) : null,
      experimentDone: applicable ? $("#experimentDone").value : "not_applicable", experimentResult: applicable ? $("#experimentResult").value.trim() : "", learning: optionalOpen ? $("#checkinLearning").value.trim() : "",
      evidenceDirection: optionalOpen ? $("#evidenceDirection").value : "", alternativeHypothesis: optionalOpen ? $("#alternativeHypothesis").value.trim() : "", functionImpact: optionalOpen ? Number($("#functionLevel").value) : null,
      experimentVersion: activeCycle.experimentVersion || 1,
      updatedAt: new Date().toISOString()
    };
    await putCheckin(checkin);
    $("#checkinDialog").close();
    journalCheckins = await cycleCheckins();
    if ($("#journalDialog").open) renderJournalPage();
    await renderCycleDashboard();
    if (applicable && ["yes", "partial"].includes(checkin.experimentDone)) $("#cycleDashboardStatus").textContent = "你完成了一个由自己控制的动作，也得到了一条现实信息。现在可以用它更新原来的判断；他人的反应只是信息，不是对你价值的评定。";
    else if (applicable) {
      showDeskExperiment({ editCycle: true });
      $("#saveStatus").textContent = "这次没有执行，不算失败，也不用补打卡。具体卡在哪一步？把第一步缩小到现在做得到的程度。";
      $("#experimentAction").focus();
    }
  });

  $("#closeStageButton").addEventListener("click", () => $("#stageDialog").close());
  $("#confirmStageButton").addEventListener("click", async () => {
    if (!pendingStage) return;
    $("#confirmStageButton").disabled = true; $("#confirmStageButton").textContent = "猫正在整理记录……";
    try {
      const report = await postJson("/api/cycle/report", {
        stage: pendingStage.stage,
        cycle: { startDate: activeCycle.startDate, endDate: activeCycle.endDate, topic: activeCycle.topic, feedback: activeCycle.feedback, map: activeCycle.map, concepts: activeCycle.concepts, alternatives: activeCycle.alternatives, experiment: activeCycle.experiment },
        checkins: pendingStage.checkins,
        safetyRisk: false
      });
      activeCycle.reports = { ...(activeCycle.reports || {}), [pendingStage.stage]: report };
      await putCycle(activeCycle); renderStageResult(report); await renderCycleDashboard();
      $("#confirmStageButton").textContent = "报告已生成";
    } catch (error) {
      $("#confirmStageButton").disabled = false; $("#confirmStageButton").textContent = "重新生成";
      $("#stagePreview").textContent = `生成失败：${error.message}`;
    }
  });

  $("#applyMapCorrectionButton").addEventListener("click", async () => {
    const correction = $("#mapCorrection").value.trim();
    if (!correction) { $("#confirmStatus").textContent = COMPETITION_EN ? "Write the part Cat should change." : "先写下猫应该改哪一部分。"; return; }
    if (hasSafetyLanguage(correction)) { $("#confirmStatus").textContent = COMPETITION_EN ? "Use real-world safety support now. This correction was not sent to AI." : "这段纠正涉及安全。请先使用现实支持，这段内容没有发送给 AI。"; return; }
    const previousMap = editedMap();
    const id = `USER_CORRECTION_${deepAnswers.filter((answer) => answer.id?.startsWith("USER_CORRECTION")).length + 1}`;
    const correctionAnswer = { id, sourceId: id, question: "Map correction", targetField: "correction", answer: correction, note: correction };
    $("#applyMapCorrectionButton").disabled = true;
    $("#confirmStatus").textContent = COMPETITION_EN ? "Cat is changing only the affected parts." : feedback === "不太像" ? "猫看偏了。按你的话重来。" : "猫正在按你的话修改相关部分。";
    try {
      const updated = await postJson("/api/map/analyze", { topic: deepTopic(), result: currentResult, stateAnswers: { ENTRY_01: [openingNote] }, note: openingNote, notes: { ENTRY_01: openingNote }, answers: [...deepAnswers, correctionAnswer], currentMap: previousMap, correction, safetyRisk: false, language: COMPETITION_EN ? "en" : "zh" });
      deepAnswers.push(correctionAnswer);
      deepUpdatedFields = Object.keys(mapLabels).filter((key) => String(previousMap[key]) !== String(updated.map?.[key]));
      deepSynthesis = updated;
      feedback = null;
      $("#mapCorrection").value = "";
      renderResult();
      $("#confirmStatus").textContent = COMPETITION_EN ? `Cat changed ${deepUpdatedFields.length || 1} part. Check the map again.` : `猫改了${deepUpdatedFields.length || 1}处，你再看看。`;
      requestAnimationFrame(() => document.querySelector(".deep-map-field.just-updated textarea")?.focus());
    } catch (error) {
      $("#confirmStatus").textContent = `${COMPETITION_EN ? "Live AI is unavailable. Your correction is still in this field" : "实时 AI 暂不可用。你的纠正仍留在输入框里"}：${error.message}`;
    } finally { $("#applyMapCorrectionButton").disabled = false; }
  });

  $(".confirm-actions").addEventListener("click", async (event) => {
    const choice = event.target.closest("button")?.dataset.feedback;
    if (!choice) return;
    feedback = choice;
    [...$(".confirm-actions").querySelectorAll("button")].forEach((button) => button.classList.toggle("selected", button.dataset.feedback === feedback));
    $("#confirmStatus").textContent = COMPETITION_EN ? (choice === "很像" ? "Confirmed. This map stays here until you choose the next step." : "Write the part that does not fit. Cat will change only the affected parts.") : choice === "很像" ? "你已确认。这张地图先放在这里。接下来不急着判断谁对谁错，只找一个你能决定的小动作，看看现实会告诉你什么。" : choice === "有一点像" ? "哪一部分不太像？猫只改相关步骤。" : "猫看偏了。按你的话重来。";
    $("#mapCorrectionLabel").textContent = COMPETITION_EN ? "What should the map revise?" : choice === "有一点像" ? "哪一段准确，哪一段不准确？" : "哪些地方不准确或遗漏了？";
    $("#mapCorrectionWrap").classList.toggle("hidden", !["有一点像", "不太像"].includes(choice));
    $("#toExperimentButton").disabled = choice !== "很像" || !mapCanExperiment();
    if (["有一点像", "不太像"].includes(choice)) $("#mapCorrection").focus();
    mapReturnView = "experiment";
    await saveObservation({ silent: true });
  });

  $(".coach-prompts").addEventListener("click", (event) => { const prompt = event.target.closest("button")?.dataset.prompt; if (prompt) $("#coachQuestion").value = prompt; });
  $("#coachAskButton").addEventListener("click", async () => {
    if (currentResult?.type !== "reflection") return;
    const question = $("#coachQuestion").value.trim(); if (!question) return;
    const answer = $("#coachAnswer"); answer.innerHTML = "<span>猫正在联网</span><p>只发送当前结果卡和你刚输入的问题。</p>";
    if (hasSafetyLanguage(question)) { answer.innerHTML = "<span>现在先不联网分析</span><p>这句话可能关系到现实安全。请立即联系可信任的人陪着你；如果不能保证安全，请联系当地紧急服务。</p>"; return; }
    try {
      const reply = await postJson("/api/chat", { result: currentResult, question, safetyRisk: false });
      answer.innerHTML = `<span>${escapeHtml(reply.title)}</span>${reply.answer.split(/\n\s*\n/).map((text) => `<p>${escapeHtml(text)}</p>`).join("")}`;
    } catch (error) { answer.innerHTML = `<span>猫暂时连不上外面</span><p>${escapeHtml(error.message)}。本地结果仍然可用。</p>`; }
  });

  $("#historyButton").addEventListener("click", async () => { await renderHistory(); $("#historyDialog").showModal(); });
  $("#closeHistoryButton").addEventListener("click", () => $("#historyDialog").close());
  const openNetworkPrivacy = () => {
    $("#networkPrivacyStatus").textContent = COMPETITION_MODE ? (COMPETITION_EN ? "Live AI is used by default; synthetic fallback requires your choice." : "默认使用实时 AI；只有你明确选择后才显示合成兜底。") : RELATIONSHIP_DEMO ? "当前固定关系演示保持离线。" : hasNetworkConsent() ? "已允许本轮产品使用上述联网范围。" : "尚未允许联网；重新开始后会再次显示边界说明。";
    $("#networkPrivacyDialog").showModal();
  };
  $("#networkPrivacyButton").addEventListener("click", openNetworkPrivacy);
  $("#landingAiDetailsButton").addEventListener("click", openNetworkPrivacy);
  $("#closeNetworkPrivacyButton").addEventListener("click", () => $("#networkPrivacyDialog").close());
  $("#revokeNetworkConsentButton").addEventListener("click", () => { if (DEMO_MODE) return; try { localStorage.removeItem(NETWORK_CONSENT_KEY); } catch {} $("#networkPrivacyStatus").textContent = "已撤回。现有本地记录不会删除；新的 AI 请求会停止，重新开始后可再次确认。"; });
  $("#clearHistoryButton").addEventListener("click", async () => {
    if (!confirm("清空当前浏览器里的全部问题地图、七日周期和打卡记录？删除后无法恢复。")) return;
    await Promise.all([clearRecords(), clearCycles(), clearCheckins()]);
    savedRecordId = null; activeCycle = null; await renderHistory(); await renderMemory(); reset();
  });

  const localBadge = document.createElement("span"); localBadge.textContent = COMPETITION_MODE ? (COMPETITION_EN ? "Live AI · Example input · Nothing saved" : "实时 AI · 合成示例输入 · 不保存") : RELATIONSHIP_DEMO ? "固定演示 · 不联网 · 不保存" : "本地安全判断 · AI 联网地图"; $(".status-strip").append(localBadge);
  $("#enterDeskButton").addEventListener("click", () => enterDesk());
  if (DEMO_MODE) {
    if (!COMPETITION_MODE || params.has("view")) enterDesk({ animate: false });
    initDemo();
  }
  else (async () => { await renderMemory(); await restoreDesk(); updateLandingEntry(); })();
})();
