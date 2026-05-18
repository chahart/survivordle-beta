const SUPABASE_URL = "https://ctznxbrgcijyjtnfesfp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0em54YnJnY2lqeWp0bmZlc2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyOTE1MjMsImV4cCI6MjA4Nzg2NzUyM30.qEnDJSHeSqZu7L1dx6uB5MyjN8DZNwAjL5G_0GmcncM";

export async function logSolveEvent({ puzzle, guesses, hints, won, mode, firstGuess, secondGuess }) {
  try {
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const h = now.getHours();
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
      + `${pad(h % 12 || 12)}:${pad(now.getMinutes())}${h < 12 ? "am" : "pm"}`;
    const finalGuesses = won ? guesses : 9;
    await fetch(`${SUPABASE_URL}/rest/v1/solve_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        puzzle,
        guesses: finalGuesses,
        hints,
        won,
        mode,
        timestamp,
        first_guess: firstGuess || null,
        second_guess: secondGuess || null,
      }),
    });
  } catch {
    // Fail silently — never disrupt gameplay
  }
}

export async function logRecallEvent({
  puzzle, mode,
  guess_season, guess_placement, guess_age, guess_tribe_color,
  pts_season, pts_placement, pts_age, pts_tribe_color,
  score, grade,
}) {
  try {
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const h = now.getHours();
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} `
      + `${pad(h % 12 || 12)}:${pad(now.getMinutes())}${h < 12 ? "am" : "pm"}`;
    await fetch(`${SUPABASE_URL}/rest/v1/recall_events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        puzzle, mode,
        guess_season, guess_placement, guess_age, guess_tribe_color,
        pts_season, pts_placement, pts_age, pts_tribe_color,
        score, grade, timestamp,
      }),
    });
  } catch {
    // Fail silently — never disrupt gameplay
  }
}

export async function fetchUnlimitedStats() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_unlimited_stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchDailyStats() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_daily_stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function fetchGlobalStats() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_global_stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

export async function fetchRecallGlobalStats() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_recall_global_stats`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
