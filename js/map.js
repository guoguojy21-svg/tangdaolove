/* ============================================
   躺岛 TANGDAO · 陵水互动地图
   高德地图 JS API 2.0 + 原生 JS
   ============================================ */
(function () {
  "use strict";

  const CONFIG = window.TANGDAO_CONFIG || {};
  const $ = (sel) => document.querySelector(sel);

  // ---------- 图层 SVG 图标（统一 24x24，线条 1.5，手绘感） ----------
  const LAYER_ICONS = {
    all: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21"/><path d="M12 7l1.8 3.2L17 12l-3.2 1.8L12 17l-1.8-3.2L7 12l3.2-1.8z" fill="currentColor" stroke="none"/></svg>',
    beach: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4C7.5 4 4 7.5 4 12c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5 0-4.5-3.5-8-8-8z"/><path d="M12 5.5v13M12 9c-1.8 0-3 1-3 3M12 9c1.8 0 3 1 3 3M12 13.5c-1.5 0-2.5 1-2.5 2.5M12 13.5c1.5 0 2.5 1 2.5 2.5"/></svg>',
    fishing: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12c2-3 5-4.5 8-3.5 2 0.8 3.2 1.8 4 2.7-0.8 0.9-2 1.9-4 2.7-3 1-6-0.5-8-3.5z"/><path d="M18 12l3-2.2v4.4z"/><circle cx="9" cy="11" r="0.7" fill="currentColor"/></svg>',
    hike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20l5-8 4 6 3-4 5 6"/><circle cx="8" cy="8" r="1.5"/><path d="M10 14l2-3"/></svg>',
    family: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="14" rx="4" ry="3"/><path d="M8 12.5C7 10.5 5 10.5 4.2 11.3M16 12.5c1-2 3-2 3.8-1.2"/><circle cx="10" cy="13.5" r="0.6" fill="currentColor"/><circle cx="14" cy="13.5" r="0.6" fill="currentColor"/><path d="M8 17.5L7 20M16 17.5l1 2.5"/></svg>',
    village: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10l8-6 8 6v10"/><rect x="9" y="14" width="6" height="6"/><path d="M18 10c2.5 0 4.5-1 4.5-3M18 10c-2.5 0-4.5-1-4.5-3M18 10V4.5"/></svg>',
    food_drink: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h11v5a5 5 0 01-5 5H10a5 5 0 01-5-5z"/><path d="M16 9h2a2 2 0 010 4h-2"/><path d="M8 4v2M11 4v2"/></svg>',
    handcraft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2.2"/><path d="M12 4.5a2.2 2.2 0 000 4.4M12 15.1a2.2 2.2 0 000 4.4M4.5 12a2.2 2.2 0 004.4 0M15.1 12a2.2 2.2 0 004.4 0"/></svg>',
    culture: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/><path d="M7 11.5h2M15 11.5h2"/></svg>',
    water_sports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3c2 0 3 2 2.5 4.5l-3.5 10c-1 3-2.5 4-3.5 3s-1-3.5 0-6.5l3.5-10C13.5 3.5 14 3 14 3z"/><path d="M4 18c2-1 4-1 6 0s4 1 6 0"/></svg>'
  };

  // ---------- 图层元信息（仅用于显示，颜色/图标） ----------
  const LAYER_META = {
    beach:        { label: "沙滩",     color: "#d98a5c", icon: LAYER_ICONS.beach },
    fishing:      { label: "渔排赶海", color: "#6b8e9f", icon: LAYER_ICONS.fishing },
    hike:         { label: "慢行徒步", color: "#6b8250", icon: LAYER_ICONS.hike },
    village:      { label: "渔村乡村", color: "#9c7a52", icon: LAYER_ICONS.village },
    family:       { label: "亲子浅滩", color: "#e0a888", icon: LAYER_ICONS.family },
    food_drink:   { label: "咖啡餐饮", color: "#c8703f", icon: LAYER_ICONS.food_drink },
    handcraft:    { label: "手作体验", color: "#a8b88a", icon: LAYER_ICONS.handcraft },
    culture:      { label: "文化展馆", color: "#7a5a3a", icon: LAYER_ICONS.culture },
    water_sports: { label: "水上运动", color: "#4a6b7d", icon: LAYER_ICONS.water_sports }
  };
  function getLayerMeta(layer) {
    return LAYER_META[layer] || { label: layer, color: "#9c8b78", icon: LAYER_ICONS.all };
  }

  // ---------- 工具：HTML 转义 ----------
  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---------- 配置检查 ----------
  function isConfigReady() {
    return CONFIG.amapKey && CONFIG.amapKey !== "YOUR_AMAP_KEY_HERE"
      && CONFIG.amapSecurityJsCode && CONFIG.amapSecurityJsCode !== "YOUR_AMAP_SECURITY_CODE_HERE";
  }

  // ---------- 加载高德地图脚本 ----------
  function loadAMap(key, securityCode) {
    return new Promise((resolve, reject) => {
      window._AMapSecurityConfig = { securityJsCode: securityCode };
      const script = document.createElement("script");
      script.src = "https://webapi.amap.com/maps?v=2.0&key=" + encodeURIComponent(key) + "&plugin=AMap.Scale";
      script.async = true;
      script.onload = () => resolve(window.AMap);
      script.onerror = () => reject(new Error("高德地图脚本加载失败，请检查网络与 Key"));
      document.head.appendChild(script);
    });
  }

  // ---------- 构建 marker HTML ----------
  function buildMarkerContent(poi, meta) {
    return '<div class="tangdao-marker" data-id="' + poi.id + '">'
      + '<div class="tangdao-marker__pin" style="background:' + meta.color + '"><span class="tangdao-marker__icon">' + meta.icon + '</span></div>'
      + '<div class="tangdao-marker__label">' + esc(poi.name) + '</div>'
      + '</div>';
  }

  // ---------- 渲染信息卡 ----------
  function renderPoiCard(poi, meta) {
    const tags = (poi.tag || []).map(t => '<span class="poi-card__tag">' + esc(t) + '</span>').join("");
    const activities = (poi.activities || []).map(a => '<li>' + esc(a) + '</li>').join("");

    let html = '';
    // 1. name
    html += '<h3 class="poi-card__name">' + esc(poi.name) + '</h3>';
    // 2. layer_type
    html += '<div class="poi-card__layer"><i style="background:' + meta.color + '"></i>' + esc(meta.label) + '</div>';
    // address (辅助)
    if (poi.address) html += '<p class="poi-card__addr">' + esc(poi.address) + '</p>';
    // 3. tag
    if (tags) html += '<div class="poi-card__tags">' + tags + '</div>';
    // 4. activities
    if (activities) html += '<div class="poi-card__section"><h5>可玩</h5><ul>' + activities + '</ul></div>';
    // 5. landscape_analysis
    if (poi.landscape_analysis) html += '<div class="poi-card__section"><h5>景观</h5><p>' + esc(poi.landscape_analysis) + '</p></div>';
    // 6. crowd
    if (poi.crowd) html += '<div class="poi-card__section"><h5>适合人群</h5><p class="poi-card__crowd">' + esc(poi.crowd) + '</p></div>';
    // 7. remark
    if (poi.remark) html += '<div class="poi-card__remark">' + esc(poi.remark) + '</div>';
    // 8. 「查看正在发生」入口 → /now/:placeId
    html += '<a class="poi-card__action" href="/now/' + poi.id + '">查看正在发生 →</a>';
    // 9. 收藏按钮（接入 TangdaoStore）
    const Store = window.TangdaoStore;
    const saved = !!(Store && Store.isPlaceSaved && Store.isPlaceSaved(poi.id));
    html += '<button class="poi-card__collect' + (saved ? ' is-saved' : '') + '" id="poiCollectBtn" data-place-id="' + poi.id + '" type="button">' +
      (saved ? '🔖 已收藏到我的躺岛' : '🔖 收藏这个地点') + '</button>';
    // 10. 看看别人怎么说 · 相关帖子（按 placeId 聚合，异步填充）
    html += '<div class="poi-card__posts" id="poiCardPosts" data-place-id="' + poi.id + '"></div>';
    return html;
  }

  // ---------- 主流程 ----------
  async function init() {
    const statusEl = $("#mapStatus");
    const statusText = $("#mapStatusText");

    // 实时时钟 + 天气优先启动（不依赖地图密钥）
    startClock();
    initNowWeather();

    // 配置检查
    if (!isConfigReady()) {
      $("#configHint").hidden = false;
      statusEl.classList.add("is-hidden");
      return;
    }

    let AMap;
    try {
      statusText.textContent = "正在加载高德地图…";
      AMap = await loadAMap(CONFIG.amapKey, CONFIG.amapSecurityJsCode);
    } catch (e) {
      statusText.textContent = e.message;
      return;
    }

    // 初始化地图
    const map = new AMap.Map("amapContainer", {
      viewMode: "2D",
      zoom: CONFIG.defaultZoom || 11,
      center: CONFIG.lingshuiCenter || [110.03, 18.50],
      mapStyle: "amap://styles/normal",
      maxZoom: 18,
      minZoom: 10,
      features: ["bg", "road", "building", "point"],
    });

    // 限制主要浏览区域在陵水附近
    if (CONFIG.lingshuiBounds && CONFIG.lingshuiBounds.length === 2) {
      map.setLimitBounds(new AMap.Bounds(CONFIG.lingshuiBounds[0], CONFIG.lingshuiBounds[1]));
    }

    // 比例尺
    map.addControl(new AMap.Scale());

    // 加载 POI 数据
    statusText.textContent = "正在加载陵水 POI 数据…";
    let data;
    try {
      const res = await fetch("/data/lingshui-poi.json");
      if (!res.ok) throw new Error("数据加载失败 (" + res.status + ")");
      data = await res.json();
    } catch (e) {
      statusText.textContent = "数据加载失败：" + e.message;
      return;
    }

    const pois = data.pois || [];
    if (!pois.length) {
      statusText.textContent = "暂无 POI 数据";
      return;
    }

    // 生成 marker
    const markerEntries = pois.map(poi => {
      const meta = getLayerMeta(poi.layer_type);
      const marker = new AMap.Marker({
        position: [poi.lng, poi.lat],
        content: buildMarkerContent(poi, meta),
        anchor: "bottom-center",
        zIndex: 100,
      });
      // 高德原生事件（主）
      marker.on("click", () => openPoiCard(poi, meta));
      marker.setMap(map);
      return { poi, marker, layer: poi.layer_type };
    });

    // 原生 DOM 事件委托（可靠 fallback，绕过 AMap 对自定义 content 的命中检测）
    const mapContainer = document.getElementById("amapContainer");
    mapContainer.addEventListener("click", (e) => {
      const markerEl = e.target.closest(".tangdao-marker");
      if (!markerEl) return;
      const id = parseInt(markerEl.dataset.id, 10);
      const entry = markerEntries.find(en => en.poi.id === id);
      if (entry) openPoiCard(entry.poi, getLayerMeta(entry.poi.layer_type));
    });

    // 生成分类（按数据中真实出现顺序去重）
    const layerOrder = [];
    const layerCounts = {};
    pois.forEach(p => {
      if (!layerCounts[p.layer_type]) { layerCounts[p.layer_type] = 0; layerOrder.push(p.layer_type); }
      layerCounts[p.layer_type]++;
    });

    // 渲染筛选 chips
    renderFilterChips(layerOrder, layerCounts, pois.length);
    // 渲染图例
    renderLegend(layerOrder);

    // 自动调整视野到能看到所有 POI（限制最大缩放，避免点位少时过度放大）
    map.setFitView(
      markerEntries.map(e => e.marker),
      false,
      [70, 70, 70, 70],
      15
    );

    // 缩放控制
    setupZoom(map, AMap);
    // 信息卡关闭
    setupCardClose();
    // 分类筛选
    setupFilter(markerEntries, map);

    // 图例可收起/展开
    const legendEl = $("#mapLegend");
    if (legendEl) {
      legendEl.addEventListener("click", (e) => {
        if (e.target.tagName === "H4") legendEl.classList.toggle("collapsed");
      });
    }

    // 隐藏加载状态
    statusEl.classList.add("is-hidden");
  }

  // ---------- 实时时钟（Asia/Shanghai） ----------
  function startClock() {
    const el = $("#liveClock");
    if (!el) return;
    const tick = () => {
      try {
        el.textContent = new Date().toLocaleTimeString("zh-CN", {
          timeZone: "Asia/Shanghai", hour12: false
        });
      } catch (e) {
        el.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      }
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---------- Now in Lingshui 天气状态（轻量动画切换，占位数据） ----------
  function initNowWeather() {
    const weatherEl = $("#nowWeather");
    if (!weatherEl) return;

    // 占位数据（后续接入真实天气 API 时只改这里的数据来源）
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 19;
    const state = isNight ? "night" : "sun"; // sun / cloud / rain / night
    const temp = "26°";
    const cond = isNight ? "夜" : "晴";

    setNowWeather(state, temp, cond);
    updateSunsetPlaceholder();

    // 每分钟检查一次昼夜切换 + 日落时间
    setInterval(() => {
      const h = new Date().getHours();
      const night = h < 6 || h >= 19;
      const newState = night ? "night" : "sun";
      if (newState !== state) setNowWeather(newState, temp, night ? "夜" : "晴");
      updateSunsetPlaceholder();
    }, 60000);
  }

  // 陵水近似日落时间占位（基于季节，后续接入真实 API 替换）
  function updateSunsetPlaceholder() {
    const sunsetEl = $("#nowSunset");
    if (!sunsetEl) return;
    const month = new Date().getMonth() + 1;
    let sunsetHour = 18, sunsetMin = 45;
    if (month >= 5 && month <= 8) { sunsetHour = 19; sunsetMin = 5; }       // 夏季
    else if (month === 4 || month === 9) { sunsetHour = 18; sunsetMin = 50; } // 春秋
    else { sunsetHour = 18; sunsetMin = 20; }                                // 冬季
    sunsetEl.textContent = String(sunsetHour).padStart(2, "0") + ":" + String(sunsetMin).padStart(2, "0");
  }

  function setNowWeather(state, temp, cond) {
    const weatherEl = $("#nowWeather");
    const tempEl = $("#nowTemp");
    const condEl = $("#nowCond");
    if (!weatherEl) return;
    weatherEl.className = "now-status__weather now-weather--" + state;
    if (tempEl) tempEl.textContent = temp;
    if (condEl) condEl.textContent = cond;
    // 根据状态切换 SVG 图标
    const icons = {
      sun: '<svg class="now-weather__icon" viewBox="0 0 24 24" fill="none"><circle class="nw-sun-core" cx="12" cy="12" r="4.2" fill="#F2C879"/><g class="nw-sun-rays" stroke="#F2C879" stroke-width="1.4" stroke-linecap="round"><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6"/></g></svg>',
      cloud: '<svg class="now-weather__icon" viewBox="0 0 24 24" fill="none"><path class="nw-cloud" d="M6 16a4 4 0 010-8 5 5 0 019.6-1.5A3.5 3.5 0 0118 16H6z" fill="#C9B896" opacity="0.7"/></svg>',
      rain: '<svg class="now-weather__icon" viewBox="0 0 24 24" fill="none"><path class="nw-cloud" d="M6 14a4 4 0 010-8 5 5 0 019.6-1.5A3.5 3.5 0 0118 14H6z" fill="#C9B896" opacity="0.6"/><line class="nw-rain-drop" x1="8" y1="16" x2="8" y2="19" stroke="#7BA7BC" stroke-width="1.4" stroke-linecap="round"/><line class="nw-rain-drop" x1="12" y1="16" x2="12" y2="19" stroke="#7BA7BC" stroke-width="1.4" stroke-linecap="round"/><line class="nw-rain-drop" x1="16" y1="16" x2="16" y2="19" stroke="#7BA7BC" stroke-width="1.4" stroke-linecap="round"/></svg>',
      night: '<svg class="now-weather__icon" viewBox="0 0 24 24" fill="none"><path class="nw-moon" d="M20 14.5A8 8 0 119.5 4a6.5 6.5 0 0010.5 10.5z" fill="#E8D8A8" opacity="0.9"/><circle class="nw-star" cx="5" cy="6" r="0.6" fill="#E8D8A8"/><circle class="nw-star" cx="18" cy="8" r="0.5" fill="#E8D8A8"/><circle class="nw-star" cx="15" cy="4" r="0.4" fill="#E8D8A8"/></svg>'
    };
    weatherEl.innerHTML = icons[state] || icons.sun;
  }

  // ---------- 筛选 chips ----------
  function renderFilterChips(layerOrder, counts, total) {
    const scroll = $("#filterScroll");
    // 保留第一个"全部"按钮，移除其余动态按钮
    const allChip = scroll.querySelector('[data-layer="all"]');
    allChip.querySelector("em").textContent = total;
    scroll.querySelectorAll(".filter-chip[data-layer]:not([data-layer='all'])").forEach(n => n.remove());

    layerOrder.forEach(layer => {
      const meta = getLayerMeta(layer);
      const btn = document.createElement("button");
      btn.className = "filter-chip";
      btn.dataset.layer = layer;
      btn.innerHTML = '<span class="filter-chip__icon" style="color:' + meta.color + '">' + meta.icon + '</span>'
        + esc(meta.label) + '<em>' + counts[layer] + '</em>';
      scroll.appendChild(btn);
    });
  }

  // ---------- 图例 ----------
  function renderLegend(layerOrder) {
    const legend = $("#mapLegend");
    let html = "<h4>图例</h4>";
    layerOrder.forEach(layer => {
      const meta = getLayerMeta(layer);
      html += '<div class="legend-row"><span class="legend-row__icon" style="color:' + meta.color + '">' + meta.icon + '</span>' + esc(meta.label) + '</div>';
    });
    legend.innerHTML = html;
  }

  // ---------- 筛选交互 ----------
  function setupFilter(entries, map) {
    const scroll = $("#filterScroll");
    scroll.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      scroll.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      const layer = btn.dataset.layer;
      const visibleMarkers = [];
      entries.forEach(({ poi, marker }) => {
        const show = layer === "all" || poi.layer_type === layer;
        marker.setMap(show ? map : null);
        if (show) visibleMarkers.push(marker);
      });
      // 若有可见点则调整视野（"全部"也需恢复全局视野）
      if (visibleMarkers.length) {
        map.setFitView(visibleMarkers, false, [70, 70, 70, 70], 15);
      }
    });
  }

  // ---------- 缩放控制 ----------
  function setupZoom(map, AMap) {
    const levelEl = $("#zoomLevel");
    const update = () => { levelEl.textContent = Math.round(map.getZoom()); };
    $("#zoomIn").addEventListener("click", () => { map.zoomIn(); setTimeout(update, 100); });
    $("#zoomOut").addEventListener("click", () => { map.zoomOut(); setTimeout(update, 100); });
    map.on("zoomend", update);
    update();
  }

  // ---------- 信息卡 ----------
  function openPoiCard(poi, meta) {
    const card = $("#poiCard");
    const inner = $("#poiCardInner");
    inner.innerHTML = renderPoiCard(poi, meta);
    card.classList.add("is-open");
    card.setAttribute("aria-hidden", "false");
    // marker 高亮
    document.querySelectorAll(".tangdao-marker.is-active").forEach(el => el.classList.remove("is-active"));
    const el = document.querySelector('.tangdao-marker[data-id="' + poi.id + '"]');
    if (el) el.classList.add("is-active");

    // 绑定收藏按钮
    const collectBtn = inner.querySelector("#poiCollectBtn");
    const Store = window.TangdaoStore;
    if (collectBtn && Store) {
      Store.ensureLoaded().then(() => {
        const saved = Store.isPlaceSaved(poi.id);
        collectBtn.classList.toggle("is-saved", saved);
        collectBtn.textContent = saved ? "🔖 已收藏到我的躺岛" : "🔖 收藏这个地点";
      });
      collectBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const nowSaved = Store.togglePlace(poi.id);
        collectBtn.classList.toggle("is-saved", nowSaved);
        collectBtn.textContent = nowSaved ? "🔖 已收藏到我的躺岛" : "🔖 收藏这个地点";
        const toast = document.createElement("div");
        toast.textContent = nowSaved ? "已收藏到我的躺岛 ✓" : "已取消收藏";
        toast.style.cssText = "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:rgba(58,42,28,0.92);color:#fff;padding:0.6rem 1.2rem;border-radius:20px;font-size:0.82rem;z-index:9999;transition:opacity 0.3s;";
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = "0"; }, 1500);
        setTimeout(() => { toast.remove(); }, 1900);
      });
    }

    // 填充"看看别人怎么说"相关帖子（按 placeId 聚合）
    const postsWrap = inner.querySelector("#poiCardPosts");
    const PlacePosts = window.TangdaoPlacePosts;
    if (postsWrap && PlacePosts) {
      postsWrap.innerHTML = '<p class="poi-card__posts-loading">看看别人怎么说…</p>';
      PlacePosts.renderPostList(poi.id, 2).then((html) => {
        // 卡片可能已关闭，检查仍在 DOM 中
        if (!document.body.contains(postsWrap)) return;
        if (html) {
          postsWrap.innerHTML = '<div class="poi-card__posts-head"><span>💬 看看别人怎么说</span><a href="/community.html?place=' + encodeURIComponent(poi.id) + '" class="poi-card__posts-more">全部 →</a></div>' + html;
        } else {
          postsWrap.innerHTML = '<p class="poi-card__posts-empty">暂时还没有人在这里留下脚印。</p>';
        }
      });
    }
  }

  function setupCardClose() {
    const card = $("#poiCard");
    $("#poiCardClose").addEventListener("click", () => {
      card.classList.remove("is-open");
      card.setAttribute("aria-hidden", "true");
      document.querySelectorAll(".tangdao-marker.is-active").forEach(el => el.classList.remove("is-active"));
    });
  }

  // 启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
