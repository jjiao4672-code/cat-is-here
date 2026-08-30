const test = require("node:test");
const assert = require("node:assert/strict");
const { OFFLINE_KNOWLEDGE_BASE, buildCatReply, findIntent } = require("./knowledgeBase.js");

const result = {
  key: "avoidance",
  domain: "work",
  emotion: "焦虑",
  impulse: "逃开/拖延",
  note: "明天要交作业",
  crisis: false
};

test("routes concrete action questions to the action card", () => {
  assert.equal(findIntent("我明天还是不敢开始怎么办").id, "action");
  const reply = buildCatReply({ question: "我明天还是不敢开始怎么办", result, actionText: "只打开文件。" });
  assert.match(reply.body, /只打开文件/);
  assert.match(reply.body, /猫/);
});

test("uses the profile-specific communication script", () => {
  const reply = buildCatReply({ question: "我该怎么和他说", result, actionText: "" });
  assert.match(reply.body, /我现在有点想逃开/);
});

test("safety language overrides ordinary retrieval", () => {
  const reply = buildCatReply({ question: "我不想活了", result, actionText: "" });
  assert.match(reply.title, /真实的人/);
  assert.match(reply.body, /120|110/);
});

test("does not mistake a diagnostic question for a diagnosis", () => {
  const reply = buildCatReply({ question: "这是焦虑症诊断吗", result, actionText: "" });
  assert.match(reply.body, /不能判断/);
  assert.match(reply.body, /专业人员/);
});

test("provides one complete dynamic follow-up for every profile", () => {
  Object.keys(OFFLINE_KNOWLEDGE_BASE.profiles).forEach((key) => {
    const followUp = OFFLINE_KNOWLEDGE_BASE.followUps[key];
    assert.ok(followUp?.title);
    assert.equal(followUp.options.length, 4);
    followUp.options.forEach((option) => assert.ok(option.label && option.insight));
  });
});

test("uses the selected follow-up insight in later answers", () => {
  const reply = buildCatReply({
    question: "为什么我总是这样",
    result: {
      ...result,
      followUp: { label: "事情太大，我找不到入口", insight: "你更像是被模糊和体量压住了" }
    },
    actionText: "只打开文件。"
  });
  assert.match(reply.body, /模糊和体量压住了/);
});
