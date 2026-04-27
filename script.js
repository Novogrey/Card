let currentLang = "ru";
let languageRun = 0;
let typingTimers = [];

function scheduleTyping(fn, delay) {
    const timer = window.setTimeout(() => {
        typingTimers = typingTimers.filter((item) => item !== timer);
        fn();
    }, delay);
    typingTimers.push(timer);
}

function clearTypingTimers() {
    typingTimers.forEach((timer) => window.clearTimeout(timer));
    typingTimers = [];
}

function typeText(el, langKey, speed = 10, runId = languageRun) {
    const text = el.dataset[langKey] || "";
    el.textContent = "";
    let i = 0;

    function next() {
        if (runId !== languageRun) return;

        if (i < text.length) {
            el.textContent += text[i];
            i++;
            scheduleTyping(next, speed);
        }
    }

    next();
}

function typeContact(el, langKey, speed = 15, runId = languageRun) {
    const text = el.dataset[langKey] || "";
    const existingLink = el.querySelector("a");
    const linkData = existingLink
        ? {
            href: existingLink.href,
            target: existingLink.target || "_blank",
            rel: existingLink.rel || "noopener noreferrer"
        }
        : null;
    const marker = "#\u3014\uD83C\uDFAB\u3015tickets";

    el.textContent = "";

    if (!linkData || !text.includes(marker)) {
        typeText(el, langKey, speed, runId);
        return;
    }

    const markerIndex = text.indexOf(marker);
    const beforeLink = text.slice(0, markerIndex);
    const afterLink = text.slice(markerIndex + marker.length);
    let i = 0;
    let j = 0;

    function typeBefore() {
        if (runId !== languageRun) return;

        if (i < beforeLink.length) {
            el.appendChild(document.createTextNode(beforeLink[i]));
            i++;
            scheduleTyping(typeBefore, speed);
            return;
        }

        const link = document.createElement("a");
        link.href = linkData.href;
        link.target = linkData.target;
        link.rel = linkData.rel;
        link.textContent = marker;
        el.appendChild(link);
        typeAfter();
    }

    function typeAfter() {
        if (runId !== languageRun) return;

        if (j < afterLink.length) {
            el.appendChild(document.createTextNode(afterLink[j]));
            j++;
            scheduleTyping(typeAfter, speed);
        }
    }

    typeBefore();
}

function setActiveLanguageButton(lang) {
    document.querySelectorAll(".top-controls button").forEach((button) => {
        const isActive = button.dataset.lang === lang;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function setLanguage(lang) {
    currentLang = lang;
    languageRun++;
    clearTypingTimers();
    document.documentElement.lang = lang;
    setActiveLanguageButton(lang);

    const runId = languageRun;
    const fadeElements = [...document.querySelectorAll(".fade-text")];
    const skillElements = [...document.querySelectorAll(".skill")];
    const languageElements = [...document.querySelectorAll(".language")];
    const contactElements = [...document.querySelectorAll(".contact-chip p")];
    const linkElements = [...document.querySelectorAll(".links a")];
    const animatedElements = [...fadeElements, ...skillElements, ...languageElements, ...contactElements, ...linkElements];

    animatedElements.forEach((el) => el.classList.add("text-hide"));

    scheduleTyping(() => {
        if (runId !== languageRun) return;

        fadeElements.forEach((el, i) => {
            el.textContent = el.dataset[lang] || "";
            scheduleTyping(() => el.classList.remove("text-hide"), i * 28);
        });

        skillElements.forEach((el, i) => {
            scheduleTyping(() => {
                if (runId !== languageRun) return;
                el.classList.remove("text-hide");
                typeText(el, lang, 9, runId);
            }, i * 70);
        });

        languageElements.forEach((el, i) => {
            scheduleTyping(() => {
                if (runId !== languageRun) return;
                el.classList.remove("text-hide");
                typeText(el, lang, 9, runId);
            }, i * 55);
        });

        contactElements.forEach((el, i) => {
            scheduleTyping(() => {
                if (runId !== languageRun) return;
                el.classList.remove("text-hide");
                typeContact(el, lang, 10, runId);
            }, i * 90);
        });

        linkElements.forEach((el, i) => {
            el.textContent = el.dataset[lang] || "";
            scheduleTyping(() => el.classList.remove("text-hide"), i * 26);
        });
    }, 240);
}

document.querySelector("h1").textContent = "Novogrey";
setLanguage(currentLang);

const AUDIO_FOLDER = "audio";
const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm"];
const DEFAULT_VOLUME = 0.5;
const VOLUME_STORAGE_KEY = "musicVolumeV3";
const PLAYLIST_ANIMATION_MS = 320;
const audioEl = document.getElementById("site-audio");
const musicPlayer = document.getElementById("music-player");
const musicDrawerToggle = document.getElementById("music-drawer-toggle");
const musicCover = document.getElementById("music-cover");
const musicTitle = document.getElementById("music-title");
const musicArtist = document.getElementById("music-artist");
const musicStatus = document.getElementById("music-status");
const playButton = document.getElementById("play-button");
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const shuffleButton = document.getElementById("shuffle-button");
const repeatButton = document.getElementById("repeat-button");
const playlistButton = document.getElementById("playlist-button");
const muteButton = document.getElementById("mute-button");
const progressInput = document.getElementById("track-progress");
const volumeInput = document.getElementById("volume-slider");
const currentTimeLabel = document.getElementById("current-time");
const durationTimeLabel = document.getElementById("duration-time");
const playlistPanel = document.getElementById("music-playlist");

let musicTracks = [];
let currentTrackIndex = 0;
let shuffleEnabled = true;
let repeatMode = "all";
let isSeeking = false;
let autoplayBlocked = false;
let playlistCloseTimer = null;

function isAudioFile(file) {
    const lower = file.toLowerCase();
    return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function safeDecode(value) {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

function toAudioSrc(file) {
    return `${AUDIO_FOLDER}/${file.split(/[\\/]/).map((part) => encodeURIComponent(part)).join("/")}`;
}

function deriveTrackMeta(file) {
    const decoded = safeDecode(file).split(/[\\/]/).pop() || "Track";
    const base = decoded.replace(/\.[^.]+$/, "");
    const parts = base.split(/\s+-\s+/);
    const title = (parts.shift() || base).trim() || "Track";
    const artist = parts.join(" - ").replace(/\s+_\s+/g, " / ").trim() || "Local audio";

    return { title, artist };
}

function normalizeTrack(item) {
    const rawFile = typeof item === "string" ? item : item?.file || item?.src || "";
    if (!rawFile) return null;

    const file = safeDecode(rawFile).replace(/^audio[\\/]/i, "");
    if (!isAudioFile(file)) return null;

    const meta = deriveTrackMeta(file);
    return {
        file,
        src: typeof item === "object" && item.src ? item.src : toAudioSrc(file),
        title: typeof item === "object" && item.title ? item.title : meta.title,
        artist: typeof item === "object" && item.artist ? item.artist : meta.artist
    };
}

function mergeTrackSources(...sources) {
    const tracks = new Map();

    sources.flat().forEach((item) => {
        const track = normalizeTrack(item);
        if (!track) return;

        const key = track.file.toLowerCase();
        if (!tracks.has(key)) tracks.set(key, track);
    });

    return [...tracks.values()];
}

async function readJsonManifest() {
    try {
        const response = await fetch(`${AUDIO_FOLDER}/tracks.json`, { cache: "no-store" });
        if (!response.ok) return [];

        const data = await response.json();
        return Array.isArray(data) ? data : data.tracks || [];
    } catch {
        return [];
    }
}

async function readDirectoryListing() {
    try {
        const response = await fetch(`${AUDIO_FOLDER}/`, { cache: "no-store" });
        if (!response.ok) return [];

        const html = await response.text();
        return [...html.matchAll(/href=["']([^"']+)["']/gi)]
            .map((match) => safeDecode(match[1]).split(/[?#]/)[0].split("/").filter(Boolean).pop() || "")
            .filter(isAudioFile)
            .map((file) => ({ file }));
    } catch {
        return [];
    }
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${rest}`;
}

function getTrackInitials(title) {
    const words = title.match(/[A-Za-zА-Яа-яЁёІіЇїЄєҐґ0-9]+/g) || [];
    const first = words[0]?.[0] || "N";
    const second = words[1]?.[0] || "G";
    return `${first}${second}`.toUpperCase();
}

function setControlsDisabled(disabled) {
    [playButton, prevButton, nextButton, shuffleButton, repeatButton, playlistButton, muteButton, progressInput, volumeInput]
        .filter(Boolean)
        .forEach((control) => {
            control.disabled = disabled;
        });
}

function setMusicDrawerOpen(isOpen) {
    musicPlayer.classList.toggle("is-open", isOpen);
    musicDrawerToggle.setAttribute("aria-expanded", String(isOpen));
    musicDrawerToggle.setAttribute("aria-label", isOpen ? "Закрыть музыкальный плеер" : "Открыть музыкальный плеер");
}

function setPlaylistOpen(isOpen) {
    window.clearTimeout(playlistCloseTimer);
    playlistButton.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
        playlistPanel.hidden = false;
        playlistPanel.setAttribute("aria-hidden", "false");
        window.requestAnimationFrame(() => {
            playlistPanel.classList.add("is-open");
        });
        return;
    }

    playlistPanel.classList.remove("is-open");
    playlistPanel.setAttribute("aria-hidden", "true");
    playlistCloseTimer = window.setTimeout(() => {
        if (!playlistPanel.classList.contains("is-open")) {
            playlistPanel.hidden = true;
        }
    }, PLAYLIST_ANIMATION_MS);
}

function updateShuffleButton() {
    shuffleButton.classList.toggle("is-active", shuffleEnabled);
    shuffleButton.setAttribute("aria-pressed", String(shuffleEnabled));
}

function updateRepeatButton() {
    const active = repeatMode !== "off";
    repeatButton.classList.toggle("is-active", active);
    repeatButton.setAttribute("aria-pressed", String(active));
    repeatButton.textContent = repeatMode === "one" ? "①" : "↻";
    repeatButton.setAttribute("aria-label", repeatMode === "one" ? "Повтор одного трека" : "Повтор");
}

function updatePlayButton() {
    const isPlaying = !audioEl.paused;
    playButton.textContent = isPlaying ? "⏸" : "▶";
    playButton.setAttribute("aria-label", isPlaying ? "Пауза" : "Воспроизвести");
}

function updateVolumeButton() {
    const muted = audioEl.muted || audioEl.volume === 0;
    muteButton.textContent = muted ? "🔇" : "🔊";
    muteButton.setAttribute("aria-label", muted ? "Включить звук" : "Выключить звук");
}

function updateProgress() {
    const duration = audioEl.duration || 0;
    progressInput.max = String(duration);
    durationTimeLabel.textContent = formatTime(duration);

    if (!isSeeking) {
        progressInput.value = String(audioEl.currentTime || 0);
        currentTimeLabel.textContent = formatTime(audioEl.currentTime || 0);
    }
}

function updateTrackInfo() {
    const track = musicTracks[currentTrackIndex];
    if (!track) return;

    musicTitle.textContent = track.title;
    musicArtist.textContent = track.artist;
    musicCover.textContent = getTrackInitials(track.title);
    musicStatus.textContent = `${currentTrackIndex + 1} / ${musicTracks.length}`;

    playlistPanel.querySelectorAll(".playlist-track").forEach((button, index) => {
        button.classList.toggle("is-active", index === currentTrackIndex);
    });
}

function loadTrack(index, options = {}) {
    if (!musicTracks.length) return;

    currentTrackIndex = (index + musicTracks.length) % musicTracks.length;
    audioEl.src = musicTracks[currentTrackIndex].src;
    audioEl.load();
    progressInput.disabled = false;
    updateTrackInfo();
    updateProgress();

    if (options.play) {
        playAudio();
    }
}

async function playAudio() {
    if (!musicTracks.length) return;

    try {
        await audioEl.play();
        autoplayBlocked = false;
        musicPlayer.classList.remove("is-blocked");
        updateTrackInfo();
    } catch {
        autoplayBlocked = true;
        musicPlayer.classList.add("is-blocked");
        musicStatus.textContent = "Нажмите Play";
    }

    updatePlayButton();
}

function chooseRandomIndex() {
    if (musicTracks.length < 2) return 0;

    let nextIndex = currentTrackIndex;
    while (nextIndex === currentTrackIndex) {
        nextIndex = Math.floor(Math.random() * musicTracks.length);
    }

    return nextIndex;
}

function nextTrack(options = {}) {
    if (!musicTracks.length) return;

    if (options.fromEnded && repeatMode === "one") {
        audioEl.currentTime = 0;
        playAudio();
        return;
    }

    let nextIndex = shuffleEnabled ? chooseRandomIndex() : currentTrackIndex + 1;

    if (nextIndex >= musicTracks.length) {
        if (options.fromEnded && repeatMode === "off") {
            audioEl.pause();
            updatePlayButton();
            return;
        }

        nextIndex = 0;
    }

    loadTrack(nextIndex, { play: true });
}

function previousTrack() {
    if (!musicTracks.length) return;

    if (audioEl.currentTime > 4) {
        audioEl.currentTime = 0;
        return;
    }

    loadTrack(currentTrackIndex - 1, { play: true });
}

function renderPlaylist() {
    playlistPanel.textContent = "";

    musicTracks.forEach((track, index) => {
        const button = document.createElement("button");
        const title = document.createElement("span");
        const artist = document.createElement("span");

        button.type = "button";
        button.className = "playlist-track";
        button.setAttribute("aria-label", `Включить ${track.title}`);
        title.className = "playlist-title";
        artist.className = "playlist-artist";
        title.textContent = track.title;
        artist.textContent = track.artist;

        button.append(title, artist);
        button.addEventListener("click", () => {
            loadTrack(index, { play: true });
            setPlaylistOpen(false);
        });

        playlistPanel.appendChild(button);
    });
}

function readSavedVolume() {
    try {
        localStorage.removeItem("musicVolume");
        localStorage.removeItem("musicVolumeV2");

        const saved = Number(localStorage.getItem(VOLUME_STORAGE_KEY));
        if (!Number.isFinite(saved) || saved <= 0) return DEFAULT_VOLUME;

        return Math.min(1, Math.max(DEFAULT_VOLUME, saved));
    } catch {
        return DEFAULT_VOLUME;
    }
}

function saveVolume(value) {
    try {
        localStorage.setItem(VOLUME_STORAGE_KEY, String(value));
    } catch {
        // Local storage can be unavailable in private or local-file contexts.
    }
}

async function initMusicPlayer() {
    if (!audioEl || !musicPlayer) return;

    setControlsDisabled(true);
    audioEl.volume = readSavedVolume();
    audioEl.muted = false;
    volumeInput.value = String(audioEl.volume);
    updateVolumeButton();
    updateShuffleButton();
    updateRepeatButton();

    const globalTracks = Array.isArray(window.AUDIO_TRACKS) ? window.AUDIO_TRACKS : [];
    const [jsonTracks, directoryTracks] = await Promise.all([readJsonManifest(), readDirectoryListing()]);
    musicTracks = mergeTrackSources(globalTracks, jsonTracks, directoryTracks);

    if (!musicTracks.length) {
        musicTitle.textContent = "Музыка не найдена";
        musicArtist.textContent = "Добавьте файлы в папку audio";
        musicStatus.textContent = "0 / 0";
        return;
    }

    setControlsDisabled(false);
    renderPlaylist();
    currentTrackIndex = Math.floor(Math.random() * musicTracks.length);
    loadTrack(currentTrackIndex);
    playAudio();
}

playButton.addEventListener("click", () => {
    if (audioEl.paused) {
        playAudio();
    } else {
        audioEl.pause();
    }
});

musicDrawerToggle.addEventListener("click", () => {
    setMusicDrawerOpen(!musicPlayer.classList.contains("is-open"));
});

prevButton.addEventListener("click", previousTrack);
nextButton.addEventListener("click", () => nextTrack());

shuffleButton.addEventListener("click", () => {
    shuffleEnabled = !shuffleEnabled;
    updateShuffleButton();
});

repeatButton.addEventListener("click", () => {
    const modes = ["all", "one", "off"];
    repeatMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
    updateRepeatButton();
});

playlistButton.addEventListener("click", () => {
    setPlaylistOpen(!playlistPanel.classList.contains("is-open"));
});

muteButton.addEventListener("click", () => {
    audioEl.muted = !audioEl.muted;
    updateVolumeButton();
});

volumeInput.addEventListener("input", () => {
    const volume = Number(volumeInput.value);
    audioEl.volume = volume;
    audioEl.muted = volume === 0 ? true : false;
    saveVolume(volume);
    updateVolumeButton();
});

progressInput.addEventListener("input", () => {
    isSeeking = true;
    currentTimeLabel.textContent = formatTime(Number(progressInput.value));
});

progressInput.addEventListener("change", () => {
    audioEl.currentTime = Number(progressInput.value);
    isSeeking = false;
    updateProgress();
});

audioEl.addEventListener("play", updatePlayButton);
audioEl.addEventListener("pause", updatePlayButton);
audioEl.addEventListener("timeupdate", updateProgress);
audioEl.addEventListener("loadedmetadata", updateProgress);
audioEl.addEventListener("volumechange", updateVolumeButton);
audioEl.addEventListener("ended", () => nextTrack({ fromEnded: true }));

document.addEventListener("click", (event) => {
    if (playlistPanel.classList.contains("is-open") && !musicPlayer.contains(event.target)) {
        setPlaylistOpen(false);
    }

    if (musicPlayer.classList.contains("is-open") && !musicPlayer.contains(event.target)) {
        setMusicDrawerOpen(false);
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && musicPlayer.classList.contains("is-open")) {
        setMusicDrawerOpen(false);
        setPlaylistOpen(false);
    }
});

window.addEventListener("pointerdown", () => {
    if (autoplayBlocked && audioEl.paused) playAudio();
}, { once: true, passive: true });

window.addEventListener("keydown", () => {
    if (autoplayBlocked && audioEl.paused) playAudio();
}, { once: true });

initMusicPlayer();

const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const pointer = { x: 0, y: 0, active: false };
let particles = [];

function createParticle(width, height) {
    const speed = 0.18 + Math.random() * 0.34;
    const angle = Math.random() * Math.PI * 2;

    return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 1.8
    };
}

function buildParticles() {
    const area = window.innerWidth * window.innerHeight;
    const count = prefersReducedMotion.matches
        ? 28
        : Math.min(86, Math.max(42, Math.floor(area / 17000)));

    particles = Array.from({ length: count }, () => createParticle(window.innerWidth, window.innerHeight));
}

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
}

function moveParticle(particle) {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > window.innerWidth) particle.vx *= -1;
    if (particle.y < 0 || particle.y > window.innerHeight) particle.vy *= -1;
}

function drawLine(a, b, maxDistance, color) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);

    if (distance > maxDistance) return;

    const alpha = (1 - distance / maxDistance) * 0.28;
    ctx.strokeStyle = color(alpha);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
}

function drawBackground() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.lineWidth = 1;

    particles.forEach((particle, index) => {
        if (!prefersReducedMotion.matches) moveParticle(particle);

        ctx.fillStyle = "rgba(247, 251, 255, 0.42)";
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = index + 1; j < particles.length; j++) {
            drawLine(particle, particles[j], 138, (alpha) => `rgba(56, 225, 196, ${alpha})`);
        }

        if (pointer.active) {
            drawLine(particle, pointer, 180, (alpha) => `rgba(244, 201, 93, ${alpha})`);
        }
    });

    if (!prefersReducedMotion.matches) {
        window.requestAnimationFrame(drawBackground);
    }
}

window.addEventListener("resize", resizeCanvas, { passive: true });
window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
}, { passive: true });
window.addEventListener("pointerleave", () => {
    pointer.active = false;
}, { passive: true });

resizeCanvas();
drawBackground();
