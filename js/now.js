/* ============================================
   躺岛 TANGDAO · 「正在发生 NOW AT THIS PLACE」
   数据驱动渲染：Today Timeline / Week Events / Recent Changes
   数据源：
     · 地点基础信息 → data/lingshui-poi.json（POI 唯一数据源，不复制）
     · 活动信息     → data/place-events.json（按 placeId 索引）
   路由：/now/:placeId（或 now.html?placeId=X 降级）
   ============================================ */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  // ---------- 工具：HTML 转义 ----------
  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---------- 解析 placeId ----------
  // 优先从 pathname /now/:id 解析，降级到 ?placeId=
  function parsePlaceId() {
    const pathMatch = location.pathname.match(/\/now\/(\d+)/);
    if (pathMatch) return parseInt(pathMatch[1], 10);
    const queryMatch = location.search.match(/[?&]placeId=(\d+)/);
    if (queryMatch) return parseInt(queryMatch[1], 10);
    return 1; // 默认清水湾（POI id=1）
  }

  // ---------- 拉取 POI 数据（lingshui-poi.json，地点信息唯一源） ----------
  let poiCache = null;
  function fetchPois() {
    if (poiCache) return Promise.resolve(poiCache);
    return fetch("/data/lingshui-poi.json", { cache: "force-cache" })
      .then(res => res.json())
      .then(data => { poiCache = data || { pois: [] }; return poiCache; })
      .catch(err => {
        console.warn("[Tangdao · 正在发生] POI 数据加载失败：", err);
        poiCache = { pois: [] };
        return poiCache;
      });
  }

  // ---------- 拉取事件数据（place-events.json，按 placeId 索引） ----------
  let eventCache = null;
  function fetchEvents() {
    if (eventCache) return Promise.resolve(eventCache);
    return fetch("/data/place-events.json", { cache: "force-cache" })
      .then(res => res.json())
      .then(data => { eventCache = data || { places: [] }; return eventCache; })
      .catch(err => {
        console.warn("[Tangdao · 正在发生] 事件数据加载失败：", err);
        eventCache = { places: [] };
        return eventCache;
      });
  }

  // ---------- 渲染地点基础信息（标题 / Hero / 基础信息列表） ----------
  function renderPlaceInfo(poi) {
    const titleEl = $("#placeTitle");
    const heroEl = $("#heroLocation");
    const basicEl = $("#basicInfoList");

    if (!poi) {
      if (titleEl) titleEl.textContent = "未找到该地点";
      if (heroEl) heroEl.textContent = "Lingshui · 陵水";
      if (basicEl) basicEl.innerHTML = '<div class="basic-info__row"><dt>提示</dt><dd>该地点不存在或已下架。</dd></div>';
      return;
    }

    // 标题：地点名（过长时自动换行，不强制 <br>）
    if (titleEl) titleEl.textContent = poi.name || "未命名地点";
    // Hero 浮层：区域名 + 地点名
    if (heroEl) heroEl.textContent = "Lingshui · " + (poi.name || "陵水");

    // 基础信息：地址 / 类型 / 适合人群 / 备注
    let html = "";
    if (poi.address) {
      html += '<div class="basic-info__row"><dt>地址</dt><dd>' + esc(poi.address) + '</dd></div>';
    }
    if (poi.layer_type) {
      const layerLabel = getLayerLabel(poi.layer_type);
      html += '<div class="basic-info__row"><dt>类型</dt><dd>' + esc(layerLabel) + '</dd></div>';
    }
    if (poi.crowd) {
      html += '<div class="basic-info__row"><dt>适合</dt><dd>' + esc(poi.crowd) + '</dd></div>';
    }
    if (poi.remark) {
      html += '<div class="basic-info__row"><dt>备注</dt><dd>' + esc(poi.remark) + '</dd></div>';
    }
    if (!html) {
      html = '<div class="basic-info__row"><dt>信息</dt><dd>暂无更多基础信息</dd></div>';
    }
    if (basicEl) basicEl.innerHTML = html;
  }

  // 图层类型中文标签（与 map.js LAYER_META 保持一致）
  const LAYER_LABEL = {
    beach: "沙滩", fishing: "渔排赶海", hike: "慢行徒步",
    village: "渔村乡村", family: "亲子浅滩", food_drink: "咖啡餐饮",
    handcraft: "手作体验", culture: "文化展馆", water_sports: "水上运动"
  };
  function getLayerLabel(layer) {
    return LAYER_LABEL[layer] || layer;
  }

  // ---------- 渲染 Today Timeline ----------
  function renderTodayTimeline(items) {
    const wrap = $("#timelineList");
    if (!wrap) return;
    if (!items || !items.length) {
      // 空状态：用户明确要求的文案
      wrap.innerHTML = '<li class="timeline__empty">今天这里很安静。</li>';
      return;
    }

    wrap.innerHTML = items.map(item => {
      const status = item.status || "future"; // past | current | future
      const itemClass = "timeline__item timeline__item--" + status;
      const dotClass = "timeline__dot" + (status === "current" ? " timeline__dot--current" : "");
      return ''
        + '<li class="' + itemClass + '">'
        +   '<span class="timeline__time">' + esc(item.time) + '</span>'
        +   '<span class="' + dotClass + '"></span>'
        +   '<div class="timeline__body">'
        +     '<p class="timeline__event">' + esc(item.event) + '</p>'
        +     (item.desc ? '<p class="timeline__desc">' + esc(item.desc) + '</p>' : '')
        +   '</div>'
        + '</li>';
    }).join("");
  }

  // ---------- 渲染 Week Events（横向轻量活动条） ----------
  function renderWeekEvents(items) {
    const wrap = $("#weekStrip");
    if (!wrap) return;
    if (!items || !items.length) {
      wrap.innerHTML = '<p class="week-strip__empty">本周暂无特别活动</p>';
      return;
    }

    wrap.innerHTML = items.map(item => {
      return ''
        + '<article class="week-card">'
        +   '<span class="week-card__date">' + esc(item.dateRange) + '</span>'
        +   '<span class="week-card__day">' + esc(item.dayLabel || "") + '</span>'
        +   '<p class="week-card__name">' + esc(item.name) + '</p>'
        +   '<p class="week-card__loc">' + esc(item.location || "") + '</p>'
        + '</article>';
    }).join("");
  }

  // ---------- 渲染 Recent Changes ----------
  function renderRecentChanges(items) {
    const wrap = $("#changeList");
    if (!wrap) return;
    if (!items || !items.length) {
      // 空状态：用户明确要求的文案
      wrap.innerHTML = '<li class="change-list__empty">最近没有明显变化。</li>';
      return;
    }

    // 标签颜色映射：NEW / NOTICE / HOT
    const tagMap = {
      NEW: "new",
      NOTICE: "notice",
      HOT: "hot"
    };

    wrap.innerHTML = items.map(item => {
      const tag = (item.tag || "INFO").toUpperCase();
      const tagClass = "change-list__tag change-list__tag--" + (tagMap[tag] || "info");
      return ''
        + '<li class="change-list__item">'
        +   '<span class="' + tagClass + '">' + esc(tag) + '</span>'
        +   '<p class="change-list__text">' + esc(item.text)
        +     (item.metric ? ' <span class="change-list__metric">' + esc(item.metric) + '</span>' : '')
        +   '</p>'
        + '</li>';
    }).join("");
  }

  // ============================================
  // Live Comments · 海风吹过来的几句话（示意留言）
  // 架构原则（经验 #100033298）：
  //   · JS 唯一控制：随机选取、CSS 变量分配、DOM 生成、定时生成、点击放大 class
  //   · CSS 唯一控制：动画消费变量、hover 暂停、视觉样式、移动端隐藏
  // ============================================
  let demoCommentsCache = null;
  let liveCommentTimer = null;

  function fetchDemoComments() {
    if (demoCommentsCache) return Promise.resolve(demoCommentsCache);
    return fetch("/data/demo-comments.json", { cache: "force-cache" })
      .then(res => res.json())
      .then(data => { demoCommentsCache = data || { comments: [] }; return demoCommentsCache; })
      .catch(err => {
        console.warn("[Tangdao · 正在发生] 示意留言加载失败：", err);
        demoCommentsCache = { comments: [] };
        return demoCommentsCache;
      });
  }

  // 从数组中随机取一项
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 生成一条浮动留言 bubble
  function spawnCommentBubble(comments) {
    const float = $("#liveCommentsFloat");
    if (!float || !comments || !comments.length) return;
    // 移动端容器 display:none 时跳过（避免 DOM 堆积，animationend 不会触发）
    if (float.offsetParent === null) return;

    // 同屏数量上限（桌面端 3-5）
    const maxOnScreen = window.matchMedia("(max-width: 900px)").matches ? 2 : 4;
    const existing = float.querySelectorAll(".comment-bubble").length;
    if (existing >= maxOnScreen) return;

    const item = pickRandom(comments);
    if (!item || !item.text) return;

    const bubble = document.createElement("article");
    bubble.className = "comment-bubble";
    // 装饰元素随机选择：wave / shell / droplet，不是每条都加
    const decoChoice = Math.random();
    if (decoChoice < 0.4) {
      bubble.classList.add("comment-bubble--deco-wave");
    } else if (decoChoice < 0.7) {
      bubble.classList.add("comment-bubble--deco-shell");
    } else if (decoChoice < 0.85) {
      bubble.classList.add("comment-bubble--deco-droplet");
    }
    // CSS 变量：JS 唯一分配，CSS 只消费
    // 穿越时间 18-30 秒（缓慢漂浮）
    const travelDuration = 18 + Math.random() * 12;
    // 垂直位置 8%-72%（不同留言略微不同高度）
    const topOffset = 8 + Math.random() * 64;
    // 轻微随机延迟（错开起点）
    const animDelay = Math.random() * 3;
    bubble.style.setProperty("--travel-duration", travelDuration.toFixed(1) + "s");
    bubble.style.setProperty("--top-offset", topOffset.toFixed(1) + "%");
    bubble.style.setProperty("--anim-delay", animDelay.toFixed(1) + "s");

    bubble.innerHTML = ''
      + '<span class="comment-bubble__text">' + esc(item.text) + '</span>'
      + (item.author ? '<span class="comment-bubble__author">' + esc(item.author) + '</span>' : '');

    // 点击轻微放大（JS 控制 class，CSS 控制 scale）
    bubble.addEventListener("click", function () {
      bubble.classList.toggle("comment-bubble--pop");
      // 放大后自动恢复
      setTimeout(function () {
        bubble.classList.remove("comment-bubble--pop");
      }, 600);
    });

    float.appendChild(bubble);

    // 动画结束后移除元素（避免 DOM 堆积）
    bubble.addEventListener("animationend", function () {
      if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
    });
  }

  function initLiveComments() {
    fetchDemoComments().then(data => {
      const comments = data.comments || [];
      if (!comments.length) return;
      // 初始先放 3 条，错开起点
      for (let i = 0; i < 3; i++) {
        setTimeout(function () { spawnCommentBubble(comments); }, i * 1500);
      }
      // 每 6 秒生成一条新留言
      liveCommentTimer = setInterval(function () {
        spawnCommentBubble(comments);
      }, 6000);
      console.log("[Tangdao · 正在发生] 示意留言已就绪，共 " + comments.length + " 条素材");
    });
  }

  // ---------- 主初始化 ----------
  function init() {
    const placeId = parsePlaceId();

    // 1. 先拉取 POI 数据，渲染地点基础信息（标题 / Hero / 基础信息）
    fetchPois().then(poiData => {
      const pois = poiData.pois || [];
      const poi = pois.find(p => p.id === placeId);
      renderPlaceInfo(poi);

      // 2. 拉取事件数据，按 placeId 匹配后渲染
      fetchEvents().then(eventData => {
        const places = eventData.places || [];
        const placeEvents = places.find(p => p.placeId === placeId);

        if (placeEvents) {
          renderTodayTimeline(placeEvents.todayTimeline);
          renderWeekEvents(placeEvents.weekEvents);
          renderRecentChanges(placeEvents.recentChanges);
          console.log("[Tangdao · 正在发生] placeId=" + placeId + " 数据已渲染："
            + (placeEvents.todayTimeline ? placeEvents.todayTimeline.length : 0) + " 条今日 · "
            + (placeEvents.weekEvents ? placeEvents.weekEvents.length : 0) + " 条本周 · "
            + (placeEvents.recentChanges ? placeEvents.recentChanges.length : 0) + " 条变化");
        } else {
          // 该地点无事件数据：显示友好空状态，不报错不空白
          renderTodayTimeline(null);      // → "今天这里很安静。"
          renderWeekEvents(null);         // → "本周暂无特别活动"
          renderRecentChanges(null);      // → "最近没有明显变化。"
          console.log("[Tangdao · 正在发生] placeId=" + placeId + " 暂无事件数据，已显示空状态");
        }
      });
    });

    // 示意留言独立初始化（不阻塞主数据渲染，始终使用 Demo Comments）
    initLiveComments();

    // 收藏按钮接入 store
    initCollectButton(placeId);

    // 填充"这地方最近有人说"相关帖子
    initPlacePosts(placeId);
  }

  // ---------- 收藏按钮接入 TangdaoStore ----------
  function initCollectButton(placeId) {
    const btn = document.getElementById("placeCollectBtn");
    const Store = window.TangdaoStore;
    if (!btn || !Store) return;

    function reflect(saved) {
      if (saved) {
        btn.classList.add("is-saved");
        btn.textContent = "🔖 已收藏到我的躺岛";
      } else {
        btn.classList.remove("is-saved");
        btn.textContent = "🔖 收藏这个地点";
      }
    }

    Store.ensureLoaded().then(() => {
      reflect(Store.isPlaceSaved(placeId));
    });

    btn.addEventListener("click", () => {
      const nowSaved = Store.togglePlace(placeId);
      reflect(nowSaved);
      // 轻量 toast 反馈
      const toast = document.createElement("div");
      toast.textContent = nowSaved ? "已收藏到我的躺岛 ✓" : "已取消收藏";
      toast.style.cssText = "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:rgba(58,42,28,0.92);color:#fff;padding:0.6rem 1.2rem;border-radius:20px;font-size:0.82rem;z-index:9999;transition:opacity 0.3s;";
      document.body.appendChild(toast);
      setTimeout(() => { toast.style.opacity = "0"; }, 1500);
      setTimeout(() => { toast.remove(); }, 1900);
    });
  }

  // ---------- 填充"这地方最近有人说"相关帖子（按 placeId 聚合） ----------
  function initPlacePosts(placeId) {
    const section = document.getElementById("placePosts");
    const list = document.getElementById("placePostsList");
    const PlacePosts = window.TangdaoPlacePosts;
    if (!section || !list || !PlacePosts) return;

    PlacePosts.renderPostList(placeId, 3).then((html) => {
      if (!html) return; // 无相关帖子则不显示该区块
      list.innerHTML = html;
      section.style.display = "block";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
