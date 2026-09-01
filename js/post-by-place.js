/* ============================================
   躺岛 TANGDAO · 地点帖子聚合模块
   围绕 placeId 组织帖子，让帖子成为地点体验的一部分
   暴露全局单例 window.TangdaoPlacePosts
   ============================================ */
(function () {
  "use strict";

  const POSTS_URL = "/data/demo-posts.json";

  // ---------- 工具：统一 ID 为字符串，避免数字 vs 字符串静默不匹配 ----------
  function idStr(id) {
    if (id === null || id === undefined) return "";
    return String(id);
  }

  // ---------- HTML 转义 ----------
  function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---------- 缓存：避免重复拉取 ----------
  let postsCache = null;
  let postsPromise = null;

  function fetchAllPosts() {
    if (postsCache) return Promise.resolve(postsCache);
    if (postsPromise) return postsPromise;
    postsPromise = fetch(POSTS_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        postsCache = (data && data.posts) || [];
        return postsCache;
      })
      .catch(function (err) {
        console.warn("[TangdaoPlacePosts] 帖子数据加载失败：", err);
        postsCache = [];
        return [];
      });
    return postsPromise;
  }

  // ---------- 按 placeId 过滤帖子 ----------
  // placeId 为数字或字符串均可，内部统一字符串比较
  function fetchPostsByPlace(placeId) {
    var target = idStr(placeId);
    if (!target) return Promise.resolve([]);
    return fetchAllPosts().then(function (posts) {
      return posts.filter(function (p) {
        return idStr(p.placeId) === target;
      });
    });
  }

  // ---------- 单条帖子紧凑摘要（用于嵌入地图卡 / now 页 / today 卡） ----------
  function renderPostSnippet(post) {
    if (!post) return "";
    // 摘要：取正文前 60 字，截到句号
    var content = (post.content || "").trim();
    var summary = content.length > 60 ? content.slice(0, 60) + "…" : content;
    var tags = (post.tags || []).slice(0, 2)
      .map(function (t) { return '<span class="pp-snippet__tag">' + esc(t) + '</span>'; }).join("");
    return ''
      + '<a class="pp-snippet" href="/community/' + encodeURIComponent(post.id) + '">'
      +   '<div class="pp-snippet__head">'
      +     '<span class="pp-snippet__cat">' + esc(post.category || "") + '</span>'
      +     '<span class="pp-snippet__author">' + esc(post.authorName || "匿名岛民") + '</span>'
      +   '</div>'
      +   '<p class="pp-snippet__title">' + esc(post.title || "") + '</p>'
      +   '<p class="pp-snippet__summary">' + esc(summary) + '</p>'
      +   (tags ? '<div class="pp-snippet__tags">' + tags + '</div>' : '')
      + '</a>';
  }

  // ---------- 渲染多条帖子列表（返回 Promise<string>） ----------
  // limit 默认 3；空列表返回空字符串，由调用方决定是否显示区块
  function renderPostList(placeId, limit) {
    var max = (typeof limit === "number" && limit > 0) ? limit : 3;
    return fetchPostsByPlace(placeId).then(function (posts) {
      if (!posts || !posts.length) return "";
      return posts.slice(0, max).map(renderPostSnippet).join("");
    });
  }

  // ---------- 同步获取缓存的帖子数（用于显示计数，如"看看别人怎么说 (3)"） ----------
  function getCachedCountByPlace(placeId) {
    if (!postsCache) return null; // 缓存未就绪
    var target = idStr(placeId);
    return postsCache.filter(function (p) { return idStr(p.placeId) === target; }).length;
  }

  // ---------- 导出 ----------
  window.TangdaoPlacePosts = {
    idStr: idStr,
    fetchAllPosts: fetchAllPosts,
    fetchPostsByPlace: fetchPostsByPlace,
    renderPostSnippet: renderPostSnippet,
    renderPostList: renderPostList,
    getCachedCountByPlace: getCachedCountByPlace
  };
})();
