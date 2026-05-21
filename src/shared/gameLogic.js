import { THRESHOLDS, SHUFFLE_SEED, START_DATE, MAX_GUESSES } from "./constants";

function compareNumeric(g, a, t) {
  if (g == null || a == null) return { status: "wrong", hint: null };
  if (g === a) return { status: "correct", hint: null };
  return { status: Math.abs(g - a) <= t ? "close" : "wrong", hint: g < a ? "↑" : "↓" };
}

function compareText(g, a) {
  return g === a ? { status: "correct", hint: null } : { status: "wrong", hint: null };
}

export function evaluateGuess(guess, answer) {
  return [
    { label: "Season",    displayMain: `S${guess.season}`,           displaySub: guess.seasonName,  ...compareNumeric(guess.season,     answer.season,     THRESHOLDS.season) },
    { label: "Placement", displayMain: `#${guess.placement}`,        displaySub: null,              ...compareNumeric(guess.placement,  answer.placement,  THRESHOLDS.placement) },
    { label: "Gender",    displayMain: guess.gender,                  displaySub: null,              ...compareText(guess.gender,        answer.gender) },
    { label: "Tribe Color", displayMain: guess.tribe_color,           displaySub: null,              ...compareText(guess.tribe_color,   answer.tribe_color) },
    { label: "Returnee",  displayMain: guess.returnee ? "Yes" : "No", displaySub: null,              ...compareText(guess.returnee,      answer.returnee) },
    { label: "Age",       displayMain: guess.age ?? "?",              displaySub: null,              ...compareNumeric(guess.age,        answer.age,        THRESHOLDS.age) },
  ];
}

export function isWin(result) {
  return result.every(c => c.status === "correct");
}

export function normalize(str) {
  return (str || "").toLowerCase().replace(/\./g, "");
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seed) {
  const a = [...arr];
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getPuzzleNumber() {
  const etDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [y, m, d] = etDateStr.split("-").map(Number);
  const todayUTC = Date.UTC(y, m - 1, d);
  const startUTC = Date.UTC(START_DATE.getFullYear(), START_DATE.getMonth(), START_DATE.getDate());
  return Math.floor((todayUTC - startUTC) / 86400000) + 1;
}

import puzzleHistory from "./puzzleHistory.json"

export function getAnswerForPuzzle(contestants, puzzleNum) {
  // Past puzzles — locked in, immune to roster changes
  if (puzzleNum - 1 < puzzleHistory.length) {
    const id = puzzleHistory[puzzleNum - 1];
    return contestants.find(c => c.id === id);
  }

  // Future puzzles — shuffle only unused contestants
  const usedSet = new Set(puzzleHistory);
  const remaining = contestants.filter(c => !usedSet.has(c.id));
  const shuffled = seededShuffle(remaining, SHUFFLE_SEED);
  const idx = (puzzleNum - 1 - puzzleHistory.length) % shuffled.length;
  return shuffled[idx];
}

export function getDailyAnswer(contestants) {
  return getAnswerForPuzzle(contestants, getPuzzleNumber());
}

export function getRandomAnswer(contestants) {
  return contestants[Math.floor(Math.random() * contestants.length)];
}

export function getDateForPuzzle(puzzleNum) {
  const d = new Date(START_DATE);
  d.setDate(START_DATE.getDate() + puzzleNum - 1);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function msUntilMidnightET() {
  const now = new Date();
  const etStr = now.toLocaleString("en-CA", { timeZone: "America/New_York", hour12: false });
  const timePart = etStr.split(", ")[1];
  const [h, m, s] = timePart.split(":").map(Number);
  return ((24 * 3600) - (h * 3600 + m * 60 + s)) * 1000 + 500;
}
