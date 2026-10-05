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
    YOUTUBE_EMBED_PARAMS: 'rel=0&playsinline=1&modestbranding=1&autoplay=1',
    SUGGESTED_VIDEOS_COUNT: 10,
    YOUTUBE_API_KEY: 'AIzaSyAXZ2ntfnxiUDPQJq_FjCUIy6wKbqcxuWQ', // Default API Key placeholder
    YOUTUBE_API_BASE_URL: 'https://www.googleapis.com/youtube/v3'
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
    favoriteToggle: document.getElementById('favoriteToggle'),
    shareEmbed: document.getElementById('shareEmbed'),
    favoritesList: document.getElementById('favoritesList'),
    historyList: document.getElementById('historyList'),
    favoritesCount: document.getElementById('favoritesCount'),
    clearHistory: document.getElementById('clearHistory'),
    ambientGlow: document.getElementById('ambientGlow'),
    pageAmbient: document.getElementById('pageAmbient')
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
    static buildEmbedUrl(videoId, source) {
        // Guard: YouTube IDs are always exactly 11 chars. Anything else
        // renders "Error 153 - Video player configuration error".
        if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId || '')) return null;

        if (source === 'invidious') {
            return `https://yewtu.be/embed/${videoId}?autoplay=1`;
        } else if (source === 'piped') {
            return `https://piped.video/embed/${videoId}`;
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
            return `${CONFIG.YOUTUBE_EMBED_BASE_URL}${videoId}?${CONFIG.YOUTUBE_EMBED_PARAMS}${originParam}`;
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
    }

    static renderFavorites() {
        if (!DOM.favoritesList) return;
        const favorites = appState.favorites;

        if (DOM.favoritesCount) {
            DOM.favoritesCount.textContent = favorites.length;
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
                <button class="library-card__delete" data-video-id="${video.id}" title="Remove from favorites">✕</button>
            </div>
        `).join('');

        DOM.favoritesList.innerHTML = html;
        this.bindLibraryEvents(DOM.favoritesList);
    }

    static renderHistory() {
        if (!DOM.historyList) return;
        const history = appState.history;

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
                if (e.target.classList.contains('library-card__delete')) return;
                
                const videoId = card.dataset.videoId;
                if (videoId) {
                    VideoPlayerController.loadVideoById(videoId);
                }
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
            if (iconElement) iconElement.textContent = '✅';
            if (textElement) textElement.textContent = 'API key configured successfully';
        } else {
            statusElement.className = 'api-key-status api-key-status--error';
            if (iconElement) iconElement.textContent = '⚠️';
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
        DOM.toggleApiKeyBtn.textContent = isMasked ? '🙈' : '👁️';
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
                </div>
            `;
        }).join('');

        DOM.suggestedVideosContainer.innerHTML = html;
        this.bindVideoCardEvents();
    }

    static bindVideoCardEvents() {
        const cards = DOM.suggestedVideosContainer.querySelectorAll('.suggested-video-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const videoId = card.dataset.videoId;
                if (videoId) {
                    VideoPlayerController.loadVideoById(videoId);
                }
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
                MessageSystem.show(MESSAGES.INVALID_LINK, 'error');
                return false;
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
    static async loadVideoById(videoId) {
        try {
            appState.setVideoId(videoId);
            
            // Set frame src
            this.updateIframeSource(videoId);
            
            // Fetch metadata
            if (DOM.activeVideoTitle) DOM.activeVideoTitle.textContent = 'Loading video title...';
            if (DOM.activeVideoChannel) DOM.activeVideoChannel.textContent = '';
            
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

            // Fire suggestions loads
            await SuggestedVideosController.loadSuggestedVideos(videoId, details.title);

            // Change ambiance lighting glow (thumbnail-driven, extension-like)
            AmbientController.setFromVideo(videoId, details.thumbnailUrl);

        } catch (error) {
            console.error('Playback setup failed:', error);
        }
    }

    static updateIframeSource(videoId) {
        if (!DOM.videoPlayer) return;
        const source = appState.getPlaybackSource();
        const embedUrl = YouTubeUtils.buildEmbedUrl(videoId, source);
        if (!embedUrl) {
            console.warn('Refusing to set invalid embed URL for videoId:', videoId);
            MessageSystem.show(MESSAGES.INVALID_LINK, 'error');
            return;
        }
        DOM.videoPlayer.src = embedUrl;
    }

    static updateFavoriteButtonState() {
        if (!DOM.favoriteToggle) return;
        
        const videoId = appState.getVideoId();
        const isFav = appState.isFavorite(videoId);
        const icon = DOM.favoriteToggle.querySelector('.action-btn__icon');
        const text = DOM.favoriteToggle.querySelector('.action-btn__text');

        if (isFav) {
            DOM.favoriteToggle.classList.add('active');
            if (icon) icon.textContent = '★';
            if (text) text.textContent = 'Favorited';
        } else {
            DOM.favoriteToggle.classList.remove('active');
            if (icon) icon.textContent = '☆';
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
}

// ============================================================================
// Main Application Loader
// ============================================================================

class YouTubeBypassApp {
    static init() {
        try {
            console.log('Starting YouTube Bypass Player System...');
            this.validateDOM();
            
            // Start sub-controllers
            TabController.init();
            LibraryController.init();
            EventListeners.init();
            ApiKeyController.init();
            
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