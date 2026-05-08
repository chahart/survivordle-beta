const STORAGE_KEY = "survivordle_state";

export function loadStorage() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

export function saveStorage(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch {}
}

export function loadTodayGame(puzzleNum) {
  const s = loadStorage();
  // Restore completed OR in-progress game as long as it's today's puzzle
  if (s.puzzleNum === puzzleNum) return s;
  return null;
}

export function saveMidGame({ puzzleNum, guesses, results, hintEpisode, hintNeighbors }) {
  const s = loadStorage();
  // Preserve existing stats and any completed game data
  saveStorage({
    ...s,
    puzzleNum,
    guessObjects: guesses,
    resultObjects: results,
    hintEpisode,
    hintNeighbors,
    gameOver: false,
  });
}

export function saveCompletedGame({ puzzleNum, won, gaveUp, guessCount, emojiGrid }) {
  const s = loadStorage();
  const stats = s.stats || { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, dist: {} };
  stats.played += 1;
  if (won) {
    stats.wins += 1;
    stats.currentStreak += 1;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.dist[guessCount] = (stats.dist[guessCount] || 0) + 1;
  } else {
    stats.currentStreak = 0;
  }
  saveStorage({ puzzleNum, won, gaveUp, guessCount, emojiGrid, gameOver: true, stats });
}

// ── Recall storage ────────────────────────────────────────────────────────────
const RECALL_UNLIMITED_KEY = "recall_unlimited_history";
const RECALL_UNLIMITED_CAP = 200;

export function loadRecallUnlimitedHistory() {
  try { return JSON.parse(localStorage.getItem(RECALL_UNLIMITED_KEY)) || []; }
  catch { return []; }
}

export function saveRecallUnlimitedGame({ puzzle, total_score, grade, season_score, placement_score, age_score, tribe_score }) {
  const history = loadRecallUnlimitedHistory();
  const pad = n => String(n).padStart(2, "0");
  const now = new Date();
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  history.push({ puzzle, total_score, grade, season_score, placement_score, age_score, tribe_score, date });
  const capped = history.length > RECALL_UNLIMITED_CAP ? history.slice(-RECALL_UNLIMITED_CAP) : history;
  try { localStorage.setItem(RECALL_UNLIMITED_KEY, JSON.stringify(capped)); }
  catch {}
}

// Scan all recall_daily_* and recall_archive_* keys from localStorage
export function loadAllRecallDailyResults() {
  const results = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("recall_daily_")) {
        const val = JSON.parse(localStorage.getItem(key));
        if (val && val.total != null) results.push(val);
      }
    }
  } catch {}
  return results;
}

export function loadAllRecallArchiveResults() {
  const results = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("recall_archive_")) {
        const val = JSON.parse(localStorage.getItem(key));
        if (val && val.total != null) results.push(val);
      }
    }
  } catch {}
  return results;
}

// ── Unlimited stats (localStorage, per device) ────────────────────────────────
const UNLIMITED_KEY = "survivordle_unlimited_stats";

export function loadUnlimitedStats() {
  try { return JSON.parse(localStorage.getItem(UNLIMITED_KEY)) || { played: 0, wins: 0, dist: {} }; }
  catch { return { played: 0, wins: 0, dist: {} }; }
}

export function saveUnlimitedGame({ won, guessCount }) {
  const s = loadUnlimitedStats();
  s.played += 1;
  if (won) {
    s.wins += 1;
    s.dist[guessCount] = (s.dist[guessCount] || 0) + 1;
  }
  try { localStorage.setItem(UNLIMITED_KEY, JSON.stringify(s)); }
  catch {}
  return s;
}
