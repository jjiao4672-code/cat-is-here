const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const script = fs.readFileSync("adaptive.js", "utf8");
const server = fs.readFileSync("server.mjs", "utf8");
const css = fs.readFileSync("styles.css", "utf8");

test("entry accepts an option, text, or both and keeps text primary", () => {
  assert.match(script, /if \(!eventChoice && !note\)/);
  assert.match(script, /beginEventInterview\(eventChoice, note \|\| optionLabel, Boolean\(note\) && !\(competitionInputSynthetic && competitionCase === "relationship"\)\)/);
  assert.match(script, /eventIsSpecific: openingWasTyped/);
  assert.match(script, /state\.answers\.ENTRY_01 = eventChoice \? \[eventChoice\] : \[inferEntry\(openingNote\)\]/);
  assert.match(html, /选一个最接近的，也可以直接写|id="freeNote"/);
  assert.match(script, /选一个大致类别，或者直接写一件具体的事/);
});

test("the category entry and concrete-event gate ask two different things", () => {
  assert.match(script, /这次更接近哪一类情况/);
  assert.match(script, /先选一个大致类别；如果已经想到具体事情，也可以直接写/);
  assert.match(script, /eventIsSpecific: openingWasTyped/);
  assert.match(server, /最近哪一件事让你开始难受/);
  assert.match(server, /isSpecificEvent\(eventText, body\.eventIsSpecific\)/);
});

test("each live round depends on confirmed prior answers and returns one question", () => {
  assert.match(script, /postJson\("\/api\/map\/followups"[\s\S]*priorAnswers: deepAnswers[\s\S]*round: interviewRound \+ 1/);
  assert.match(server, /每次只返回一句短复述和一个下一问/);
  assert.match(server, /下一问必须依赖最新回答/);
  assert.match(server, /questionMarks !== 1/);
  assert.match(server, /data\.options\.length < 1 \|\| data\.options\.length > 3/);
});

test("dynamic options stay optional beside user-owned text", () => {
  assert.match(html, /id="followupReflection"[\s\S]*id="followupTitle"[\s\S]*id="followupOptions"[\s\S]*id="followupNote"/);
  assert.match(script, /都不太像，我自己说/);
  assert.match(script, /const answer = note \|\| option\?\.label/);
  assert.match(script, /selectedFollow === "unknown"/);
  assert.match(css, /\.followup-options\{display:flex!important;flex-direction:column/);
});

test("the interview stays user-led and asks for a summary before the map", () => {
  assert.match(script, /const interviewLimit = 10/);
  assert.match(script, /missingDepth \? renderRequiredDepthGap\(missingDepth\) : renderUserSummaryPrompt\(\)/);
  assert.match(script, /if \(data\.readyForMap && deepAnswers\.length >= 2\)/);
  assert.match(script, /renderRequiredGap\(missing\)/);
  assert.match(script, /mode: "user_summary"/);
  assert.match(script, /interviewQuestion\?\.mode === "user_summary"/);
  assert.match(server, /在 evidence 阶段明确区分判断和事实/);
  assert.match(server, /mode: "counterevidence"/);
  assert.match(server, /不要限定为求职原因/);
  assert.match(server, /用户没有表达自我否定，不能替用户加入这一判断/);
  assert.match(script, /#finishFollowupsButton"\)\.classList\.add\("hidden"\)/);
});

test("typed answers are sent with their questions and cannot trigger repeated fields", () => {
  assert.match(server, /question: String\(answer\?\.question/);
  assert.match(server, /knownFields\.has\(targetField\) && !usefulSecondPass/);
  assert.match(server, /previousQuestions, knownFields, knownModes/);
  assert.match(script, /duplicateQuestion \|\| \(repeatedField && !usefulSecondPass\)/);
});

test("going back restores an answer that can be submitted without reselecting it", () => {
  assert.match(script, /savedOption \? "" : savedAnswer/);
  assert.match(script, /followupNextButton"\)\.disabled = !selectedFollow && !\$\("#followupNote"\)\.value\.trim\(\)/);
});

test("user claims stay grounded in typed or confirmed answers", () => {
  assert.match(server, /!knownFields\.includes\("fact"\)/);
  assert.match(server, /最近哪一件事让你开始难受？写一句就够了/);
  assert.match(server, /sourceValuesByField\[answer\.targetField\]/);
  assert.match(server, /cleanedMap\[key\] = cleanVisible\(sourceValuesByField\[key\]/);
  assert.match(server, /const refs = \(sourceByField\[key\] \|\| \[\]\)/);
  assert.doesNotMatch(script.match(/function renderRequiredGap\(field\)[\s\S]*?\n  }/)?.[0] || "", /不够好|停止继续投递|后来更焦虑/);
  assert.match(server, /ungroundedScenarioIssues\(sourceText, \{ reflection, question, options \}\)/);
  assert.match(server, /ungroundedScenarioIssues\(synthesisSource, synthesis\)/);
  assert.match(server, /禁止用常见案例补空白/);
  assert.doesNotMatch(server.match(/function fallbackNextQuestion[\s\S]*?\n}/)?.[0] || "", /再次被拒绝或发生冲突|More rejection or conflict/);
});

test("a relationship event cannot become an unsupported judgment about the self", () => {
  assert.match(server, /const unsupportedSelfFocus =/);
  assert.match(server, /用户没有把这件事归因于自己，不能把下一问引向自我评价/);
});

test("secondary meaning probes cannot replace the user's main interpretation", () => {
  assert.match(server, /const isCoreFieldAnswer = .*secondaryMeaningModes\.has/);
  assert.match(server, /depthProbeModes = \["evidence", "counterevidence", "alternative", "protective_purpose"\]/);
  assert.match(server, /priorAnswers\.filter\(isCoreFieldAnswer\)/);
  assert.match(server, /!isCoreFieldAnswer\(answer\)/);
  assert.match(script, /answeredFields = \(\) => new Set\(deepAnswers\.filter\(isCoreFieldAnswer\)/);
  assert.match(script, /deepSynthesis\.map = confirmedMap/);
  assert.match(script, /prediction: confirmedMap\.meaning/);
});

test("the map action field cannot be filled by a future experiment", () => {
  assert.match(server, /行为字段只能问已经做了什么或没有做什么；未来动作留到实验页/);
  assert.match(server, /targetField === "move"[\s\S]*this week\|next time\|tomorrow/);
  assert.match(server, /你希望.{0,20}做/);
  assert.match(server, /地图完成前禁止问用户希望、打算、可以或将会做什么/);
});

test("short reflections cannot reverse waiting into stopping", () => {
  assert.match(server, /stopped and waited[\s\S]*stopped waiting/);
  assert.match(server, /短复述把继续等待误写成停止等待/);
});

test("the first follow-up after a concrete event asks for feeling before interpretation", () => {
  const feelingStage = server.indexOf('{ targetField: "feeling", mode: "feeling" }');
  const meaningStage = server.indexOf('{ targetField: "meaning", mode: "question" }');
  assert.ok(feelingStage > 0 && feelingStage < meaningStage);
  assert.match(server, /expectedStage\.mode === "feeling"/);
  assert.match(server, /这件事发生时，你有什么感受/);
  assert.match(server, /targetField: "feeling", mode: "feeling"/);
});

test("a broad category asks for one concrete event without pretending to be Live AI", () => {
  assert.match(server, /先不急着解释。猫需要一件真的发生过的事/);
  assert.match(server, /最近哪一件事让你开始难受？写一句就够了/);
  assert.match(script, /const factCheck = question\.mode === "fact_check"/);
  assert.match(script, /factCheck \? \(COMPETITION_EN \? "ONE SPECIFIC EVENT" : "先说具体一点"\)/);
  assert.match(script, /factCheck \? options\.before\(freeWrap\) : options\.after\(freeWrap\)/);
  assert.match(script, /用自己的话说这件事/);
});

test("all map fields are asked before summary and answered placeholders are repaired", () => {
  assert.match(script, /\["meaning", "feeling", "move", "result"\]\.find/);
  assert.match(script, /not asked yet/i);
  assert.doesNotMatch(script, /Prepare only|只做准备/);
  assert.match(server, /动作必须取得一条能区分原判断和 alternative 的现实信息/);
  assert.match(script, /suggestedAction/);
});

test("depth stages must cover evidence, alternatives, consequences, and possible protection", () => {
  assert.match(server, /reflectionStages = \[[\s\S]*mode: "evidence"[\s\S]*mode: "counterevidence"[\s\S]*mode: "alternative"[\s\S]*mode: "action"[\s\S]*mode: "result"[\s\S]*mode: "protective_purpose"/);
  assert.match(server, /依据、反例、替代解释和保护作用尚未问全/);
  assert.match(server, /不能断言用户故意这样做/);
  assert.match(server, /resultHeldBack[\s\S]*没有带来核对原判断的新事实/);
  assert.match(server, /protectivePurpose[\s\S]*由你判断，不是事实/);
  assert.match(script, /function applyInterviewAnswersToSynthetic/);
  assert.match(script, /base\.map = \{ \.\.\.base\.map, \.\.\.byField, fact: openingNote \}/);
  assert.match(script, /if \(COMPETITION_MODE\) deepSynthesis = applyInterviewAnswersToSynthetic/);
});

test("partial maps distinguish not asked, not known, and valid absence", () => {
  assert.match(script, /asked \? "还不知道" : "还没说到"/);
  assert.match(server, /没有明显感受/);
  assert.match(server, /没有采取行动/);
  assert.match(server, /没有问到的字段写“还没说到”/);
  assert.match(server, /已经问过但用户不知道/);
});

test("the Problem Map is one editable chain and corrections return for confirmation", () => {
  assert.match(css, /\.deep-map-grid\{display:flex!important;[\s\S]*flex-direction:column/);
  assert.doesNotMatch(html, /id="mapCoreCard"/);
  assert.match(script, /猫的猜想，等你判断/);
  assert.match(script, /结果怎样（当下 \/ 后来）/);
  assert.match(script, /map-chain-node/);
  assert.match(script, /map-after-layer/);
  assert.match(html, /id="applyMapCorrectionButton"/);
  assert.match(script, /USER_CORRECTION_/);
  assert.match(script, /deepUpdatedFields = Object\.keys\(mapLabels\)/);
  assert.match(script, /feedback = null/);
  assert.match(script, /按你的话改了/);
});

test("an experiment starts only after confirmation and begins with the user's action", () => {
  assert.match(script, /const feedbackAllowsExperiment = \(\) => \["很像", "有一点像"\]\.includes\(feedback\)/);
  assert.match(script, /!feedbackAllowsExperiment\(\) \|\| !mapCanExperiment/);
  assert.match(html, /如果只做一件很小的事/);
  assert.match(html, /id="experimentProposal"[\s\S]*id="showCatSuggestionButton"/);
  assert.match(script, /showCatSuggestionButton[\s\S]*options\.classList\.remove\("hidden"\)/);
  assert.match(script, /dependsOnOther/);
});

test("the map adds a grounded Adlerian reading and bridges the guess to an experiment", () => {
  for (const id of ["catTemporaryUnderstanding", "adlerPerspectiveTitle", "adlerPerspectiveText", "adlerPerspectiveBoundary", "experimentBridge"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(server, /const adlerAnalysis = protectivePurpose/);
  assert.match(server, /title: "行为的方向"/);
  assert.match(server, /title: "主观意义"/);
  assert.match(server, /不能证明隐藏动机，也不是对你人格的判断/);
  assert.match(script, /这目前只是猫的猜想。要是你觉得和自己的经历有一点像，我们可以一起想一个小实验/);
});

test("action routing covers now, todo, not done, and shrinking", () => {
  for (const id of ["actionWaitStep", "todoStep", "blockedStep", "observationStep", "journeyClosingStep"]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(script, /selectedExperiment\.timing === "later"/);
  assert.match(script, /selectedExperiment\.timing === "not_now"/);
  assert.match(script, /actionNotDoneButton/);
  assert.match(script, /shrinkFromBlockButton/);
  assert.doesNotMatch(`${html}\n${script}`, /actionWaitStep[\s\S]{0,300}(倒计时|timer|setInterval)/i);
});

test("the user judges the observation before Cat summarizes it", () => {
  assert.match(html, /现在看，原来的担心怎么样了/);
  assert.equal((html.match(/name="cognitiveUpdate"/g) || []).length, 5);
  assert.ok(script.indexOf("const updateLabels") < script.indexOf("journeySummary").valueOf());
  assert.match(script, /你已经完成了自己能决定的部分。对方怎样回应，还要等现实给出信息/);
});

test("saving is explicit, structured, and disabled in competition", () => {
  assert.equal((html.match(/name="journeySave"/g) || []).length, 3);
  assert.match(script, /choice === "remember" && !DEMO_MODE/);
  assert.match(script, /rememberForCat"\)\.closest\("label"\)\.classList\.toggle\("hidden", COMPETITION_MODE\)/);
  assert.match(script, /save-choices"\)\.classList\.toggle\("hidden", COMPETITION_MODE\)/);
  assert.match(script, /if \(rememberForCat\) \{\s*await putRecord\(record\)/);
  assert.match(script, /const DEMO_MODE = RELATIONSHIP_DEMO \|\| COMPETITION_MODE/);
  assert.match(html, /不保存完整对话/);
});

test("invalid placeholders and silent fallback are blocked at both boundaries", () => {
  assert.match(server, /invalidVisibleValue/);
  assert.match(server, /punctuationOnly/);
  assert.match(server, /cleanVisible\(typeof data\.map\[key\]/);
  assert.match(script, /invalidVisibleValue/);
  assert.match(script, /safeVisible/);
  assert.match(script, /mapRequestState = "fallback-offered"/);
  assert.match(script, /No fixed question has been shown/);
  assert.match(script, /Continue with synthetic example/);
  assert.match(server, /if \(!options\.some\(\(\{ label \}\) => label === unknownLabel\)\) options\.push/);
});

test("competition remains bilingual and persistence-free", () => {
  assert.match(script, /if \(COMPETITION_MODE\) \{[\s\S]*competition-mode/);
  assert.match(script, /COMPETITION_MODE \? params\.has\("view"\) : true/);
  assert.match(script, /合成示例 · 不保存/);
  assert.match(script, /SYNTHETIC EXAMPLE · QUESTION/);
  assert.match(script, /合成示例 · 第/);
  assert.match(server, /English follow-up contains Chinese text/);
  assert.match(server, /English competition output contains Chinese text/);
  assert.match(script, /putRecord = \(record\) => DEMO_MODE \? Promise\.resolve/);
  assert.match(script, /putCycle = \(cycle\) => DEMO_MODE \|\| !cycle\.remembered/);
});

test("map output keeps complete text, grounded fact sources, and uncertain third-party reactions", () => {
  assert.match(server, /String\(body\.note \|\| ""\)\.trim\(\) \? \["ENTRY_01"\]/);
  assert.match(server, /return `\$\{clipped\}…`/);
  assert.match(server, /No new fact checked this judgment/);
  assert.match(server, /地图字段 \$\{key\} 缺少有效来源/);
  assert.match(server, /实验不能把第三方的不回应或含糊反应解释成确定动机/);
  assert.match(server, /choose a time that works for you/);
});
