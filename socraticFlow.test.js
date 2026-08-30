const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("index.html", "utf8");
const script = fs.readFileSync("adaptive.js", "utf8");
const server = fs.readFileSync("server.mjs", "utf8");
const css = fs.readFileSync("styles.css", "utf8");

test("entry accepts an option, text, or both and keeps text primary", () => {
  assert.match(script, /if \(!eventChoice && !note\)/);
  assert.match(script, /beginEventInterview\(eventChoice, note \|\| optionLabel, Boolean\(note\)\)/);
  assert.match(script, /eventIsSpecific: openingWasTyped/);
  assert.match(script, /state\.answers\.ENTRY_01 = eventChoice \? \[eventChoice\] : \[inferEntry\(openingNote\)\]/);
  assert.match(html, /选一个最接近的，也可以直接写|id="freeNote"/);
  assert.match(script, /选一个最接近的，或者写一句发生的事/);
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
  assert.match(script, /if \(interviewRound >= 8\) return missing \? renderRequiredGap\(missing\) : renderUserSummaryPrompt\(\)/);
  assert.match(script, /if \(data\.readyForMap && deepAnswers\.length >= 2\)/);
  assert.match(script, /renderRequiredGap\(missing\)/);
  assert.match(script, /mode: "user_summary"/);
  assert.match(script, /interviewQuestion\?\.mode === "user_summary"/);
  assert.match(server, /是对自己的判断，不是已经证明的事实/);
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

test("user claims stay grounded in typed or confirmed answers", () => {
  assert.match(server, /!knownFields\.includes\("fact"\)/);
  assert.match(server, /最近具体发生了哪一件事/);
  assert.match(server, /sourceValuesByField\[answer\.targetField\]/);
  assert.match(server, /cleanedMap\[key\] = cleanVisible\(sourceValuesByField\[key\]/);
  assert.match(server, /const refs = \(sourceByField\[key\] \|\| \[\]\)/);
  assert.doesNotMatch(script.match(/function renderRequiredGap\(field\)[\s\S]*?\n  }/)?.[0] || "", /不够好|停止继续投递|后来更焦虑/);
});

test("the first follow-up after a concrete event asks for feeling before interpretation", () => {
  const feelingGate = server.indexOf('!["meaning", "feeling", "move", "result"].some');
  const selfWorthGate = server.indexOf('if (selfWorth && !knownModes.includes("counterevidence"))');
  assert.ok(feelingGate > 0 && feelingGate < selfWorthGate);
  assert.match(server, /这件事发生时，你有什么感受/);
  assert.match(server, /targetField: "feeling", mode: "feeling"/);
});

test("all map fields are asked before summary and answered placeholders are repaired", () => {
  assert.match(script, /\["meaning", "feeling", "move", "result"\]\.find/);
  assert.match(script, /not asked yet/i);
  assert.doesNotMatch(script, /Prepare only|只做准备/);
  assert.match(server, /不能只记录情绪或想法/);
  assert.match(script, /suggestedAction/);
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
  assert.match(script, /feedback !== "很像" \|\| !mapCanExperiment/);
  assert.match(html, /如果只做一件很小的事/);
  assert.match(html, /id="experimentProposal"[\s\S]*id="showCatSuggestionButton"/);
  assert.match(script, /showCatSuggestionButton[\s\S]*options\.classList\.remove\("hidden"\)/);
  assert.match(script, /dependsOnOther/);
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
