/* ============================================
   躺岛 TANGDAO · 我的躺岛 collection.js
   服务：collection.html（收藏主页 + 路线板）
   数据源：window.TangdaoStore（localStorage 唯一真相，首次 seed demo）
   本阶段：地点收藏 + 帖子收藏 + 路线板（增删改 + 排序 + 地图联动）
   视觉：旅行手账 / 贴纸板 风格
   ============================================ */

(function () {
  "use strict";

  var Store = window.TangdaoStore;
  var allPois = [];
  var allPosts = [];
  var currentTab = "places";

  // ---------- 工具函数 ----------
  function $(sel) { return document.querySelector(sel); }
  function $all(sel) { return document.querySelectorAll(sel); }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    try {
      var d = new Date(iso);
      var m = d.getMonth() + 1;
      var day = d.getDate();
      return m + "月" + day + "日";
    } catch (e) { return ""; }
  }

  // layer_type 友好中文名
  var CATEGORY_LABELS = {
    beach: "海滩",
    fishing: "渔村",
    mountain: "山林",
    culture: "人文",
    food: "美食",
    market: "市集",
    park: "公园",
    hotel: "住宿",
    activity: "玩乐",
    other: "其他"
  };
  function categoryLabel(layerType) {
    if (!layerType) return "地点";
    return CATEGORY_LABELS[layerType] || layerType;
  }

  // 帖子分类渐变色
  var POST_GRADIENTS = {
    "海边": "linear-gradient(135deg, #4E96A8, #6BB8C9, #A8D5E2)",
    "日落": "linear-gradient(135deg, #E8845C, #F2A65A, #F7C59F)",
    "市集": "linear-gradient(135deg, #7A9E7E, #A5C2A8, #C9DCC5)",
    "美食": "linear-gradient(135deg, #D98A5C, #E8A87C, #F2C9A8)",
    "古镇": "linear-gradient(135deg, #8B7355, #A89279, #C9B8A0)",
    "赶海": "linear-gradient(135deg, #4A7C8C, #6B9DA8, #A0C5CC)",
    "玩水": "linear-gradient(135deg, #3D8C9E, #5FA9B8, #9DD0D9)"
  };
  function postGradient(category) {
    return POST_GRADIENTS[category] || "linear-gradient(135deg, var(--wood-500), var(--wood-400))";
  }

  function getPoi(id) {
    var sid = String(id);
    return allPois.find(function (p) { return String(p.id) === sid; });
  }
  function getPost(id) {
    var sid = String(id);
    return allPosts.find(function (p) { return String(p.id) === sid; });
  }

  // ---------- 参考数据（只读） ----------
  function fetchPois() {
    return fetch("/data/lingshui-poi.json", { cache: "force-cache" })
      .then(function (res) { return res.json(); })
      .then(function (data) { return data.pois || data || []; })
      .catch(function () { return []; });
  }
  function fetchPosts() {
    return fetch("/data/demo-posts.json", { cache: "force-cache" })
      .then(function (res) { return res.json(); })
      .then(function (data) { return data.posts || []; })
      .catch(function () { return []; });
  }

  // ---------- 渲染：收藏地点（贴纸板风） ----------
  function renderSavedPlaces() {
    var places = Store.getSavedPlaces();
    var boards = Store.getRouteBoards();
    var content = $("#collectionContent");

    if (places.length === 0) {
      content.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state__icon">📍</div>' +
          '<p class="empty-state__text">还没有收藏地点<br>去地图 / 今天去哪 / 正在发生 / 漂流帖 里收藏喜欢的地方吧</p>' +
        '</div>';
      return;
    }

    // 加入路线板下拉选项
    var boardOptions = boards.map(function (b) {
      return '<option value="' + escapeHtml(b.id) + '">' + escapeHtml(b.title) + '</option>';
    }).join("");
    if (boards.length === 0) {
      boardOptions = '<option value="">（先去路线板新建）</option>';
    }

    content.innerHTML =
      '<h2 class="section-title">收藏地点<span class="section-title__count">(' + places.length + ')</span></h2>' +
      '<div class="saved-places-grid journal-grid">' +
      places.map(function (saved, idx) {
        var poi = getPoi(saved.placeId);
        var name = poi ? poi.name : "未知地点 #" + saved.placeId;
        var layerType = poi ? poi.layer_type : "";
        var tags = poi && poi.tag ? poi.tag : [];
        var rot = (idx % 5 - 2) * 0.6; // 轻微旋转
        return (
          '<div class="sticker-card" style="transform: rotate(' + rot + 'deg);" data-place-id="' + escapeHtml(saved.placeId) + '">' +
            '<div class="sticker-card__washi"></div>' +
            '<div class="sticker-card__body">' +
              '<span class="sticker-card__cat">' + escapeHtml(categoryLabel(layerType)) + '</span>' +
              '<h3 class="sticker-card__name">' + escapeHtml(name) + '</h3>' +
              (tags.length > 0 ? '<div class="sticker-card__tags">' + tags.slice(0, 3).map(function (t) { return '<span class="mini-tag">' + escapeHtml(t) + '</span>'; }).join("") + '</div>' : '') +
              (saved.note ? '<p class="sticker-card__note">‘' + escapeHtml(saved.note) + '’</p>' : '') +
            '</div>' +
            '<div class="sticker-card__actions">' +
              '<a class="mini-btn mini-btn--map" href="/map.html?place=' + encodeURIComponent(saved.placeId) + '">🗺️ 地图</a>' +
              '<button class="mini-btn mini-btn--add" data-action="add-to-board" data-place-id="' + escapeHtml(saved.placeId) + '">＋ 路线板</button>' +
              '<button class="mini-btn mini-btn--del" data-action="remove-place" data-place-id="' + escapeHtml(saved.placeId) + '" title="删除">✕</button>' +
            '</div>' +
            '<select class="sticker-card__board-select" data-place-id="' + escapeHtml(saved.placeId) + '" style="display:none;">' +
              boardOptions +
            '</select>' +
          '</div>'
        );
      }).join("") +
      '</div>';
  }

  // ---------- 渲染：收藏帖子 ----------
  function renderSavedPosts() {
    var saved = Store.getSavedPosts();
    var content = $("#collectionContent");

    if (saved.length === 0) {
      content.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-state__icon">📝</div>' +
          '<p class="empty-state__text">还没有收藏漂流帖<br>去岛民漂流帖里收藏喜欢的帖子吧</p>' +
        '</div>';
      return;
    }

    content.innerHTML =
      '<h2 class="section-title">收藏帖子<span class="section-title__count">(' + saved.length + ')</span></h2>' +
      '<div class="saved-posts-list">' +
      saved.map(function (s) {
        var post = getPost(s.postId);
        if (!post) return "";
        var poi = post.placeId ? getPoi(post.placeId) : null;
        var summary = (post.content || "").split(/[。！？\n]/).filter(Boolean)[0] || "";
        return (
          '<div class="saved-post-card" data-post-id="' + escapeHtml(post.id) + '">' +
            '<a class="saved-post-card__link" href="/community/' + encodeURIComponent(post.id) + '">' +
              '<div class="saved-post-card__cover" style="background:' + postGradient(post.category) + ';">' +
                '<span>' + escapeHtml((post.category || "TANGDAO").toUpperCase()) + '</span>' +
              '</div>' +
              '<div class="saved-post-card__body">' +
                '<p class="saved-post-card__title">' + escapeHtml(post.title) + '</p>' +
                '<p class="saved-post-card__summary">' + escapeHtml(summary) + '</p>' +
                '<div class="saved-post-card__meta">' +
                  '<span>' + escapeHtml(post.authorName || "匿名岛民") + ' · ' + formatDate(post.createdAt) + '</span>' +
                  (poi ? '<span class="saved-post-card__place">📍 ' + escapeHtml(poi.name) + '</span>' : '') +
                '</div>' +
              '</div>' +
            '</a>' +
            '<button class="mini-btn mini-btn--del" data-action="remove-post" data-post-id="' + escapeHtml(post.id) + '" title="删除">✕</button>' +
          '</div>'
        );
      }).join("") +
      '</div>';
  }

  // ---------- 渲染：路线板（planning board 风） ----------
  function renderRouteBoards() {
    var boards = Store.getRouteBoards();
    var savedPlaces = Store.getSavedPlaces();
    var content = $("#collectionContent");

    var html =
      '<div class="board-toolbar">' +
        '<h2 class="section-title">路线板</h2>' +
        '<button class="primary-btn" data-action="create-board">＋ 新建路线板</button>' +
      '</div>';

    if (boards.length === 0) {
      html +=
        '<div class="empty-state">' +
          '<div class="empty-state__icon">🗺️</div>' +
          '<p class="empty-state__text">还没有路线板<br>新建一个，把收藏的地点串成周末躺平线</p>' +
        '</div>';
      content.innerHTML = html;
      return;
    }

    html += '<div class="route-boards-wrap">';
    boards.forEach(function (board, bIdx) {
      var rot = (bIdx % 3 - 1) * 0.5;
      html +=
        '<div class="route-board-card" style="transform: rotate(' + rot + 'deg);" data-board-id="' + escapeHtml(board.id) + '">' +
          '<div class="route-board-card__washi"></div>' +
          '<div class="route-board-card__head">' +
            '<h3 class="route-board-card__title">' + escapeHtml(board.title) + '</h3>' +
            '<div class="route-board-card__head-actions">' +
              '<span class="route-board-card__updated">' + formatDate(board.updatedAt) + '</span>' +
              '<button class="mini-btn mini-btn--del" data-action="delete-board" data-board-id="' + escapeHtml(board.id) + '" title="删除路线板">✕</button>' +
            '</div>' +
          '</div>' +
          '<div class="route-board-card__stops">';

      if (board.stops.length === 0) {
        html += '<p class="route-board-card__empty">还没有地点，从下面加入收藏的地点</p>';
      } else {
        board.stops.forEach(function (stop, idx) {
          var poi = getPoi(stop.placeId);
          var name = poi ? poi.name : "未知地点 #" + stop.placeId;
          html +=
            '<div class="route-stop" data-stop-id="' + escapeHtml(stop.stopId) + '" data-board-id="' + escapeHtml(board.id) + '">' +
              '<span class="route-stop__num">' + (idx + 1) + '</span>' +
              '<div class="route-stop__body">' +
                '<p class="route-stop__name">' + escapeHtml(name) + '</p>' +
                '<input class="route-stop__time" type="text" placeholder="时间建议，如 Day1 上午" value="' + escapeHtml(stop.day) + '" data-action="update-stop-day" data-board-id="' + escapeHtml(board.id) + '" data-stop-id="' + escapeHtml(stop.stopId) + '">' +
              '</div>' +
              '<div class="route-stop__actions">' +
                '<button class="mini-icon-btn" data-action="move-stop" data-board-id="' + escapeHtml(board.id) + '" data-stop-id="' + escapeHtml(stop.stopId) + '" data-dir="up" title="上移">↑</button>' +
                '<button class="mini-icon-btn" data-action="move-stop" data-board-id="' + escapeHtml(board.id) + '" data-stop-id="' + escapeHtml(stop.stopId) + '" data-dir="down" title="下移">↓</button>' +
                '<a class="mini-icon-btn mini-icon-btn--map" href="/map.html?place=' + encodeURIComponent(stop.placeId) + '" title="地图查看">🗺️</a>' +
                '<button class="mini-icon-btn mini-icon-btn--del" data-action="remove-stop" data-board-id="' + escapeHtml(board.id) + '" data-stop-id="' + escapeHtml(stop.stopId) + '" title="删除">✕</button>' +
              '</div>' +
            '</div>';
        });
      }

      // 从收藏地点加入
      if (savedPlaces.length > 0) {
        var usedIds = board.stops.map(function (s) { return s.placeId; });
        var available = savedPlaces.filter(function (sp) { return usedIds.indexOf(sp.placeId) < 0; });
        if (available.length > 0) {
          html +=
            '<div class="route-board-card__add-row">' +
              '<select class="route-board-card__select" id="addSelect_' + escapeHtml(board.id) + '">' +
                available.map(function (sp) {
                  var poi = getPoi(sp.placeId);
                  var n = poi ? poi.name : ("地点 #" + sp.placeId);
                  return '<option value="' + escapeHtml(sp.placeId) + '">' + escapeHtml(n) + '</option>';
                }).join("") +
              '</select>' +
              '<button class="primary-btn primary-btn--sm" data-action="add-to-board" data-board-id="' + escapeHtml(board.id) + '">＋ 加入</button>' +
            '</div>';
        }
      }

      html += '</div></div>';
    });
    html += '</div>';

    content.innerHTML = html;
  }

  // ---------- Tab 渲染 ----------
  function renderTab(tab) {
    currentTab = tab;
    if (tab === "places") renderSavedPlaces();
    else if (tab === "posts") renderSavedPosts();
    else if (tab === "board") renderRouteBoards();
  }

  function initTabs() {
    var tabs = $("#collectionTabs");
    if (!tabs) return;

    // URL 默认 tab
    var pathMatch = location.pathname.match(/\/collection\/(board)/);
    var defaultTab = pathMatch ? pathMatch[1] : "places";
    currentTab = defaultTab;

    $all(".collection-tab").forEach(function (btn) {
      if (btn.getAttribute("data-tab") === defaultTab) btn.classList.add("is-active");
      else btn.classList.remove("is-active");
    });

    renderTab(defaultTab);

    tabs.addEventListener("click", function (e) {
      var btn = e.target.closest(".collection-tab");
      if (!btn) return;
      $all(".collection-tab").forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      renderTab(btn.getAttribute("data-tab"));
    });
  }

  // ---------- 事件委托 ----------
  function bindEvents() {
    var content = $("#collectionContent");
    if (!content) return;

    content.addEventListener("click", function (e) {
      var target = e.target;
      // 阻止链接冒泡（卡片内删除按钮不应触发卡片跳转）
      var actionEl = target.closest("[data-action]");
      if (!actionEl) return;

      var action = actionEl.getAttribute("data-action");

      // 删除收藏地点
      if (action === "remove-place") {
        var placeId = actionEl.getAttribute("data-place-id");
        if (confirm("确定删除这个收藏地点吗？")) {
          Store.removePlace(placeId);
          renderTab(currentTab);
        }
        return;
      }

      // 删除收藏帖子
      if (action === "remove-post") {
        var postId = actionEl.getAttribute("data-post-id");
        if (confirm("确定删除这个收藏帖子吗？")) {
          Store.removePost(postId);
          renderTab(currentTab);
        }
        return;
      }

      // 地点 tab：加入路线板（展开 select）
      if (action === "add-to-board" && currentTab === "places") {
        var card = actionEl.closest(".sticker-card");
        if (!card) return;
        var sel = card.querySelector(".sticker-card__board-select");
        if (sel) {
          sel.style.display = sel.style.display === "none" ? "inline-block" : "none";
          sel.focus();
          // 选中后直接加入
          sel.onchange = function () {
            if (sel.value) {
              Store.addToBoard(sel.value, sel.getAttribute("data-place-id"));
              renderTab(currentTab);
            }
          };
        }
        return;
      }

      // 路线板 tab：新建路线板
      if (action === "create-board") {
        var title = prompt("给路线板起个名字吧", "我的周末躺平线");
        if (title && title.trim()) {
          Store.createBoard(title.trim());
          renderTab(currentTab);
        }
        return;
      }

      // 路线板 tab：删除路线板
      if (action === "delete-board") {
        var boardId = actionEl.getAttribute("data-board-id");
        if (confirm("确定删除这个路线板吗？")) {
          Store.deleteBoard(boardId);
          renderTab(currentTab);
        }
        return;
      }

      // 路线板 tab：从收藏地点加入 board
      if (action === "add-to-board" && currentTab === "board") {
        var bid = actionEl.getAttribute("data-board-id");
        var select = $("#addSelect_" + bid);
        if (select && select.value) {
          Store.addToBoard(bid, select.value);
          renderTab(currentTab);
        }
        return;
      }

      // 路线板 tab：删除停靠点
      if (action === "remove-stop") {
        var rbId = actionEl.getAttribute("data-board-id");
        var stopId = actionEl.getAttribute("data-stop-id");
        Store.removeFromBoard(rbId, stopId);
        renderTab(currentTab);
        return;
      }

      // 路线板 tab：上移/下移
      if (action === "move-stop") {
        var mvBoardId = actionEl.getAttribute("data-board-id");
        var mvStopId = actionEl.getAttribute("data-stop-id");
        var dir = actionEl.getAttribute("data-dir");
        Store.moveStop(mvBoardId, mvStopId, dir);
        renderTab(currentTab);
        return;
      }
    });

    // 路线板 tab：时间建议输入（失焦保存）
    content.addEventListener("change", function (e) {
      var target = e.target;
      if (target.getAttribute("data-action") === "update-stop-day") {
        Store.updateStop(
          target.getAttribute("data-board-id"),
          target.getAttribute("data-stop-id"),
          { day: target.value }
        );
      }
    });
  }

  // ---------- 初始化 ----------
  document.addEventListener("DOMContentLoaded", function () {
    if (!Store) {
      console.error("TangdaoStore 未加载");
      return;
    }
    Store.ensureLoaded().then(function () {
      Promise.all([fetchPois(), fetchPosts()]).then(function (results) {
        allPois = results[0];
        allPosts = results[1];
        initTabs();
        bindEvents();
      });
    });
  });
})();
