const fs = require("node:fs");
const path = require("node:path");

const audioDir = path.resolve(__dirname, "..", "audio");
const extensions = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".webm"]);

if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
}

const tracks = fs.readdirSync(audioDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => ({ file: entry.name }))
    .sort((a, b) => a.file.localeCompare(b.file, "en", { sensitivity: "base" }));

const json = `${JSON.stringify({ tracks }, null, 2)}\n`;
const js = `window.AUDIO_TRACKS = ${JSON.stringify(tracks, null, 2)};\n`;

fs.writeFileSync(path.join(audioDir, "tracks.json"), json, "utf8");
fs.writeFileSync(path.join(audioDir, "tracks.js"), js, "utf8");

console.log(`Updated ${tracks.length} audio track(s).`);
