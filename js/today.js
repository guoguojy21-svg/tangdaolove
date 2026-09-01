/* ============================================
   躺岛 TANGDAO · 「今天去哪？」
   本阶段：Intro 开场 + 6题 Quiz UI + 用户答案 state
   不接角色算法 / POI 推荐 / 天气 / 结果页完整数据 / 分享
   ============================================ */
(function () {
  "use strict";

  const STATES = ["intro", "quiz", "loading", "result"];
  const $ = (sel) => document.querySelector(sel);

  // ---------- 6 道真实题目数据 ----------
  const QUIZ = [
    {
      field: "energy",
      question: "今天还有多少电？",
      bg: "energy",
      options: [
        { value: 1, label: "5%", subDesc: "能坐绝不站", deco: "shell" },
        { value: 2, label: "30%", subDesc: "可以慢慢晃", deco: "pearl" },
        { value: 3, label: "60%", subDesc: "想出去看看", deco: "wave" },
        { value: 4, label: "100%", subDesc: "今天想玩点大的", deco: "sun" }
      ]
    },
    {
      field: "crowdPreference",
      question: "今天想被多少人看见？",
      bg: "crowd",
      options: [
        { value: "quiet", label: "最好谁都别看见我", deco: "shell" },
        { value: "low", label: "有一点人气就好", deco: "pearl" },
        { value: "medium", label: "想看看热闹", deco: "wave" },
        { value: "lively", label: "越热闹越有意思", deco: "sun" }
      ]
    },
    {
      field: "sunPreference",
      question: "今天想和太阳怎么相处？",
      bg: "sun",
      options: [
        { value: "indoor", label: "躲着它", subDesc: "给我空调和屋檐", deco: "shell" },
        { value: "shade", label: "隔着树叶见它", subDesc: "有风有树荫就好", deco: "leaf" },
        { value: "softSun", label: "晒一会儿", subDesc: "海边可以", deco: "sun" },
        { value: "fullSun", label: "今天我要发光", subDesc: "太阳越好越开心", deco: "sun" }
      ]
    },
    {
      field: "activityIntensity",
      question: "今天想动到什么程度？",
      bg: "activity",
      options: [
        { value: "rest", label: "最好不要动", deco: "shell" },
        { value: "light", label: "散散步可以", deco: "wave" },
        { value: "medium", label: "想做点事情", deco: "pearl" },
        { value: "active", label: "今天可以玩水 / 探索", deco: "wave" }
      ]
    },
    {
      field: "companion",
      question: "今天和谁一起？",
      bg: "companion",
      options: [
        { value: "solo", label: "我自己", deco: "shell" },
        { value: "couple", label: "和喜欢的人", deco: "pearl" },
        { value: "friends", label: "和朋友", deco: "wave" },
        { value: "family", label: "和家人", deco: "shell" }
      ]
    },
    {
      field: "emotionalIntention",
      question: "此刻最想从陵水带走什么？",
      bg: "emotion",
      options: [
        { value: "quiet", label: "一段安静", deco: "shell" },
        { value: "freedom", label: "一点自由", deco: "wave" },
        { value: "joy", label: "一点快乐", deco: "sun" },
        { value: "beauty", label: "一个漂亮瞬间", deco: "pearl" },
        { value: "novelty", label: "一点新鲜感", deco: "star" },
        { value: "localLife", label: "一点真实生活", deco: "leaf" }
      ]
    }
  ];

  // ---------- 用户答案 state（控制台可见） ----------
  const answerState = {
    energy: null,
    crowdPreference: null,
    sunPreference: null,
    activityIntensity: null,
    companion: null,
    emotionalIntention: null
  };
  // 暴露到 window 方便控制台调试
  window.__tangdaoAnswerState = answerState;

  let currentIndex = 0;
  let isAdvancing = false; // 防止重复点击

  // ---------- POI 数据缓存（提前 fetch，避免 loading 动画时才加载） ----------
  let poiCache = null;
  function fetchPois() {
    if (poiCache) return Promise.resolve(poiCache);
    return fetch("/data/lingshui-poi.json", { cache: "force-cache" })
      .then(res => res.json())
      .then(data => {
        poiCache = (data && data.pois) ? data.pois : [];
        console.log("[Tangdao] POI 数据已加载，共 " + poiCache.length + " 个");
        return poiCache;
      })
      .catch(err => {
        console.warn("[Tangdao] POI 数据加载失败：", err);
        poiCache = [];
        return [];
      });
  }

  // ---------- 装饰 SVG ----------
  const DECO_SVG = {
    shell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3C8 3 5 6 5 10c0 3 2 5 4 6l1 1h4l1-1c2-1 4-3 4-6 0-4-3-7-7-7z"/><path d="M12 7v8M12 9c-1.5 .5-2.5 1.5-3 3M12 9c1.5 .5 2.5 1.5 3 3"/></svg>',
    pearl: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="currentColor" opacity="0.85"/><circle cx="9.5" cy="9.5" r="2.2" fill="#fff" opacity="0.7"/></svg>',
    wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" opacity="0.6"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 3c4 2 6 5 6 9 0 3-2 6-6 6s-6-3-6-6c0-4 2-7 6-9z"/><path d="M12 5v16"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.5 6.5L21 9l-5 4.5L17.5 21 12 17l-5.5 4L8 13.5 3 9l6.5-.5z"/></svg>'
  };

  // ---------- 状态切换 ----------
  function setState(state) {
    if (!STATES.includes(state)) state = "intro";

    // Loading 动画生命周期管理：进入时触发，离开时强制停止防止残留
    const loadingSection = $("#loadingSection");
    if (loadingSection) {
      if (state === "loading") {
        loadingSection.classList.remove("is-exiting", "is-animating");
        // 强制重排，确保动画每次都能从头触发
        void loadingSection.offsetWidth;
        loadingSection.classList.add("is-animating");
      } else {
        // 离开 loading：停止所有动画并隐藏
        loadingSection.classList.remove("is-animating");
        loadingSection.classList.add("is-exiting");
      }
    }

    document.querySelectorAll(".page-state").forEach(el => {
      el.dataset.active = (el.dataset.state === state) ? "true" : "false";
    });
    document.querySelectorAll(".dev-switcher button").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.goto === state);
    });
    const url = new URL(window.location);
    url.searchParams.set("state", state);
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- 渲染当前题目 ----------
  function renderQuiz() {
    const item = QUIZ[currentIndex];
    if (!item) return;

    // 背景变化 class
    const stage = $("#quizStage");
    if (stage) {
      stage.className = "quiz-stage quiz-stage--" + item.bg;
    }

    // 问题
    $("#quizQuestion").textContent = item.question;

    // 选项容器（根据数量加 class，6 项用双列）
    const wrap = $("#quizOptions");
    wrap.className = "quiz__options" + (item.options.length > 4 ? " quiz__options--grid" : "");

    // 渲染选项
    wrap.innerHTML = item.options.map((opt, i) => {
      const deco = DECO_SVG[opt.deco] || DECO_SVG.shell;
      const letter = String.fromCharCode(65 + i);
      const sub = opt.subDesc ? '<span class="quiz__option-sub">' + esc(opt.subDesc) + '</span>' : '';
      return '<button class="quiz__option" data-value="' + esc(opt.value) + '" data-field="' + item.field + '">'
        + '<span class="quiz__option-deco">' + deco + '</span>'
        + '<span class="quiz__option-main">'
        + '<span class="quiz__option-label">' + esc(opt.label) + '</span>'
        + sub
        + '</span>'
        + '<span class="quiz__option-letter">' + letter + '</span>'
        + '</button>';
    }).join("");

    // 进度
    const pct = ((currentIndex + 1) / QUIZ.length) * 100;
    $("#quizProgress").style.width = pct + "%";
    $("#quizProgressText").textContent = String(currentIndex + 1).padStart(2, "0") + " / " + String(QUIZ.length).padStart(2, "0");
  }

  // ---------- 选项点击：保存 + 珠光 + 自动下一题 ----------
  function handleOptionClick(btn) {
    if (isAdvancing) return;
    const field = btn.dataset.field;
    const value = btn.dataset.value;
    const item = QUIZ[currentIndex];

    // 转换值类型（energy 为数字）
    const finalValue = item.field === "energy" ? parseInt(value, 10) : value;
    answerState[field] = finalValue;

    // 控制台完整可见
    console.log("[Tangdao] 答案已保存:", field, "=", finalValue);
    console.log("[Tangdao] 当前 answerState:", JSON.parse(JSON.stringify(answerState)));

    isAdvancing = true;
    btn.classList.add("is-selected");

    // 自动下一题（300~500ms 延迟配合珠光动画）
    setTimeout(() => {
      if (currentIndex < QUIZ.length - 1) {
        currentIndex++;
        renderQuiz();
        isAdvancing = false;
      } else {
        // 6 题全部完成 → 调用角色判断系统
        console.log("%c[Tangdao] 6题全部完成，最终 answerState：", "color:#27453F;font-weight:bold;", answerState);
        const result = window.tangdaoScoreRole(answerState);
        window.__tangdaoResult = result;
        renderResult(result);
        setState("loading");
        // 异步计算 TOP3 推荐（确保 POI 已加载）
        fetchPois().then(pois => {
          if (typeof window.tangdaoRecommendTop3 !== "function") {
            console.warn("[Tangdao] POI推荐引擎未就绪，跳过 TOP3");
            return;
          }
          const top3 = window.tangdaoRecommendTop3(pois, answerState, result.winner.role);
          window.__tangdaoTop3 = top3;
          renderTop3(top3);
        }).catch(err => console.warn("[Tangdao] TOP3 计算失败：", err));
        // 等待 loading 动画完整播放（水退→沙现→贝壳→文字，约 3.2s）
        setTimeout(() => setState("result"), 3200);
      }
    }, 420);
  }

  // ---------- 渲染结果页（用角色配置数据，文案避免"你就是"） ----------
  function renderResult(result) {
    if (!result || !result.winner) return;
    const role = result.winner.role;
    const card = $("#resultCard");

    // 角色主题色（用 CSS 变量驱动卡片色调）
    if (card) {
      card.style.setProperty("--role-color", role.color);
      card.style.borderColor = role.color;
    }

    const el = {
      number: $("#resultRoleNumber"),
      name: $("#resultRoleName"),
      en: $("#resultRoleEn"),
      quote: $("#resultRoleQuote"),
      desc: $("#resultRoleDesc"),
      tags: $("#resultTags"),
      suggest: $("#resultSuggest")
    };

    if (el.number) el.number.textContent = role.number;
    if (el.name) el.name.textContent = role.name;
    if (el.en) el.en.textContent = role.nameEn;
    if (el.quote) el.quote.textContent = "「" + role.quote + "」";
    if (el.desc) el.desc.textContent = role.description;
    if (el.tags) {
      el.tags.innerHTML = role.tags.map(t => '<span class="result__tag">' + esc(t) + '</span>').join("");
    }
    // suggest 区域保留为角色气质补充，TOP3 在下方单独渲染
    if (el.suggest) {
      el.suggest.textContent = "基于你今天的状态和 " + role.name + " 的气质，为你从陵水挑了 3 个去处 ↓";
    }
  }

  // ---------- 渲染 TOP3 明信片 ----------
  function renderTop3(top3) {
    const wrap = $("#resultTop3");
    if (!wrap) return;
    if (!top3 || !top3.length) {
      wrap.innerHTML = '<p class="result__empty">暂时无法生成推荐，请稍后再试。</p>';
      return;
    }

    wrap.innerHTML = top3.map((item, i) => {
      const poi = item.poi;
      const num = String(i + 1).padStart(2, "0");
      // 取 2~3 个 tag
      const tags = (poi.tag || []).slice(0, 3);
      const tagHtml = tags.map(t => '<span class="postcard__tag">' + esc(t) + '</span>').join("");
      // layer_type 中文
      const layerMap = {
        beach: "海滩", fishing: "渔排", hike: "慢行", family: "亲子",
        village: "渔村", food_drink: "食饮", handcraft: "手作",
        culture: "文化", water_sports: "玩水"
      };
      const layerLabel = layerMap[poi.layer_type] || "陵水";
      return ''
        + '<article class="postcard" data-poi-id="' + poi.id + '">'
        +   '<div class="postcard__head">'
        +     '<span class="postcard__num">' + num + '</span>'
        +     '<span class="postcard__layer">' + esc(layerLabel) + '</span>'
        +   '</div>'
        +   '<h4 class="postcard__title">' + esc(poi.name) + '</h4>'
        +   '<div class="postcard__fit">'
        +     '<span class="postcard__fit-label">适合度</span>'
        +     '<span class="postcard__fit-value">' + item.fitPercent + '%</span>'
        +     '<span class="postcard__fit-bar"><span class="postcard__fit-fill" style="width:' + item.fitPercent + '%"></span></span>'
        +   '</div>'
        +   '<div class="postcard__tags">' + tagHtml + '</div>'
        +   '<p class="postcard__reason">' + esc(item.reason) + '</p>'
        +   '<p class="postcard__addr">' + esc(poi.address) + '</p>'
        +   '<button class="postcard__collect" data-action="collect-place" data-place-id="' + poi.id + '" type="button">🔖 收藏到我的躺岛</button>'
        +   '<div class="postcard__posts" id="postcardPosts' + poi.id + '" data-poi-id="' + poi.id + '"></div>'
        + '</article>';
    }).join("");

    // 同步渲染隐藏分享卡（供 PNG 导出）
    renderShareCard();

    // 绑定收藏按钮（确保 store 已加载）
    var Store = window.TangdaoStore;
    if (Store) {
      Store.ensureLoaded().then(function () {
        wrap.querySelectorAll('[data-action="collect-place"]').forEach(function (btn) {
          var pid = btn.getAttribute("data-place-id");
          if (Store.isPlaceSaved(pid)) {
            btn.classList.add("is-saved");
            btn.textContent = "🔖 已收藏";
          }
        });
      });
      wrap.addEventListener("click", function (e) {
        var btn = e.target.closest('[data-action="collect-place"]');
        if (!btn) return;
        e.preventDefault();
        var pid = btn.getAttribute("data-place-id");
        var nowSaved = Store.togglePlace(pid);
        btn.classList.toggle("is-saved", nowSaved);
        btn.textContent = nowSaved ? "🔖 已收藏" : "🔖 收藏到我的躺岛";
        // toast 反馈
        var toast = document.createElement("div");
        toast.textContent = nowSaved ? "已收藏到我的躺岛 ✓" : "已取消收藏";
        toast.style.cssText = "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:rgba(58,42,28,0.92);color:#fff;padding:0.6rem 1.2rem;border-radius:20px;font-size:0.82rem;z-index:9999;transition:opacity 0.3s;";
        document.body.appendChild(toast);
        setTimeout(function () { toast.style.opacity = "0"; }, 1500);
        setTimeout(function () { toast.remove(); }, 1900);
      });
    }

    // 填充"看看别人怎么待在这里"相关帖子（每张卡显示 1 条摘要 + 查看全部）
    var PlacePosts = window.TangdaoPlacePosts;
    if (PlacePosts) {
      wrap.querySelectorAll(".postcard__posts").forEach(function (postsWrap) {
        var pid = postsWrap.getAttribute("data-poi-id");
        if (!pid) return;
        PlacePosts.fetchPostsByPlace(pid).then(function (posts) {
          if (!posts || !posts.length) return; // 无相关帖子则不显示
          var count = posts.length;
          var first = posts[0];
          postsWrap.innerHTML =
            '<div class="postcard__posts-head"><span>💬 看看别人怎么待在这里</span></div>'
            + PlacePosts.renderPostSnippet(first)
            + (count > 1 ? '<a class="postcard__posts-more" href="/community.html?place=' + encodeURIComponent(pid) + '">还有 ' + (count - 1) + ' 条 →</a>' : '');
        });
      });
    }
  }

  // ---------- 渲染隐藏分享卡（1080×1440） ----------
  function renderShareCard() {
    const result = window.__tangdaoResult;
    const top3 = window.__tangdaoTop3;
    if (!result || !result.winner) return;
    const role = result.winner.role;

    // 顶部编号 TANGDAO SHELL 05
    const numberEl = $("#shareCardNumber");
    if (numberEl) numberEl.textContent = "TANGDAO SHELL " + role.number;

    // 贝壳视觉（内联 SVG，确保导出不丢失）
    const visualEl = $("#shareCardVisual");
    if (visualEl) {
      const svg = (typeof window.tangdaoGetShellVisual === "function")
        ? window.tangdaoGetShellVisual(role.id)
        : "";
      visualEl.innerHTML = svg;
    }

    // 角色信息
    const setText = (id, text) => { const el = $("#" + id); if (el) el.textContent = text; };
    setText("shareCardRoleName", role.name.split("").join(" "));
    setText("shareCardRoleEn", role.nameEn);
    setText("shareCardQuote", role.quote);
    setText("shareCardTags", (role.tags || []).slice(0, 4).join(" · "));

    // TOP3 列表
    const top3El = $("#shareCardTop3");
    if (top3El && top3 && top3.length) {
      top3El.innerHTML = top3.map((item, i) => {
        const num = String(i + 1).padStart(2, "0");
        // 名称截断（过长省略）
        let name = item.poi.name || "";
        if (name.length > 14) name = name.slice(0, 13) + "…";
        return ''
          + '<div class="share-card__top3-item">'
          +   '<span class="share-card__top3-num">' + num + '</span>'
          +   '<span class="share-card__top3-name">' + esc(name) + '</span>'
          +   '<span class="share-card__top3-fit">' + item.fitPercent + '%</span>'
          + '</div>';
      }).join("");
    }

    // 日期
    setText("shareCardDate", formatShareDate(new Date()));
  }

  // ---------- 日期格式化：30 AUG 2026 ----------
  function formatShareDate(date) {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    return String(d).padStart(2, "0") + " " + m + " " + y;
  }

  // ---------- 获取陵水真实天气（高德 API，失败则静默跳过） ----------
  let cachedWeather = null;
  function fetchWeather() {
    if (cachedWeather !== null) return Promise.resolve(cachedWeather);
    const cfg = window.TANGDAO_CONFIG;
    if (!cfg || !cfg.amapKey) { cachedWeather = ""; return Promise.resolve(""); }
    // 高德天气 API：city 用陵水 adcode 或名称
    const url = "https://restapi.amap.com/v3/weather/weatherInfo?key=" + cfg.amapKey + "&city=460028&extensions=base";
    return fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.status === "1" && data.lives && data.lives[0]) {
          const live = data.lives[0];
          const temp = live.temperature ? live.temperature + "°C" : "";
          const weather = live.weather || "";
          const text = [temp, weather.toUpperCase()].filter(Boolean).join(" · ");
          cachedWeather = text;
          console.log("[Tangdao · 天气] 陵水实时天气：" + text);
        } else {
          cachedWeather = "";
        }
        return cachedWeather;
      })
      .catch(err => {
        console.warn("[Tangdao · 天气] 获取失败，分享卡不显示天气：", err);
        cachedWeather = "";
        return "";
      });
  }

  // ---------- 保存分享卡为 PNG ----------
  async function saveShareCard() {
    const card = $("#shareCard");
    const btn = $("#btnSaveCard");
    if (!card) { alert("分享卡组件未就绪"); return; }

    // 按钮状态：保存中
    const originalText = btn ? btn.textContent : "";
    if (btn) { btn.textContent = "正在生成贝壳卡…"; btn.disabled = true; }

    try {
      // 1. 确保字体已加载（防止导出时字体丢失）
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      // 2. 异步刷新天气（不阻塞导出，上次成功则用缓存）
      fetchWeather().then(text => {
        const wEl = $("#shareCardWeather");
        if (wEl) wEl.textContent = text;
      }).catch(() => {});

      // 3. 等待一帧，确保天气 DOM 更新 + 字体渲染
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      // 4. 用 html-to-image 导出 PNG
      if (typeof htmlToImage === "undefined") {
        throw new Error("html-to-image 库未加载，请检查网络");
      }

      const dataUrl = await htmlToImage.toPng(card, {
        pixelRatio: 2,           // 2x 高清，适合手机屏幕
        cacheBust: true,
        backgroundColor: "#F7F3EF",
        width: 1080,
        height: 1440,
        style: {
          transform: "none"      // 防止隐藏状态的 transform 影响
        }
      });

      // 5. 下载 / 保存
      const role = (window.__tangdaoResult && window.__tangdaoResult.winner)
        ? window.__tangdaoResult.winner.role : {};
      const filename = "tangdao-shell-" + (role.id || "today") + "-" + formatShareDate(new Date()).replace(/\s/g, "") + ".png";

      downloadDataUrl(dataUrl, filename);
      console.log("%c[Tangdao · 分享卡] PNG 已导出：" + filename, "color:#27453F;font-weight:bold;");

      if (btn) btn.textContent = "已保存 ✓";
      setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
    } catch (err) {
      console.error("[Tangdao · 分享卡] 导出失败：", err);
      alert("贝壳卡生成失败：" + (err.message || "未知错误") + "\n请截图保存结果页也是一样的。");
      if (btn) btn.textContent = originalText;
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  // ---------- 下载 dataURL（兼容移动端） ----------
  function downloadDataUrl(dataUrl, filename) {
    // 优先用 a 标签 download
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 移动端 iOS Safari 可能不触发 download，提示长按保存
    setTimeout(() => {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        console.log("[Tangdao] iOS 设备：请长按图片保存到相册");
      }
    }, 500);
  }

  // ---------- 应用测试预设（dev 角色按钮） ----------
  async function applyPreset(presetId) {
    const presets = window.TANGDAO_TEST_PRESETS || [];
    const preset = presets.find(p => p.id === presetId);
    if (!preset) {
      console.warn("[Tangdao] 未找到预设：" + presetId);
      return;
    }
    // 写入 answerState
    Object.keys(answerState).forEach(k => {
      answerState[k] = preset.answerState[k] !== undefined ? preset.answerState[k] : null;
    });
    window.__tangdaoAnswerState = answerState;
    console.log("%c[Tangdao · 测试] 应用预设：" + preset.label, "color:#9CCECE;font-weight:bold;", answerState);
    // 确保 POI 数据已加载（快速点击时可能还在 fetch）
    const pois = await fetchPois();
    // 直接评分 + 渲染结果
    const result = window.tangdaoScoreRole(answerState);
    window.__tangdaoResult = result;
    renderResult(result);
    // 计算 TOP3 推荐（防御性检查）
    if (typeof window.tangdaoRecommendTop3 !== "function") {
      console.warn("[Tangdao] POI推荐引擎未就绪，跳过 TOP3");
      setState("result");
      return;
    }
    const top3 = window.tangdaoRecommendTop3(pois, answerState, result.winner.role);
    window.__tangdaoTop3 = top3;
    renderTop3(top3);
    setState("result");
  }

  // ---------- 工具 ----------
  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    document.addEventListener("click", (e) => {
      // 选项点击
      const optionBtn = e.target.closest(".quiz__option");
      if (optionBtn) {
        handleOptionClick(optionBtn);
        return;
      }
      // 动作按钮
      const actionEl = e.target.closest("[data-action]");
      if (actionEl) {
        handleAction(actionEl.dataset.action);
        return;
      }
      // dev 切换
      const gotoEl = e.target.closest(".dev-switcher button[data-goto]");
      if (gotoEl) {
        setState(gotoEl.dataset.goto);
        return;
      }
      // dev 角色测试预设
      const presetEl = e.target.closest(".dev-roles button[data-preset]");
      if (presetEl) {
        applyPreset(presetEl.dataset.preset);
        return;
      }
    });

    // 键盘 1-4 快捷切换（开发模式）
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const map = { "1": "intro", "2": "quiz", "3": "loading", "4": "result" };
      if (map[e.key]) setState(map[e.key]);
    });
  }

  function handleAction(action) {
    switch (action) {
      case "start":
        // 重置答案
        Object.keys(answerState).forEach(k => answerState[k] = null);
        currentIndex = 0;
        isAdvancing = false;
        renderQuiz();
        setState("quiz");
        break;
      case "back":
        if (currentIndex > 0) {
          currentIndex--;
          isAdvancing = false;
          renderQuiz();
        } else {
          setState("intro");
        }
        break;
      case "restart":
        Object.keys(answerState).forEach(k => answerState[k] = null);
        currentIndex = 0;
        isAdvancing = false;
        // 清空结果与分享卡
        window.__tangdaoResult = null;
        window.__tangdaoTop3 = null;
        renderQuiz();
        setState("intro");
        break;
      case "save":
        saveShareCard();
        break;
    }
  }

  // ---------- 初始化 ----------
  function init() {
    bindEvents();
    renderQuiz();
    // 提前加载 POI 数据，缓存供推荐使用
    fetchPois();
    const params = new URL(window.location).searchParams;
    const initial = params.get("state");
    setState(STATES.includes(initial) ? initial : "intro");
    console.log("[Tangdao] answerState 已挂载到 window.__tangdaoAnswerState，可在控制台查看");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
