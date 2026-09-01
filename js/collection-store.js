/* ============================================
   躺岛 TANGDAO · 集中式收藏仓库 collection-store.js
   全局单例 window.TangdaoStore
   唯一数据源：localStorage（首次访问用 demo-collections.json 播种）
   服务所有页面：map / today / now / community-detail / collection
   特性：
   - placeId / postId 统一 String 化比较，避免类型冲突
   - 首次访问播种 demo 数据，之后 localStorage 为唯一真相
   - 路线板增删改 + 排序
   ============================================ */

(function () {
  "use strict";

  var STORAGE_KEY = "tangdao_collections_v1";
  var DEMO_URL = "/data/demo-collections.json";

  // 内存态
  var state = null;
  var loaded = false;

  // ---------- 内部工具 ----------
  function nowIso() {
    return new Date().toISOString();
  }

  // 统一 ID 为字符串，避免 1 vs "1" 静默不匹配
  function idStr(id) {
    return id === undefined || id === null ? "" : String(id);
  }

  function genId(prefix) {
    return prefix + "-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("收藏写入 localStorage 失败", e);
    }
  }

  // ---------- 播种 ----------
  function loadDemo() {
    return fetch(DEMO_URL, { cache: "force-cache" })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        // 规范化：所有 placeId 转字符串，补全 stopId
        state = {
          savedPlaces: (data.savedPlaces || []).map(function (p) {
            return { placeId: idStr(p.placeId), savedAt: p.savedAt || nowIso(), note: p.note || "" };
          }),
          savedPosts: (data.savedPosts || []).map(function (p) {
            return { postId: idStr(p.postId), savedAt: p.savedAt || nowIso() };
          }),
          routeBoards: (data.routeBoards || []).map(function (b) {
            return {
              id: b.id || genId("board"),
              title: b.title || "我的躺岛路线板",
              updatedAt: b.updatedAt || nowIso(),
              stops: (b.stops || []).map(function (s) {
                return {
                  stopId: genId("stop"),
                  placeId: idStr(s.placeId),
                  day: s.day || "",
                  note: s.note || ""
                };
              })
            };
          })
        };
        persist();
      })
      .catch(function (err) {
        console.error("播种 demo 收藏失败", err);
        state = { savedPlaces: [], savedPosts: [], routeBoards: [] };
        persist();
      });
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      // 基本校验
      if (!parsed || typeof parsed !== "object") return null;
      parsed.savedPlaces = parsed.savedPlaces || [];
      parsed.savedPosts = parsed.savedPosts || [];
      parsed.routeBoards = parsed.routeBoards || [];
      return parsed;
    } catch (e) {
      return null;
    }
  }

  // 确保已加载（幂等 Promise）
  var loadingPromise = null;
  function ensureLoaded() {
    if (loaded) return Promise.resolve(state);
    if (loadingPromise) return loadingPromise;

    loadingPromise = new Promise(function (resolve) {
      var local = loadLocal();
      if (local) {
        state = local;
        loaded = true;
        resolve(state);
        return;
      }
      // 首次访问：从 demo JSON 播种
      loadDemo().then(function () {
        loaded = true;
        resolve(state);
      });
    });
    return loadingPromise;
  }

  // 同步获取（仅在 ensureLoaded 完成后安全使用）
  function getState() {
    return state || { savedPlaces: [], savedPosts: [], routeBoards: [] };
  }

  // ---------- 收藏地点 ----------
  function getSavedPlaces() {
    return getState().savedPlaces.slice();
  }

  function isPlaceSaved(placeId) {
    var pid = idStr(placeId);
    return getState().savedPlaces.some(function (p) { return p.placeId === pid; });
  }

  function togglePlace(placeId, note) {
    var pid = idStr(placeId);
    var idx = state.savedPlaces.findIndex(function (p) { return p.placeId === pid; });
    if (idx >= 0) {
      // 已收藏 → 取消收藏（同时从所有路线板移除）
      state.savedPlaces.splice(idx, 1);
      state.routeBoards.forEach(function (b) {
        b.stops = b.stops.filter(function (s) { return s.placeId !== pid; });
        b.updatedAt = nowIso();
      });
      persist();
      return false;
    } else {
      state.savedPlaces.push({ placeId: pid, savedAt: nowIso(), note: note || "" });
      persist();
      return true;
    }
  }

  function removePlace(placeId) {
    return togglePlace(placeId);
  }

  // ---------- 收藏帖子 ----------
  function getSavedPosts() {
    return getState().savedPosts.slice();
  }

  function isPostSaved(postId) {
    var pid = idStr(postId);
    return getState().savedPosts.some(function (p) { return p.postId === pid; });
  }

  function togglePost(postId) {
    var pid = idStr(postId);
    var idx = state.savedPosts.findIndex(function (p) { return p.postId === pid; });
    if (idx >= 0) {
      state.savedPosts.splice(idx, 1);
      persist();
      return false;
    } else {
      state.savedPosts.push({ postId: pid, savedAt: nowIso() });
      persist();
      return true;
    }
  }

  function removePost(postId) {
    return togglePost(postId);
  }

  // ---------- 路线板 ----------
  function getRouteBoards() {
    return getState().routeBoards.slice();
  }

  function getBoard(boardId) {
    var bid = idStr(boardId);
    return state.routeBoards.find(function (b) { return idStr(b.id) === bid; }) || null;
  }

  function createBoard(title) {
    var board = {
      id: genId("board"),
      title: title || "我的周末躺平线",
      updatedAt: nowIso(),
      stops: []
    };
    state.routeBoards.push(board);
    persist();
    return board;
  }

  function deleteBoard(boardId) {
    var bid = idStr(boardId);
    var idx = state.routeBoards.findIndex(function (b) { return idStr(b.id) === bid; });
    if (idx >= 0) {
      state.routeBoards.splice(idx, 1);
      persist();
      return true;
    }
    return false;
  }

  // 把已收藏地点加入指定路线板
  function addToBoard(boardId, placeId) {
    var board = getBoard(boardId);
    if (!board) return false;
    var pid = idStr(placeId);
    // 幂等：同一地点不重复加入
    if (board.stops.some(function (s) { return s.placeId === pid; })) return false;
    board.stops.push({ stopId: genId("stop"), placeId: pid, day: "", note: "" });
    board.updatedAt = nowIso();
    persist();
    return true;
  }

  function removeFromBoard(boardId, stopId) {
    var board = getBoard(boardId);
    if (!board) return false;
    var sid = idStr(stopId);
    var idx = board.stops.findIndex(function (s) { return idStr(s.stopId) === sid; });
    if (idx >= 0) {
      board.stops.splice(idx, 1);
      board.updatedAt = nowIso();
      persist();
      return true;
    }
    return false;
  }

  function moveStop(boardId, stopId, direction) {
    var board = getBoard(boardId);
    if (!board) return false;
    var sid = idStr(stopId);
    var idx = board.stops.findIndex(function (s) { return idStr(s.stopId) === sid; });
    if (idx < 0) return false;
    var target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= board.stops.length) return false;
    var tmp = board.stops[idx];
    board.stops[idx] = board.stops[target];
    board.stops[target] = tmp;
    board.updatedAt = nowIso();
    persist();
    return true;
  }

  function updateStop(boardId, stopId, patch) {
    var board = getBoard(boardId);
    if (!board) return false;
    var sid = idStr(stopId);
    var stop = board.stops.find(function (s) { return idStr(s.stopId) === sid; });
    if (!stop) return false;
    if (patch.day !== undefined) stop.day = patch.day;
    if (patch.note !== undefined) stop.note = patch.note;
    board.updatedAt = nowIso();
    persist();
    return true;
  }

  // ---------- 导出 ----------
  window.TangdaoStore = {
    ensureLoaded: ensureLoaded,
    getState: getState,
    // 地点
    getSavedPlaces: getSavedPlaces,
    isPlaceSaved: isPlaceSaved,
    togglePlace: togglePlace,
    removePlace: removePlace,
    // 帖子
    getSavedPosts: getSavedPosts,
    isPostSaved: isPostSaved,
    togglePost: togglePost,
    removePost: removePost,
    // 路线板
    getRouteBoards: getRouteBoards,
    getBoard: getBoard,
    createBoard: createBoard,
    deleteBoard: deleteBoard,
    addToBoard: addToBoard,
    removeFromBoard: removeFromBoard,
    moveStop: moveStop,
    updateStop: updateStop
  };
})();
