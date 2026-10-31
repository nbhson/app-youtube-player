# YouTube Player 📺

[![CI](https://github.com/nbhson/app-youtube-player/actions/workflows/ci.yml/badge.svg)](https://github.com/nbhson/app-youtube-player/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

YouTube player dạng **PWA** với queue, tìm kiếm, favorites, history, Picture-in-Picture và hỗ trợ offline (app shell).

## Tính năng

- Queue phát nhạc/video, điều khiển đầy đủ
- Tìm kiếm video, quản lý favorites & history
- Import/export dữ liệu backup (JSON, có sanitize schema chống XSS)
- Fallback qua **Invidious/Piped** khi API chính bị chặn
- PWA: cài đặt lên máy, chạy offline với app shell (`sw.js` + `manifest.webmanifest`)

## Chạy

Là static web app — mở `index.html` hoặc serve tĩnh:

```bash
npx serve .
```

Service worker cần `http://localhost` hoặc `https` để đăng ký (mở `file://` sẽ không hoạt động offline).

## Cấu trúc

```
index.html             # App shell
app.js                 # Toàn bộ logic (~1900 dòng): queue, search, favorites, XSS-escape
sw.js                  # Service worker (offline cache)
manifest.webmanifest   # PWA manifest
icon.svg               # Icon
```

## Bảo mật

Toàn bộ dữ liệu từ API/backup file (title, channel, thumbnail URL) được escape qua `escapeHtml/escapeAttr` trước khi render — chống stored XSS.

## License

[MIT](LICENSE)
