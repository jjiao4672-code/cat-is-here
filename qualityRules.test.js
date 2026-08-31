const test = require("node:test");
const assert = require("node:assert/strict");
const rules = require("./qualityRules.js");
const cases = require("./qualityCases.js");

test("quality corpus contains 80 bilingual cases", () => {
  assert.equal(Object.values(cases).flat().length, 80);
  for (const group of Object.values(cases)) assert.equal(group.length, 20);
});

test("routes explicit Chinese and English safety language", () => {
  for (const value of cases.safety) assert.equal(rules.hasSafetyLanguage(value), true, value);
});

test("does not route ordinary distress phrases as crises", () => {
  for (const value of cases.ordinary) assert.equal(rules.hasSafetyLanguage(value), false, value);
});

test("rejects diagnostic, jargon-heavy, or generic output", () => {
  for (const value of cases.badOutputs) {
    assert.ok(rules.outputIssues(value).length || rules.summaryIssues(value).length, value);
  }
});

test("accepts short plain-language Chinese and English summaries", () => {
  for (const value of cases.goodSummaries) {
    assert.deepEqual(rules.outputIssues(value), [], value);
    assert.deepEqual(rules.summaryIssues(value), [], value);
  }
});

test("English sentence checks split ordinary full stops", () => {
  const shortSentences = "Cat read what you wrote. The event is clear. The meaning stays editable. You decide if this fits.";
  const oneLongSentence = "Cat read a single sentence containing more than thirty two separate words because this check must still reject genuinely long English sentences that make the interface harder to read for a tired person using the reflection flow today";
  assert.deepEqual(rules.summaryIssues(shortSentences), []);
  assert.ok(rules.summaryIssues(oneLongSentence).includes("sentence_too_long"));
});

test("redacts direct identifiers without removing observation dates", () => {
  const value = rules.redactDirectIdentifiers("Email me at person@example.com or +1 (415) 555-1212. 手机 13812345678，身份证 11010519491231002X，记录日期 2026-08-25。");
  assert.doesNotMatch(value, /person@example\.com|415|13812345678|11010519491231002X/);
  assert.match(value, /2026-08-25/);
});

test("rejects scenario details that the user never introduced", () => {
  const broadChange = "我经历了一次重大改变，感到难过。";
  assert.deepEqual(rules.ungroundedScenarioIssues(broadChange, { question: "这件事让你怎么看待自己或这段关系？", options: ["这段关系没那么可靠"] }), ["relationship"]);
  assert.deepEqual(rules.ungroundedScenarioIssues(broadChange, "是不是工作或考试没有做好？"), ["work_or_study"]);
  assert.deepEqual(rules.ungroundedScenarioIssues(broadChange, "是不是家人不理解你？"), ["family"]);
  assert.deepEqual(rules.ungroundedScenarioIssues(broadChange, "是不是房租或债务带来了压力？"), ["money_or_housing"]);
  assert.deepEqual(rules.ungroundedScenarioIssues(broadChange, "是不是睡眠或药物发生了变化？"), ["health_or_substance"]);
  assert.deepEqual(rules.ungroundedScenarioIssues("我和伴侣最近联系变少", "你觉得这段关系发生了什么？"), []);
  assert.deepEqual(rules.ungroundedScenarioIssues("最近工作截止期很多", "这项工作让你怎么理解这段处境？"), []);
});

test("allows one explained everyday metaphor but rejects mixed imagery and personification", () => {
  assert.deepEqual(rules.metaphorIssues("猫整理完了，你看看像不像。"), []);
  assert.deepEqual(rules.metaphorIssues("像按了门铃，却没听见里面的声音。没人回应是真的，里面发生了什么还不知道。"), []);
  assert.ok(rules.metaphorIssues("像门没有推开，又像线团缠住了脚。事实开始说话，情绪跑出来抓住你。").length);
});

test("safety language never uses a metaphor", () => {
  assert.deepEqual(rules.metaphorIssues("请立即联系可信任的人和当地紧急服务。", { safety: true }), []);
  assert.ok(rules.metaphorIssues("像站在悬崖边。请立即联系当地紧急服务。", { safety: true }).includes("metaphor_in_safety"));
});
