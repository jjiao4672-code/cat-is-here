const OFFLINE_KNOWLEDGE_BASE = {
  safety: {
    keywords: [
      "自杀", "轻生", "不想活", "活不下去", "结束生命", "伤害自己", "自残",
      "割腕", "跳楼", "吃药死", "去死", "马上死", "杀了我", "家暴", "正在打我"
    ],
    title: "猫先陪你去找一个真实的人",
    body: "猫现在不和你分析原因。请先离开可能伤害你的物品或地方，去到有人在的空间，并立刻联系一个可信任的人，直接说：‘我现在不安全，请陪着我。’如果危险正在发生，请联系当地紧急服务；在中国大陆可拨打 120 或 110。猫可以陪你看字，但此刻真正能来到你身边的人更重要。"
  },
  intents: [
    {
      id: "boundary",
      title: "猫先把边界放在这里",
      keywords: ["诊断", "治疗", "心理疾病", "抑郁症", "焦虑症", "咨询师", "吃药", "有病"],
      lead: "这张卡只能提供一种自我反思的假设，不能判断你有没有某种疾病，也不能代替心理咨询或医疗帮助。"
    },
    {
      id: "message",
      title: "猫替你把话放轻一点",
      keywords: ["怎么说", "沟通", "发消息", "回复", "拒绝", "道歉", "告诉对方", "和他说", "和她说"],
      lead: "先说自己的状态和需要，不猜测对方的动机，也不急着给关系定性。"
    },
    {
      id: "decision",
      title: "先把选择缩成一小块",
      keywords: ["要不要", "选择", "决定", "纠结", "该不该", "后悔"],
      lead: "先区分你能负责的行动，和你无法保证的结果。选择不需要消灭所有不确定，才算一个好选择。"
    },
    {
      id: "why",
      title: "猫看见了一种可能的用处",
      keywords: ["为什么", "原因", "怎么会", "总是", "每次", "又这样"],
      lead: "这个反应也许不是无缘无故，它可能正在替你避开一种更难承受的感觉。"
    },
    {
      id: "emotion",
      title: "先让这阵情绪有地方落脚",
      keywords: ["平静", "缓解", "难受", "焦虑", "生气", "想哭", "睡不着", "崩溃", "冷静"],
      lead: "情绪很大时，先照顾身体和当下，不必立刻把整个人生解释明白。"
    },
    {
      id: "action",
      title: "猫只给你一小步",
      keywords: ["做什么", "怎么办", "开始", "行动", "现在", "明天", "下一步", "不敢做"],
      lead: "先做一个小到不会压垮你的动作，用现实反馈替代脑内预演。"
    },
    {
      id: "reflection",
      title: "猫陪你把这团线放到桌上",
      keywords: [],
      lead: "先不急着解决全部问题。我们只看：这份情绪在保护什么，又让你离真正想要的东西远了多少。"
    }
  ],
  profiles: {
    avoidance: {
      insight: "你可能在用拖延或离开，推迟那个会被现实评价的时刻。",
      question: "如果只做五分钟，最怕被证明的那件事还会发生吗？",
      action: "只打开材料，做第一小格，五分钟后允许停下。",
      script: "我现在有点想逃开，不是因为这件事不重要。请先陪我确认最小的一步。"
    },
    perfection: {
      insight: "你可能在用高标准保护‘我不能显得普通或失败’的自我形象。",
      question: "这件事做到六十分，真正会失去什么？",
      action: "做一个六十分版本，只交给一个低风险的人看。",
      script: "我很怕做得不够好，所以一直没有交出来。你能只告诉我下一处最值得改的地方吗？"
    },
    pleasing: {
      insight: "你可能在用照顾所有人，换取关系暂时不破裂。",
      question: "如果你不先照顾对方的情绪，你真正想说的需要是什么？",
      action: "写下一句不指责、也不隐藏自己的请求。",
      script: "我在意我们的关系，也有一点难受。我想先确认一件具体的事：____。"
    },
    control: {
      insight: "你可能在用控制细节抵挡结果不确定带来的害怕。",
      question: "这件事里，哪一项是你的行动，哪一项其实属于别人或现实？",
      action: "列出一件可控制的动作和一件不可控制的结果，只做前者。",
      script: "我现在很想立刻得到确定答案。你可以告诉我，你能确认的部分是什么吗？"
    },
    recognition: {
      insight: "你可能把自己的价值暂时交给了别人的眼光和排名。",
      question: "如果今天没人知道，你仍愿意做哪件有用的小事？",
      action: "完成一件不需要被看见、但确实有贡献的小事。",
      script: "我发现自己很在意评价。我想先谈具体事情，而不是证明谁更好。"
    },
    inferiority: {
      insight: "你可能先用‘我不够好’解释一切，以免现实再来否定一次。",
      question: "如果这不是能力判决，只是一项尚未练会的任务，下一次练习是什么？",
      action: "找一个具体任务练一次，不给整个人下结论。",
      script: "我现在很容易把这件事理解成自己不行。请和我一起只看一个具体问题。"
    },
    disconnect: {
      insight: "你可能因为负荷太高而暂时关掉了感觉，这不等于你没有需要。",
      question: "先不问人生怎么了，身体现在最需要水、食物、走动、睡眠，还是陪伴？",
      action: "喝水，站起来，找到房间里的五样东西，再决定下一步。",
      script: "我现在有点麻木，说不清楚，但不想一个人待着。你能陪我一会儿吗？"
    }
  },
  followUps: {
    avoidance: {
      title: "猫还没看清，你为什么停在门口？",
      hint: "选一句最像脑子里悄悄响起的话。",
      options: [
        { label: "做不好会证明我不行", insight: "你更像是在推迟被评价的时刻" },
        { label: "一开始就得一直承担", insight: "你更像是在躲开行动之后的持续责任" },
        { label: "事情太大，我找不到入口", insight: "你更像是被模糊和体量压住了" },
        { label: "做了也未必有意义", insight: "你更像是在行动前先失去了方向感" }
      ]
    },
    perfection: {
      title: "猫想知道，你的高标准在防哪一种意外？",
      hint: "不是选正确答案，只选最刺你的那句。",
      options: [
        { label: "别人会发现我其实很普通", insight: "你的标准更像是在保护自我形象" },
        { label: "一个错误会毁掉全部结果", insight: "你的标准更像是在对抗灾难化预期" },
        { label: "交出去就不能再控制了", insight: "你的标准更像是在延迟失去控制" },
        { label: "我不知道怎样才算够好", insight: "你的标准更像是一个没有终点的安全条件" }
      ]
    },
    pleasing: {
      title: "猫再问一句：你最怕关系里发生什么？",
      hint: "猫不会替任何一边判对错，只想看清你藏起了什么。",
      options: [
        { label: "对方会生气或失望", insight: "你更像是在用顺从避免冲突" },
        { label: "对方会不要我了", insight: "你更像是在用讨好守住归属感" },
        { label: "我根本说不清自己的需要", insight: "你可能习惯先听见别人，后来才想起自己" },
        { label: "说了也不会有人在意", insight: "你可能已经预先放弃了被理解的可能" }
      ]
    },
    control: {
      title: "猫看见你抓得很紧，你最怕松手以后怎样？",
      hint: "只选最接近的一项，不必解释。",
      options: [
        { label: "事情会立刻出错", insight: "你更像是在用控制抵挡犯错的恐惧" },
        { label: "别人根本靠不住", insight: "你更像是难以把责任交还给别人" },
        { label: "后果一旦发生就不能挽回", insight: "你更像是在防范不可逆的结果" },
        { label: "我只是受不了不知道", insight: "不确定本身可能就是你最难承受的部分" }
      ]
    },
    recognition: {
      title: "如果没有人看见，哪件事最让你难受？",
      hint: "猫不太懂排名，但猫知道被看见对人类很重要。",
      options: [
        { label: "努力好像就白费了", insight: "你可能把价值和被看见绑在了一起" },
        { label: "别人会以为我不够好", insight: "你可能把别人的判断当成了自我结论" },
        { label: "别人走得比我快", insight: "比较正在替你决定自己的节奏" },
        { label: "我不知道自己真正想要什么", insight: "外部评价可能暂时替代了自己的方向" }
      ]
    },
    inferiority: {
      title: "猫想确认，‘不够好’对你究竟意味着什么？",
      hint: "别急着证明它不对，先看它在说什么。",
      options: [
        { label: "我没有资格参与", insight: "你可能正用自我否定让自己退出关系或任务" },
        { label: "别人迟早会失望", insight: "你可能在被评价前先替别人否定自己" },
        { label: "再努力也不会改变", insight: "无力感正在把一次困难扩大成永久结论" },
        { label: "我必须先变好才配开始", insight: "你可能把成长的结果当成了参与的门票" }
      ]
    },
    disconnect: {
      title: "猫轻轻问一句：麻木以前，发生了什么？",
      hint: "想不清也没关系，选最靠近身体感觉的一项。",
      options: [
        { label: "事情一下子太多了", insight: "麻木更像是负荷过高后的关闭" },
        { label: "难受持续太久了", insight: "麻木可能在替你暂时隔开长期痛感" },
        { label: "我不敢真的感受到它", insight: "麻木可能在保护你不被某种情绪淹没" },
        { label: "我也不知道，只觉得很远", insight: "你现在最需要的可能不是解释，而是重新连接身体和人" }
      ]
    }
  },
  domains: {
    work: "这件事落在工作或学习任务上，重点是重新和一个真实的小结果接触。",
    love: "这件事落在亲密关系里，重点是表达真实需要，而不是控制对方回应。",
    friendship: "这件事落在社交关系里，重点是参与和连接，不是赢得所有人的认可。",
    belonging: "这件事碰到了归属感，重点是既看见别人，也不把自己藏起来。",
    self: "这件事碰到了自我期待，重点是把自我评价改写成一次具体练习。",
    security: "这件事碰到了安全感，重点是区分真实风险和脑内预演。",
    comparison: "这件事碰到了比较，重点是把注意力从排名带回自己的行动。"
  }
};

function includesAny(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function findIntent(question) {
  let best = OFFLINE_KNOWLEDGE_BASE.intents.at(-1);
  let bestScore = 0;

  OFFLINE_KNOWLEDGE_BASE.intents.forEach((intent) => {
    const score = intent.keywords.reduce((total, keyword) => total + (question.includes(keyword) ? keyword.length : 0), 0);
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  });

  return best;
}

function buildCatReply({ question, result, actionText }) {
  const cleanQuestion = String(question || "").trim();
  const combinedText = `${cleanQuestion} ${result?.note || ""}`;

  if (!cleanQuestion) {
    return {
      title: "猫等你问一句小问题",
      body: "可以问：我现在该做什么、为什么总是这样，或者怎么和对方说。问题不用写得体面，猫看得懂一点乱糟糟。"
    };
  }

  if (!result) {
    return {
      title: "先让猫看完你的选择",
      body: "完成这次小扫描后，猫才知道你在难受什么、又在保护什么。"
    };
  }

  if (result.crisis || includesAny(combinedText, OFFLINE_KNOWLEDGE_BASE.safety.keywords)) {
    return OFFLINE_KNOWLEDGE_BASE.safety;
  }

  const intent = findIntent(cleanQuestion);
  const profile = OFFLINE_KNOWLEDGE_BASE.profiles[result.key] || OFFLINE_KNOWLEDGE_BASE.profiles.avoidance;
  const domain = OFFLINE_KNOWLEDGE_BASE.domains[result.domain] || "这件事还没有落到一个清楚的场景里，先只挑最近一次发生的时刻。";
  const followUpLine = result.followUp?.insight ? `你后来选的那句话也让猫注意到：${result.followUp.insight}。` : "";
  const catAside = "人类常想一次把整件人生弄明白，猫对此有些不懂。猫只会先踩稳眼前这一小块地。";

  if (intent.id === "boundary") {
    return {
      title: intent.title,
      body: `${intent.lead} 猫能做的是陪你看见一种可能的保护策略：${profile.insight} ${followUpLine}如果困扰持续、明显影响生活，或你担心自己的安全，请找合格的心理咨询师或医疗专业人员。`
    };
  }

  if (intent.id === "message") {
    return {
      title: intent.title,
      body: `${intent.lead}\n\n你可以先这样说：“${profile.script}” 不必一口气讲完，也不要求对方立刻理解。猫觉得一句真话已经很重了，不用再给它挂很多装饰。`
    };
  }

  if (intent.id === "why") {
    return {
      title: intent.title,
      body: `${intent.lead} ${profile.insight} ${followUpLine}${domain}\n\n猫不把这当结论，只把它当一个可以核对的猜想：${profile.question}`
    };
  }

  if (intent.id === "emotion") {
    return {
      title: intent.title,
      body: `${intent.lead} 先做这个：${result.key === "disconnect" ? profile.action : "双脚踩地，慢慢呼气，指出眼前五样东西，然后喝几口水。"}\n\n等情绪稍微退一点，再问自己：${profile.question}`
    };
  }

  if (intent.id === "decision") {
    return {
      title: intent.title,
      body: `${intent.lead} ${domain}\n\n在纸上写两列：“我能做的”和“结果才知道的”。今天只从第一列选一个动作。${catAside}`
    };
  }

  if (intent.id === "action") {
    return {
      title: intent.title,
      body: `${profile.insight} ${followUpLine}现在先做：${actionText || profile.action}\n\n做完便停一下，不要趁机加码。记录“我原本怕什么、实际发生了什么”。${catAside}`
    };
  }

  return {
    title: intent.title,
    body: `${intent.lead} 猫从你的选择里看见：${profile.insight} ${followUpLine}${domain}\n\n先问一句：${profile.question} 如果暂时答不上来，也可以只做：${actionText || profile.action}`
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { OFFLINE_KNOWLEDGE_BASE, buildCatReply, findIntent };
}
