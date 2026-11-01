/**
 * YouTube Bypass Player — shared utilities
 * Loaded via <script> BEFORE app.js. Declares globals: CONFIG,
 * YOUTUBE_URL_PATTERNS and the YouTubeUtils class (pure helpers +
 * thin API wrappers). Kept free of DOM access so the pure functions
 * (escapeHtml, extractVideoId, formatDuration, buildEmbedUrl, ...)
 * can be unit-tested directly in Node (tests/utils.test.mjs).
 */

const CONFIG = {
    DEFAULT_VIDEO_ID: 'sru72Wk20Y0',
    MESSAGE_DISPLAY_TIME: 3000,
    MESSAGE_ANIMATION_DELAY: 100,
    MESSAGE_REMOVE_DELAY: 300,
    YOUTUBE_EMBED_BASE_URL: 'https://www.youtube-nocookie.com/embed/',
    YOUTUBE_EMBED_PARAMS: 'rel=0&playsinline=1&modestbranding=1&autoplay=1&enablejsapi=1',
    SUGGESTED_VIDEOS_COUNT: 10,
    SEARCH_RESULTS_COUNT: 12,
    YOUTUBE_API_KEY: '', // Load from localStorage at runtime — NEVER hardcode
    YOUTUBE_API_BASE_URL: 'https://www.googleapis.com/youtube/v3',
    INVIDIOUS_INSTANCES: ['https://yewtu.be', 'https://iv.melmac.space', 'https://invidious.nerdvpn.de'],
    PIPED_INSTANCES: ['https://piped.video', 'https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de']
};


const YOUTUBE_URL_PATTERNS = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct 11-char Video ID match
];

// ============================================================================
// Utility Methods (Bypass URLs & Formatting)
// ============================================================================
class YouTubeUtils {
    /**
     * Escape untrusted text for safe interpolation into innerHTML (text nodes).
     * Any string coming from the YouTube API or an imported backup file MUST
     * pass through this before being placed in an HTML template.
     */
    static escapeHtml(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /** Alias for attribute contexts (same 5 entities — kept for readability). */
    static escapeAttr(str) {
        return this.escapeHtml(str);
    }

    /**
     * Extract video ID from various YouTube formats
     * @param {string} url - youtube link or video ID
     */
    static extractVideoId(url) {
        if (!url || typeof url !== 'string') return null;
        
        const cleanUrl = url.trim();
        for (const pattern of YOUTUBE_URL_PATTERNS) {
            const match = cleanUrl.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    /**
     * Build appropriate frame URL based on selection
     * @param {string} videoId 
     * @param {string} source - 'nocookie' | 'invidious' | 'piped'
     */
    static buildEmbedUrl(videoId, source, startSec = 0) {
        // Guard: YouTube IDs are always exactly 11 chars. Anything else
        // renders "Error 153 - Video player configuration error".
        if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId || '')) return null;
        const startParam = startSec > 0 ? `&start=${Math.floor(startSec)}` : '';

        if (source === 'invidious') {
            const base = (appState.invidiousInstance || CONFIG.INVIDIOUS_INSTANCES[0]).replace(/\/$/, '');
            return `${base}/embed/${videoId}?autoplay=1${startParam}`;
        } else if (source === 'piped') {
            const base = (appState.pipedInstance || CONFIG.PIPED_INSTANCES[0]).replace(/\/$/, '');
            const embedBase = base.replace('pipedapi.', 'piped.').replace(/\/api$/, '');
            return `${embedBase}/embed/${videoId}${startSec > 0 ? `?t=${Math.floor(startSec)}` : ''}`;
        } else {
            // Default: youtube no-cookie standard bypass
            // IMPORTANT: only append &origin= when running on http(s).
            // When opened via file://, window.location.origin === "null"
            // and YouTube rejects the player with Error 153.
            let originParam = '';
            try {
                const o = window.location.origin;
                if (o && o !== 'null' && /^https?:\/\//.test(o)) {
                    originParam = `&origin=${encodeURIComponent(o)}`;
                }
            } catch (e) { /* ignore - omit origin */ }
            return `${CONFIG.YOUTUBE_EMBED_BASE_URL}${videoId}?${CONFIG.YOUTUBE_EMBED_PARAMS}${originParam}${startParam}`;
        }
    }

    /**
     * Fetch video title and author publicly (No API Key required) via YouTube's official oEmbed endpoint
     * @param {string} videoId 
     */
    static async fetchVideoDetailsOEmbed(videoId) {
        const fallback = {
            id: videoId,
            title: `YouTube Video (${videoId})`,
            channelTitle: 'YouTube Bypass',
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
        };
        try {
            // YouTube's own CORS-enabled oEmbed endpoint. Using it directly
            // (instead of a third-party proxy like noembed.com) keeps watch
            // history from leaking to another service.
            const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();

            return {
                id: videoId,
                title: data.title || fallback.title,
                channelTitle: data.author_name || fallback.channelTitle,
                // YouTube oEmbed has no separate field we relied on beyond
                // title/author_name/thumbnail_url — fall back to the local
                // static thumbnail URL when the field is missing.
                thumbnailUrl: data.thumbnail_url || fallback.thumbnailUrl
            };
        } catch (e) {
            console.warn('OEmbed fetch failed, fallback applied:', e);
            return fallback;
        }
    }

    /**
     * Search related videos using title keyword matching (Workaround for deprecated relatedToVideoId)
     */
    static async fetchSuggestedVideos(videoId, title) {
        try {
            if (!appState.hasValidApiKey()) {
                throw new Error('API Key missing');
            }

            const apiKey = appState.getApiKey();
            
            // Extract core words from title to use as search queries
            const cleanTitle = title
                ? title.replace(/[^\w\s]/gi, '').split(/\s+/).slice(0, 4).join(' ')
                : 'music';
            const query = encodeURIComponent(cleanTitle);
            
            const url = `${CONFIG.YOUTUBE_API_BASE_URL}/search?part=snippet&q=${query}&type=video&maxResults=${CONFIG.SUGGESTED_VIDEOS_COUNT}&key=${apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Error fetching suggestions:', error);
            return [];
        }
    }

    /**
     * Fetch durations and view stats for suggestions
     */
    static async fetchVideoDetails(videoIds) {
        try {
            const apiKey = appState.getApiKey();
            if (!appState.hasValidApiKey()) return [];

            const ids = videoIds.join(',');
            const url = `${CONFIG.YOUTUBE_API_BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data.items || [];
        } catch (error) {
            console.error('Error fetching statistics details:', error);
            return [];
        }
    }

    static formatViewCount(viewCount) {
        if (!viewCount) return '';
        const count = parseInt(viewCount);
        if (isNaN(count)) return '';
        if (count >= 1000000000) {
            return (count / 1000000000).toFixed(1) + 'B';
        } else if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }

    static formatDuration(duration) {
        if (!duration) return '';
        if (!duration.startsWith('PT')) return duration;
        
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return '';
        
        const hours = (match[1] || '').replace('H', '');
        const minutes = (match[2] || '').replace('M', '');
        const seconds = (match[3] || '').replace('S', '');
        
        if (hours) {
            return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
        } else {
            return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
        }
    }

    static formatSeconds(sec) {
        if (!sec || sec < 0) return '0:00';
        sec = Math.floor(sec);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        return `${m}:${String(s).padStart(2, '0')}`;
    }

    static buildWatchUrl(videoId, startSec = 0) {
        const base = `https://youtu.be/${videoId}`;
        return startSec > 0 ? `${base}?t=${Math.floor(startSec)}s` : base;
    }

    static async searchVideos(query, maxResults = CONFIG.SEARCH_RESULTS_COUNT) {
        if (!appState.hasValidApiKey()) throw new Error('API Key missing');
        const apiKey = appState.getApiKey();
        const url = `${CONFIG.YOUTUBE_API_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.items || [];
    }

    /**
     * Validate/sanitize items from an untrusted backup file. Every field is
     * coerced to a bounded string; thumbnailUrl must be an i.ytimg.com https
     * URL or it is replaced with a safe fallback derived from the video id.
     */
    static sanitizeImportedList(list, cap) {
        return (Array.isArray(list) ? list : [])
            .filter(v => v && typeof v === 'object')
            .map(v => ({
                id: String(v.id ?? '').slice(0, 32),
                title: String(v.title ?? '').slice(0, 300),
                channelTitle: String(v.channelTitle ?? '').slice(0, 200),
                thumbnailUrl: (typeof v.thumbnailUrl === 'string' && /^https:\/\/i\.ytimg\.com\//.test(v.thumbnailUrl))
                    ? v.thumbnailUrl
                    : `https://i.ytimg.com/vi/${encodeURIComponent(String(v.id ?? ''))}/mqdefault.jpg`
            }))
            .filter(v => v.id)
            .slice(0, cap);
    }

    static async checkInstance(url, kind) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        try {
            if (kind === 'invidious') {
                const res = await fetch(`${url.replace(/\/$/, '')}/api/v1/stats`, { signal: ctrl.signal });
                clearTimeout(timer);
                return res.ok;
            }
            // mode:'no-cors' luôn resolve opaque → check vô nghĩa. Dùng Piped API
            // thực tế có CORS để kiểm tra instance còn sống.
            const res = await fetch(`${url.replace(/\/$/, '')}/api/v1/trending?region=US`, { signal: ctrl.signal });
            clearTimeout(timer);
            return res.ok;
        } catch (e) {
            clearTimeout(timer);
            return false;
        }
    }
}
