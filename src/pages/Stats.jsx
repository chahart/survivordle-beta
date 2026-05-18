import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useSEO from "../shared/useSEO";
import { fetchDailyStats, fetchGlobalStats } from "../shared/supabase";
import { loadStorage, loadUnlimitedStats } from "../shared/storage";
import { RecallStatsTab } from "../shared/recallStats";

// ── Helpers ────────────────────────────────────────────────────────────────────
function friendlyCount(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${Math.floor(num / 1000)}K`;
  return num.toLocaleString();
}

function difficultyLabel(avg, sampleOk, easyThreshold, hardThreshold) {
  if (!sampleOk) return { label: "Still calculating…", color: "var(--text3)", emoji: "⏳" };
  if (avg <= easyThreshold) return { label: "Easier than usual", color: "#4aaa4a", emoji: "😊" };
  if (avg >= hardThreshold) return { label: "Harder than usual", color: "#e05040", emoji: "💀" };
  return                            { label: "Typical difficulty", color: "#e8742a", emoji: "🔥" };
}

function getThresholds(chartDays) {
  if (chartDays.length < 3) return { easy: -Infinity, hard: Infinity };
  const sorted = [...chartDays].sort((a, b) => Number(a.avg_guesses) - Number(b.avg_guesses));
  const n = sorted.length; // should be 7
  // bottom 2 = easy, middle 3 = typical, top 2 = hard
  const easyThreshold = Number(sorted[Math.floor(n * 2 / 7) - 1]?.avg_guesses ?? sorted[1].avg_guesses);
  const hardThreshold = Number(sorted[n - Math.floor(n * 2 / 7)]?.avg_guesses ?? sorted[n - 2].avg_guesses);
  return { easy: easyThreshold, hard: hardThreshold };
}

function pct(count, total) {
  if (!total) return 0;
  return Math.round((Number(count) / Number(total)) * 100);
}

// ── My Stats Tab ───────────────────────────────────────────────────────────────
function MyStatsTab() {
  const daily    = loadStorage();
  const unlim    = loadUnlimitedStats();
  const dStats   = daily.stats || { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, dist: {} };
  const dPct     = dStats.played > 0 ? Math.round((dStats.wins / dStats.played) * 100) : 0;
  const dDist    = dStats.dist || {};
  const dMax     = Math.max(...Object.values(dDist).map(Number), 1);
  const dBest    = Object.entries(dDist).sort((a,b) => b[1]-a[1])[0]?.[0];
  const uPct     = unlim.played > 0 ? Math.round((unlim.wins / unlim.played) * 100) : 0;
  const uDist    = unlim.dist || {};
  const uMax     = Math.max(...Object.values(uDist).map(Number), 1);
  const uBest    = Object.entries(uDist).sort((a,b) => b[1]-a[1])[0]?.[0];

  return (
    <div className="stats-page-body">
      {/* Daily personal */}
      <div className="sp-section-title">🔥 Daily</div>
      <div className="stats-grid" style={{ marginBottom: "16px" }}>
        {[
          [dStats.played,         "Played"],
          [`${dPct}%`,            "Solved"],
          [dStats.currentStreak,  "Streak"],
          [dStats.maxStreak,      "Best Streak"],
        ].map(([val, lbl]) => (
          <div className="stats-grid-item" key={lbl}>
            <span className="stats-grid-num">{val}</span>
            <span className="stats-grid-label">{lbl}</span>
          </div>
        ))}
      </div>

      {dStats.wins > 0 && (
        <>
          <div className="sp-sub-title">Guess Distribution</div>
          {[1,2,3,4,5,6,7,8].map(n => {
            const count = Number(dDist[n] || 0);
            const w = count > 0 ? `${Math.max(Math.round((count/dMax)*100), 4)}%` : "0%";
            return (
              <div key={n} className="stat-row">
                <span className="stat-label">{n}</span>
                <div className="stat-bar-wrap">
                  <div className={`stat-bar${String(n)===String(dBest)?" best":""}`} style={{ width: w }}>
                    {count > 0 && <span className="stat-bar-count">{Math.round((count/dStats.wins)*100)}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      <div className="stats-divider" />

      {/* Unlimited personal */}
      <div className="sp-section-title">♾️ Unlimited</div>
      <div className="stats-grid" style={{ marginBottom: "16px" }}>
        {[
          [unlim.played,          "Played"],
          [`${uPct}%`,            "Solved"],
          [unlim.wins,            "Wins"],
          [unlim.played > 0 && unlim.wins > 0
            ? (Object.entries(uDist).reduce((s,[n,c])=>s+Number(n)*c,0)/unlim.wins).toFixed(1)
            : "—",                "Avg Guesses"],
        ].map(([val, lbl]) => (
          <div className="stats-grid-item" key={lbl}>
            <span className="stats-grid-num">{val}</span>
            <span className="stats-grid-label">{lbl}</span>
          </div>
        ))}
      </div>

      {unlim.wins > 0 && (
        <>
          <div className="sp-sub-title">Guess Distribution</div>
          {[1,2,3,4,5,6,7,8].map(n => {
            const count = Number(uDist[n] || 0);
            const w = count > 0 ? `${Math.max(Math.round((count/uMax)*100), 4)}%` : "0%";
            return (
              <div key={n} className="stat-row">
                <span className="stat-label">{n}</span>
                <div className="stat-bar-wrap">
                  <div className={`stat-bar${String(n)===String(uBest)?" best":""}`} style={{ width: w }}>
                    {count > 0 && <span className="stat-bar-count">{Math.round((count/unlim.wins)*100)}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {dStats.played === 0 && unlim.played === 0 && (
        <p style={{ textAlign:"center", color:"var(--text3)", marginTop:"40px" }}>
          Play some games to see your stats here!
        </p>
      )}
    </div>
  );
}

// ── Daily Tab ──────────────────────────────────────────────────────────────────
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function DailyTab({ data, loading, onRetry }) {
  if (loading) return <div className="loading">Loading daily stats…</div>;
  if (!data)   return (
    <div style={{ textAlign:"center", marginTop:"40px" }}>
      <p style={{ color:"var(--text3)", marginBottom:"12px" }}>Could not load daily stats.</p>
      <button className="ul-subtab" onClick={onRetry}>Retry</button>
    </div>
  );

  const lastSeven  = data.last_seven || [];

  // Deduplicate by day (take the entry with most solves), sort ascending
  const dayMap = {};
  for (const row of lastSeven) {
    const key = row.day;
    if (!dayMap[key] || Number(row.solve_count) > Number(dayMap[key].solve_count)) {
      dayMap[key] = row;
    }
  }
  const chartDays = Object.values(dayMap).sort((a,b) => new Date(a.day) - new Date(b.day));
  const chartMax  = Math.max(...chartDays.map(d => Number(d.avg_guesses)), 8);

  // today card — use SQL result or fall back to most recent chart day
  const today      = data.today || [...chartDays].sort((a,b) => new Date(b.day) - new Date(a.day))[0];
  const sampleOk   = today && Number(today.solve_count) >= 100;
  const avgGuesses = today ? Number(today.avg_guesses) : null;
  const { easy: easyThresh, hard: hardThresh } = getThresholds(chartDays);
  const diff       = difficultyLabel(avgGuesses, sampleOk, easyThresh, hardThresh);

  return (
    <div className="stats-page-body">

      {/* Today's difficulty */}
      <div className="sp-section-title">Today's Puzzle</div>
      <div className="sp-difficulty-card">
        <span className="sp-diff-emoji">{diff.emoji}</span>
        <div className="sp-diff-right">
          <span className="sp-diff-label" style={{ color: diff.color }}>{diff.label}</span>
          {avgGuesses && sampleOk && (
            <span className="sp-diff-sub">
              Average solve: {Number(avgGuesses).toFixed(2)} guesses &nbsp;
            </span>
          )}
          {!sampleOk && (
            <span className="sp-diff-sub">Need 100+ solves to calculate — check back later</span>
          )}
        </div>
      </div>

      {/* 7-day chart */}
      {chartDays.length > 0 && (
        <>
          <div className="stats-divider" />
          <div className="sp-section-title">Last 7 Days</div>
          <div className="sp-chart">
            {chartDays.map((row, i) => {
              const avg     = Number(row.avg_guesses);
              const d       = difficultyLabel(avg, Number(row.solve_count) >= 100, easyThresh, hardThresh);
              const barPct  = Math.round((avg / 8) * 100);
              const date    = new Date(row.day + "T12:00:00Z");
              const dayName = DAY_LABELS[date.getUTCDay()];
              return (
                <div key={i} className="sp-chart-col">
                  <span className="sp-chart-val">{avg.toFixed(2)}</span>
                  <div className="sp-chart-bar-wrap">
                    <div
                      className="sp-chart-bar"
                      style={{
                        height: `${Math.max(barPct, 8)}%`,
                        background: d.color === "#4aaa4a" ? "#1a4d1a"
                                  : d.color === "#e05040" ? "#4a1010"
                                  : "#4a2a05",
                        borderColor: d.color,
                      }}
                      title={`${avg} avg guesses`}
                    />
                  </div>
                  <span className="sp-chart-label">{dayName}</span>
                  <span className="sp-chart-emoji">{d.emoji}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Global Tab ─────────────────────────────────────────────────────────────────
function GlobalTab({ data, loading, onRetry }) {
  if (loading) return <div className="loading">Loading global stats…</div>;
  if (!data)   return (
    <div style={{ textAlign:"center", marginTop:"40px" }}>
      <p style={{ color:"var(--text3)", marginBottom:"12px" }}>Could not load global stats.</p>
      <button className="ul-subtab" onClick={onRetry}>Retry</button>
    </div>
  );

  const totalGames   = Number(data.total_games   || 0);
  const totalWins    = Number(data.total_wins     || 0);
  const totalGuesses = Number(data.total_guesses_approx || 0);
  const unlimTotal   = Number(data.unlimited_total || 0);
  const solveRate    = pct(totalWins, totalGames);
  const dist         = data.dist || {};
  const distMax      = Math.max(...Object.values(dist).map(Number), 1);
  const topFG        = data.top_first_guesses || [];

  return (
    <div className="stats-page-body">

      {/* Summary */}
      <div className="sp-section-title">All Time</div>
      <div className="stats-grid sp-4col" style={{ marginBottom: "20px" }}>
        <div className="stats-grid-item">
          <span className="stats-grid-num">{friendlyCount(totalGames)}</span>
          <span className="stats-grid-label">Games Played</span>
        </div>
        <div className="stats-grid-item">
          <span className="stats-grid-num">{solveRate}%</span>
          <span className="stats-grid-label">Solve Rate</span>
        </div>
        <div className="stats-grid-item">
          <span className="stats-grid-num">{friendlyCount(totalGuesses)}</span>
          <span className="stats-grid-label">Guesses Made</span>
        </div>
        <div className="stats-grid-item">
          <span className="stats-grid-num">{friendlyCount(unlimTotal)}</span>
          <span className="stats-grid-label">Unlimited Plays</span>
        </div>
      </div>

      {/* Distribution */}
      {totalWins > 0 && (
        <>
          <div className="stats-divider" />
          <div className="sp-section-title">Guess Distribution (Wins)</div>
          {[1,2,3,4,5,6,7,8].map(n => {
            const count   = Number(dist[n] || 0);
            const freq    = totalWins > 0 ? Math.round((count/totalWins)*100) : 0;
            const barW    = count > 0 ? `${Math.max(Math.round((count/distMax)*100), 4)}%` : "0%";
            const isBest  = count === Math.max(...Object.values(dist).map(Number));
            return (
              <div key={n} className="stat-row">
                <span className="stat-label">{n}</span>
                <div className="stat-bar-wrap">
                  <div className={`stat-bar${isBest?" best":""}`} style={{ width: barW }}>
                    {count > 0 && <span className="stat-bar-count">{freq}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Top first guesses */}
      {topFG.length > 0 && (
        <>
          <div className="stats-divider" />
          <div className="sp-section-title">Most Common First Guesses</div>
          {topFG.map((row, i) => {
            const maxCount = Number(topFG[0].count);
            const barW = `${Math.max(Math.round((Number(row.count)/maxCount)*100), 4)}%`;
            return (
              <div key={row.first_guess} className="sp-fg-row">
                <span className="sp-fg-rank">#{i+1}</span>
                <div className="sp-fg-bar-wrap">
                  <div className="sp-fg-bar" style={{ width: barW }} />
                  <span className="sp-fg-name">{row.first_guess}</span>
                </div>
              </div>
            );
          })}
        </>
      )}

    </div>
  );
}

// ── Main Stats Page ────────────────────────────────────────────────────────────
export default function Stats() {
  const [activeTab,     setActiveTab]     = useState("my");
  const [dailyData,     setDailyData]     = useState(null);
  const [globalData,    setGlobalData]    = useState(null);
  const [loadingDaily,  setLoadingDaily]  = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const navigate = useNavigate();

  function loadDaily() {
    setLoadingDaily(true);
    fetchDailyStats().then(d  => { setDailyData(d);  setLoadingDaily(false);  });
  }
  function loadGlobal() {
    setLoadingGlobal(true);
    fetchGlobalStats().then(d => { setGlobalData(d); setLoadingGlobal(false); });
  }

  useEffect(() => { loadDaily(); loadGlobal(); }, []);

  useSEO({
    title: "Stats — Survivordle",
    description: "Survivordle statistics — your personal stats, today's difficulty rating, and global player data.",
    canonical: "https://survivordle.com/stats",
  });

  return (
    <>
      <header className="header">
        <div className="logo">
          <span className="logo-surv">SURV</span>
          <span className="logo-torch">
            <span className="logo-torch-flame">🔥</span>
            <span className="logo-torch-stem" />
          </span>
          <span className="logo-vor">VOR</span>
          <span className="logo-dle">DLE</span>
        </div>
        <div className="torch-row">
          <div className="torch-line" />
          <div className="torch-line r" />
        </div>
        <div className="tagline">Statistics</div>
      </header>

      <div className="ul-tabs">
        <button className={`ul-tab${activeTab === "my"     ? " active" : ""}`} onClick={() => setActiveTab("my")}>My Stats</button>
        <button className={`ul-tab${activeTab === "recall" ? " active" : ""}`} onClick={() => setActiveTab("recall")}>Recall</button>
        <button className={`ul-tab${activeTab === "daily"  ? " active" : ""}`} onClick={() => setActiveTab("daily")}>Daily</button>
        <button className={`ul-tab${activeTab === "global" ? " active" : ""}`} onClick={() => setActiveTab("global")}>Global</button>
      </div>

      {activeTab === "my"     && <MyStatsTab />}
      {activeTab === "recall" && <RecallStatsTab />}
      {activeTab === "daily"  && <DailyTab  data={dailyData}  loading={loadingDaily}  onRetry={loadDaily}  />}
      {activeTab === "global" && <GlobalTab data={globalData} loading={loadingGlobal} onRetry={loadGlobal} />}
    </>
  );
}
