/* ============================================
   躺岛 TANGDAO · 贝壳角色判断系统
   本文件独立于 today.js：角色配置 + 评分矩阵 + 角色选择
   设计原则：数据与 UI 分离，增加角色只需在 SHELL_ROLES 里加一条
   不接天气 / 不做 POI Top3 / 不做分享卡
   ============================================ */
(function () {
  "use strict";

  /**
   * 6 个贝壳角色配置
   * scoreProfile：每个字段 → 每个答案值 → 权重（0~4，越高越偏向该角色）
   * energy 值为数字 1/2/3/4，其余为字符串，查找时统一用 String(value) 匹配 key
   */
  const SHELL_ROLES = [
    {
      id: "moon",
      number: "01",
      name: "月光贝",
      nameEn: "MOON SHELL",
      quote: "今天别赶路。",
      description: "今天的你更需要安静、树荫和一点风。不一定非要打卡，找个能待很久的地方就够了。",
      tags: ["低电量", "安静", "低人群", "慢下来", "吹风"],
      color: "#E8E0ED",
      visual: "moon",
      scoreProfile: {
        energy: { "1": 4, "2": 3, "3": 0, "4": 0 },
        crowdPreference: { quiet: 4, low: 2, medium: 0, lively: 0 },
        sunPreference: { indoor: 0, shade: 4, softSun: 1, fullSun: 0 },
        activityIntensity: { rest: 4, light: 3, medium: 0, active: 0 },
        companion: { solo: 4, couple: 1, friends: 0, family: 0 },
        emotionalIntention: { quiet: 4, freedom: 1, joy: 0, beauty: 0, novelty: 0, localLife: 1 }
      }
    },
    {
      id: "blossom",
      number: "02",
      name: "樱花贝",
      nameEn: "BLOSSOM SHELL",
      quote: "今天需要一点漂亮的事情发生。",
      description: "今天适合把自己放进好看的光线里，日落、花、一杯漂亮的饮品，都值得特意走一趟。",
      tags: ["浪漫", "拍照", "日落", "情侣", "漂亮瞬间"],
      color: "#F0DADA",
      visual: "blossom",
      scoreProfile: {
        energy: { "1": 0, "2": 2, "3": 4, "4": 2 },
        crowdPreference: { quiet: 0, low: 2, medium: 3, lively: 2 },
        sunPreference: { indoor: 0, shade: 1, softSun: 4, fullSun: 2 },
        activityIntensity: { rest: 0, light: 2, medium: 3, active: 2 },
        companion: { solo: 0, couple: 4, friends: 2, family: 1 },
        emotionalIntention: { quiet: 0, freedom: 1, joy: 2, beauty: 4, novelty: 2, localLife: 0 }
      }
    },
    {
      id: "iridescent",
      number: "03",
      name: "虹彩贝",
      nameEn: "IRIDESCENT SHELL",
      quote: "计划不重要，今天适合遇到一点意外。",
      description: "今天的你适合出门走走，不设目的地。拐角的小店、没去过的巷子，都比清单有意思。",
      tags: ["随机探索", "新鲜", "手作", "朋友", "城市漫游"],
      color: "#9CCECE",
      visual: "iridescent",
      scoreProfile: {
        energy: { "1": 0, "2": 2, "3": 4, "4": 2 },
        crowdPreference: { quiet: 0, low: 1, medium: 3, lively: 3 },
        sunPreference: { indoor: 0, shade: 1, softSun: 2, fullSun: 2 },
        activityIntensity: { rest: 0, light: 2, medium: 4, active: 3 },
        companion: { solo: 0, couple: 1, friends: 4, family: 1 },
        emotionalIntention: { quiet: 0, freedom: 2, joy: 2, beauty: 1, novelty: 4, localLife: 1 }
      }
    },
    {
      id: "pearl",
      number: "04",
      name: "珍珠蚌",
      nameEn: "PEARL CLAM",
      quote: "外面很热，今天适合待在舒服的地方。",
      description: "今天的电量适合室内，咖啡、书、一点冷气和手作，比晒太阳更让你舒服。",
      tags: ["室内", "低体力", "咖啡", "文化", "手作", "躲太阳"],
      color: "#F2E8DD",
      visual: "pearl",
      scoreProfile: {
        energy: { "1": 4, "2": 3, "3": 0, "4": 0 },
        crowdPreference: { quiet: 4, low: 3, medium: 0, lively: 0 },
        sunPreference: { indoor: 4, shade: 2, softSun: 0, fullSun: 0 },
        activityIntensity: { rest: 4, light: 3, medium: 0, active: 0 },
        companion: { solo: 3, couple: 2, friends: 1, family: 2 },
        emotionalIntention: { quiet: 3, freedom: 0, joy: 1, beauty: 1, novelty: 0, localLife: 2 }
      }
    },
    {
      id: "conch",
      number: "05",
      name: "海螺",
      nameEn: "SEA CONCH",
      quote: "今天什么都不用想，往有海的方向走。",
      description: "今天的你想离海近一点，慢走、吹风、听浪。一个人或两个人都好，只要方向是海。",
      tags: ["吹海风", "海边", "自由", "慢走", "一个人"],
      color: "#D8EBEA",
      visual: "conch",
      scoreProfile: {
        energy: { "1": 2, "2": 3, "3": 2, "4": 0 },
        crowdPreference: { quiet: 3, low: 3, medium: 1, lively: 0 },
        sunPreference: { indoor: 0, shade: 3, softSun: 3, fullSun: 1 },
        activityIntensity: { rest: 2, light: 4, medium: 2, active: 1 },
        companion: { solo: 3, couple: 3, friends: 1, family: 0 },
        emotionalIntention: { quiet: 1, freedom: 4, joy: 1, beauty: 2, novelty: 1, localLife: 1 }
      }
    },
    {
      id: "sun",
      number: "06",
      name: "太阳贝",
      nameEn: "SUN SHELL",
      quote: "今天不适合躺太久。",
      description: "太阳很好，你也还有电。去碰一点海水，或者把今天玩得远一点。",
      tags: ["满电", "玩水", "探索", "朋友", "户外"],
      color: "#DFA69F",
      visual: "sun",
      scoreProfile: {
        energy: { "1": 0, "2": 0, "3": 2, "4": 4 },
        crowdPreference: { quiet: 0, low: 0, medium: 2, lively: 3 },
        sunPreference: { indoor: 0, shade: 0, softSun: 2, fullSun: 4 },
        activityIntensity: { rest: 0, light: 1, medium: 2, active: 4 },
        companion: { solo: 0, couple: 1, friends: 3, family: 1 },
        emotionalIntention: { quiet: 0, freedom: 3, joy: 4, beauty: 1, novelty: 2, localLife: 0 }
      }
    }
  ];

  /**
   * 计算单个角色得分
   * @param {Object} role 角色配置
   * @param {Object} answerState 用户答案
   * @returns {number} 该角色总分
   */
  function scoreOneRole(role, answerState) {
    let total = 0;
    const profile = role.scoreProfile;
    for (const field in profile) {
      const userVal = answerState[field];
      if (userVal === null || userVal === undefined) continue;
      // key 统一用字符串匹配（energy 数字 → "1"）
      const weightMap = profile[field];
      const w = weightMap[String(userVal)];
      if (typeof w === "number") total += w;
    }
    return total;
  }

  /**
   * 核心评分：计算 6 个角色得分并选出最终角色
   * tie breaker 规则：
   *   1. 最高分相同 → 比较 Q6 emotionalIntention 在 scoreProfile 中的权重
   *   2. 仍然相同 → 在并列者中随机选一个
   * @param {Object} answerState 用户答案
   * @returns {{scores: Array<{role, score}>, winner: Object, tieBreak: string}}
   */
  function scoreShellRoles(answerState) {
    // 1. 计算每个角色基础分
    const scores = SHELL_ROLES.map(role => ({
      role: role,
      score: scoreOneRole(role, answerState)
    }));

    // 2. 找出最高分
    const maxScore = Math.max.apply(null, scores.map(s => s.score));
    const top = scores.filter(s => s.score === maxScore);

    let winner;
    let tieBreak = "highest-score";

    if (top.length === 1) {
      winner = top[0];
    } else {
      // 3. tie breaker：Q6 emotionalIntention 权重
      const emotionVal = answerState.emotionalIntention;
      top.forEach(s => {
        const map = s.role.scoreProfile.emotionalIntention;
        s.tieScore = (map && typeof map[String(emotionVal)] === "number") ? map[String(emotionVal)] : 0;
      });
      const maxTie = Math.max.apply(null, top.map(s => s.tieScore));
      const tiedAgain = top.filter(s => s.tieScore === maxTie);

      if (tiedAgain.length === 1) {
        winner = tiedAgain[0];
        tieBreak = "Q6-emotionalIntention";
      } else {
        // 4. 仍然相同 → 随机
        winner = tiedAgain[Math.floor(Math.random() * tiedAgain.length)];
        tieBreak = "random";
      }
    }

    // 控制台完整输出
    console.log("%c[Tangdao · 角色判断] 用户答案：", "color:#27453F;font-weight:bold;", answerState);
    console.log("[Tangdao · 角色判断] 6 个角色得分：");
    scores.forEach(s => {
      const mark = (s.role.id === winner.role.id) ? " 👈 最终选择" : "";
      console.log("   " + s.role.number + " " + s.role.name + " (" + s.role.nameEn + ")：" + s.score + " 分" + mark);
    });
    console.log("%c[Tangdao · 角色判断] 最终角色：" + winner.role.number + " " + winner.role.name + " / " + winner.role.nameEn, "color:#DFA69F;font-weight:bold;");
    console.log("   选择方式：" + tieBreak);
    console.log("   角色文案：" + winner.role.quote);
    console.log("   角色说明：" + winner.role.description);
    console.log("   角色标签：" + winner.role.tags.join(" · "));

    return { scores: scores, winner: winner, tieBreak: tieBreak };
  }

  /**
   * 6 个测试预设：每个预设稳定命中一个角色
   * 用于快速验证角色判断系统是否正常工作
   */
  const TEST_PRESETS = [
    {
      id: "preset-moon",
      label: "测试·月光贝",
      answerState: { energy: 1, crowdPreference: "quiet", sunPreference: "shade", activityIntensity: "rest", companion: "solo", emotionalIntention: "quiet" }
    },
    {
      id: "preset-blossom",
      label: "测试·樱花贝",
      answerState: { energy: 3, crowdPreference: "medium", sunPreference: "softSun", activityIntensity: "medium", companion: "couple", emotionalIntention: "beauty" }
    },
    {
      id: "preset-iridescent",
      label: "测试·虹彩贝",
      answerState: { energy: 3, crowdPreference: "lively", sunPreference: "softSun", activityIntensity: "medium", companion: "friends", emotionalIntention: "novelty" }
    },
    {
      id: "preset-pearl",
      label: "测试·珍珠蚌",
      answerState: { energy: 1, crowdPreference: "quiet", sunPreference: "indoor", activityIntensity: "rest", companion: "solo", emotionalIntention: "quiet" }
    },
    {
      id: "preset-conch",
      label: "测试·海螺",
      answerState: { energy: 2, crowdPreference: "low", sunPreference: "softSun", activityIntensity: "light", companion: "couple", emotionalIntention: "freedom" }
    },
    {
      id: "preset-sun",
      label: "测试·太阳贝",
      answerState: { energy: 4, crowdPreference: "lively", sunPreference: "fullSun", activityIntensity: "active", companion: "friends", emotionalIntention: "joy" }
    }
  ];

  // 暴露到全局，供 today.js 与控制台调试
  window.SHELL_ROLES = SHELL_ROLES;
  window.tangdaoScoreRole = scoreShellRoles;
  window.TANGDAO_TEST_PRESETS = TEST_PRESETS;

  // 控制台快速调试命令
  console.log("%c[Tangdao · 角色判断] 已就绪", "color:#27453F;font-weight:bold;");
  console.log("   可用命令：");
  console.log("   · tangdaoScoreRole(window.__tangdaoAnswerState) — 用当前答案计算");
  console.log("   · TANGDAO_TEST_PRESETS — 6 个测试预设");
  console.log("   · SHELL_ROLES — 角色配置（增加角色只需在此数组加一条）");
})();
