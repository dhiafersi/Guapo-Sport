// Elements
const els = {
    matchList: document.getElementById('match-list'),
    channelList: document.getElementById('channels-list'),
    webPlayer: document.getElementById('web-player'),
    placeholder: document.getElementById('placeholder-screen'),
    channelName: document.getElementById('current-channel-name'),
    streamTypeBadge: document.getElementById('stream-type-badge'),
    searchInput: document.getElementById('search-input'),
    dateDisplay: document.getElementById('date-display'),
    tabs: document.querySelectorAll('.y2k-tab'),
    fullscreenBtn: document.getElementById('fullscreen-btn')
};

// --- DATA: Premium Channels (Direct Albaplayer) ---
const PREMIUM_CHANNELS = [
    { id: 1, name: "beIN SPORTS 1", url: "https://a.kooraxx.com/albaplayer/bein-1/", logo: "https://vignette.wikia.nocookie.net/logopedia/images/9/94/BE_IN_SPORT_1_HD_2013.jpg" },
    { id: 2, name: "beIN SPORTS 2", url: "https://a.kooraxx.com/albaplayer/bein-2/", logo: "https://vignette.wikia.nocookie.net/logopedia/images/6/60/Beinsports2hd.jpg" },
    { id: 3, name: "beIN SPORTS 3", url: "https://a.kooraxx.com/albaplayer/bein-3/", logo: "https://vignette.wikia.nocookie.net/logopedia/images/5/59/BEIN-Sport-3-ID_o.jpg" },
    { id: 4, name: "beIN SPORTS 4", url: "https://a.kooraxx.com/albaplayer/bein-4/", logo: "https://vignette.wikia.nocookie.net/logopedia/images/c/c3/Bein_4.png" },
    { id: 5, name: "beIN SPORTS 5", url: "https://a.kooraxx.com/albaplayer/bein-5/", logo: "https://vignette.wikia.nocookie.net/logopedia/images/f/fd/Bein_5.png" },
    { id: 6, name: "beIN SPORTS 6", url: "https://a.kooraxx.com/albaplayer/bein-6/", logo: "https://vignette.wikia.nocookie.net/logopedia/images/3/3e/Bein6.png" },
    { id: 7, name: "beIN SPORTS 7", url: "https://a.kooraxx.com/albaplayer/bein-7/", logo: "https://vignette.wikia.nocookie.net/logopedia/images/f/f1/Bein_7.png" },
    { id: 8, name: "beIN SPORTS 8", url: "https://a.kooraxx.com/albaplayer/bein-8/", logo: "https://vignette.wikia.nocookie.net/logopedia/images/0/09/Bein_8.png" },
    { id: 9, name: "beIN SPORTS 9", url: "https://a.kooraxx.com/albaplayer/bein-9/", logo: "https://vignette.wikia.nocookie.net/logopedia/images/c/cd/Bein_sport_9.png" },
    { id: 10, name: "beIN SPORTS 10", url: "https://a.kooraxx.com/albaplayer/bein-10/", logo: "https://www.orbitiptvpro.com/logos/b10.png" }
];

// --- INITIALIZATION ---
function init() {
    console.log('GUAPO SPORT ULTRA INITIALIZED...');
    updateClock();
    setInterval(updateClock, 60000);

    renderChannels(PREMIUM_CHANNELS);
    fetchMatches();

    els.searchInput.oninput = handleSearch;
    els.fullscreenBtn.onclick = toggleFullscreen;

    els.tabs.forEach(tab => {
        tab.onclick = () => {
            els.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterChannels(tab.dataset.filter, els.searchInput.value);
        };
    });
}

function updateClock() {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    els.dateDisplay.textContent = `SYS_DATE: ${d}/${m}/${y}`;
}

// --- FETCHING MATCHES (LiveSoccerHD Engine) ---
async function fetchMatches() {
    els.matchList.innerHTML = '<div class="loading-state"><div class="cyber-spinner"></div><p>SYNCHRONIZING...</p></div>';

    // Using a reliable CORS proxy
    const PROXY = "https://api.allorigins.win/get?url=";
    const SOURCE = encodeURIComponent("https://www.livesoccerhd.info/");

    try {
        const response = await fetch(`${PROXY}${SOURCE}`);
        if (!response.ok) throw new Error('NETWORK_ERR');
        const data = await response.json();

        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, "text/html");

        // Accurate selectors based on user-provided HTML
        const matchElements = doc.querySelectorAll('.AY_Match');
        const matches = [];

        matchElements.forEach(el => {
            try {
                const team1 = el.querySelector('.TM1 .TM_Name')?.textContent?.trim() || "???";
                const team2 = el.querySelector('.TM2 .TM_Name')?.textContent?.trim() || "???";
                const time = el.querySelector('.MT_Time')?.textContent?.trim() || "--:--";
                const status = el.querySelector('.MT_Stat')?.textContent?.trim() || "";
                const matchLink = el.querySelector('a')?.href;

                // Detection logic for beIN Channels in info text
                const infoText = el.querySelector('.MT_Info')?.textContent || "";
                let channelId = null;
                const match = infoText.match(/beIN\s*SPORTS\s*(\d+)/i) || matchLink?.match(/bein-(\d+)/i);
                if (match) channelId = parseInt(match[1]);

                if (team1 !== "???" && team2 !== "???") {
                    matches.push({
                        time,
                        team1,
                        team2,
                        status,
                        url: matchLink,
                        id: channelId,
                        isLive: el.classList.contains('live') || status.includes('جارية')
                    });
                }
            } catch (innerErr) { console.warn("PARSE_MATCH_ITEM_ERR", innerErr); }
        });

        if (matches.length === 0) throw new Error('NO_MATCHES_SYNCED');
        renderMatches(matches);
    } catch (e) {
        console.error("SYNC_ERR:", e);
        els.matchList.innerHTML = '<div class="error-text neon-text">FETCH_FAILED: CONNECTION_LOST</div>';
    }
}

function renderMatches(matches) {
    els.matchList.innerHTML = '';
    matches.forEach(match => {
        const card = document.createElement('div');
        card.className = `match-card glass-panel ${match.isLive ? 'live-border' : ''}`;
        card.onclick = () => handleMatchClick(match);

        card.innerHTML = `
            <div class="match-time">${match.time}</div>
            <div class="match-teams">
                <span class="team">${match.team1}</span>
                <span class="vs">VS</span>
                <span class="team">${match.team2}</span>
            </div>
            ${match.isLive ? '<div class="live-indicator"><span class="pulse-dot"></span>LIVE</div>' : ''}
            <div class="match-status">${match.status || 'SYNCED'}</div>
        `;
        els.matchList.appendChild(card);
    });
}

async function handleMatchClick(match) {
    if (!match.url) return;

    // Show loading state in player
    els.placeholder.classList.add('hidden');
    els.webPlayer.classList.add('hidden');
    // Using channelName to show loading status
    els.channelName.textContent = `DECRYPTING_STREAM: ${match.team1.toUpperCase()}...`;

    try {
        const PROXY = "https://api.allorigins.win/get?url=";
        const response = await fetch(`${PROXY}${encodeURIComponent(match.url)}`);
        const data = await response.json();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, "text/html");

        // Extract Albaplayer iframe from the target page (e.g. sia-me.com)
        const iframe = doc.querySelector('iframe[src*="albaplayer"]');
        if (iframe && iframe.src) {
            playDirectUrl(iframe.src, `${match.team1} v ${match.team2}`);
            return;
        }

        // Fallback: If we can't extract, try to map to our premium list if it has beIN Id
        if (match.id) {
            const channel = PREMIUM_CHANNELS.find(c => c.id === match.id);
            if (channel) {
                playChannel(channel);
                return;
            }
        }

        // Last resort: Just play the link in iframe
        playDirectUrl(match.url, `${match.team1} v ${match.team2}`);
    } catch (e) {
        console.error("SEARCH_ERR", e);
        els.channelName.textContent = "EXTRACT_FAILED: TRY_CHANNELS_LIST";
    }
}

function playDirectUrl(url, title) {
    els.placeholder.classList.add('hidden');
    els.webPlayer.classList.remove('hidden');
    els.channelName.textContent = `FEED: ${title.toUpperCase()}`;
    els.webPlayer.src = url;
}

function renderChannels(channels) {
    els.channelList.innerHTML = '';
    channels.forEach(ch => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.innerHTML = `
            <img src="${ch.logo}" onerror="this.src='https://via.placeholder.com/50'">
            <div class="name">${ch.name}</div>
        `;
        card.onclick = () => {
            document.querySelectorAll('.channel-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            playChannel(ch);
        };
        els.channelList.appendChild(card);
    });
}

function playChannel(channel) {
    els.placeholder.classList.add('hidden');
    els.webPlayer.classList.remove('hidden');
    els.channelName.textContent = `FEED_ID: ${channel.name.toUpperCase()}`;
    els.webPlayer.src = channel.url;

    // Effect highlight
    els.channelName.classList.add('glitch');
    setTimeout(() => els.channelName.classList.remove('glitch'), 1000);
}

function handleSearch() {
    const query = els.searchInput.value.toLowerCase();
    const activeTab = document.querySelector('.y2k-tab.active').dataset.filter;
    filterChannels(activeTab, query);
}

function filterChannels(category, query) {
    let filtered = PREMIUM_CHANNELS;
    if (query) filtered = filtered.filter(ch => ch.name.toLowerCase().includes(query));

    if (category === 'premium') {
        filtered = filtered.filter(ch => [1, 2, 3].includes(ch.id));
    }
    renderChannels(filtered);
}

function toggleFullscreen() {
    if (els.webPlayer.requestFullscreen) {
        els.webPlayer.requestFullscreen();
    } else if (els.webPlayer.webkitRequestFullscreen) {
        els.webPlayer.webkitRequestFullscreen();
    } else if (els.webPlayer.msRequestFullscreen) {
        els.webPlayer.msRequestFullscreen();
    }
}

document.addEventListener('DOMContentLoaded', init);
