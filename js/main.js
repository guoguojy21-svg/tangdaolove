/* ============================================
   躺岛 TANGDAO · 交互脚本
   ============================================ */

(function () {
  "use strict";

  // ---------- 导航栏滚动效果 ----------
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- 移动端菜单 ----------
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.querySelector(".nav__links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
      navToggle.classList.toggle("active");
    });
    // 点击链接后关闭菜单
    navLinks.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        navLinks.classList.remove("open");
        navToggle.classList.remove("active");
      });
    });
  }

  // ---------- 滚动揭示动画 ----------
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in-view"));
  }

  // ---------- 装饰元素视差 ----------
  const shellDecor = document.querySelector(".decor--shell");
  const waveDecor = document.querySelector(".decor--wave");
  const heroBg = document.querySelector(".hero__bg");
  const hero = document.getElementById("hero");

  const onHeroScroll = () => {
    const y = window.scrollY;
    if (y > window.innerHeight) return;
    if (shellDecor) shellDecor.style.transform = `translateY(${y * 0.15}px)`;
    if (waveDecor) waveDecor.style.transform = `translateY(${y * -0.1}px)`;
  };
  window.addEventListener("scroll", onHeroScroll, { passive: true });
})();
