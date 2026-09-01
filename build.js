/**
 * 躺岛 TANGDAO · GitHub Pages 构建脚本
 *
 * 功能：
 * 1. 从环境变量生成 js/config.js（高德 API Key 注入）
 * 2. 创建 dist/ 输出目录
 * 3. 复制所有静态资源到 dist/
 * 4. 路径前缀替换：/css/ → /tangdao/css/ 等（适配 GitHub Pages 子路径）
 * 5. 生成 404.html 实现 clean URL 回退（/now/1 → now.html#/now/1）
 *
 * 本地开发：node build.js（从 .env.local 读取密钥）
 * CI 构建：GitHub Actions 通过 secrets 注入环境变量
 */
const fs = require("fs");
const path = require("path");

// ============================================================
// 1. 读取环境变量（优先系统环境变量，其次 .env.local）
// ============================================================
const envLocalPath = path.join(__dirname, ".env.local");
if (fs.existsSync(envLocalPath)) {
  const lines = fs.readFileSync(envLocalPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim();
    }
  }
}

const AMAP_KEY = process.env.AMAP_KEY || "__AMAP_KEY__";
const AMAP_SECURITY_JS_CODE = process.env.AMAP_SECURITY_JS_CODE || "__AMAP_SECURITY_JS_CODE__";

// GitHub Pages 仓库名（base 路径）
const BASE_PATH = "/tangdao";

// ============================================================
// 2. 构建路径替换规则（仅替换根路径资源，不影响 CDN）
// ============================================================
const REPLACE_RULES = [
  // CSS / JS / 资源 / 数据目录
  { from: /(["'(])\/css\//g, to: `$1${BASE_PATH}/css/` },
  { from: /(["'(])\/js\//g, to: `$1${BASE_PATH}/js/` },
  { from: /(["'(])\/assets\//g, to: `$1${BASE_PATH}/assets/` },
  { from: /(["'(])\/data\//g, to: `$1${BASE_PATH}/data/` },
  // HTML 页面互链（仅替换已知页面，避免误伤 CDN 链接）
  { from: /(["'(])\/index\.html/g, to: `$1${BASE_PATH}/index.html` },
  { from: /(["'(])\/map\.html/g, to: `$1${BASE_PATH}/map.html` },
  { from: /(["'(])\/today\.html/g, to: `$1${BASE_PATH}/today.html` },
  { from: /(["'(])\/now\.html/g, to: `$1${BASE_PATH}/now.html` },
  { from: /(["'(])\/community\.html/g, to: `$1${BASE_PATH}/community.html` },
  { from: /(["'(])\/community-detail\.html/g, to: `$1${BASE_PATH}/community-detail.html` },
  { from: /(["'(])\/collection\.html/g, to: `$1${BASE_PATH}/collection.html` },
];

function applyPathReplace(content) {
  let result = content;
  for (const rule of REPLACE_RULES) {
    result = result.replace(rule.from, rule.to);
  }
  return result;
}

// ============================================================
// 3. 生成 config.js 内容
// ============================================================
const configContent = `/* ============================================
   躺岛 TANGDAO · 地图配置（由 build.js 自动生成，请勿手动编辑）
   高德地图 JS API 2.0 密钥通过环境变量注入。
   申请地址：https://lbs.amap.com/
   */
window.TANGDAO_CONFIG = {
  amapKey: "${AMAP_KEY}",
  amapSecurityJsCode: "${AMAP_SECURITY_JS_CODE}",
  lingshuiCenter: [110.03, 18.50],
  lingshuiBounds: [
    [109.60, 18.20],
    [110.55, 18.85]
  ],
  defaultZoom: 11
};
`;

// ============================================================
// 4. 生成 404.html（GitHub Pages clean URL 回退）
// ============================================================
const notFoundHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>躺岛 TANGDAO · 重定向中…</title>
  <script>
    // GitHub Pages 404 回退：解析 clean URL 并重定向到对应 .html
    // /tangdao/now/1 → /tangdao/now.html#/now/1
    (function() {
      var base = "${BASE_PATH}";
      var path = location.pathname.replace(base, "").replace(/^\\/+/, "");
      var parts = path.split("/").filter(Boolean);
      var target = "index.html";
      var hash = "";
      if (parts.length >= 1) {
        var page = parts[0];
        if (page === "now" && parts.length >= 2) {
          target = "now.html";
          hash = "#/now/" + parts[1];
        } else if (page === "community" && parts.length >= 2) {
          target = "community-detail.html";
          hash = "#/community/" + parts[1];
        } else if (page === "collection" && parts[1] === "board") {
          target = "collection.html";
          hash = "#/collection/board";
        } else if (["map", "today", "now", "community", "collection"].indexOf(page) >= 0) {
          target = page + ".html";
        }
      }
      location.replace(base + "/" + target + hash);
    })();
  </script>
</head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#f5f0e6;font-family:serif;color:#8b7355;">
  <p>躺岛 TANGDAO · 正在为你导航…</p>
</body>
</html>`;

// ============================================================
// 5. 文件复制与构建
// ============================================================
const distDir = path.join(__dirname, "dist");

// 清理并重建 dist
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 需要处理路径替换的文件类型
const TEXT_EXTENSIONS = [".html", ".css", ".js", ".json", ".svg", ".xml", ".webmanifest"];

// 跳过的文件/目录
const SKIP_ITEMS = new Set([
  "node_modules", ".git", ".github", "dist",
  "server.js", "build.js", "package.json", "package-lock.json",
  ".gitignore", ".vercelignore", ".env.local", ".env",
  "vercel.json", "temp-font.css",
]);

function shouldSkip(name) {
  return SKIP_ITEMS.has(name) || name.startsWith(".");
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldSkip(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.includes(ext)) {
        // 文本文件：读取 → 路径替换 → 写入
        let content = fs.readFileSync(srcPath, "utf-8");
        content = applyPathReplace(content);
        // config.js 由专门生成，跳过复制时的路径替换后直接写入
        fs.writeFileSync(destPath, content, "utf-8");
      } else {
        // 二进制文件直接复制
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// 复制项目文件到 dist（路径替换）
copyDir(__dirname, distDir);

// 用生成的 config.js 覆盖 dist/js/config.js（确保含真实密钥）
const configDest = path.join(distDir, "js", "config.js");
fs.mkdirSync(path.dirname(configDest), { recursive: true });
fs.writeFileSync(configDest, configContent, "utf-8");

// 写入 404.html
fs.writeFileSync(path.join(distDir, "404.html"), notFoundHtml, "utf-8");

// 写入 .nojekyll（GitHub Pages 不忽略下划线开头文件）
fs.writeFileSync(path.join(distDir, ".nojekyll"), "", "utf-8");

// ============================================================
// 6. 构建报告
// ============================================================
function countFiles(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) count += countFiles(path.join(dir, e.name));
    else count++;
  }
  return count;
}

const fileCount = countFiles(distDir);

console.log("========================================");
console.log(" 躺岛 TANGDAO · GitHub Pages 构建完成");
console.log("========================================");
console.log(` 输出目录: dist/`);
console.log(` 文件数量: ${fileCount}`);
console.log(` Base 路径: ${BASE_PATH}`);
if (AMAP_KEY === "__AMAP_KEY__") {
  console.log(` ⚠️  AMAP_KEY 未设置，config.js 中为占位值`);
  console.log(`    本地开发: 创建 .env.local 填入密钥`);
  console.log(`    GitHub Actions: 在 Settings → Secrets 配置`);
} else {
  console.log(` ✅ AMAP_KEY 已注入 config.js`);
}
console.log(` ✅ 404.html 已生成（clean URL 回退）`);
console.log(` ✅ .nojekyll 已生成`);
console.log("========================================");
