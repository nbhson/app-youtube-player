import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (f) => readFileSync(path.join(root, f), "utf8");

const indexHtml = read("index.html");
const appJs = read("app.js");

// ---- index.html: mọi asset local tham chiếu phải tồn tại ----

const localRefs = [...indexHtml.matchAll(/(?:src|href)="([^"#]+)"/g)]
  .map((m) => m[1])
  .filter((u) => !/^(https?:)?\/\//.test(u) && !u.startsWith("data:") && !u.startsWith("/"));

test("index.html tham chiếu đúng các asset cốt lõi", () => {
  for (const asset of ["utils.js", "app.js", "style.css", "manifest.webmanifest", "icon.svg"]) {
    assert.ok(localRefs.includes(asset), `index.html phải tham chiếu "${asset}"`);
  }
});

test("mọi asset local trong index.html đều tồn tại trên đĩa", () => {
  assert.ok(localRefs.length > 0, "index.html phải có ít nhất một asset local");
  for (const ref of localRefs) {
    assert.ok(existsSync(path.join(root, decodeURIComponent(ref))), `thiếu asset "${ref}"`);
  }
});

test("utils.js được load TRƯỚC app.js (app.js dùng globals từ utils.js)", () => {
  const idxUtils = indexHtml.indexOf('src="utils.js"');
  const idxApp = indexHtml.indexOf('src="app.js"');
  assert.ok(idxUtils !== -1 && idxApp !== -1, "phải có cả utils.js và app.js");
  assert.ok(idxUtils < idxApp, "utils.js phải đứng trước app.js");
});

// ---- manifest.webmanifest ----

test("manifest.webmanifest là JSON hợp lệ và icon trỏ tới file tồn tại", () => {
  const manifest = JSON.parse(read("manifest.webmanifest"));
  assert.ok(manifest.name || manifest.short_name, "manifest phải có name");
  const icons = manifest.icons || [];
  assert.ok(icons.length > 0, "manifest phải có ít nhất một icon");
  for (const icon of icons) {
    const p = path.join(root, decodeURIComponent(icon.src.replace(/^\.\//, "").split("?")[0]));
    assert.ok(existsSync(p), `manifest icon "${icon.src}" không tồn tại`);
  }
});

// ---- service worker ----

test("app.js đăng ký sw.js và sw.js tồn tại", () => {
  assert.match(appJs, /serviceWorker\.register\(['"]sw\.js['"]/);
  assert.ok(existsSync(path.join(root, "sw.js")), "sw.js không tồn tại");
});

test("sw.js precache đủ app-shell (bao gồm utils.js)", () => {
  const sw = read("sw.js");
  for (const asset of ["./index.html", "./style.css", "./utils.js", "./app.js", "./manifest.webmanifest", "./icon.svg"]) {
    assert.ok(sw.includes(`'${asset}'`), `sw.js ASSETS thiếu "${asset}"`);
  }
});

// ---- tính toàn vẹn ứng dụng ----

test("app.js không định nghĩa lại các global đã khai báo trong utils.js", () => {
  const app = appJs;
  for (const decl of ["class YouTubeUtils", "const CONFIG", "const YOUTUBE_URL_PATTERNS"]) {
    assert.ok(!app.includes(decl), `app.js không được định nghĩa lại "${decl}" (đã chuyển sang utils.js)`);
  }
  const utils = read("utils.js");
  for (const decl of ["class YouTubeUtils", "const CONFIG", "const YOUTUBE_URL_PATTERNS"]) {
    assert.ok(utils.includes(decl), `utils.js phải khai báo "${decl}"`);
  }
});

test("app.js đăng ký listener DOMContentLoaded để khởi động app", () => {
  assert.match(appJs, /DOMContentLoaded/);
});
