# Plan — app-youtube-player

> YouTube player PWA (vanilla JS ~1900 dòng, queue/favorites/history, Invidious/Piped fallback, PWA).

## Kết quả Review (audit đợt 1)

| # | Severity | Vị trí | Vấn đề | Fix |
|---|----------|--------|--------|-----|
| 1 | CRITICAL | app.js:1242-1256 | `renderFavorites` innerHTML không escape `title/channelTitle/thumbnailUrl` (từ API + file import) → stored XSS | `escapeHtml/escapeAttr` toàn bộ |
| 2 | CRITICAL | app.js:1269-1280 | `renderHistory` — cùng bug XSS | escape toàn bộ |
| 3 | CRITICAL | app.js:1209-1227 | `importAll` nhận JSON tùy ý không validate → XSS qua backup file + thiếu reset input | Sanitize schema (type/length/URL regex ytimg), reset `e.target.value`, gọi `updateFavoriteButtonState` |
| 4 | MAJOR | app.js:956-967 | Search results template không escape `title/channelTitle` + query trong empty-state | escape |
| 5 | MAJOR | app.js:1440-1497 | displaySuggestedVideos/displayFallbackSuggestions không escape | escape |
| 6 | MAJOR | app.js:1079 | `fillSelect` nội suy URL vào `<option>` qua innerHTML | createElement + setAttribute |
| 7 | MAJOR | app.js:563 | Piped health check `mode:'no-cors'` luôn resolve → vô nghĩa | Fetch `/api/v1/trending` (có CORS) + check `res.ok` |
| 8 | MAJOR | app.js:1074 | 7+ cross-origin fetch mỗi lần load trang | TTL cache 5 phút |
| 9 | MAJOR | app.js:794-804 | `localStorage.setItem` mỗi giây khi phát video | Throttle 10s |
| 10 | MAJOR | app.js:1843-1845 | ResizeObserver không disconnect + không throttle | Giữ ref, rAF throttle |
| 11 | MAJOR | sw.js | Cache-first → stale app.js sau deploy; ASSETS cache-list ổn | Network-first + fallback cache + bump v2 |
| 12 | MAJOR | app.js:1213 | Re-import cùng file không fire change | Reset `e.target.value=''` |
| 13 | MINOR | index.html:63 | `autoplay=1` trên iframe đầu trang — autoplay không có gesture | Xóa param |
| 14 | MINOR | index.html:9 | Meta description nói "offline support" gây hiểu nhầm | Ghi rõ "app-shell offline" |

## Trạng thái

- [x] Plan
- [x] Fix #1–#14
- [x] Commit + self-review

## Review Log

### Vòng 1
- Self-review: `node --check` pass (app.js + sw.js). Đã grep toàn bộ `innerHTML` — mọi interpolation dữ liệu động đều qua `YouTubeUtils.escapeHtml/escapeAttr`. `importAll` sanitize: id ≤32, title ≤300, channel ≤200, thumbnailUrl whitelist `https://i.ytimg.com/`. Queue render cũng đã escape. `checkAll` chỉ bỏ qua khi `!manual` (nút Check vẫn force).

---

# Round 2 (2026-10-29) — Enterprise upgrade

## Kết quả Review (audit đợt 2)

| # | Severity | Vị trí | Vấn đề | Fix |
|---|----------|--------|--------|-----|
| 1 | MAJOR | app.js:1010 (SearchController) | `Search failed (${e.message})` nội suy error text (fetch/HTTP) thẳng vào innerHTML | Qua `YouTubeUtils.escapeHtml` |
| 2 | MINOR | PlaybackExtras.init | Keydown không ignore Ctrl/Cmd/Alt → Ctrl+F/Cmd+… vừa hệ thống vừa kích hoạt shortcut của app | Guard `ctrlKey/metaKey/altKey` |
| 3 | MINOR | keydown Space | Space trên button đang focus vừa kích hoạt click vừa toggle play | Guard `tag === 'BUTTON'` cho Space/K |
| 4 | MINOR | sw.js | Cache version chưa bump sau khi đổi assets | Bump v3 (network-first vẫn ưu tiên bản mới, bump đảm bảo prefetch sạch) |

## Feature mới (đợt 2)

1. **Theater mode**: nút Theater + phím T — player trải toàn bộ chiều rộng (`.content-layout.theater`), sidebar thu xuống dưới; lưu localStorage, khôi phục khi load; `aria-pressed` trên nút.
2. **Mute + volume keys**: M toggle mute (nút + icon volume_off sync, un-mute khi bấm ↑), ↑/↓ volume ±5% qua IFrame API (getVolume/setVolume có clamp).
3. **Speed stepping**: `,` / `.` đi qua mốc 0.25→2x, đồng bộ `speedSelect` UI (đslider select + appState.setSpeed + setPlaybackRate).

## Trạng thái (Round 2)

- [x] Deep review + plan
- [x] Fix #1–#4
- [x] Features: theater mode, mute/volume keys, speed stepping
- [x] `node --check` (app.js, sw.js) + manifest.webmanifest hợp lệ + self-review

## Review Log (Round 2)

### Vòng 2
- Self-review: lúc refactor PlaybackExtras bị trùng class/orphan tryPiP body — đã phát hiện qua `node --check` + rà lại toàn bộ class, sửa lại thành 1 class sạch (1 init, tryPiP có signature, không method trùng). `node --check` pass. Shortcuts mới không xung đột phím cũ; các tổ hợp Ctrl/Cmd/Alt được bỏ qua sớm. Theater chỉ đổi class CSS + localStorage — không đụng player. Rủi ro còn lại: volume/mute chỉ hoạt động trên source nocookie (iframe API) — đã báo message rõ khi dùng invidious/piped.

