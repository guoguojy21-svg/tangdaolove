/* ============================================
   躺岛首页 · 交互逻辑
   1. 动态文案轮播（淡入淡出 + 轻微位移）
   2. 实时时钟（Asia/Shanghai，复用 map.js 模式）
   ============================================ */
(function () {
  "use strict";

  // ---------- 工具 ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  // ---------- 1. 动态文案轮播 ----------
  function initRotator() {
    const rotator = $("#homeRotator");
    if (!rotator) return;

    const items = rotator.querySelectorAll(".rotator__item");
    if (items.length < 2) return;

    let current = 0;
    const INTERVAL = 2800; // 2.5~3 秒之间

    setInterval(() => {
      items[current].classList.remove("is-active");
      current = (current + 1) % items.length;
      items[current].classList.add("is-active");
    }, INTERVAL);
  }

  // ---------- 2. 实时时钟（Asia/Shanghai） ----------
  function startClock() {
    const el = $("#liveClock");
    if (!el) return;

    const tick = () => {
      try {
        el.textContent = new Date().toLocaleTimeString("zh-CN", {
          timeZone: "Asia/Shanghai",
          hour12: false
        });
      } catch (e) {
        el.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
      }
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---------- 3. 天气 / 日落（占位，后续接入真实 API） ----------
  function initWeatherPlaceholder() {
    const weatherEl = $("#liveWeather");
    const sunsetEl = $("#liveSunset");
    if (weatherEl) weatherEl.textContent = "26°C 晴";
    if (sunsetEl) sunsetEl.textContent = "18:42 日落";
  }

  // ---------- 启动 ----------
  document.addEventListener("DOMContentLoaded", () => {
    initRotator();
    startClock();
    initWeatherPlaceholder();
  });
})();
