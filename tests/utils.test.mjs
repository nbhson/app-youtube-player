// Unit tests cho các hàm pure trong utils.js (extractVideoId, formatDuration,
// buildEmbedUrl, escapeHtml/escapeAttr, sanitizeImportedList).
//
// utils.js là classic script (không có exports) nên test đọc source và chạy
// qua Function constructor để lấy các binding top-level (CONFIG,
// YOUTUBE_URL_PATTERNS, YouTubeUtils). Các tham chiếu runtime như `appState`
// hay `window` được resolve lúc GỌI hàm nên test có thể mock qua globalThis.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const utilsSrc = readFileSync(path.join(root, "utils.js"), "utf8");

const load = new Function(`${utilsSrc}; return { CONFIG, YOUTUBE_URL_PATTERNS, YouTubeUtils };`);
const { CONFIG, YOUTUBE_URL_PATTERNS, YouTubeUtils } = load();

// ---------------------------------------------------------------- escapeHtml
test("escapeHtml/escapeAttr thoát 5 ký tự HTML", () => {
  assert.equal(YouTubeUtils.escapeHtml('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(YouTubeUtils.escapeHtml(`O'Brien & Sons </script>`),
    "O&#39;Brien &amp; Sons &lt;/script&gt;");
  assert.equal(YouTubeUtils.escapeAttr(`" onmouseover="x`), '&quot; onmouseover=&quot;x');
});

test("escapeHtml xử lý null/undefined/số một cách an toàn", () => {
  assert.equal(YouTubeUtils.escapeHtml(null), "");
  assert.equal(YouTubeUtils.escapeHtml(undefined), "");
  assert.equal(YouTubeUtils.escapeHtml(0), "0");
  assert.equal(YouTubeUtils.escapeHtml(123), "123");
  assert.equal(YouTubeUtils.escapeHtml(YouTubeUtils.escapeHtml("<b>")), "&amp;lt;b&amp;gt;");
});

// ------------------------------------------------------------ extractVideoId
const ID = "dQw4w9WgXcQ";

test("extractVideoId nhận diện các dạng URL YouTube", () => {
  assert.equal(YouTubeUtils.extractVideoId(`https://www.youtube.com/watch?v=${ID}&t=30s`), ID);
  assert.equal(YouTubeUtils.extractVideoId(`https://youtu.be/${ID}`), ID);
  assert.equal(YouTubeUtils.extractVideoId(`https://www.youtube.com/shorts/${ID}`), ID);
  assert.equal(YouTubeUtils.extractVideoId(`https://www.youtube.com/live/${ID}`), ID);
  assert.equal(YouTubeUtils.extractVideoId(`https://www.youtube.com/embed/${ID}`), ID);
  assert.equal(YouTubeUtils.extractVideoId(`https://www.youtube-nocookie.com/embed/${ID}?rel=0`), ID);
});

test("extractVideoId nhận video ID trực tiếp (có/khoảng trắng)", () => {
  assert.equal(YouTubeUtils.extractVideoId(ID), ID);
  assert.equal(YouTubeUtils.extractVideoId(`  ${ID}  `), ID);
});

test("extractVideoId trả về null cho input rác", () => {
  assert.equal(YouTubeUtils.extractVideoId(null), null);
  assert.equal(YouTubeUtils.extractVideoId(undefined), null);
  assert.equal(YouTubeUtils.extractVideoId(12345), null);
  assert.equal(YouTubeUtils.extractVideoId(""), null);
  assert.equal(YouTubeUtils.extractVideoId("https://example.com/notyoutube/dQw4w9WgXc"), null);
  assert.equal(YouTubeUtils.extractVideoId("too_short"), null);
});

// ------------------------------------------------------------ formatDuration
test("formatDuration chuyển ISO 8601 sang mm:ss / h:mm:ss", () => {
  assert.equal(YouTubeUtils.formatDuration("PT4M24S"), "4:24");
  assert.equal(YouTubeUtils.formatDuration("PT2M29S"), "2:29");
  assert.equal(YouTubeUtils.formatDuration("PT12M42S"), "12:42");
  assert.equal(YouTubeUtils.formatDuration("PT2H3M4S"), "2:03:04");
  assert.equal(YouTubeUtils.formatDuration("PT24H0M0S"), "24:00:00");
});

test("formatDuration giữ nguyên giá trị lạ / rỗng", () => {
  assert.equal(YouTubeUtils.formatDuration(""), "");
  assert.equal(YouTubeUtils.formatDuration(null), "");
  assert.equal(YouTubeUtils.formatDuration(undefined), "");
  assert.equal(YouTubeUtils.formatDuration("LIVE"), "LIVE"); // không phải PT → trả nguyên bản
});

// ------------------------------------------------------------ buildEmbedUrl
beforeEach(() => {
  globalThis.appState = {
    invidiousInstance: "https://yewtu.be/",
    pipedInstance: "https://pipedapi.kavin.rocks"
  };
});
afterEach(() => {
  delete globalThis.appState;
  delete globalThis.window;
});

test("buildEmbedUrl (nocookie) tạo URL embed chuẩn, có start khi > 0", () => {
  assert.equal(
    YouTubeUtils.buildEmbedUrl(ID, "nocookie"),
    `${CONFIG.YOUTUBE_EMBED_BASE_URL}${ID}?${CONFIG.YOUTUBE_EMBED_PARAMS}`
  );
  assert.equal(
    YouTubeUtils.buildEmbedUrl(ID, "nocookie", 90),
    `${CONFIG.YOUTUBE_EMBED_BASE_URL}${ID}?${CONFIG.YOUTUBE_EMBED_PARAMS}&start=90`
  );
  assert.equal(YouTubeUtils.buildEmbedUrl(ID, "nocookie", 0).includes("&start="), false);
});

test("buildEmbedUrl bỏ origin khi window.location.origin là 'null' (file://)", () => {
  globalThis.window = { location: { origin: "null" } };
  const url = YouTubeUtils.buildEmbedUrl(ID, "nocookie");
  assert.ok(!url.includes("origin="), "file:// không được thêm origin param");
});

test("buildEmbedUrl thêm origin encodeURIComponent khi chạy trên http(s)", () => {
  globalThis.window = { location: { origin: "https://my.player.dev" } };
  const url = YouTubeUtils.buildEmbedUrl(ID, "nocookie");
  assert.ok(url.includes("&origin=https%3A%2F%2Fmy.player.dev"));
});

test("buildEmbedUrl (invidious/piped) dùng instance đã cấu hình, bỏ slash cuối", () => {
  assert.equal(
    YouTubeUtils.buildEmbedUrl(ID, "invidious", 30),
    `https://yewtu.be/embed/${ID}?autoplay=1&start=30`
  );
  assert.equal(
    YouTubeUtils.buildEmbedUrl(ID, "piped", 30),
    `https://piped.kavin.rocks/embed/${ID}?t=30`
  );
  assert.equal(
    YouTubeUtils.buildEmbedUrl(ID, "piped"),
    `https://piped.kavin.rocks/embed/${ID}`
  );
});

test("buildEmbedUrl fallback về instance mặc định khi chưa cấu hình", () => {
  globalThis.appState = {};
  assert.ok(YouTubeUtils.buildEmbedUrl(ID, "invidious").startsWith(CONFIG.INVIDIOUS_INSTANCES[0]));
  assert.ok(YouTubeUtils.buildEmbedUrl(ID, "piped").startsWith("https://piped.video/embed/"));
});

test("buildEmbedUrl từ chối videoId không hợp lệ (trả null)", () => {
  assert.equal(YouTubeUtils.buildEmbedUrl(null, "nocookie"), null);
  assert.equal(YouTubeUtils.buildEmbedUrl("", "nocookie"), null);
  assert.equal(YouTubeUtils.buildEmbedUrl("short", "nocookie"), null);
  assert.equal(YouTubeUtils.buildEmbedUrl("way-too-long-video-id", "nocookie"), null);
  assert.equal(YouTubeUtils.buildEmbedUrl("<script>", "nocookie"), null);
});

// --------------------------------------------- sanitizeImportedList (backup)
const GOOD_ID = "abcdefghijk"; // 11 ký tự

test("sanitizeImportedList giữ item hợp lệ nguyên vẹn", () => {
  const out = YouTubeUtils.sanitizeImportedList([{
    id: GOOD_ID, title: "Tít có tiếng Việt", channelTitle: "Kênh", thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg"
  }], 10);
  assert.deepEqual(out, [{
    id: GOOD_ID, title: "Tít có tiếng Việt", channelTitle: "Kênh", thumbnailUrl: "https://i.ytimg.com/vi/abcdefghijk/mqdefault.jpg"
  }]);
});

test("sanitizeImportedList thay thumbnailUrl không phải i.ytimg.com bằng fallback an toàn", () => {
  const out = YouTubeUtils.sanitizeImportedList([
    { id: GOOD_ID, thumbnailUrl: "javascript:alert(1)" },
    { id: GOOD_ID, thumbnailUrl: "https://evil.example.com/x.jpg" },
    { id: GOOD_ID, thumbnailUrl: 42 },
    { id: GOOD_ID }
  ], 10);
  for (const v of out) {
    assert.match(v.thumbnailUrl, /^https:\/\/i\.ytimg\.com\/vi\/abcdefghijk\/mqdefault\.jpg$/);
  }
});

test("sanitizeImportedList cắt độ dài field theo giới hạn (id 32 / title 300 / channel 200)", () => {
  const out = YouTubeUtils.sanitizeImportedList([{
    id: "x".repeat(100), title: "t".repeat(1000), channelTitle: "c".repeat(500)
  }], 10);
  assert.equal(out[0].id.length, 32);
  assert.equal(out[0].title.length, 300);
  assert.equal(out[0].channelTitle.length, 200);
});

test("sanitizeImportedList loại item rác và giới hạn số lượng (cap)", () => {
  const junk = [null, undefined, 42, "str", {}, { title: "no id" }];
  const items = [...junk, ...Array.from({ length: 30 }, (_, i) => ({ id: `${GOOD_ID.slice(0, 10)}${i}` }))];
  const out = YouTubeUtils.sanitizeImportedList(items, 10);
  assert.equal(out.length, 10);
});

test("sanitizeImportedList xử lý an toàn input không phải mảng", () => {
  assert.deepEqual(YouTubeUtils.sanitizeImportedList(null, 10), []);
  assert.deepEqual(YouTubeUtils.sanitizeImportedList(undefined, 10), []);
  assert.deepEqual(YouTubeUtils.sanitizeImportedList("nope", 10), []);
});
