// 零依赖静态文件服务器
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 5173;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  // /now/:placeId 路由回退：服务 now.html，由客户端 JS 从 pathname 解析 placeId
  if (/^\/now\/[^/]+\/?$/.test(urlPath) || urlPath === "/now") {
    urlPath = "/now.html";
  }

  // /community 路由回退：列表页 + 详情页（/community/:postId）
  if (urlPath === "/community") {
    urlPath = "/community.html";
  } else if (/^\/community\/[^/]+\/?$/.test(urlPath)) {
    urlPath = "/community-detail.html";
  }

  // /collection 路由回退：收藏主页 + 路线板（/collection/board）
  if (urlPath === "/collection" || urlPath === "/collection/board") {
    urlPath = "/collection.html";
  }

  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<h1>404 Not Found</h1>");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`躺岛 TANGDAO 预览服务器已启动`);
  console.log(`访问地址: http://localhost:${PORT}`);
});
