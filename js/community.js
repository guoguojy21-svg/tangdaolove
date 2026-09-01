/* ============================================
   躺岛 TANGDAO · 岛民漂流帖 community.js
   同时服务：community.html（列表页）+ community-detail.html（详情页）
   本阶段：feed + 卡片 + category 筛选 + 模拟数据接入
   数据源：data/demo-posts.json（显式 category 字段，结构化契约）
   ============================================ */

(function () {
  "use strict";

  // ---------- 工具函数 ----------
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return document.querySelectorAll(sel); }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      var m = d.getMonth() + 1;
      var day = d.getDate();
      return m + "月" + day + "日";
    } catch (e) { return ""; }
  }

  function getInitial(name) {
    if (!name) return "?";
    return name.charAt(0);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---------- 数据源（统一契约） ----------
  function fetchPosts() {
    return fetch("/data/demo-posts.json", { cache: "force-cache" })
      .then(function (res) { return res.json(); })
      .then(function (data) { return data.posts || []; })
      .catch(function (err) {
        console.error("加载漂流帖失败", err);
        return [];
      });
  }

  function fetchPois() {
    return fetch("/data/lingshui-poi.json", { cache: "force-cache" })
      .then(function (res) { return res.json(); })
      .then(function (data) { return data.pois || data || []; })
      .catch(function (err) {
        console.error("加载 POI 失败", err);
        return [];
      });
  }

  // 评论数据源（按 postId 索引）
  function fetchComments() {
    return fetch("/data/demo-comments-posts.json", { cache: "force-cache" })
      .then(function (res) { return res.json(); })
      .then(function (data) { return data.comments || {}; })
      .catch(function (err) {
        console.error("加载评论失败", err);
        return {};
      });
  }

  // ============ 列表页逻辑 ============
  function initListPage() {
    var grid = $("#postGrid");
    if (!grid) return;

    var allPosts = [];
    var currentFilter = "all";

    function renderPosts(posts) {
      if (!posts || posts.length === 0) {
        grid.innerHTML =
          '<div class="empty-state">' +
          '<div class="empty-state__icon">🌊</div>' +
          '<p class="empty-state__text">这个分类下暂时还没有漂流帖</p>' +
          '</div>';
        return;
      }

      grid.innerHTML = posts.map(function (post) {
        var category = post.category || "漂流";
        var author = post.authorName || "匿名岛民";
        var toneClass = "media-tone--" + escapeHtml(category);
        return (
          '<a class="post-card" href="/community/' + post.id + '">' +
            '<div class="post-card__media post-card__media--photo ' + toneClass + '">' +
              '<span class="post-card__tag-overlay">' + escapeHtml(category) + '</span>' +
            '</div>' +
            '<div class="post-card__body">' +
              (post.placeName ?
                '<div class="post-card__place">' +
                  '<span class="post-card__place-icon">📍</span>' +
                  '<span>' + escapeHtml(post.placeName) + '</span>' +
                '</div>' : '') +
              '<h3 class="post-card__title">' + escapeHtml(post.title) + '</h3>' +
              '<p class="post-card__excerpt">' + escapeHtml(post.content) + '</p>' +
              '<div class="post-card__meta">' +
                '<span class="post-card__author">' +
                  '<span class="post-card__avatar">' + escapeHtml(getInitial(author)) + '</span>' +
                  escapeHtml(author) +
                '</span>' +
                '<span class="post-card__stats">' +
                  '<span class="post-card__stat">♡ ' + (post.likes || 0) + '</span>' +
                  '<span class="post-card__stat">💬 ' + (post.commentsCount || 0) + '</span>' +
                  '<span class="post-card__stat">🔖 ' + (post.saves || 0) + '</span>' +
                '</span>' +
              '</div>' +
            '</div>' +
          '</a>'
        );
      }).join("");
    }

    // 统一筛选状态：按显式 category 字段过滤（不猜 tags）
    function applyFilter(filter) {
      currentFilter = filter;
      var filtered = allPosts;
      if (filter !== "all") {
        filtered = allPosts.filter(function (p) {
          return p.category === filter;
        });
      }
      renderPosts(filtered);
    }

    // 筛选栏交互：所有入口绑定 data-filter，统一走 applyFilter
    var filterBar = $("#filterBar");
    if (filterBar) {
      filterBar.addEventListener("click", function (e) {
        var chip = e.target.closest(".filter-chip");
        if (!chip) return;
        $all(".filter-chip").forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        applyFilter(chip.getAttribute("data-filter"));
      });
    }

    // 初始加载
    fetchPosts().then(function (posts) {
      allPosts = posts;
      renderPosts(posts);
    });
  }

  // ============ 详情页逻辑 ============
  function initDetailPage() {
    var titleEl = $("#detailTitle");
    if (!titleEl) return;

    // 从 URL 解析 postId：/community/:postId
    var pathMatch = location.pathname.match(/\/community\/([^/]+)/);
    var postId = pathMatch ? pathMatch[1] : "dp-001";

    var Store = window.TangdaoStore;

    // 确保收藏仓库已加载，再渲染详情
    function runDetail() {
      renderDetail();
    }

    function renderDetail() {
      // 三源数据聚合：帖子 + POI + 评论
      Promise.all([fetchPosts(), fetchPois(), fetchComments()]).then(function (results) {
      var posts = results[0];
      var pois = results[1];
      var commentsMap = results[2];
      var post = posts.find(function (p) { return p.id === postId; });

      if (!post) {
        titleEl.textContent = "漂流帖不见了";
        $("#detailBody").innerHTML = "<p>没有找到这条漂流帖，可能已经随海浪漂走了。</p>";
        return;
      }

      var author = post.authorName || "匿名岛民";

      // ===== 1. 图片（hero 背景渐变 + 文字） =====
      var heroEl = $("#detailHero");
      if (heroEl) {
        heroEl.textContent = (post.category || "TANGDAO").toUpperCase();
        // 按 category 上色
        var cat = (post.category || "").trim();
        var catGradients = {
          "海边": "linear-gradient(135deg, #4E96A8, #6BB8C9, #A8D5E2)",
          "日落": "linear-gradient(135deg, #E8845C, #F2A65A, #F7C59F)",
          "市集": "linear-gradient(135deg, #7A9E7E, #A5C2A8, #C9DCC5)",
          "美食": "linear-gradient(135deg, #D98A5C, #E8A87C, #F2C9A8)",
          "古镇": "linear-gradient(135deg, #8B7355, #A89279, #C9B8A0)",
          "赶海": "linear-gradient(135deg, #4A7C8C, #6B9DA8, #A0C5CC)",
          "玩水": "linear-gradient(135deg, #3D8C9E, #5FA9B8, #9DD0D9)"
        };
        heroEl.style.background = catGradients[cat] || "linear-gradient(135deg, var(--wood-500), var(--wood-400))";
      }

      // ===== 2. 标题 =====
      titleEl.textContent = post.title;

      // 标签：category + tags
      var tagsEl = $("#detailTags");
      var allTags = [post.category].concat(post.tags || []);
      allTags = allTags.filter(function (t) { return t; });
      if (allTags.length > 0) {
        tagsEl.innerHTML = allTags.map(function (t) {
          return '<span class="detail-tag">' + escapeHtml(t) + '</span>';
        }).join("");
      } else {
        tagsEl.style.display = "none";
      }

      // ===== 3. 正文（按句号分段） =====
      var bodyEl = $("#detailBody");
      if (post.content) {
        bodyEl.innerHTML = post.content.split(/(?<=[。！？\n])/).filter(Boolean).map(function (para) {
          return "<p>" + escapeHtml(para.trim()) + "</p>";
        }).join("");
        if (!bodyEl.innerHTML) {
          bodyEl.innerHTML = "<p>" + escapeHtml(post.content) + "</p>";
        }
      } else {
        bodyEl.innerHTML = "<p>（正文待补充）</p>";
      }

      // ===== 4. 作者与时间 =====
      $("#detailAuthor").textContent = author;
      $("#detailAvatar").textContent = getInitial(author);
      $("#detailTime").textContent = formatDate(post.createdAt);

      // ===== 5. 关联地点（联动 POI） =====
      var poi = pois.find(function (p) { return p.id === post.placeId; });
      var relatedEl = $("#relatedPlace");
      var actionsEl = $("#relatedPlaceActions");
      if (poi || post.placeName) {
        $("#relatedName").textContent = post.placeName || (poi ? poi.name : "未命名地点");
        // 地点类别 + 一句摘要
        if (poi) {
          $("#relatedCategory").textContent = poi.layer_type || "";
          $("#relatedSummary").textContent = poi.remark || poi.address || "";
        } else {
          $("#relatedCategory").textContent = "";
          $("#relatedSummary").textContent = "";
        }
        relatedEl.style.display = "flex";
        // 两个联动按钮
        if (poi) {
          $("#placeMapBtn").href = "/map.html?place=" + encodeURIComponent(poi.id);
          $("#placeNowBtn").href = "/now/" + encodeURIComponent(poi.id);
          actionsEl.style.display = "flex";
        } else {
          actionsEl.style.display = "none";
        }
      } else {
        relatedEl.style.display = "none";
        actionsEl.style.display = "none";
      }

      // ===== 5.1 收藏这个地点（帖子关联地点时可用） =====
      var placeCollectBtn = $("#placeCollectBtn");
      if (placeCollectBtn && post.placeId && Store) {
        var placeId = post.placeId;
        function reflectPlaceSaved(saved) {
          if (saved) {
            placeCollectBtn.classList.add("is-saved");
            placeCollectBtn.textContent = "🔖 已收藏地点";
          } else {
            placeCollectBtn.classList.remove("is-saved");
            placeCollectBtn.textContent = "🔖 收藏这个地点";
          }
        }
        Store.ensureLoaded().then(function () {
          reflectPlaceSaved(Store.isPlaceSaved(placeId));
        });
        placeCollectBtn.addEventListener("click", function () {
          var nowSaved = Store.togglePlace(placeId);
          reflectPlaceSaved(nowSaved);
          var toast = document.createElement("div");
          toast.textContent = nowSaved ? "已收藏到我的躺岛 ✓" : "已取消收藏";
          toast.style.cssText = "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:rgba(58,42,28,0.92);color:#fff;padding:0.6rem 1.2rem;border-radius:20px;font-size:0.82rem;z-index:9999;transition:opacity 0.3s;";
          document.body.appendChild(toast);
          setTimeout(function () { toast.style.opacity = "0"; }, 1500);
          setTimeout(function () { toast.remove(); }, 1900);
        });
      }

      // ===== 6. 互动操作栏（点赞/评论/收藏，前端交互 + 收藏写入 store） =====
      var likeCount = post.likes || 0;
      var commentCount = (commentsMap[postId] || []).length || post.commentsCount || 0;
      var saveCount = post.saves || 0;
      $("#likeCount").textContent = likeCount;
      $("#commentCount").textContent = commentCount;
      $("#saveCount").textContent = saveCount;

      var likeBtn = $("#likeBtn");
      var saveBtn = $("#saveBtn");
      var commentBtn = $("#commentBtn");

      // 收藏按钮：从 store 同步初始状态
      var isSaved = !!(Store && Store.isPostSaved && Store.isPostSaved(postId));
      function reflectSaveState(saved) {
        var icon = saveBtn.querySelector(".detail-action-btn__icon");
        var label = saveBtn.querySelector(".detail-action-btn__label");
        if (saved) {
          saveBtn.classList.add("is-active");
          icon.textContent = "🔖";
          label.textContent = "已收藏";
        } else {
          saveBtn.classList.remove("is-active");
          icon.textContent = "🔖";
          label.textContent = "收藏";
        }
      }
      reflectSaveState(isSaved);

      likeBtn.addEventListener("click", function () {
        var active = likeBtn.classList.toggle("is-active");
        var icon = likeBtn.querySelector(".detail-action-btn__icon");
        var label = likeBtn.querySelector(".detail-action-btn__label");
        if (active) {
          likeCount++;
          icon.textContent = "♥";
          label.textContent = "已赞";
        } else {
          likeCount--;
          icon.textContent = "♡";
          label.textContent = "点赞";
        }
        $("#likeCount").textContent = likeCount;
      });

      saveBtn.addEventListener("click", function () {
        if (!Store) {
          // store 未加载，回退纯前端 toggle
          var fallback = saveBtn.classList.toggle("is-active");
          saveBtn.querySelector(".detail-action-btn__label").textContent = fallback ? "已收藏" : "收藏";
          return;
        }
        var nowSaved = Store.togglePost(postId);
        reflectSaveState(nowSaved);
        // 轻量反馈
        var toast = document.createElement("div");
        toast.textContent = nowSaved ? "已收藏到我的躺岛 ✓" : "已取消收藏";
        toast.style.cssText = "position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:rgba(58,42,28,0.92);color:#fff;padding:0.6rem 1.2rem;border-radius:20px;font-size:0.82rem;z-index:9999;transition:opacity 0.3s;";
        document.body.appendChild(toast);
        setTimeout(function () { toast.style.opacity = "0"; }, 1500);
        setTimeout(function () { toast.remove(); }, 1900);
      });

      commentBtn.addEventListener("click", function () {
        var commentsSection = document.querySelector(".comments-section");
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      // ===== 7. 模拟评论渲染 =====
      var commentList = $("#commentList");
      var postComments = commentsMap[postId] || [];
      if (postComments.length > 0) {
        commentList.innerHTML = postComments.map(function (c) {
          return (
            '<div class="comment-item">' +
              '<div class="comment-item__avatar">' + escapeHtml(getInitial(c.author)) + '</div>' +
              '<div class="comment-item__body">' +
                '<div class="comment-item__head">' +
                  '<span class="comment-item__author">' + escapeHtml(c.author) + '</span>' +
                  '<span class="comment-item__time">' + escapeHtml(formatDate(c.createdAt)) + '</span>' +
                '</div>' +
                '<p class="comment-item__text">' + escapeHtml(c.text) + '</p>' +
              '</div>' +
            '</div>'
          );
        }).join("");
      } else {
        commentList.innerHTML = '<p class="comments-empty">暂无留言，来做第一个留下脚印的人。</p>';
      }

      // ===== 8. 相关帖子（placeId 优先 → tags 兜底 → 排除当前） =====
      var relatedSection = $("#relatedPostsSection");
      var relatedGrid = $("#relatedPostsGrid");
      var related = computeRelatedPosts(post, posts, 4);
      if (related.length > 0) {
        relatedGrid.innerHTML = related.map(function (rp) {
          return (
            '<a class="related-post-card" href="/community/' + encodeURIComponent(rp.id) + '">' +
              '<span class="related-post-card__tag">' + escapeHtml(rp.category || "") + '</span>' +
              '<span class="related-post-card__title">' + escapeHtml(rp.title) + '</span>' +
              '<span class="related-post-card__meta">' + escapeHtml(rp.authorName || "") + ' · ' + escapeHtml(formatDate(rp.createdAt)) + '</span>' +
            '</a>'
          );
        }).join("");
        relatedSection.style.display = "block";
      } else {
        relatedSection.style.display = "none";
      }
    });
    } // end renderDetail()

    // 确保收藏仓库加载完成后再渲染（详情页需同步收藏态）
    if (Store && Store.ensureLoaded) {
      Store.ensureLoaded().then(runDetail);
    } else {
      runDetail();
    }
  } // end initDetailPage()

  // 相关帖子推荐算法：placeId 优先 → tags 交集兜底 → 排除当前 → 限制数量
  function computeRelatedPosts(currentPost, allPosts, limit) {
    var excludeId = currentPost.id;
    var currentPlaceId = currentPost.placeId;
    var currentTags = (currentPost.tags || []).slice();
    var scored = [];

    allPosts.forEach(function (p) {
      if (p.id === excludeId) return;
      var score = 0;
      if (currentPlaceId && p.placeId === currentPlaceId) score += 10;
      if (currentTags.length > 0 && p.tags) {
        p.tags.forEach(function (t) {
          if (currentTags.indexOf(t) >= 0) score += 2;
        });
      }
      if (score > 0) scored.push({ post: p, score: score });
    });

    scored.sort(function (a, b) { return b.score - a.score; });
    var result = scored.slice(0, limit || 4).map(function (s) { return s.post; });
    return result;
  }

  // ============ 初始化 ============
  document.addEventListener("DOMContentLoaded", function () {
    initListPage();
    initDetailPage();
  });
})();
