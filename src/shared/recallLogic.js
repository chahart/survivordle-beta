export function scoreSeason(guess, answer) {
  return Math.max(0, 40 - Math.abs(guess - answer) * 4);
}

export function scorePlacement(guess, answer) {
  return Math.max(0, 40 - Math.abs(guess - answer) * 4);
}

export function scoreAge(guess, answer) {
  const diff = Math.abs(guess - answer);
  if (diff <= 3)  return 12;
  if (diff <= 5)  return 8;
  if (diff <= 10) return 4;
  return 0;
}

export function scoreTribeColor(guess, answer) {
  return guess === answer ? 8 : 0;
}

export function scoreAll(guesses, answer) {
  const season     = scoreSeason(guesses.season,     answer.season);
  const placement  = scorePlacement(guesses.placement, answer.placement);
  const age        = scoreAge(guesses.age,            answer.age);
  const tribeColor = scoreTribeColor(guesses.tribeColor, answer.tribe_color);
  const total = season + placement + age + tribeColor;
  return { season, placement, age, tribeColor, total };
}

export function getGrade(score) {
  if (score === 100) return "A+";
  if (score >= 93)   return "A";
  if (score >= 90)   return "A-";
  if (score >= 87)   return "B+";
  if (score >= 83)   return "B";
  if (score >= 80)   return "B-";
  if (score >= 77)   return "C+";
  if (score >= 73)   return "C";
  if (score >= 70)   return "C-";
  if (score >= 67)   return "D+";
  if (score >= 63)   return "D";
  if (score >= 60)   return "D-";
  return "F";
}

export function buildStintMap(contestants) {
  const grouped = {};
  for (const c of contestants) {
    if (!grouped[c.castaway_id]) grouped[c.castaway_id] = [];
    grouped[c.castaway_id].push(c);
  }
  for (const id in grouped) {
    grouped[id].sort((a, b) => a.season - b.season);
  }
  const stintMap = {};
  for (const id in grouped) {
    grouped[id].forEach((c, idx) => {
      const labels = ["First Appearance", "Second Appearance", "Third Appearance", "Fourth Appearance"];
      stintMap[c.id] = c.returnee ? (labels[idx] || `Appearance ${idx + 1}`) : null;
    });
  }
  return stintMap;
}

export function getEligibleContestants(contestants) {
  const maxSeason = Math.max(...contestants.map(c => c.season));
  return contestants.filter(c => c.season !== maxSeason);
}

export function pickRandom(pool, seenIds) {
  const available = pool.filter(c => !seenIds.has(c.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

// Returns "YYYYMMDD" for today in ET
export function getTodayKeyET() {
  const etStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return etStr.replace(/-/g, "");
}

// Returns { year, month, day } for a "YYYYMMDD" key
function parseKey(key) {
  return {
    year:  parseInt(key.slice(0, 4), 10),
    month: parseInt(key.slice(4, 6), 10),
    day:   parseInt(key.slice(6, 8), 10),
  };
}

// Deterministic castaway index for a given date key
function recallIndexForKey(key, poolLength) {
  const { year, month, day } = parseKey(key);
  return (year * 10000 + month * 100 + day) * 7 % poolLength;
}

// The Recall Daily castaway for a given date key
export function getRecallAnswerForKey(pool, key) {
  const idx = recallIndexForKey(key, pool.length);
  return pool[idx];
}

// Today's Recall Daily castaway
export function getRecallDailyAnswer(contestants) {
  const pool = getEligibleContestants(contestants);
  return getRecallAnswerForKey(pool, getTodayKeyET());
}

// All past date keys (from RECALL_START_KEY up to but not including today), newest first
export const RECALL_START_KEY = "20260520";

export function getRecallPuzzleNumber(key) {
  const k = key || getTodayKeyET();
  const { year, month, day } = parseKey(k);
  const { year: sy, month: sm, day: sd } = parseKey(RECALL_START_KEY);
  const msPerDay = 86400000;
  return Math.max(1, Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(sy, sm - 1, sd)) / msPerDay) + 1);
}

export function getPastRecallKeys() {
  const todayKey = getTodayKeyET();
  const keys = [];
  // Walk backward from yesterday
  const today = new Date(
    parseInt(todayKey.slice(0, 4), 10),
    parseInt(todayKey.slice(4, 6), 10) - 1,
    parseInt(todayKey.slice(6, 8), 10)
  );
  const start = new Date(
    parseInt(RECALL_START_KEY.slice(0, 4), 10),
    parseInt(RECALL_START_KEY.slice(4, 6), 10) - 1,
    parseInt(RECALL_START_KEY.slice(6, 8), 10)
  );
  const cur = new Date(today);
  cur.setDate(cur.getDate() - 1);
  while (cur >= start) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    keys.push(`${y}${m}${d}`);
    cur.setDate(cur.getDate() - 1);
  }
  return keys;
}

// Format a date key as "Mon D, YYYY"
export function formatRecallKey(key) {
  const { year, month, day } = parseKey(key);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}