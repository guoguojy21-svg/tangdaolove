/* ============================================
   躺岛 TANGDAO · POI 推荐引擎
   独立模块：读取现有 data/lingshui-poi.json，不复制数据
   两层评分：用户状态匹配 + 预留 weatherAdjustment / timeAdjustment
   ============================================ */
(function () {
  "use strict";

  // ---------- 预留接口（本阶段恒为 0，未来接天气/时间） ----------
  function weatherAdjustment(poi, answerState) {
    // TODO: 接入真实天气后实现，返回 -15 ~ +15 之间的调整分
    return 0;
  }
  function timeAdjustment(poi, answerState) {
    // TODO: 接入时段/潮汐后实现
    return 0;
  }

  // ---------- 工具：判断 POI crowd 字段是哪种格式 ----------
  // 格式A（人群类型）："情侣闺蜜、亲子家庭、独行游客" → 匹配 companion
  // 格式B（客流程度）："周末/节假日中等，工作日相对轻松" → 匹配 crowdPreference
  function isAudienceCrowd(crowdStr) {
    if (typeof crowdStr !== "string") return false;
    return /情侣|闺蜜|亲子|独行|摄影|徒步|美食|人文|运动|散步|野餐|采风|带娃|静心|生态/.test(crowdStr);
  }

  // ---------- crowd 匹配（双重格式） ----------
  function scoreCrowd(poi, answerState) {
    const crowd = poi.crowd || "";
    const companion = answerState.companion;
    const crowdPref = answerState.crowdPreference;

    if (isAudienceCrowd(crowd)) {
      // 格式A：人群类型 → 匹配 companion
      const companionMap = {
        solo: ["独行", "一个人"],
        couple: ["情侣", "闺蜜", "浪漫"],
        friends: ["闺蜜", "朋友", "聚会"],
        family: ["亲子", "家庭", "带娃"]
      };
      const keywords = companionMap[companion] || [];
      const matched = keywords.some(k => crowd.includes(k));
      return matched ? { score: 8, reasons: ["人群构成适合你的出行方式"] }
                     : { score: -7, reasons: ["人群构成与你今天的同伴不太匹配"] };
    } else {
      // 格式B：客流程度 → 匹配 crowdPreference
      // 解析客流关键词
      const isQuiet = /少|轻松|舒适|分散|小众|无人/ .test(crowd);
      const isMedium = /中等|偏多|可能|周末|节假日|下午/ .test(crowd);
      const isLively = /多|热门|偏多|较多|集中/ .test(crowd);

      const prefMap = { quiet: isQuiet, low: isQuiet || isMedium, medium: isMedium, lively: isLively };
      const matched = prefMap[crowdPref];
      if (matched) {
        if (crowdPref === "quiet" && isQuiet) return { score: 8, reasons: ["这里人流较少，适合安静待着"] };
        if (crowdPref === "lively" && isLively) return { score: 8, reasons: ["这里今天人气较旺，有热闹可看"] };
        return { score: 5, reasons: ["人流强度基本符合你今天的偏好"] };
      }
      return { score: -7, reasons: ["人流强度与你今天想要的不太一样"] };
    }
  }

  // ---------- activity 匹配（部分匹配，防止膨胀） ----------
  function scoreActivity(poi, answerState, winnerRole) {
    const activities = poi.activities || [];
    if (!activities.length) return { score: 0, reasons: [] };

    // 用户意图关键词映射
    const intentKeywords = getIntentKeywords(answerState, winnerRole);
    let matchCount = 0;
    const matchedActs = [];

    activities.forEach(act => {
      if (intentKeywords.some(k => act.includes(k))) {
        matchCount++;
        matchedActs.push(act);
      }
    });

    // 部分匹配：匹配越多分越高，但上限 12（收紧防止膨胀）
    if (matchCount === 0) return { score: -6, reasons: ["活动类型与你今天的状态关联不大"] };
    if (matchCount === 1) return { score: 4, reasons: ["这里有你今天想做的事情"] };
    if (matchCount === 2) return { score: 8, reasons: [matchedActs[0] + " 是你今天会想做的事"] };
    return { score: 12, reasons: [matchedActs[0] + "，" + matchedActs[1] + "，都很适合今天"] };
  }

  // 根据用户答案和角色，生成意图关键词
  function getIntentKeywords(answerState, winnerRole) {
    const kws = new Set();
    const energy = answerState.energy;
    const activity = answerState.activityIntensity;
    const sun = answerState.sunPreference;
    const emotion = answerState.emotionalIntention;

    // energy 低 → 躺平/发呆/慢
    if (energy <= 2) { kws.add("躺平"); kws.add("发呆"); kws.add("慢"); kws.add("放空"); kws.add("散步"); kws.add("吹"); }
    if (energy >= 3) { kws.add("玩"); kws.add("探索"); kws.add("水"); kws.add("登高"); }
    if (energy >= 4) { kws.add("戏水"); kws.add("玩水"); kws.add("赶海"); }

    // activity
    if (activity === "rest") { kws.add("躺平"); kws.add("发呆"); kws.add("放空"); }
    if (activity === "light") { kws.add("散步"); kws.add("慢行"); kws.add("走"); kws.add("吹"); }
    if (activity === "medium") { kws.add("拍"); kws.add("逛"); kws.add("探索"); kws.add("文化"); kws.add("人文"); }
    if (activity === "active") { kws.add("水"); kws.add("赶海"); kws.add("登高"); kws.add("玩"); }

    // sun
    if (sun === "shade") { kws.add("遮阴"); kws.add("树荫"); kws.add("林"); }
    if (sun === "softSun") { kws.add("海边"); kws.add("日落"); kws.add("海景"); }
    if (sun === "fullSun") { kws.add("日出"); kws.add("戏水"); kws.add("海滩"); }

    // emotion
    if (emotion === "quiet") { kws.add("静谧"); kws.add("放空"); kws.add("慢"); }
    if (emotion === "freedom") { kws.add("海"); kws.add("吹风"); kws.add("赶海"); }
    if (emotion === "joy") { kws.add("玩"); kws.add("戏水"); kws.add("亲子"); }
    if (emotion === "beauty") { kws.add("拍照"); kws.add("出片"); kws.add("日落"); kws.add("海景"); }
    if (emotion === "novelty") { kws.add("探索"); kws.add("人文"); kws.add("采风"); kws.add("渔村"); }
    if (emotion === "localLife") { kws.add("人文"); kws.add("渔村"); kws.add("疍家"); kws.add("市集"); }

    return Array.from(kws);
  }

  // ---------- energy 匹配 ----------
  function scoreEnergy(poi, answerState) {
    const energy = answerState.energy;
    const layer = poi.layer_type;

    // 需要体力的 layer
    const activeLayers = ["hike", "water_sports"];
    // 静态/轻松的 layer
    const restLayers = ["beach", "family", "food_drink", "handcraft", "culture"];

    if (energy <= 2) {
      if (restLayers.includes(layer)) return { score: 6, reasons: ["不需要太多体力，适合今天的电量"] };
      if (activeLayers.includes(layer)) return { score: -6, reasons: ["今天电量不高，这里可能会有点累"] };
      return { score: 3, reasons: ["强度适中"] };
    }
    if (energy >= 4) {
      if (activeLayers.includes(layer)) return { score: 6, reasons: ["电量满格，这里有的玩"] };
      if (restLayers.includes(layer)) return { score: -4, reasons: ["今天电量很足，这里可能太安静了"] };
      return { score: 2, reasons: [] };
    }
    return { score: 3, reasons: ["强度适合今天的状态"] };
  }

  // ---------- 角色 core tag 匹配 ----------
  function scoreRoleTag(poi, winnerRole) {
    if (!winnerRole || !winnerRole.tags) return { score: 0, reasons: [] };
    const poiTags = poi.tag || [];
    const layer = poi.layer_type;

    // 角色核心倾向 → layer_type 映射
    const roleLayerMap = {
      moon: ["beach", "hike"],
      blossom: ["beach", "village", "food_drink"],
      iridescent: ["village", "handcraft", "culture", "hike"],
      pearl: ["food_drink", "handcraft", "culture"],
      conch: ["beach", "fishing", "hike"],
      sun: ["water_sports", "beach", "family"]
    };
    const preferredLayers = roleLayerMap[winnerRole.id] || [];
    if (preferredLayers.includes(layer)) {
      return { score: 10, reasons: ["符合 " + winnerRole.name + " 今天的气质"] };
    }

    // tag 关键词匹配
    const roleTagKeywords = {
      moon: ["躺平", "岛民", "慢行"],
      blossom: ["拍照", "出片", "咖啡", "乡村"],
      iridescent: ["探索", "人文", "手作", "渔村"],
      pearl: ["咖啡", "手作", "文化", "室内"],
      conch: ["海", "吹风", "赶海", "慢行", "躺平"],
      sun: ["玩水", "戏水", "赶海", "亲子", "玩"]
    };
    const kws = roleTagKeywords[winnerRole.id] || [];
    const poiTagStr = poiTags.join(" ");
    const matched = kws.filter(k => poiTagStr.includes(k) || (poi.activities || []).some(a => a.includes(k)));
    if (matched.length >= 2) return { score: 10, reasons: ["多个特质契合 " + winnerRole.name] };
    if (matched.length === 1) return { score: 6, reasons: ["气质上和 " + winnerRole.name + " 对得上"] };
    return { score: 0, reasons: [] };
  }

  // ---------- companion 适配 ----------
  function scoreCompanion(poi, answerState) {
    const companion = answerState.companion;
    const layer = poi.layer_type;
    const crowd = poi.crowd || "";

    if (companion === "solo") {
      if (/独行|静心|放空/.test(crowd) || layer === "beach" || layer === "hike") return { score: 5, reasons: ["一个人来也舒服"] };
    }
    if (companion === "couple") {
      if (/情侣|闺蜜|浪漫/.test(crowd) || layer === "beach" || layer === "food_drink") return { score: 6, reasons: ["适合两个人一起"] };
    }
    if (companion === "friends") {
      if (layer === "village" || layer === "handcraft" || layer === "food_drink") return { score: 5, reasons: ["和朋友一起会更有意思"] };
    }
    if (companion === "family") {
      if (/亲子|家庭|带娃/.test(crowd) || layer === "family") return { score: 6, reasons: ["对家庭出行很友好"] };
    }
    return { score: 2, reasons: [] };
  }

  // ---------- suitability 加分 ----------
  function scoreSuitability(poi) {
    if (poi.suitability === "very_good") return { score: 8, reasons: ["这里本就是陵水很推荐的地方"] };
    if (poi.suitability === "good") return { score: 4, reasons: [] };
    return { score: 0, reasons: [] };
  }

  // ---------- 生成推荐理由（模板，非AI生成） ----------
  function generateReason(poi, answerState, winnerRole, scoreBreakdown) {
    const energy = answerState.energy;
    const activity = answerState.activityIntensity;
    const emotion = answerState.emotionalIntention;
    const layer = poi.layer_type;
    const matchedReasons = scoreBreakdown.filter(r => r.score > 0).flatMap(r => r.reasons).filter(Boolean);

    // 优先使用匹配到的积极理由
    if (matchedReasons.length >= 2) {
      return matchedReasons.slice(0, 2).join("，") + "。";
    }

    // 否则按能量级 + layer 生成模板理由
    if (energy <= 2) {
      if (layer === "beach" || layer === "fishing") return "今天电量不高，这里适合慢慢待着，吹吹风就好。";
      if (layer === "food_drink" || layer === "handcraft") return "今天适合找个舒服的地方坐下，不用赶。";
      if (layer === "hike") return "步道平缓，慢慢走也不会累，适合今天的状态。";
      return "今天不用安排太多，这里待着就很舒服。";
    }
    if (energy >= 4) {
      if (layer === "water_sports" || layer === "beach") return "电量满格，去碰一点海水，把今天玩得远一点。";
      if (layer === "village") return "今天有劲，适合多走走，探索一点新鲜的。";
      return "今天状态很好，这里可以好好玩一玩。";
    }

    // 中等能量
    if (emotion === "beauty") return "这里出片效果不错，适合今天想收集漂亮瞬间的你。";
    if (emotion === "novelty") return "这里和常规打卡点不太一样，今天适合遇到一点意外。";
    if (emotion === "freedom") return "往有海的方向走，这里会让你觉得自由一点。";

    return "综合你今天的状态，这里是个稳妥又舒服的选择。";
  }

  // ---------- 单 POI 评分 ----------
  function scorePoi(poi, answerState, winnerRole) {
    const breakdown = [
      scoreActivity(poi, answerState, winnerRole),
      scoreCrowd(poi, answerState),
      scoreEnergy(poi, answerState),
      scoreRoleTag(poi, winnerRole),
      scoreCompanion(poi, answerState),
      scoreSuitability(poi)
    ];

    let score = 42; // 基础分（压低，避免分数膨胀）
    breakdown.forEach(b => { score += b.score; });

    // 预留接口
    score += weatherAdjustment(poi, answerState);
    score += timeAdjustment(poi, answerState);

    // 限制 0~100
    score = Math.max(0, Math.min(100, Math.round(score)));

    const reason = generateReason(poi, answerState, winnerRole, breakdown);

    // 适合度百分比（42~92 映射到 55~90%，TOP1 约 80-88%，避免全 95+）
    const fitPercent = Math.round(55 + (score - 42) * 0.62);

    return { poi: poi, score: score, fitPercent: Math.min(92, Math.max(50, fitPercent)), reason: reason, breakdown: breakdown };
  }

  // ---------- 推荐 TOP3 ----------
  function recommendTop3(pois, answerState, winnerRole) {
    if (!Array.isArray(pois) || !pois.length) return [];

    const scored = pois.map(poi => scorePoi(poi, answerState, winnerRole));

    // 按分数降序，同分按 suitability 排序
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const sa = a.poi.suitability === "very_good" ? 1 : 0;
      const sb = b.poi.suitability === "very_good" ? 1 : 0;
      return sb - sa;
    });

    const top3 = scored.slice(0, 3);

    // 控制台输出推荐详情
    console.log("%c[Tangdao · POI推荐] TOP 3 已生成", "color:#27453F;font-weight:bold;");
    top3.forEach((item, i) => {
      console.log("   " + (i + 1) + ". " + item.poi.name + "｜得分 " + item.score + "｜适合度 " + item.fitPercent + "%");
      console.log("      理由：" + item.reason);
    });
    console.log("   （共评分 " + scored.length + " 个 POI，已预留 weatherAdjustment / timeAdjustment 接口）");

    return top3;
  }

  // ---------- 暴露到全局 ----------
  window.tangdaoScorePoi = scorePoi;
  window.tangdaoRecommendTop3 = recommendTop3;
  window.tangdaoWeatherAdjustment = weatherAdjustment;
  window.tangdaoTimeAdjustment = timeAdjustment;

  console.log("%c[Tangdao · POI推荐引擎] 已就绪", "color:#27453F;font-weight:bold;");
  console.log("   可用命令：tangdaoRecommendTop3(pois, answerState, winnerRole)");
})();
