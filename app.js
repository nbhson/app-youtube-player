/**
 * YouTube Bypass Player Application
 * A modern interface for playing YouTube videos with enhanced privacy
 */

// ============================================================================
// Constants & Fallbacks
// ============================================================================
const CONFIG = {
    DEFAULT_VIDEO_ID: 'sru72Wk20Y0',
    MESSAGE_DISPLAY_TIME: 3000,
    MESSAGE_ANIMATION_DELAY: 100,
    MESSAGE_REMOVE_DELAY: 300,
    YOUTUBE_EMBED_BASE_URL: 'https://www.youtube-nocookie.com/embed/',
    YOUTUBE_EMBED_PARAMS: 'rel=0&playsinline=1&modestbranding=1&autoplay=1&enablejsapi=1',
    SUGGESTED_VIDEOS_COUNT: 10,
    SEARCH_RESULTS_COUNT: 12,
    YOUTUBE_API_KEY: 'AIzaSyAXZ2ntfnxiUDPQJq_FjCUIy6wKbqcxuWQ', // Default API Key placeholder
    YOUTUBE_API_BASE_URL: 'https://www.googleapis.com/youtube/v3',
    INVIDIOUS_INSTANCES: ['https://yewtu.be', 'https://iv.melmac.space', 'https://invidious.nerdvpn.de'],
    PIPED_INSTANCES: ['https://piped.video', 'https://pipedapi.kavin.rocks', 'https://pipedapi.adminforge.de']
};

const MESSAGES = {
    EMPTY_INPUT: 'Please paste a YouTube link first',
    INVALID_LINK: 'Invalid YouTube link. Please check your URL and try again.',
    SUCCESS_LOAD: 'Video loaded successfully!'
};

const YOUTUBE_URL_PATTERNS = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct 11-char Video ID match
];

const FALLBACK_VIDEOS = [
    {
        id: 'jfKfPfyJRdk',
        snippet: {
            title: 'lofi hip hop radio 📚 beats to relax/study to',
            channelTitle: 'Lofi Girl',
            thumbnails: { medium: { url: 'https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg' } }
        },
        statistics: { viewCount: '850000000' },
        contentDetails: { duration: 'PT24H0M0S' }
    },
    {
        id: '4xDzrJKXOOY',
        snippet: {
            title: 'synthwave radio 🌌 beats to chill/game to',
            channelTitle: 'Lofi Girl',
            thumbnails: { medium: { url: 'https://i.ytimg.com/vi/4xDzrJKXOOY/mqdefault.jpg' } }
        },
        statistics: { viewCount: '150000000' },
        contentDetails: { duration: 'PT24H0M0S' }
    },
    {
        id: 'n4O95n8y2lo',
        snippet: {
            title: '10 Hours of Relaxing Rain & Thunder Sounds for Sleep',
            channelTitle: 'Relaxing Sounds',
            thumbnails: { medium: { url: 'https://i.ytimg.com/vi/n4O95n8y2lo/mqdefault.jpg' } }
        },
        statistics: { viewCount: '45000000' },
        contentDetails: { duration: 'PT10H0M0S' }
    },
    {
        id: 'XWZ0xJpxzD8',
        snippet: {
            title: 'New M4 MacBook Pro: What They Didn\'t Tell You!',
            channelTitle: 'TechVibe',
            thumbnails: { medium: { url: 'https://i.ytimg.com/vi/XWZ0xJpxzD8/mqdefault.jpg' } }
        },
        statistics: { viewCount: '2500000' },
        contentDetails: { duration: 'PT12M42S' }
    },
    {
        id: 'mPZkdNFkNps',
        snippet: {
            title: 'Cozy Rain & Coffee Shop Ambience ☕ Lofi Jazz Music',
            channelTitle: 'Rainy Cafe',
            thumbnails: { medium: { url: 'https://i.ytimg.com/vi/mPZkdNFkNps/mqdefault.jpg' } }
        },
        statistics: { viewCount: '12000000' },
        contentDetails: { duration: 'PT3H0M0S' }
    },
    {
        id: 'TcMBFSGVi1c',
        snippet: {
            title: 'Marvel Studios\' Avengers: Endgame - Official Trailer',
            channelTitle: 'Marvel Entertainment',
            thumbnails: { medium: { url: 'https://i.ytimg.com/vi/TcMBFSGVi1c/mqdefault.jpg' } }
        },
        statistics: { viewCount: '160000000' },
        contentDetails: { duration: 'PT2M29S' }
    },
    {
        id: 'JGwWNGJdvx8',
        snippet: {
            title: 'Ed Sheeran - Shape of You [Official Video]',
            channelTitle: 'Ed Sheeran',
            thumbnails: { medium: { url: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg' } }
        },
        statistics: { viewCount: '6200000000' },
        contentDetails: { duration: 'PT4M24S' }
    },
    {
        id: 'Yykjpe592Ro',
        snippet: {
            title: 'Coldplay - Hymn For The Weekend (Official Video)',
            channelTitle: 'Coldplay',
            thumbnails: { medium: { url: 'https://i.ytimg.com/vi/Yykjpe592Ro/mqdefault.jpg' } }
        },
        statistics: { viewCount: '1900000000' },
        contentDetails: { duration: 'PT4M20S' }
    }
];

// ============================================================================
// DOM Elements
// ============================================================================
const DOM = {
    youtubeLinkInput: document.getElementById('youtubeLink'),
    loadButton: document.getElementById('loadButton'),
    videoPlayer: document.getElementById('videoPlayer'),
    messageContainer: document.getElementById('messageContainer'),
    suggestedVideosContainer: document.getElementById('suggestedVideosContainer'),
    refreshSuggestionsBtn: document.getElementById('refreshSuggestions'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    saveApiKeyBtn: document.getElementById('saveApiKey'),
    toggleApiKeyBtn: document.getElementById('toggleApiKey'),
    apiKeyStatus: document.getElementById('apiKeyStatus'),
    
    // New UX Elements
    playerSource: document.getElementById('playerSource'),
    activeVideoTitle: document.getElementById('activeVideoTitle'),
    activeVideoChannel: document.getElementById('activeVideoChannel'),
    playProgress: document.getElementById('playProgress'),
    favoriteToggle: document.getElementById('favoriteToggle'),
    shareEmbed: document.getElementById('shareEmbed'),
    favoritesList: document.getElementById('favoritesList'),
    historyList: document.getElementById('historyList'),
    favoritesCount: document.getElementById('favoritesCount'),
    clearHistory: document.getElementById('clearHistory'),
    libraryFilter: document.getElementById('libraryFilter'),
    exportLibraryBtn: document.getElementById('exportLibraryBtn'),
    importLibraryBtn: document.getElementById('importLibraryBtn'),
    importLibraryFile: document.getElementById('importLibraryFile'),
    ambientGlow: document.getElementById('ambientGlow'),
    pageAmbient: document.getElementById('pageAmbient'),
    // Queue / search / playback
    searchButton: document.getElementById('searchButton'),
    searchResultsContainer: document.getElementById('searchResultsContainer'),
    searchCount: document.getElementById('searchCount'),
    queueList: document.getElementById('queueList'),
    queueCount: document.getElementById('queueCount'),
    autoplayToggle: document.getElementById('autoplayToggle'),
    loopMode: document.getElementById('loopMode'),
    shuffleQueue: document.getElementById('shuffleQueue'),
    clearQueue: document.getElementById('clearQueue'),
    prevBtn: document.getElementById('prevBtn'),
    nextBtn: document.getElementById('nextBtn'),
    pipBtn: document.getElementById('pipBtn'),
    speedSelect: document.getElementById('speedSelect'),
    sleepSelect: document.getElementById('sleepSelect'),
    invidiousInstance: document.getElementById('invidiousInstance'),
    pipedInstance: document.getElementById('pipedInstance'),
    invidiousStatus: document.getElementById('invidiousStatus'),
    pipedStatus: document.getElementById('pipedStatus'),
    checkHealthBtn: document.getElementById('checkHealthBtn')
};

// ============================================================================
// App State Management
// ============================================================================
class AppState {
    constructor() {
        this.currentVideoId = CONFIG.DEFAULT_VIDEO_ID;
        this.apiKey = this.loadApiKey();
        this.playbackSource = this.loadPlaybackSource();
        this.favorites = this.loadFavorites();
        this.history = this.loadHistory();
        this.queue = this.loadQueue();
        this.autoplay = this.loadAutoplay();
        this.loopMode = this.loadLoopMode();
        this.speed = this.loadSpeed();
        this.invidiousInstance = this.loadInstance('youtube_invidious_instance', CONFIG.INVIDIOUS_INSTANCES[0]);
        this.pipedInstance = this.loadInstance('youtube_piped_instance', CONFIG.PIPED_INSTANCES[0]);
        this.resumeMap = this.loadResumeMap();
    }

    setVideoId(videoId) {
        this.currentVideoId = videoId;
    }

    getVideoId() {
        return this.currentVideoId;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('youtube_api_key', apiKey);
    }

    getApiKey() {
        return this.apiKey || ''; // Do not enforce placeholder
    }

    loadApiKey() {
        return localStorage.getItem('youtube_api_key') || null;
    }

    hasValidApiKey() {
        const apiKey = this.getApiKey();
        return apiKey && apiKey.length > 10;
    }

    // Playback Sources
    setPlaybackSource(source) {
        this.playbackSource = source;
        localStorage.setItem('youtube_playback_source', source);
    }

    getPlaybackSource() {
        return this.playbackSource;
    }

    loadPlaybackSource() {
        return localStorage.getItem('youtube_playback_source') || 'nocookie';
    }

    // Library - Favorites
    loadFavorites() {
        try {
            return JSON.parse(localStorage.getItem('youtube_favorites')) || [];
        } catch (e) {
            return [];
        }
    }

    saveFavorites() {
        localStorage.setItem('youtube_favorites', JSON.stringify(this.favorites));
    }

    toggleFavorite(video) {
        const idx = this.favorites.findIndex(v => v.id === video.id);
        if (idx > -1) {
            this.favorites.splice(idx, 1);
            this.saveFavorites();
            return false; // Removed
        } else {
            this.favorites.push(video);
            this.saveFavorites();
            return true; // Added
        }
    }

    isFavorite(videoId) {
        return this.favorites.some(v => v.id === videoId);
    }

    // Library - History
    loadHistory() {
        try {
            return JSON.parse(localStorage.getItem('youtube_history')) || [];
        } catch (e) {
            return [];
        }
    }

    saveHistory() {
        localStorage.setItem('youtube_history', JSON.stringify(this.history));
    }

    addHistory(video) {
        // Remove existing duplicates
        this.history = this.history.filter(v => v.id !== video.id);
        // Push to front
        this.history.unshift(video);
        // Truncate to maximum 20 items
        if (this.history.length > 20) {
            this.history.pop();
        }
        this.saveHistory();
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    // Queue
    loadQueue() {
        try { return JSON.parse(localStorage.getItem('youtube_queue')) || []; } catch (e) { return []; }
    }
    saveQueue() { localStorage.setItem('youtube_queue', JSON.stringify(this.queue)); }
    enqueue(video) {
        if (!video || !video.id) return false;
        if (this.queue.some(v => v.id === video.id)) return false;
        this.queue.push(video);
        this.saveQueue();
        return true;
    }
    dequeue(videoId) {
        this.queue = this.queue.filter(v => v.id !== videoId);
        this.saveQueue();
    }
    clearQueue() { this.queue = []; this.saveQueue(); }
    moveInQueue(videoId, dir) {
        const i = this.queue.findIndex(v => v.id === videoId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= this.queue.length) return;
        [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        this.saveQueue();
    }
    shuffleQueue() {
        for (let i = this.queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
        }
        this.saveQueue();
    }

    loadAutoplay() {
        const v = localStorage.getItem('youtube_autoplay');
        return v === null ? true : v === '1';
    }
    setAutoplay(on) { this.autoplay = !!on; localStorage.setItem('youtube_autoplay', on ? '1' : '0'); }
    loadLoopMode() { return localStorage.getItem('youtube_loop') || 'all'; }
    setLoopMode(m) { this.loopMode = m; localStorage.setItem('youtube_loop', m); }
    loadSpeed() { return parseFloat(localStorage.getItem('youtube_speed')) || 1; }
    setSpeed(s) { this.speed = s; localStorage.setItem('youtube_speed', String(s)); }

    loadInstance(key, fallback) { return localStorage.getItem(key) || fallback; }
    setInstance(key, url) { localStorage.setItem(key, url); }

    // Resume positions {videoId: seconds}
    loadResumeMap() {
        try { return JSON.parse(localStorage.getItem('youtube_resume')) || {}; } catch (e) { return {}; }
    }
    saveResumeMap() { localStorage.setItem('youtube_resume', JSON.stringify(this.resumeMap)); }
    getResume(videoId) { return this.resumeMap[videoId] || 0; }
    setResume(videoId, sec) {
        if (!videoId || !sec || sec < 5) return;
        this.resumeMap[videoId] = Math.floor(sec);
        if (Object.keys(this.resumeMap).length > 100) {
            const first = Object.keys(this.resumeMap)[0];
            delete this.resumeMap[first];
        }
        this.saveResumeMap();
    }
    clearResume(videoId) { delete this.resumeMap[videoId]; this.saveResumeMap(); }
}

const appState = new AppState();

// ============================================================================
// Utility Methods (Bypass URLs & Formatting)
// ============================================================================
class YouTubeUtils {
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
     * Fetch video title and author publicly (No API Key required) via oEmbed proxy
     * @param {string} videoId 
     */
    static async fetchVideoDetailsOEmbed(videoId) {
        try {
            // Using noembed CORS-enabled proxy endpoint
            const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
            if (!response.ok) throw new Error('Proxy failure');
            
            const data = await response.json();
            if (data.error) throw new Error(data.error);

            return {
                id: videoId,
                title: data.title || `Video (${videoId})`,
                channelTitle: data.author_name || 'YouTube Creator',
                thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
            };
        } catch (e) {
            console.warn('OEmbed fetch failed, fallback applied:', e);
            return {
                id: videoId,
                title: `YouTube Video (${videoId})`,
                channelTitle: 'YouTube Bypass',
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
            };
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

    static async checkInstance(url, kind) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 6000);
        try {
            if (kind === 'invidious') {
                const res = await fetch(`${url.replace(/\/$/, '')}/api/v1/stats`, { signal: ctrl.signal });
                clearTimeout(timer);
                return res.ok;
            }
            const res = await fetch(url.replace(/\/$/, '') + '/', { signal: ctrl.signal, mode: 'no-cors' });
            clearTimeout(timer);
            return true;
        } catch (e) {
            clearTimeout(timer);
            return false;
        }
    }
}

// ============================================================================
// Ambient light (extension-like, thumbnail-driven)
// NOTE: True realtime ambient (read pixels from <video> every frame via
// canvas/WebGL like "Ambient light for YouTube" extension) is IMPOSSIBLE
// with cross-origin <iframe> (youtube-nocookie / invidious / piped) due to
// CORS/tainted-canvas. This controller mimics it using the video thumbnail:
// blurred image + extracted dominant/edge colors + fade/breathe animation.
// ============================================================================

class AmbientController {
    static cache = new Map();

    static bestThumbnail(videoId, thumbnailUrl) {
        // Prefer hqdefault (480x360) for color quality; fallback to oEmbed thumb
        if (videoId) return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        return thumbnailUrl;
    }

    static hashHue(videoId) {
        let hash = 0;
        for (let i = 0; i < String(videoId).length; i++) {
            hash = videoId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash % 360);
    }

    static applyFallback(videoId) {
        const hue = this.hashHue(videoId);
        const root = document.documentElement.style;
        root.setProperty('--ambient-glow-color', `hsla(${hue}, 75%, 60%, 0.3)`);
        root.setProperty('--ambient-c1', `hsla(${hue}, 85%, 60%, 0.55)`);
        root.setProperty('--ambient-c2', `hsla(${(hue + 40) % 360}, 85%, 55%, 0.45)`);
        root.setProperty('--ambient-c3', `hsla(${(hue + 320) % 360}, 85%, 55%, 0.45)`);
    }

    static setFromVideo(videoId, thumbnailUrl) {
        const glow = DOM.ambientGlow;
        const page = DOM.pageAmbient;
        if (!glow && !page) return;
        const root = document.documentElement.style;

        // Fade out while loading new colors (like extension Fade in/out)
        if (glow) glow.classList.add('is-loading');
        if (page) page.classList.add('is-loading');

        const thumb = this.bestThumbnail(videoId, thumbnailUrl);

        // Instant CSS-only glow from image (works even without CORS)
        // Both the near glow (quanh player) và far glow (cả màn hình) dùng chung vars
        root.setProperty('--ambient-img', `url("${thumb}")`);
        this.applyFallback(videoId);

        // Serve from cache if already extracted
        if (this.cache.has(videoId)) {
            this.applyPalette(this.cache.get(videoId));
            if (glow) glow.classList.remove('is-loading');
            if (page) page.classList.remove('is-loading');
            return;
        }

        // Try precise color extraction (needs CORS; i.ytimg.com usually allows it)
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';

        const done = () => {
            if (glow) glow.classList.remove('is-loading');
            if (page) page.classList.remove('is-loading');
        };
        const timer = setTimeout(done, 2500); // never stuck in loading state

        img.onload = () => {
            clearTimeout(timer);
            try {
                const palette = this.extractPalette(img);
                this.cache.set(videoId, palette);
                // Only apply if user hasn't switched video meanwhile
                if (appState.getVideoId() === videoId) this.applyPalette(palette);
            } catch (e) {
                console.warn('Ambient palette extraction failed, using fallback:', e);
            }
            done();
        };
        img.onerror = () => { clearTimeout(timer); done(); };
        img.src = thumb;
    }

    static extractPalette(img) {
        const w = 32, h = 18;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        // Cover-fit draw
        const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        const data = ctx.getImageData(0, 0, w, h).data;

        const avg = (filter) => {
            let r = 0, g = 0, b = 0, n = 0;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    if (!filter(x, y)) continue;
                    const i = (y * w + x) * 4;
                    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
                }
            }
            if (!n) return null;
            return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
        };

        // Edge-biased sampling like the extension (left/right/bottom glow matters most)
        const left = avg((x) => x < 6);
        const right = avg((x) => x >= w - 6);
        const bottom = avg((x, y) => y >= h - 6);
        const overall = avg(() => true);
        return { left, right, bottom, overall };
    }

    static toCss(rgb, alpha = 0.55) {
        if (!rgb) return null;
        const [r, g, b] = rgb;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    static applyPalette(palette) {
        const root = document.documentElement.style;
        const c1 = this.toCss(palette.left, 0.6) || this.toCss(palette.overall, 0.55);
        const c2 = this.toCss(palette.right, 0.55) || c1;
        const c3 = this.toCss(palette.bottom, 0.55) || c1;
        if (c1) root.setProperty('--ambient-c1', c1);
        if (c2) root.setProperty('--ambient-c2', c2);
        if (c3) root.setProperty('--ambient-c3', c3);
    }
}

// ============================================================================
// YouTube IFrame API wrapper (nocookie only; invidious/piped degrade gracefully)
// ============================================================================
class YTPlayerAPI {
    static player = null;
    static ready = false;
    static pendingSeek = 0;
    static progressTimer = null;

    static init() {
        if (document.querySelector('script[data-yt-iframe-api]')) return;
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.setAttribute('data-yt-iframe-api', '1');
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => this.createPlayer();
        // Fallback: try creating once iframe exists
        setTimeout(() => { if (!this.player) this.createPlayer(); }, 4000);
    }

    static createPlayer() {
        try {
            if (!window.YT || !window.YT.Player || !DOM.videoPlayer) return;
            if (this.player) return;
            this.player = new window.YT.Player(DOM.videoPlayer, {
                events: {
                    onReady: (e) => {
                        this.ready = true;
                        try { e.target.setPlaybackRate(appState.speed || 1); } catch (_) {}
                        if (this.pendingSeek > 0) { try { e.target.seekTo(this.pendingSeek, true); } catch (_) {} this.pendingSeek = 0; }
                        this.startProgressLoop();
                    },
                    onStateChange: (e) => this.handleState(e.data)
                }
            });
        } catch (e) { console.warn('YT API init failed:', e); }
    }

    static handleState(state) {
        // YT.PlayerState.ENDED === 0
        const ENDED = (window.YT && window.YT.PlayerState && window.YT.PlayerState.ENDED) || 0;
        if (state === ENDED) {
            const vid = appState.getVideoId();
            appState.clearResume(vid);
            QueueController.handleEnded();
        }
    }

    static loadVideo(videoId, startSec = 0) {
        // Recreate-friendly: nocookie supports loadVideoById via API; fallback to src swap
        if (this.player && this.ready && appState.getPlaybackSource() === 'nocookie') {
            try {
                this.player.loadVideoById({ videoId, startSeconds: startSec || 0 });
                return true;
            } catch (e) { /* fall through to iframe src */ }
        }
        return false;
    }

    static getTime() {
        try { return (this.player && this.ready) ? this.player.getCurrentTime() : 0; } catch (e) { return 0; }
    }
    static getDuration() {
        try { return (this.player && this.ready) ? this.player.getDuration() : 0; } catch (e) { return 0; }
    }
    static play() { try { this.player && this.player.playVideo(); } catch (e) {} }
    static pause() { try { this.player && this.player.pauseVideo(); } catch (e) {} }
    static toggle() {
        try {
            if (!this.player || !this.ready) return false;
            const s = this.player.getPlayerState();
            const PLAYING = (window.YT.PlayerState && window.YT.PlayerState.PLAYING) || 1;
            if (s === PLAYING) this.player.pauseVideo(); else this.player.playVideo();
            return true;
        } catch (e) { return false; }
    }
    static seekBy(delta) {
        try {
            if (!this.player || !this.ready) return false;
            this.player.seekTo(Math.max(0, this.getTime() + delta), true);
            return true;
        } catch (e) { return false; }
    }
    static setRate(r) { try { this.player && this.ready && this.player.setPlaybackRate(r); } catch (e) {} }

    static startProgressLoop() {
        if (this.progressTimer) return;
        this.progressTimer = setInterval(() => {
            const vid = appState.getVideoId();
            const t = this.getTime();
            const d = this.getDuration();
            if (t > 0) appState.setResume(vid, t);
            if (DOM.playProgress) {
                DOM.playProgress.textContent = d > 0 ? `${YouTubeUtils.formatSeconds(t)} / ${YouTubeUtils.formatSeconds(d)}` : (t > 0 ? YouTubeUtils.formatSeconds(t) : '');
            }
        }, 1000);
    }
}

// ============================================================================
// Queue + Search + Playback extras + Health + PWA
// ============================================================================
class QueueController {
    static init() {
        if (DOM.autoplayToggle) {
            DOM.autoplayToggle.checked = appState.autoplay;
            DOM.autoplayToggle.addEventListener('change', (e) => {
                appState.setAutoplay(e.target.checked);
                MessageSystem.show(`Autoplay ${e.target.checked ? 'on' : 'off'}`, 'success');
            });
        }
        if (DOM.loopMode) {
            DOM.loopMode.value = appState.loopMode;
            DOM.loopMode.addEventListener('change', (e) => appState.setLoopMode(e.target.value));
        }
        if (DOM.shuffleQueue) DOM.shuffleQueue.addEventListener('click', () => {
            appState.shuffleQueue(); this.render();
            MessageSystem.show('Queue shuffled', 'success');
        });
        if (DOM.clearQueue) DOM.clearQueue.addEventListener('click', () => {
            appState.clearQueue(); this.render();
            MessageSystem.show('Queue cleared', 'success');
        });
        this.render();
    }

    static add(video) {
        const ok = appState.enqueue(video);
        this.render();
        MessageSystem.show(ok ? 'Added to queue' : 'Already in queue', ok ? 'success' : 'error');
    }

    static render() {
        if (DOM.queueCount) DOM.queueCount.textContent = appState.queue.length;
        if (!DOM.queueList) return;
        if (appState.queue.length === 0) {
            DOM.queueList.innerHTML = `<div class="empty-state">Queue is empty — hover a video and press + to add</div>`;
            return;
        }
        const cur = appState.getVideoId();
        DOM.queueList.innerHTML = appState.queue.map((v, i) => `
            <div class="library-card queue-card ${v.id === cur ? 'now-playing' : ''}" data-video-id="${v.id}">
                <span class="queue-card__pos">${i + 1}</span>
                <div class="library-card__thumbnail"><img src="${v.thumbnailUrl}" alt="" loading="lazy"></div>
                <div class="library-card__content">
                    <h4 class="library-card__title" title="${String(v.title || '').replace(/"/g, '&quot;')}">${v.title || v.id}</h4>
                    <p class="library-card__channel">${v.channelTitle || ''}</p>
                </div>
                <div class="queue-card__move">
                    <button data-act="up" data-video-id="${v.id}" title="Move up"><span class="material-symbols-rounded">expand_less</span></button>
                    <button data-act="down" data-video-id="${v.id}" title="Move down"><span class="material-symbols-rounded">expand_more</span></button>
                </div>
                <button class="library-card__delete material-symbols-rounded" data-video-id="${v.id}" title="Remove">close</button>
            </div>`).join('');
        DOM.queueList.querySelectorAll('.queue-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                VideoPlayerController.loadVideoById(card.dataset.videoId);
            });
        });
        DOM.queueList.querySelectorAll('.library-card__delete').forEach(b => b.addEventListener('click', (e) => {
            e.stopPropagation();
            appState.dequeue(b.dataset.videoId); this.render();
        }));
        DOM.queueList.querySelectorAll('.queue-card__move button').forEach(b => b.addEventListener('click', (e) => {
            e.stopPropagation();
            appState.moveInQueue(b.dataset.videoId, b.dataset.act === 'up' ? -1 : 1); this.render();
        }));
    }

    static next(manual = false) {
        const q = appState.queue;
        const cur = appState.getVideoId();
        if (q.length === 0) {
            // Loop-one on single video
            if (appState.loopMode === 'one') VideoPlayerController.loadVideoById(cur);
            else if (manual) MessageSystem.show('Queue is empty', 'error');
            return;
        }
        let idx = q.findIndex(v => v.id === cur);
        if (idx === -1) {
            VideoPlayerController.loadVideoById(q[0].id);
            return;
        }
        if (appState.loopMode === 'one' && !manual) {
            VideoPlayerController.loadVideoById(cur);
            return;
        }
        let nxt = idx + 1;
        if (nxt >= q.length) {
            if (appState.loopMode === 'all' || manual) nxt = 0;
            else { MessageSystem.show('End of queue', 'success'); return; }
        }
        VideoPlayerController.loadVideoById(q[nxt].id);
    }

    static prev() {
        const q = appState.queue;
        const cur = appState.getVideoId();
        const idx = q.findIndex(v => v.id === cur);
        if (idx > 0) VideoPlayerController.loadVideoById(q[idx - 1].id);
        else if (q.length) VideoPlayerController.loadVideoById(q[0].id);
    }

    static handleEnded() {
        if (!appState.autoplay && appState.loopMode === 'off') return;
        if (appState.loopMode === 'one') { VideoPlayerController.loadVideoById(appState.getVideoId()); return; }
        if (appState.queue.length === 0) {
            if (appState.loopMode === 'all') VideoPlayerController.loadVideoById(appState.getVideoId());
            return;
        }
        this.next(false);
    }
}

class SearchController {
    static async run(query) {
        const q = (query || '').trim();
        if (!q) { MessageSystem.show('Type keywords to search', 'error'); return; }
        TabController.switchTab('search');
        if (!DOM.searchResultsContainer) return;
        if (!appState.hasValidApiKey()) {
            DOM.searchResultsContainer.innerHTML = `<div class="empty-state"><span class="material-symbols-rounded">key</span><br>Set YouTube API key in Settings to search</div>`;
            TabController.switchTab('settings');
            MessageSystem.show('API key required for search', 'error');
            return;
        }
        DOM.searchResultsContainer.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Searching...</p></div>`;
        try {
            const items = await YouTubeUtils.searchVideos(q);
            const ids = items.map(i => i.id && i.id.videoId).filter(Boolean);
            const details = ids.length ? await YouTubeUtils.fetchVideoDetails(ids) : [];
            const byId = new Map(details.map(d => [d.id, d]));
            const videos = items.map(i => {
                const id = i.id.videoId;
                const d = byId.get(id);
                return {
                    id,
                    title: i.snippet.title,
                    channelTitle: i.snippet.channelTitle,
                    thumbnailUrl: (i.snippet.thumbnails && (i.snippet.thumbnails.medium || i.snippet.thumbnails.default) || {}).url || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
                    statistics: d ? d.statistics : null,
                    contentDetails: d ? d.contentDetails : null
                };
            });
            if (DOM.searchCount) DOM.searchCount.textContent = videos.length;
            if (!videos.length) {
                DOM.searchResultsContainer.innerHTML = `<div class="empty-state">No results for "${q}"</div>`;
                return;
            }
            DOM.searchResultsContainer.innerHTML = videos.map(v => `
                <div class="suggested-video-card" data-video-id="${v.id}">
                    <div class="suggested-video-card__thumbnail"><img src="${v.thumbnailUrl}" alt="" loading="lazy"></div>
                    <div class="suggested-video-card__content">
                        <h4 class="suggested-video-card__title" title="${String(v.title).replace(/"/g, '&quot;')}">${v.title}</h4>
                        <p class="suggested-video-card__channel">${v.channelTitle}</p>
                    </div>
                    <button class="card-add-btn material-symbols-rounded" data-video-id="${v.id}" title="Add to queue">add</button>
                </div>`).join('');
            DOM.searchResultsContainer.querySelectorAll('.suggested-video-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.card-add-btn')) return;
                    VideoPlayerController.loadVideoById(card.dataset.videoId);
                });
            });
            DOM.searchResultsContainer.querySelectorAll('.card-add-btn').forEach(b => b.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = b.closest('.suggested-video-card');
                const title = card.querySelector('.suggested-video-card__title').textContent;
                const ch = card.querySelector('.suggested-video-card__channel').textContent;
                const img = card.querySelector('img').src;
                QueueController.add({ id: b.dataset.videoId, title, channelTitle: ch, thumbnailUrl: img });
            }));
        } catch (e) {
            console.error('Search failed:', e);
            DOM.searchResultsContainer.innerHTML = `<div class="empty-state">Search failed (${e.message})</div>`;
        }
    }
}

class PlaybackExtras {
    static sleepTimerId = null;

    static init() {
        // Shortcuts
        document.addEventListener('keydown', (e) => {
            const tag = (document.activeElement && document.activeElement.tagName) || '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.code === 'Space' || e.key === 'k' || e.key === 'K') {
                if (YTPlayerAPI.toggle()) { e.preventDefault(); }
            } else if (e.key === 'ArrowRight') { if (YTPlayerAPI.seekBy(5)) e.preventDefault(); }
            else if (e.key === 'ArrowLeft') { if (YTPlayerAPI.seekBy(-5)) e.preventDefault(); }
            else if (e.key === 'j' || e.key === 'J') { YTPlayerAPI.seekBy(-10); }
            else if (e.key === 'l' || e.key === 'L') { YTPlayerAPI.seekBy(10); }
            else if (e.key === 'f' || e.key === 'F') { this.toggleFullscreen(); }
            else if (e.shiftKey && (e.key === 'N' || e.key === 'n')) { QueueController.next(true); }
            else if (e.shiftKey && (e.key === 'P' || e.key === 'p')) { QueueController.prev(); }
        });

        if (DOM.prevBtn) DOM.prevBtn.addEventListener('click', () => QueueController.prev());
        if (DOM.nextBtn) DOM.nextBtn.addEventListener('click', () => QueueController.next(true));
        if (DOM.pipBtn) DOM.pipBtn.addEventListener('click', () => this.tryPiP());
        if (DOM.speedSelect) {
            DOM.speedSelect.value = String(appState.speed || 1);
            DOM.speedSelect.addEventListener('change', (e) => {
                const r = parseFloat(e.target.value) || 1;
                appState.setSpeed(r);
                YTPlayerAPI.setRate(r);
                MessageSystem.show(`Speed ${r}x`, 'success');
            });
        }
        if (DOM.sleepSelect) DOM.sleepSelect.addEventListener('change', (e) => this.setSleep(parseInt(e.target.value, 10) || 0));
    }

    static toggleFullscreen() {
        const el = document.querySelector('.player-container');
        if (!el) return;
        try {
            if (document.fullscreenElement) document.exitFullscreen();
            else el.requestFullscreen && el.requestFullscreen();
        } catch (e) {}
    }

    static async tryPiP() {
        // True PiP needs a <video>; cross-origin iframe can't provide one.
        try {
            const videos = Array.from(document.querySelectorAll('video'));
            for (const v of videos) {
                if (document.pictureInPictureEnabled && !v.disablePictureInPicture) {
                    await v.requestPictureInPicture();
                    return;
                }
            }
        } catch (e) { console.warn('PiP failed:', e); }
        MessageSystem.show('Picture-in-Picture unavailable for this source', 'error');
    }

    static setSleep(minutes) {
        if (this.sleepTimerId) { clearTimeout(this.sleepTimerId); this.sleepTimerId = null; }
        if (!minutes) { MessageSystem.show('Sleep timer off', 'success'); return; }
        MessageSystem.show(`Sleep in ${minutes} min — playback will pause`, 'success');
        this.sleepTimerId = setTimeout(() => {
            YTPlayerAPI.pause();
            try { if (DOM.videoPlayer) DOM.videoPlayer.src = 'about:blank'; } catch (e) {}
            MessageSystem.show('Sleep timer: paused', 'success');
            if (DOM.sleepSelect) DOM.sleepSelect.value = '0';
        }, minutes * 60 * 1000);
    }
}

class SourceHealth {
    static init() {
        this.fillSelect(DOM.invidiousInstance, CONFIG.INVIDIOUS_INSTANCES, appState.invidiousInstance);
        this.fillSelect(DOM.pipedInstance, CONFIG.PIPED_INSTANCES, appState.pipedInstance);
        if (DOM.invidiousInstance) DOM.invidiousInstance.addEventListener('change', (e) => {
            appState.invidiousInstance = e.target.value;
            appState.setInstance('youtube_invidious_instance', e.target.value);
            VideoPlayerController.updateIframeSource(appState.getVideoId());
        });
        if (DOM.pipedInstance) DOM.pipedInstance.addEventListener('change', (e) => {
            appState.pipedInstance = e.target.value;
            appState.setInstance('youtube_piped_instance', e.target.value);
            VideoPlayerController.updateIframeSource(appState.getVideoId());
        });
        if (DOM.checkHealthBtn) DOM.checkHealthBtn.addEventListener('click', () => this.checkAll(true));
        setTimeout(() => this.checkAll(false), 3000);
    }

    static fillSelect(sel, list, current) {
        if (!sel) return;
        sel.innerHTML = list.map(u => `<option value="${u}" ${u === current ? 'selected' : ''}>${u.replace('https://', '')}</option>`).join('');
    }

    static setDot(el, ok) {
        if (!el) return;
        el.classList.remove('ok', 'bad');
        el.classList.add(ok ? 'ok' : 'bad');
    }

    static async checkAll(manual) {
        const inv = CONFIG.INVIDIOUS_INSTANCES;
        const pip = CONFIG.PIPED_INSTANCES;
        const [invRes, pipRes] = await Promise.all([
            Promise.all(inv.map(async (u) => ({ url: u, ok: await YouTubeUtils.checkInstance(u, 'invidious') }))),
            Promise.all(pip.map(async (u) => ({ url: u, ok: await YouTubeUtils.checkInstance(u, 'piped') })))
        ]);
        const bestInv = invRes.find(r => r.ok);
        const bestPip = pipRes.find(r => r.ok);
        this.setDot(DOM.invidiousStatus, !!bestInv);
        this.setDot(DOM.pipedStatus, !!bestPip);
        if (bestInv && bestInv.url !== appState.invidiousInstance) {
            appState.invidiousInstance = bestInv.url;
            appState.setInstance('youtube_invidious_instance', bestInv.url);
            this.fillSelect(DOM.invidiousInstance, inv, bestInv.url);
        }
        if (bestPip && bestPip.url !== appState.pipedInstance) {
            appState.pipedInstance = bestPip.url;
            appState.setInstance('youtube_piped_instance', bestPip.url);
            this.fillSelect(DOM.pipedInstance, pip, bestPip.url);
        }
        if (manual) MessageSystem.show(`Health: Invidious ${bestInv ? 'OK' : 'down'} · Piped ${bestPip ? 'OK' : 'down'}`, 'success');
    }
}

class PWAController {
    static init() {
        if ('serviceWorker' in navigator && /^https?:/.test(window.location.protocol)) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW failed:', e));
            });
        }
    }
}

// ============================================================================
// Controllers
// ============================================================================

class TabController {
    static init() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    static switchTab(tabId) {
        // Toggle tab header buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Toggle panel contents
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `tab-${tabId}`);
        });
    }
}

class LibraryController {
    static init() {
        this.renderFavorites();
        this.renderHistory();

        if (DOM.clearHistory) {
            DOM.clearHistory.addEventListener('click', () => {
                appState.clearHistory();
                this.renderHistory();
                MessageSystem.show('Playback history cleared', 'success');
            });
        }

        if (DOM.libraryFilter) {
            DOM.libraryFilter.addEventListener('input', () => {
                this.renderFavorites();
                this.renderHistory();
            });
        }

        if (DOM.exportLibraryBtn) {
            DOM.exportLibraryBtn.addEventListener('click', () => this.exportAll());
        }
        if (DOM.importLibraryBtn && DOM.importLibraryFile) {
            DOM.importLibraryBtn.addEventListener('click', () => DOM.importLibraryFile.click());
            DOM.importLibraryFile.addEventListener('change', (e) => this.importAll(e.target.files[0]));
        }
    }

    static filterText() {
        return (DOM.libraryFilter && DOM.libraryFilter.value || '').trim().toLowerCase();
    }

    static matches(video) {
        const f = this.filterText();
        if (!f) return true;
        return `${video.title || ''} ${video.channelTitle || ''}`.toLowerCase().includes(f);
    }

    static exportAll() {
        const data = {
            app: 'yt-premium-lite',
            version: 1,
            exportedAt: new Date().toISOString(),
            favorites: appState.favorites,
            history: appState.history,
            queue: appState.queue,
            settings: { autoplay: appState.autoplay, loopMode: appState.loopMode, speed: appState.speed, source: appState.playbackSource }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'yt-library-backup.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        MessageSystem.show('Library exported', 'success');
    }

    static importAll(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (Array.isArray(data.favorites)) { appState.favorites = data.favorites; appState.saveFavorites(); }
                if (Array.isArray(data.history)) { appState.history = data.history.slice(0, 20); appState.saveHistory(); }
                if (Array.isArray(data.queue)) { appState.queue = data.queue; appState.saveQueue(); }
                this.renderFavorites();
                this.renderHistory();
                QueueController.render();
                MessageSystem.show('Library imported', 'success');
            } catch (e) {
                MessageSystem.show('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    }

    static renderFavorites() {
        if (!DOM.favoritesList) return;
        const favorites = appState.favorites.filter(v => this.matches(v));

        if (DOM.favoritesCount) {
            DOM.favoritesCount.textContent = appState.favorites.length;
        }

        if (favorites.length === 0) {
            DOM.favoritesList.innerHTML = `<div class="empty-state">No favorite videos yet</div>`;
            return;
        }

        const html = favorites.map(video => `
            <div class="library-card" data-video-id="${video.id}">
                <div class="library-card__thumbnail">
                    <img src="${video.thumbnailUrl}" alt="${video.title}" loading="lazy">
                </div>
                <div class="library-card__content">
                    <h4 class="library-card__title" title="${video.title}">${video.title}</h4>
                    <p class="library-card__channel">${video.channelTitle}</p>
                </div>
                <button class="card-add-btn material-symbols-rounded" data-video-id="${video.id}" title="Add to queue">add</button>
                <button class="library-card__delete material-symbols-rounded" data-video-id="${video.id}" title="Remove from favorites">close</button>
            </div>
        `).join('');

        DOM.favoritesList.innerHTML = html;
        this.bindLibraryEvents(DOM.favoritesList);
    }

    static renderHistory() {
        if (!DOM.historyList) return;
        const history = appState.history.filter(v => this.matches(v));

        if (history.length === 0) {
            DOM.historyList.innerHTML = `<div class="empty-state">No history recorded</div>`;
            return;
        }

        const html = history.map(video => `
            <div class="library-card" data-video-id="${video.id}">
                <div class="library-card__thumbnail">
                    <img src="${video.thumbnailUrl}" alt="${video.title}" loading="lazy">
                </div>
                <div class="library-card__content">
                    <h4 class="library-card__title" title="${video.title}">${video.title}</h4>
                    <p class="library-card__channel">${video.channelTitle}</p>
                </div>
                <button class="card-add-btn material-symbols-rounded" data-video-id="${video.id}" title="Add to queue">add</button>
            </div>
        `).join('');

        DOM.historyList.innerHTML = html;
        this.bindLibraryEvents(DOM.historyList);
    }

    static bindLibraryEvents(container) {
        // Handle playlist select cards click
        container.querySelectorAll('.library-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Ignore if clicked directly on deletion cross
                if (e.target.closest('.library-card__delete') || e.target.closest('.card-add-btn')) return;
                
                const videoId = card.dataset.videoId;
                if (videoId) {
                    VideoPlayerController.loadVideoById(videoId);
                }
            });
        });

        container.querySelectorAll('.card-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const found = [...appState.favorites, ...appState.history].find(v => v.id === btn.dataset.videoId);
                if (found) QueueController.add(found);
            });
        });

        // Handle deletions
        container.querySelectorAll('.library-card__delete').forEach(delBtn => {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const videoId = delBtn.dataset.videoId;
                const foundItem = appState.favorites.find(v => v.id === videoId);
                if (foundItem) {
                    appState.toggleFavorite(foundItem);
                    this.renderFavorites();
                    VideoPlayerController.updateFavoriteButtonState();
                    MessageSystem.show('Removed from Favorites', 'success');
                }
            });
        });
    }
}

class ApiKeyController {
    static init() {
        this.loadSavedApiKey();
        this.updateStatus();
        this.bindEvents();
    }

    static loadSavedApiKey() {
        const savedApiKey = appState.loadApiKey();
        if (savedApiKey && DOM.apiKeyInput) {
            DOM.apiKeyInput.value = savedApiKey;
        }
    }

    static updateStatus() {
        if (!DOM.apiKeyStatus) return;

        const hasValidKey = appState.hasValidApiKey();
        const statusElement = DOM.apiKeyStatus;
        const iconElement = statusElement.querySelector('.status-icon');
        const textElement = statusElement.querySelector('.status-text');

        if (hasValidKey) {
            statusElement.className = 'api-key-status api-key-status--success';
            if (iconElement) iconElement.textContent = 'check_circle';
            if (textElement) textElement.textContent = 'API key configured successfully';
        } else {
            statusElement.className = 'api-key-status api-key-status--error';
            if (iconElement) iconElement.textContent = 'warning';
            if (textElement) textElement.textContent = 'API key not configured';
        }
    }

    static saveApiKey() {
        const apiKey = DOM.apiKeyInput?.value?.trim();
        
        if (!apiKey) {
            MessageSystem.show('Please enter a YouTube API key', 'error');
            return;
        }

        if (apiKey.length < 15) {
            MessageSystem.show('API Key looks invalid (too short)', 'error');
            return;
        }

        appState.setApiKey(apiKey);
        this.updateStatus();
        MessageSystem.show('API Key configured successfully!', 'success');

        // Refresh suggestions
        SuggestedVideosController.refreshSuggestions();
    }

    static toggleVisibility() {
        if (!DOM.apiKeyInput || !DOM.toggleApiKeyBtn) return;
        const isMasked = DOM.apiKeyInput.type === 'password';
        DOM.apiKeyInput.type = isMasked ? 'text' : 'password';
        DOM.toggleApiKeyBtn.textContent = isMasked ? 'visibility_off' : 'visibility';
    }

    static bindEvents() {
        if (DOM.saveApiKeyBtn) {
            DOM.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        }
        if (DOM.toggleApiKeyBtn) {
            DOM.toggleApiKeyBtn.addEventListener('click', () => this.toggleVisibility());
        }
        if (DOM.apiKeyInput) {
            DOM.apiKeyInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.saveApiKey();
            });
        }
    }
}

class SuggestedVideosController {
    static async loadSuggestedVideos(videoId, title) {
        try {
            this.showLoading();

            if (!appState.hasValidApiKey()) {
                console.log('No configured API Key. Loading fallback curation suggestions.');
                this.displayFallbackSuggestions();
                return;
            }

            const searchResults = await YouTubeUtils.fetchSuggestedVideos(videoId, title);
            if (searchResults.length === 0) {
                this.displayFallbackSuggestions();
                return;
            }

            const videoIds = searchResults.map(item => item.id.videoId).filter(Boolean);
            if (videoIds.length === 0) {
                this.displayFallbackSuggestions();
                return;
            }

            const detailedItems = await YouTubeUtils.fetchVideoDetails(videoIds);
            if (detailedItems.length === 0) {
                this.displayFallbackSuggestions();
                return;
            }

            this.displaySuggestedVideos(detailedItems);
        } catch (error) {
            console.error('Failed to resolve suggestions:', error);
            this.displayFallbackSuggestions();
        }
    }

    static displaySuggestedVideos(videos) {
        if (!DOM.suggestedVideosContainer) return;
        
        const html = videos.map(video => {
            const { snippet, statistics, contentDetails } = video;
            const thumbnail = snippet.thumbnails.medium || snippet.thumbnails.default;
            const viewCount = statistics?.viewCount ? YouTubeUtils.formatViewCount(statistics.viewCount) : '';
            const duration = contentDetails?.duration ? YouTubeUtils.formatDuration(contentDetails.duration) : '';

            return `
                <div class="suggested-video-card" data-video-id="${video.id}">
                    <div class="suggested-video-card__thumbnail">
                        <img src="${thumbnail.url}" alt="${snippet.title}" loading="lazy">
                    </div>
                    <div class="suggested-video-card__content">
                        <h4 class="suggested-video-card__title" title="${snippet.title}">${snippet.title}</h4>
                        <p class="suggested-video-card__channel">${snippet.channelTitle}</p>
                        <div class="suggested-video-card__meta">
                            ${viewCount ? `<span class="suggested-video-card__views">${viewCount} views</span>` : ''}
                            ${duration ? `<span class="suggested-video-card__duration">${duration}</span>` : ''}
                        </div>
                    </div>
                    <button class="card-add-btn material-symbols-rounded" data-video-id="${video.id}" title="Add to queue">add</button>
                </div>
            `;
        }).join('');

        DOM.suggestedVideosContainer.innerHTML = html;
        this.bindVideoCardEvents();
    }

    static displayFallbackSuggestions() {
        if (!DOM.suggestedVideosContainer) return;

        const html = FALLBACK_VIDEOS.map(video => {
            const { snippet, statistics, contentDetails } = video;
            const thumbnail = snippet.thumbnails.medium;
            const viewCount = YouTubeUtils.formatViewCount(statistics.viewCount);
            const duration = YouTubeUtils.formatDuration(contentDetails.duration);

            return `
                <div class="suggested-video-card" data-video-id="${video.id}">
                    <div class="suggested-video-card__thumbnail">
                        <img src="${thumbnail.url}" alt="${snippet.title}" loading="lazy">
                    </div>
                    <div class="suggested-video-card__content">
                        <h4 class="suggested-video-card__title" title="${snippet.title}">${snippet.title}</h4>
                        <p class="suggested-video-card__channel">${snippet.channelTitle}</p>
                        <div class="suggested-video-card__meta">
                            <span class="suggested-video-card__views">${viewCount} views</span>
                            <span class="suggested-video-card__duration">${duration}</span>
                        </div>
                    </div>
                    <button class="card-add-btn material-symbols-rounded" data-video-id="${video.id}" title="Add to queue">add</button>
                </div>
            `;
        }).join('');

        DOM.suggestedVideosContainer.innerHTML = html;
        this.bindVideoCardEvents();
    }

    static bindVideoCardEvents() {
        const cards = DOM.suggestedVideosContainer.querySelectorAll('.suggested-video-card');
        cards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.card-add-btn')) return;
                const videoId = card.dataset.videoId;
                if (videoId) {
                    VideoPlayerController.loadVideoById(videoId);
                }
            });
        });
        DOM.suggestedVideosContainer.querySelectorAll('.card-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const card = btn.closest('.suggested-video-card');
                const titleEl = card.querySelector('.suggested-video-card__title');
                const chEl = card.querySelector('.suggested-video-card__channel');
                const imgEl = card.querySelector('img');
                QueueController.add({
                    id: btn.dataset.videoId,
                    title: titleEl ? titleEl.textContent : btn.dataset.videoId,
                    channelTitle: chEl ? chEl.textContent : '',
                    thumbnailUrl: imgEl ? imgEl.src : `https://i.ytimg.com/vi/${btn.dataset.videoId}/mqdefault.jpg`
                });
            });
        });
    }

    static showLoading() {
        if (!DOM.suggestedVideosContainer) return;
        DOM.suggestedVideosContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading suggestions...</p>
            </div>
        `;
    }

    static refreshSuggestions() {
        const videoId = appState.getVideoId();
        const title = DOM.activeVideoTitle ? DOM.activeVideoTitle.textContent : '';
        this.loadSuggestedVideos(videoId, title);
    }
}

class MessageSystem {
    static show(text, type = 'success') {
        if (!DOM.messageContainer) return;

        const message = document.createElement('div');
        message.className = `message message--${type}`;
        message.textContent = text;
        
        DOM.messageContainer.appendChild(message);

        // Slide message in
        setTimeout(() => {
            message.classList.add('message--show');
        }, CONFIG.MESSAGE_ANIMATION_DELAY);

        // Slide message out and destroy
        setTimeout(() => {
            message.classList.remove('message--show');
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, CONFIG.MESSAGE_REMOVE_DELAY);
        }, CONFIG.MESSAGE_DISPLAY_TIME);
    }
}

class VideoPlayerController {
    static activeVideoObj = null;

    /**
     * Entry loader from search input field
     */
    static async loadVideo(youtubeUrl) {
        try {
            const trimmed = youtubeUrl.trim();
            if (!trimmed) {
                MessageSystem.show(MESSAGES.EMPTY_INPUT, 'error');
                return false;
            }

            const videoId = YouTubeUtils.extractVideoId(trimmed);
            if (!videoId) {
                // Not a link/ID -> treat as search keywords
                await SearchController.run(trimmed);
                return true;
            }

            await this.loadVideoById(videoId);
            this.clearInput();
            return true;
        } catch (e) {
            console.error('Error loading video:', e);
            MessageSystem.show('Error loading video', 'error');
            return false;
        }
    }

    /**
     * Absolute loader, fetches metadata and sets frame
     */
    static async loadVideoById(videoId, opts = {}) {
        try {
            appState.setVideoId(videoId);

            // Resume from saved position (skip if explicitly fresh or from queue-next at 0)
            const resumeSec = opts.fresh ? 0 : appState.getResume(videoId);
            
            // Set frame src (or YT API load)
            const usedApi = YTPlayerAPI.loadVideo(videoId, resumeSec);
            if (!usedApi) this.updateIframeSource(videoId, resumeSec);
            else YTPlayerAPI.pendingSeek = 0;
            if (resumeSec > 5) MessageSystem.show(`Resumed at ${YouTubeUtils.formatSeconds(resumeSec)}`, 'success');
            
            // Fetch metadata
            if (DOM.activeVideoTitle) DOM.activeVideoTitle.textContent = 'Loading video title...';
            if (DOM.activeVideoChannel) DOM.activeVideoChannel.textContent = '';
            if (DOM.playProgress) DOM.playProgress.textContent = '';
            
            const details = await YouTubeUtils.fetchVideoDetailsOEmbed(videoId);
            this.activeVideoObj = details;
            
            // Display title & author
            if (DOM.activeVideoTitle) DOM.activeVideoTitle.textContent = details.title;
            if (DOM.activeVideoChannel) DOM.activeVideoChannel.textContent = details.channelTitle;

            // Add to recently played list
            appState.addHistory({
                id: videoId,
                title: details.title,
                channelTitle: details.channelTitle,
                thumbnailUrl: details.thumbnailUrl
            });
            LibraryController.renderHistory();

            // Refresh Favorite Button icon states
            this.updateFavoriteButtonState();
            QueueController.render();

            // Fire suggestions loads
            await SuggestedVideosController.loadSuggestedVideos(videoId, details.title);

            // Change ambiance lighting glow (thumbnail-driven, extension-like)
            AmbientController.setFromVideo(videoId, details.thumbnailUrl);

        } catch (error) {
            console.error('Playback setup failed:', error);
        }
    }

    static updateIframeSource(videoId, startSec = 0) {
        if (!DOM.videoPlayer) return;
        const source = appState.getPlaybackSource();
        const embedUrl = YouTubeUtils.buildEmbedUrl(videoId, source, startSec);
        if (!embedUrl) {
            console.warn('Refusing to set invalid embed URL for videoId:', videoId);
            MessageSystem.show(MESSAGES.INVALID_LINK, 'error');
            return;
        }
        DOM.videoPlayer.src = embedUrl;
        // (Re)attach YT API when using nocookie so ended/speed/progress work
        setTimeout(() => YTPlayerAPI.createPlayer(), 800);
    }

    static updateFavoriteButtonState() {
        if (!DOM.favoriteToggle) return;
        
        const videoId = appState.getVideoId();
        const isFav = appState.isFavorite(videoId);
        const text = DOM.favoriteToggle.querySelector('.action-btn__text');

        if (isFav) {
            DOM.favoriteToggle.classList.add('active');
            if (text) text.textContent = 'Favorited';
        } else {
            DOM.favoriteToggle.classList.remove('active');
            if (text) text.textContent = 'Favorite';
        }
    }

    static toggleActiveFavorite() {
        if (!this.activeVideoObj) return;

        const isFavNow = appState.toggleFavorite({
            id: appState.getVideoId(),
            title: this.activeVideoObj.title,
            channelTitle: this.activeVideoObj.channelTitle,
            thumbnailUrl: this.activeVideoObj.thumbnailUrl
        });

        this.updateFavoriteButtonState();
        LibraryController.renderFavorites();

        if (isFavNow) {
            MessageSystem.show('Added to Favorites', 'success');
        } else {
            MessageSystem.show('Removed from Favorites', 'success');
        }
    }

    static copyEmbedLink() {
        const videoId = appState.getVideoId();
        const source = appState.getPlaybackSource();
        const embedUrl = YouTubeUtils.buildEmbedUrl(videoId, source);
        if (!embedUrl) {
            MessageSystem.show(MESSAGES.INVALID_LINK, 'error');
            return;
        }

        navigator.clipboard.writeText(embedUrl).then(() => {
            MessageSystem.show('Embed link copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Clipboard copy failed:', err);
            MessageSystem.show('Failed to copy embed link', 'error');
        });
    }

    static setAmbientGlowColor(videoId, thumbnailUrl) {
        AmbientController.setFromVideo(videoId, thumbnailUrl);
    }

    static clearInput() {
        if (DOM.youtubeLinkInput) {
            DOM.youtubeLinkInput.value = '';
        }
    }
}

// ============================================================================
// Event Handlers & Event Listeners
// ============================================================================

class EventHandlers {
    static async handleLoadButtonClick() {
        const url = DOM.youtubeLinkInput?.value || '';
        await VideoPlayerController.loadVideo(url);
    }

    static async handleInputKeypress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            await this.handleLoadButtonClick();
        }
    }
}

class EventListeners {
    static init() {
        this.bindLoadButton();
        this.bindInputField();
        this.bindRefreshSuggestions();
        this.bindSourceSelector();
        this.bindShelfActions();
        this.bindSearch();
        this.bindQueueNav();
        this.bindShareExtras();
    }

    static bindLoadButton() {
        if (DOM.loadButton) {
            DOM.loadButton.addEventListener('click', EventHandlers.handleLoadButtonClick.bind(EventHandlers));
        }
    }

    static bindInputField() {
        if (DOM.youtubeLinkInput) {
            DOM.youtubeLinkInput.addEventListener('keypress', EventHandlers.handleInputKeypress.bind(EventHandlers));
        }
    }

    static bindRefreshSuggestions() {
        if (DOM.refreshSuggestionsBtn) {
            DOM.refreshSuggestionsBtn.addEventListener('click', () => {
                SuggestedVideosController.refreshSuggestions();
            });
        }
    }

    static bindSourceSelector() {
        if (DOM.playerSource) {
            DOM.playerSource.value = appState.getPlaybackSource();

            DOM.playerSource.addEventListener('change', (e) => {
                const selectedSource = e.target.value;
                appState.setPlaybackSource(selectedSource);
                
                // Reload current video with new source iframe compilation
                VideoPlayerController.updateIframeSource(appState.getVideoId());
                
                const labels = {
                    nocookie: 'YouTube No-Cookie',
                    invidious: 'Invidious Instance',
                    piped: 'Piped Proxy'
                };
                MessageSystem.show(`Switched player source to ${labels[selectedSource] || selectedSource}`, 'success');
            });
        }
    }

    static bindShelfActions() {
        if (DOM.favoriteToggle) {
            DOM.favoriteToggle.addEventListener('click', () => {
                VideoPlayerController.toggleActiveFavorite();
            });
        }
        if (DOM.shareEmbed) {
            DOM.shareEmbed.addEventListener('click', () => {
                VideoPlayerController.copyEmbedLink();
            });
        }
    }

    static bindSearch() {
        if (DOM.searchButton) {
            DOM.searchButton.addEventListener('click', () => {
                SearchController.run(DOM.youtubeLinkInput?.value || '');
            });
        }
    }

    static bindQueueNav() {
        // handled in PlaybackExtras (prev/next) — kept here for clarity
    }

    static bindShareExtras() {
        // Removed: timestamp / title / thumbnail buttons (not needed)
    }
}

// ============================================================================
// Main Application Loader
// ============================================================================

class LayoutSync {
    static init() {
        this.sync();
        window.addEventListener('resize', () => this.sync());
        // Re-sync khi main-content đổi chiều cao (player resize, shelf wrap)
        const main = document.querySelector('.main-content');
        if (main && 'ResizeObserver' in window) {
            new ResizeObserver(() => this.sync()).observe(main);
        }
        // Re-sync sau khi ảnh thumbnail load xong (làm lệch chiều cao)
        window.addEventListener('load', () => this.sync());
    }

    static sync() {
        const sidebar = document.querySelector('.sidebar');
        const main = document.querySelector('.main-content');
        if (!sidebar || !main) return;
        // Mobile: 1 cột, sidebar tự nhiên
        if (window.innerWidth <= 1024) {
            sidebar.style.maxHeight = '';
            return;
        }
        const h = main.offsetHeight;
        if (h > 0) sidebar.style.maxHeight = `${h}px`;
    }
}

class YouTubeBypassApp {
    static init() {
        try {
            console.log('Starting YouTube Bypass Player System...');
            this.validateDOM();
            
            // Start sub-controllers
            TabController.init();
            LibraryController.init();
            QueueController.init();
            EventListeners.init();
            ApiKeyController.init();
            PlaybackExtras.init();
            SourceHealth.init();
            PWAController.init();
            YTPlayerAPI.init();
            LayoutSync.init();
            
            // Read last played video on startup, otherwise load the default configuration ID
            const startupVideoId = appState.history.length > 0 ? appState.history[0].id : CONFIG.DEFAULT_VIDEO_ID;
            
            VideoPlayerController.loadVideoById(startupVideoId);
            console.log('App initialized successfully. Startup video ID:', startupVideoId);
        } catch (error) {
            console.error('Initialization error occurred:', error);
        }
    }

    static validateDOM() {
        const required = ['youtubeLinkInput', 'loadButton', 'videoPlayer', 'messageContainer'];
        const missing = required.filter(el => !DOM[el]);
        
        if (missing.length > 0) {
            throw new Error(`Missing DOM elements: ${missing.join(', ')}`);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    YouTubeBypassApp.init();
});