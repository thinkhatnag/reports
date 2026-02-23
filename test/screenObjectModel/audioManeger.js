import { spawn } from "child_process";
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";
import levenshtein from "fast-levenshtein";
import allureReporter from "@wdio/allure-reporter";
const execPromise = util.promisify(exec);
import { fileURLToPath } from "url"; // ← add this
// ← add these two lines to resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AudioManager {
  constructor() {
    this.audioFiles = {
      english: path.resolve(
        __dirname,
        "../../utils/audioFiles/CardiacArrestEN.wav",
      ), // ← fixed
      spanish: path.resolve(
        __dirname,
        "../../utils/audioFiles/CardiacArrestES.mp3",
      ),
    };
    this.currentAudioFile = null;
    this.currentProcess = null;
    this.languageUsed = null;

    this.isPaused = false;
    this.playedTime = 0; // total seconds played so far
    this.segmentStart = null; // wall-clock time when current segment started
    this.maxDuration = 608;
    this._durationTicker = null;
  }

  // ─── Internal helpers ────────────────────────────────────────────────

  _killCurrentProcess() {
    try {
      if (this.currentProcess) {
        this.currentProcess.kill("SIGKILL");
        this.currentProcess = null;
      }
    } catch (e) {
      console.warn("Could not kill process:", e.message);
    }
  }

  _accumulatePlayedTime() {
    // Add time elapsed in the current playing segment
    if (!this.isPaused && this.segmentStart !== null) {
      this.playedTime += Date.now() / 1000 - this.segmentStart;
      this.segmentStart = null;
    }
  }

  _startDurationTicker() {
    if (this._durationTicker) {
      clearInterval(this._durationTicker);
    }
    this._durationTicker = setInterval(async () => {
      const elapsed =
        this.playedTime +
        (!this.isPaused && this.segmentStart
          ? Date.now() / 1000 - this.segmentStart
          : 0);

      if (elapsed >= this.maxDuration) {
        clearInterval(this._durationTicker);
        this._durationTicker = null;
        await this.stopAudio();
        console.log("Audio auto-stopped at 10:08 (608 sec)");
      }
    }, 500); // check every 500ms for tighter accuracy
  }

  _stopTicker() {
    if (this._durationTicker) {
      clearInterval(this._durationTicker);
      this._durationTicker = null;
    }
  }

  // Spawn ffplay starting at `seekSeconds` into the file
  _spawnFfplay(filePath, seekSeconds = 0) {
    // ffplay flags:
    //   -nodisp       no video window
    //   -autoexit     exit when audio ends
    //   -ss           seek to position in seconds
    const args = [
      "-nodisp",
      "-autoexit",
      "-ss",
      String(seekSeconds.toFixed(3)),
      filePath,
    ];
    const proc = spawn("ffplay", args, { stdio: "ignore" });
    proc.on("error", (err) => console.error("ffplay error:", err));
    return proc;
  }

  // ─── Public API ──────────────────────────────────────────────────────

  async playAudio(language) {
    // Stop anything currently playing
    if (this.currentProcess) {
      await this.stopAudio();
    }

    const audioFilePath = this.audioFiles[language];
    this.languageUsed = language;
    this.currentAudioFile = audioFilePath;
    this.playedTime = 0;
    this.isPaused = false;

    this.currentProcess = this._spawnFfplay(audioFilePath, 0);
    this.segmentStart = Date.now() / 1000;
    this._startDurationTicker();

    return audioFilePath;
  }

  async pauseAudio() {
    if (!this.currentProcess || this.isPaused) return;

    // 1. Accumulate how long we've played in this segment
    this._accumulatePlayedTime();

    // 2. Kill the ffplay process — no buffer drain, stops immediately
    this._killCurrentProcess();

    this.isPaused = true;
    this._stopTicker();

    console.log(`Audio paused at ${this.playedTime.toFixed(2)}s`);
  }

  async resumeAudio() {
    if (!this.isPaused || !this.currentAudioFile) return;

    // Spawn a fresh ffplay seeking exactly to where we paused
    this.currentProcess = this._spawnFfplay(
      this.currentAudioFile,
      this.playedTime,
    );
    this.segmentStart = Date.now() / 1000;
    this.isPaused = false;
    this._startDurationTicker();

    console.log(`Audio resumed from ${this.playedTime.toFixed(2)}s`);
  }

  async stopAudio() {
    const language = this.languageUsed;

    // Accumulate remaining time before killing
    this._accumulatePlayedTime();
    this._killCurrentProcess();
    this._stopTicker();

    // Also kill any stray ffplay processes
    try {
      const { stdout } = await execPromise("pgrep ffplay || true");
      if (stdout.trim()) await execPromise("killall ffplay");
    } catch (e) {
      /* ignore */
    }

    this.isPaused = false;

    // ── Transcript slicing ──────────────────────────────────────────
    const transcriptMap = {
      english:
        "/Users/nagasubarayudu/Desktop/IOS/utils/audiotranscripts/CardiacArrest.txt",
      spanish:
        "/Users/nagasubarayudu/Desktop/IOS/utils/audiotranscripts/CardiacArrestEs.txt",
    };

    if (!language || !transcriptMap[language]) {
      console.warn("No language set, skipping transcript save.");
      return null;
    }

    const fullTranscript = fs
      .readFileSync(transcriptMap[language], "utf8")
      .trim()
      .split(/\s+/);

    const wordsPerSecond = fullTranscript.length / this.maxDuration;
    const wordsToTake = Math.min(
      Math.floor(this.playedTime * wordsPerSecond),
      fullTranscript.length,
    );
    const partialTranscript = fullTranscript.slice(0, wordsToTake).join(" ");

    const logDir = "/Users/nagasubarayudu/Desktop/IOS/utils/audioLogs";
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const logFile = `${logDir}/played_audio_${Date.now()}.txt`;
    fs.writeFileSync(logFile, partialTranscript, "utf8");
    console.log("Transcript saved to:", logFile);

    // Reset state
    this.playedTime = 0;
    this.segmentStart = null;

    return logFile;
  }

  // ─── Text comparison (unchanged logic, typo fixed) ───────────────────

  async TextComparison() {
    const SCANNED_DIR = "/Users/nagasubarayudu/Desktop/IOS/_results_/";
    const PLAYED_DIR = "/Users/nagasubarayudu/Desktop/IOS/utils/audioLogs/";

    const normalizeText = (text) =>
      text
        .replace(/--+\s*Conversation\s*\d+\s*--+/gi, " ")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    const deduplicateText = (text) =>
      [
        ...new Set(
          text
            .split(/\n+/)
            .map((l) => l.trim())
            .filter(Boolean),
        ),
      ].join(" ");

    const getLatestFile = (dir, prefix) => {
      const files = fs
        .readdirSync(dir)
        .filter((f) => f.startsWith(prefix) && f.endsWith(".txt"))
        .sort((a, b) => b.localeCompare(a));
      if (!files.length)
        throw new Error(`No files with prefix ${prefix} in ${dir}`);
      return path.join(dir, files[0]);
    };

    const scannedFile = getLatestFile(SCANNED_DIR, "scanned_texts_");
    const playedFile = getLatestFile(PLAYED_DIR, "played_audio_");

    const scannedText = normalizeText(
      deduplicateText(fs.readFileSync(scannedFile, "utf8")),
    );
    const playedText = normalizeText(fs.readFileSync(playedFile, "utf8"));

    const playedSlice = playedText.slice(0, scannedText.length);
    const distance = levenshtein.get(scannedText, playedSlice);
    const maxLen = Math.max(scannedText.length, playedSlice.length) || 1;
    const similarity = ((1 - distance / maxLen) * 100).toFixed(2);

    const threshold = 90;
    const status = similarity >= threshold ? "Match Pass" : "Match Fail";

    allureReporter.addAttachment("Scanned Text", scannedText, "text/plain");
    allureReporter.addAttachment("Played Text", playedText, "text/plain");

    if (similarity < threshold) {
      allureReporter.addDescription(
        `Similarity ${similarity}% is below the ${threshold}% threshold — please review the transcript.`,
      );
    }

    return { scannedFile, playedFile, similarity: `${similarity}%`, status };
  }
}

export default new AudioManager();
