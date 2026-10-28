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
