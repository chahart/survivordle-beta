import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { logRecallEvent, fetchRecallGlobalStats } from "../shared/supabase";
import { saveRecallUnlimitedGame, loadAllRecallDailyResults, loadRecallUnlimitedHistory } from "../shared/storage";
import {
  scoreSeason, scorePlacement, scoreAge, scoreTribeColor, getGrade,
  buildStintMap, pickRandom,
  getRecallDailyAnswer, getRecallAnswerForKey,
  getTodayKeyET, getPastRecallKeys, formatRecallKey, getRecallPuzzleNumber,
  computeGPA, computeGradeDist,
} from "../shared/recallLogic";
import useSEO from "../shared/useSEO";

// ── Tribe color dot ────────────────────────────────────────────────────────────
const TRIBE_COLOR_MAP = {
  "Black":       "#333333",
  "Blue/Teal":   "#1a7abf",
  "Brown":       "#8b5e3c",
  "Green":       "#2e8b57",
  "Magenta":     "#c0306a",
  "Orange":      "#e8742a",
  "Purple":      "#7b2d8b",
  "Red":         "#c0392b",
  "Yellow/Gold": "#d4a017",
};

function TribeDot({ color, size = 10 }) {
  const hex = TRIBE_COLOR_MAP[color] || "#888";
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      background: hex, border: "1px solid rgba(255,255,255,0.15)",
      flexShrink: 0, verticalAlign: "middle", marginRight: 6,
    }} />
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
function gradeColor(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "#4aaa4a";
  if (grade === "F") return "#aa4a4a";
  return "#e8742a";
}

// Build display name with quoted nickname when showName differs from the legal name
function buildDisplayName(castaway, stintLabel) {
  const { name, showName } = castaway;
  let formatted = name;
  if (showName && !name.toLowerCase().includes(showName.toLowerCase())) {
    const spaceIdx = name.indexOf(" ");
    if (spaceIdx === -1) {
      formatted = `${name} "${showName}"`;
    } else {
      const first     = name.slice(0, spaceIdx);
      const remainder = name.slice(spaceIdx + 1);
      formatted = `${first} "${showName}" ${remainder}`;
    }
  }
  return stintLabel ? `${formatted} (${stintLabel})` : formatted;
}

// ── localStorage helpers ───────────────────────────────────────────────────────
function loadRecallResult(prefix, key) {
  try { return JSON.parse(localStorage.getItem(`${prefix}_${key}`)) || null; }
  catch { return null; }
}

function saveRecallResult(prefix, key, data) {
  try { localStorage.setItem(`${prefix}_${key}`, JSON.stringify(data)); }
  catch {}
}

// ── Name shuffle animation ─────────────────────────────────────────────────────
// phase: "loading" | "shuffling" | "revealed"
function useNameReveal(castaway, eligiblePool, skip) {
  const [phase,       setPhase]       = useState(skip ? "revealed" : "loading");
  const [shuffleName, setShuffleName] = useState("");
  const [settling,    setSettling]    = useState(false);
  const timersRef = useRef([]);

  useEffect(() => {
    // Clear any pending timers from the previous run
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (skip) { setPhase("revealed"); setSettling(false); return; }

    setPhase("loading");
    setShuffleName("");
    setSettling(false);

    // Pick 3 fakes from the pool (excluding the real castaway)
    const others = eligiblePool.filter(c => c.id !== castaway.id);
    const fakes = [];
    const usedIdx = new Set();
    while (fakes.length < 3 && fakes.length < others.length) {
      const idx = Math.floor(Math.random() * others.length);
      if (!usedIdx.has(idx)) { usedIdx.add(idx); fakes.push(others[idx].name); }
    }

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timersRef.current.push(id);
      return id;
    };

    // 400ms loading → flash fakes at 180ms / 140ms / 100ms → settle
    let t = 400;
    schedule(() => setPhase("shuffling"), 0);
    const durations = [180, 140, 100];
    fakes.forEach((name, i) => {
      schedule(() => setShuffleName(name), t);
      t += durations[i];
    });
    schedule(() => {
      setPhase("revealed");
      setSettling(true);
      schedule(() => setSettling(false), 200);
    }, t);

    return () => { timersRef.current.forEach(clearTimeout); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castaway.id]);

  return { phase, shuffleName, settling };
}

// ── Flip card result display ───────────────────────────────────────────────────
const FLIP_RESULT_COLOR = {
  correct: "#4aaa4a",
  close:   "#e8742a",
  wrong:   "#e05040",
};
const FLIP_RESULT_BG = {
  correct: "rgba(74,170,74,0.12)",
  close:   "rgba(232,116,42,0.12)",
  wrong:   "rgba(224,80,64,0.12)",
};

function flipScoreClass(pts, max) {
  if (pts === max) return "correct";
  if (pts > 0)     return "close";
  return "wrong";
}

function FlipCard({ label, guessDisplay, answerDisplay, pts, maxPts, flipped, isTribe, guessColor, answerColor }) {
  const cls       = flipScoreClass(pts, maxPts);
  const textColor = FLIP_RESULT_COLOR[cls];
  const bgColor   = FLIP_RESULT_BG[cls];

  return (
    <div className="rfc-perspective">
      <div className={`rfc-inner${flipped ? " rfc-flipped" : ""}`}>

        {/* Face */}
        <div className="rfc-face rfc-face--front">
          <span className="rfc-label">{label}</span>
          <span className="rfc-guess-main">
            {isTribe && guessColor && <TribeDot color={guessColor} size={14} />}
            {guessDisplay}
          </span>
        </div>

        {/* Back */}
        <div className="rfc-face rfc-face--back" style={{ background: bgColor, borderColor: textColor }}>
          <span className="rfc-label">{label}</span>
          <span className="rfc-back-guess">
            {isTribe && guessColor && <TribeDot color={guessColor} size={10} />}
            {guessDisplay}
          </span>
          <span className="rfc-answer" style={{ color: textColor }}>
            {isTribe && answerColor && <TribeDot color={answerColor} size={14} />}
            {answerDisplay}
          </span>
          <span className="rfc-pts" style={{ color: textColor }}>+{pts} / {maxPts}</span>
        </div>

      </div>
    </div>
  );
}

function FlipResults({
  skipAnimation,
  seasonVal, placementVal, ageVal, tribeColorVal,
  castaway,
  seasonPts, placementPts, agePts, tribePts, total, grade,
  onShare, copied,
  mode, isDaily, onNavigateStats,
}) {
  const ALL_FLIPPED = [true, true, true, true];
  const [flipped,      setFlipped]      = useState(skipAnimation ? ALL_FLIPPED : [false, false, false, false]);
  const [scoreVisible, setScoreVisible] = useState(skipAnimation);
  const timersRef = useRef([]);

  useEffect(() => {
    if (skipAnimation) return;

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timersRef.current.push(id);
    };

    // Flip each card with 600ms stagger
    [0, 1, 2, 3].forEach(i => {
      schedule(() => {
        setFlipped(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, i * 600);
    });

    // After last flip (1800ms) + 400ms wait → fade in score
    schedule(() => setScoreVisible(true), 1800 + 400);

    return () => { timersRef.current.forEach(clearTimeout); };
  // Only runs once on mount — intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="recall-results">
      <div className="rfc-grid">
        <FlipCard
          label="Season"
          guessDisplay={`S${seasonVal}`}
          answerDisplay={`S${castaway.season}`}
          pts={seasonPts} maxPts={40}
          flipped={flipped[0]}
        />
        <FlipCard
          label="Placement"
          guessDisplay={`#${placementVal}`}
          answerDisplay={`#${castaway.placement}`}
          pts={placementPts} maxPts={40}
          flipped={flipped[1]}
        />
        <FlipCard
          label="Age"
          guessDisplay={ageVal}
          answerDisplay={String(castaway.age ?? "?")}
          pts={agePts} maxPts={12}
          flipped={flipped[2]}
        />
        <FlipCard
          label="Tribe Color"
          guessDisplay={tribeColorVal || "—"}
          answerDisplay={castaway.tribe_color}
          pts={tribePts} maxPts={8}
          flipped={flipped[3]}
          isTribe
          guessColor={tribeColorVal}
          answerColor={castaway.tribe_color}
        />
      </div>

      <div className={`rfc-summary${scoreVisible ? " rfc-summary--visible" : ""}`}>
        <div className="recall-score-banner">
          <div className="recall-score-total">{total} / 100</div>
          <div className="recall-score-grade" style={{ color: gradeColor(grade) }}>{grade}</div>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="share-btn" onClick={onShare}>
            {copied ? "✓ Copied!" : "📋 Share Result"}
          </button>
          {onNavigateStats && (
            <button className="share-btn" onClick={onNavigateStats}>
              📊 Recall Stats
            </button>
          )}
        </div>
        {isDaily && (
          <p style={{ textAlign: "center", color: "var(--text3)", fontSize: "13px" }}>
            Come back tomorrow for a new castaway!
          </p>
        )}
      </div>
    </div>
  );
}

// ── Recall game form ───────────────────────────────────────────────────────────
const RECALL_SHARE_EMOJI = { correct: "🟩", close: "🟨", wrong: "🟥" };

function recallShareEmoji(pts, max) {
  if (pts === max) return RECALL_SHARE_EMOJI.correct;
  if (pts > 0)     return RECALL_SHARE_EMOJI.close;
  return RECALL_SHARE_EMOJI.wrong;
}

function RecallGame({ castaway, stintMap, tribeColors, eligiblePool, onComplete, savedResult, mode, puzzleKey, onNavigateStats }) {
  const stintLabel   = stintMap[castaway.id];
  const displayName  = buildDisplayName(castaway, stintLabel);

  // Capture whether a saved result existed at mount — not reactive to later prop changes.
  // This prevents the parent's setSaved() call (which flows savedResult back in)
  // from killing the flip animation on the same render it triggers.
  const skipFlipRef = useRef(!!savedResult);
  const skipFlip = skipFlipRef.current;
  const { phase, shuffleName, settling } = useNameReveal(castaway, eligiblePool, skipFlip);

  const [submitted,     setSubmitted]     = useState(!!savedResult);
  const [seasonVal,     setSeasonVal]     = useState(savedResult ? String(savedResult.seasonVal)    : "");
  const [placementVal,  setPlacementVal]  = useState(savedResult ? String(savedResult.placementVal) : "");
  const [ageVal,        setAgeVal]        = useState(savedResult ? String(savedResult.ageVal)       : "");
  const [tribeColorVal, setTribeColorVal] = useState(savedResult ? savedResult.tribeColorVal        : "");
  const [error,         setError]         = useState("");
  const [copied,        setCopied]        = useState(false);

  const seasonPts    = submitted ? scoreSeason(Number(seasonVal),       castaway.season)      : null;
  const placementPts = submitted ? scorePlacement(Number(placementVal), castaway.placement)   : null;
  const agePts       = submitted ? scoreAge(Number(ageVal),             castaway.age)         : null;
  const tribePts     = submitted ? scoreTribeColor(tribeColorVal,       castaway.tribe_color) : null;
  const total        = submitted ? (seasonPts + placementPts + agePts + tribePts)             : null;
  const grade        = submitted ? getGrade(total)                                            : null;

  function handleSubmit() {
    if (!seasonVal || !placementVal || !ageVal || !tribeColorVal) {
      setError("Please fill in all four fields before submitting.");
      return;
    }
    setError("");
    setSubmitted(true);
    const sP  = scoreSeason(Number(seasonVal),       castaway.season);
    const plP = scorePlacement(Number(placementVal), castaway.placement);
    const aP  = scoreAge(Number(ageVal),             castaway.age);
    const tP  = scoreTribeColor(tribeColorVal,       castaway.tribe_color);
    const tot = sP + plP + aP + tP;
    const g   = getGrade(tot);
    logRecallEvent({
      puzzle: `${castaway.name} - ${castaway.seasonNameFull}`,
      mode,
      guess_season:      Number(seasonVal),
      guess_placement:   Number(placementVal),
      guess_age:         Number(ageVal),
      guess_tribe_color: tribeColorVal,
      pts_season:        sP,
      pts_placement:     plP,
      pts_age:           aP,
      pts_tribe_color:   tP,
      score:             tot,
      grade:             g,
    });
    onComplete({
      puzzle: `${castaway.name} - ${castaway.seasonNameFull}`,
      seasonVal, placementVal, ageVal, tribeColorVal,
      total: tot, grade: g,
      pts_season: sP, pts_placement: plP, pts_age: aP, pts_tribe_color: tP,
    });
  }

  function handleShare() {
    const puzzleNum = getRecallPuzzleNumber(puzzleKey);
    const label = mode === "recall_daily"
      ? `Survivordle Recall #${puzzleNum}: ${grade}`
      : mode === "recall_archive"
      ? `Survivordle Recall Archive: ${grade}`
      : `Survivordle Recall Unlimited: ${grade}`;
    const emojiRow = [
      recallShareEmoji(seasonPts,    40),
      recallShareEmoji(placementPts, 40),
      recallShareEmoji(agePts,       12),
      recallShareEmoji(tribePts,      8),
    ].join("");
    const text = `${label}\n${emojiRow}\nsurvivordle.com/recall`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // What to show in the name card
  const nameInCard = phase === "loading"
    ? "…"
    : phase === "shuffling"
    ? shuffleName
    : displayName;

  const nameStyle = {
    transition: settling ? "color 0.2s ease, transform 0.2s ease" : "none",
    display: "inline-block",
    transform: settling ? "scale(1.04)" : "scale(1)",
    color: settling ? "#f7c66a" : undefined,
  };

  const isAnimating = phase !== "revealed";

  return (
    <>
      <div className="recall-card">
        <div className="recall-castaway-label">
          {phase === "loading" ? "Finding your castaway…" : "Who is this castaway?"}
        </div>
        <div className="recall-castaway-name" style={{ minHeight: "1.2em" }}>
          <span style={nameStyle}>{nameInCard}</span>
        </div>
        {!isAnimating && (
          <div className="recall-castaway-sub">Fill in their stats from memory, then submit.</div>
        )}
      </div>

      {!isAnimating && !submitted && (
        <div className="recall-form">
          <div className="recall-fields">
            <div className="recall-field">
              <label className="recall-field-label">Season Number</label>
              <input className="recall-input" type="number" min="1" max="50" placeholder="1-50"
                value={seasonVal} onChange={e => setSeasonVal(e.target.value)} />
            </div>
            <div className="recall-field">
              <label className="recall-field-label">Placement</label>
              <input className="recall-input" type="number" min="1" max="24" placeholder="1-24"
                value={placementVal} onChange={e => setPlacementVal(e.target.value)} />
            </div>
            <div className="recall-field">
              <label className="recall-field-label">Age (during season)</label>
              <input className="recall-input" type="number" min="1" max="100" placeholder="e.g. 26"
                value={ageVal} onChange={e => setAgeVal(e.target.value)} />
            </div>
            <div className="recall-field">
              <label className="recall-field-label">Tribe Color</label>
              <div className="recall-select-wrap">
                {tribeColorVal && <TribeDot color={tribeColorVal} size={12} />}
                <select className="recall-select" value={tribeColorVal}
                  onChange={e => setTribeColorVal(e.target.value)}>
                  <option value="">Select tribe color</option>
                  {tribeColors.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          {error && <div className="recall-error">{error}</div>}
          <button className="recall-submit-btn" onClick={handleSubmit}>Submit Answers</button>
        </div>
      )}

      {!isAnimating && submitted && (
        <FlipResults
          skipAnimation={skipFlip}
          seasonVal={seasonVal}
          placementVal={placementVal}
          ageVal={ageVal}
          tribeColorVal={tribeColorVal}
          castaway={castaway}
          seasonPts={seasonPts}
          placementPts={placementPts}
          agePts={agePts}
          tribePts={tribePts}
          total={total}
          grade={grade}
          onShare={handleShare}
          copied={copied}
          mode={mode}
          isDaily={mode === "recall_daily"}
          onNavigateStats={onNavigateStats}
        />
      )}
    </>
  );
}

// ── Daily mode ─────────────────────────────────────────────────────────────────
function RecallDaily({ contestants, stintMap, tribeColors, eligiblePool, onNavigateStats }) {
  const todayKey = getTodayKeyET();
  const castaway = useMemo(() => getRecallDailyAnswer(contestants), [contestants]);
  const savedKey = `recall_daily_${todayKey}`;
  const [saved, setSaved] = useState(() => loadRecallResult("recall_daily", todayKey));

  function handleComplete(result) {
    saveRecallResult("recall_daily", todayKey, result);
    setSaved(result);
  }

  if (!castaway) return <div className="loading">Loading…</div>;

  return (
    <div className="recall-page">
      <div className="mode-banner">
        <div className="mode-banner-left">
          <span className="mode-banner-label">Recall Daily</span>
          <span className="mode-banner-title">🔥 Today's castaway</span>
        </div>
      </div>

      <RecallGame
        key={savedKey}
        castaway={castaway}
        stintMap={stintMap}
        tribeColors={tribeColors}
        eligiblePool={eligiblePool}
        onComplete={handleComplete}
        savedResult={saved}
        mode="recall_daily"
        puzzleKey={todayKey}
        onNavigateStats={onNavigateStats}
      />
    </div>
  );
}

// ── Unlimited mode ─────────────────────────────────────────────────────────────
function RecallUnlimited({ stintMap, tribeColors, eligiblePool, onNavigateStats }) {
  const [seenIds,  setSeenIds]  = useState(() => new Set());
  const [castaway, setCastaway] = useState(() => pickRandom(eligiblePool, new Set()));
  const [gameKey,  setGameKey]  = useState(0);
  const [done,     setDone]     = useState(false);

  function handleComplete(result) {
    saveRecallUnlimitedGame({
      puzzle:          result.puzzle,
      total_score:     result.total,
      grade:           result.grade,
      season_score:    result.pts_season,
      placement_score: result.pts_placement,
      age_score:       result.pts_age,
      tribe_score:     result.pts_tribe_color,
    });
    setDone(true);
  }

  function handlePlayAgain() {
    const newSeen = new Set(seenIds);
    newSeen.add(castaway.id);
    let next = pickRandom(eligiblePool, newSeen);
    if (!next) { newSeen.clear(); next = pickRandom(eligiblePool, newSeen); }
    setSeenIds(newSeen);
    setCastaway(next);
    setGameKey(k => k + 1);
    setDone(false);
  }

  if (!castaway) return <div className="loading">Loading…</div>;

  return (
    <div className="recall-page">
      <div className="mode-banner">
        <div className="mode-banner-left">
          <span className="mode-banner-label">Recall Unlimited</span>
          <span className="mode-banner-title">♾️ Random castaway every round</span>
        </div>
        {done && (
          <button className="archive-play-btn" onClick={handlePlayAgain}>🔀 Play Again</button>
        )}
      </div>

      <RecallGame
        key={gameKey}
        castaway={castaway}
        stintMap={stintMap}
        tribeColors={tribeColors}
        eligiblePool={eligiblePool}
        onComplete={handleComplete}
        savedResult={null}
        mode="recall_unlimited"
        puzzleKey={null}
        onNavigateStats={onNavigateStats}
      />
    </div>
  );
}

// ── Archive mode ───────────────────────────────────────────────────────────────
function RecallArchive({ contestants, stintMap, tribeColors, eligiblePool, onNavigateStats }) {
  const pastKeys = useMemo(() => getPastRecallKeys(), []);
  const [selectedKey, setSelectedKey] = useState(null);
  const [saved,       setSaved]       = useState(null);

  function selectEntry(key) {
    const existing = loadRecallResult("recall_archive", key);
    setSaved(existing);
    setSelectedKey(key);
  }

  function handleComplete(result) {
    saveRecallResult("recall_archive", selectedKey, result);
    setSaved(result);
  }

  if (selectedKey) {
    const castaway = getRecallAnswerForKey(eligiblePool, selectedKey);
    return (
      <div className="recall-page">
        <div className="mode-banner">
          <div className="mode-banner-left">
            <span className="mode-banner-label">Recall Archive</span>
            <span className="mode-banner-title">{formatRecallKey(selectedKey)}</span>
          </div>
          <button
            className="archive-play-btn"
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text2)", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600 }}
            onClick={() => { setSelectedKey(null); setSaved(null); }}
          >
            ← Back
          </button>
        </div>

        <RecallGame
          key={selectedKey}
          castaway={castaway}
          stintMap={stintMap}
          tribeColors={tribeColors}
          eligiblePool={eligiblePool}
          onComplete={handleComplete}
          savedResult={saved}
          mode="recall_archive"
          puzzleKey={selectedKey}
          onNavigateStats={onNavigateStats}
        />
      </div>
    );
  }

  return (
    <div className="recall-page">
      <p className="modal-body" style={{ textAlign: "center", marginBottom: "20px" }}>
        Play any past Recall puzzle. Archive games don't affect your stats.
      </p>

      {pastKeys.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text3)", fontSize: "14px" }}>
          No past puzzles yet — check back tomorrow!
        </p>
      ) : (
        <div className="archive-list">
          {pastKeys.map(key => {
            const prev = loadRecallResult("recall_archive", key);
            return (
              <div key={key} className="archive-item" onClick={() => selectEntry(key)}>
                <div className="archive-item-left">
                  <span className="archive-item-num">{formatRecallKey(key)}</span>
                </div>
                {prev ? (
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "18px", color: gradeColor(prev.grade), letterSpacing: "1px" }}>
                    {prev.grade} &nbsp;·&nbsp; {prev.total}/100
                  </span>
                ) : (
                  <button className="archive-play-btn">Play</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Grade color helpers ────────────────────────────────────────────────────────
const GRADE_BAR_COLORS = {
  A: { bg: "#1a4d1a", border: "#4aaa4a" },
  B: { bg: "#4a2a05", border: "#f09030" },
  C: { bg: "#1a2a4a", border: "#4a8aff" },
  D: { bg: "#3a3a10", border: "#aaaa4a" },
  F: { bg: "#4a1a1a", border: "#aa4a4a" },
};

function GradeDistBars({ dist }) {
  const max = Math.max(...Object.values(dist), 1);
  return (
    <>
      <div className="sp-sub-title" style={{ marginTop: "20px" }}>Grade Distribution</div>
      {["A", "B", "C", "D", "F"].map(letter => {
        const count = dist[letter] || 0;
        const w = count > 0 ? `${Math.max(Math.round((count / max) * 100), 4)}%` : "0%";
        const { bg, border } = GRADE_BAR_COLORS[letter];
        return (
          <div key={letter} className="stat-row">
            <span className="stat-label">{letter}</span>
            <div className="stat-bar-wrap">
              <div className="stat-bar" style={{ width: w, background: bg, border: `1px solid ${border}` }}>
                {count > 0 && <span className="stat-bar-count">{count}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function RecallMyStats() {
  const dailyResults  = loadAllRecallDailyResults();
  const unlimHistory  = loadRecallUnlimitedHistory();

  function StatsSection({ results, label, scoreField = "total" }) {
    if (!results.length) {
      return (
        <div style={{ marginBottom: "28px" }}>
          <div className="sp-sub-title">{label}</div>
          <p style={{ textAlign: "center", color: "var(--text3)", fontSize: "13px", marginTop: "12px" }}>
            No games yet
          </p>
        </div>
      );
    }
    const grades  = results.map(r => r.grade);
    const gpa     = computeGPA(grades);
    const scores  = results.map(r => r[scoreField] ?? r.total ?? r.total_score ?? 0);
    const avgPct  = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const best    = scores.length ? Math.max(...scores) : 0;
    const dist    = computeGradeDist(grades);

    return (
      <div style={{ marginBottom: "32px" }}>
        <div className="sp-sub-title">{label}</div>
        <div className="stats-grid" style={{ marginTop: "12px", marginBottom: "12px" }}>
          {[
            [results.length, "Played"],
            [`${avgPct}%`,   "Avg Score"],
            [gpa ?? "—",     "GPA"],
            [best,           "Best Score"],
          ].map(([val, lbl]) => (
            <div className="stats-grid-item" key={lbl}>
              <span className="stats-grid-num">{val}</span>
              <span className="stats-grid-label">{lbl}</span>
            </div>
          ))}
        </div>
        <GradeDistBars dist={dist} />
      </div>
    );
  }

  return (
    <div>
      <StatsSection results={dailyResults} label="Daily" />
      <StatsSection results={unlimHistory} label="Unlimited" scoreField="total_score" />
    </div>
  );
}

const RECALL_GRADE_COLORS = {
  A: { bg: "#1a4d1a", border: "#4aaa4a" },
  B: { bg: "#4a2a05", border: "#f09030" },
  C: { bg: "#1a2a4a", border: "#4a8aff" },
  D: { bg: "#3a3a10", border: "#aaaa4a" },
  F: { bg: "#4a1a1a", border: "#aa4a4a" },
};

function friendlyK(n) {
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${Math.floor(num / 1000)}K`;
  return num.toLocaleString();
}

function RecallGlobalStats() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecallGlobalStats().then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <p style={{ textAlign: "center", color: "var(--text3)", marginTop: "24px" }}>Loading…</p>;
  if (!data)   return <p style={{ textAlign: "center", color: "var(--text3)", marginTop: "24px" }}>Could not load global stats.</p>;

  const total_plays     = Number(data.total_plays     || 0);
  const unlimited_plays = Number(data.unlimited_plays || 0);
  const avg_score       = data.avg_score != null ? Math.round(Number(data.avg_score)) : null;
  const avg_gpa         = data.avg_gpa   != null ? Number(data.avg_gpa).toFixed(2)   : null;
  const grade_dist      = data.grade_dist || {};
  const gradeMax        = Math.max(...Object.values(grade_dist).map(Number), 1);
  const easiest         = data.easiest || [];
  const hardest         = data.hardest || [];

  return (
    <div>
      <div className="stats-grid sp-4col" style={{ marginBottom: "20px" }}>
        {[
          [friendlyK(total_plays),                     "Total Plays"],
          [avg_score != null ? `${avg_score}%` : "—", "Avg Score"],
          [avg_gpa   != null ? avg_gpa          : "—", "Total GPA"],
          [friendlyK(unlimited_plays),                 "Unlimited Plays"],
        ].map(([val, lbl]) => (
          <div className="stats-grid-item" key={lbl}>
            <span className="stats-grid-num" style={{ fontSize: "32px" }}>{val}</span>
            <span className="stats-grid-label">{lbl}</span>
          </div>
        ))}
      </div>

      {total_plays > 0 && (
        <>
          <div className="sp-sub-title">Grade Distribution</div>
          {["A", "B", "C", "D", "F"].map(letter => {
            const count = Number(grade_dist[letter] || 0);
            const pct   = total_plays > 0 ? Math.round((count / total_plays) * 100) : 0;
            const w     = count > 0 ? `${Math.max(Math.round((count / gradeMax) * 100), 4)}%` : "0%";
            const { bg, border } = RECALL_GRADE_COLORS[letter];
            return (
              <div key={letter} className="stat-row">
                <span className="stat-label">{letter}</span>
                <div className="stat-bar-wrap">
                  <div className="stat-bar" style={{ width: w, background: `linear-gradient(90deg, ${bg}, ${bg})`, border: `1px solid ${border}` }}>
                    {count > 0 && <span className="stat-bar-count">{pct}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      {(easiest.length > 0 || hardest.length > 0) && (
        <>
          <div className="stats-divider" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <div className="sp-sub-title" style={{ color: "#4aaa4a" }}>Easiest</div>
              {easiest.map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.3, paddingRight: "8px" }}>{row.puzzle}</span>
                  <span style={{ fontSize: "13px", fontFamily: "'Bebas Neue', sans-serif", color: "#4aaa4a", whiteSpace: "nowrap" }}>{Math.round(row.avg_score)}%</span>
                </div>
              ))}
            </div>
            <div>
              <div className="sp-sub-title" style={{ color: "#e05040" }}>Hardest</div>
              {hardest.map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.3, paddingRight: "8px" }}>{row.puzzle}</span>
                  <span style={{ fontSize: "13px", fontFamily: "'Bebas Neue', sans-serif", color: "#e05040", whiteSpace: "nowrap" }}>{Math.round(row.avg_score)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function RecallInlineStats() {
  const [sub, setSub] = useState("mystats");

  return (
    <div className="recall-page">
      <div className="ul-subtabs" style={{ marginBottom: "20px", marginTop: "0" }}>
        <button className={`ul-subtab${sub === "mystats" ? " active" : ""}`} onClick={() => setSub("mystats")}>My Stats</button>
        <button className={`ul-subtab${sub === "daily"   ? " active" : ""}`} onClick={() => setSub("daily")}>Daily</button>
        <button className={`ul-subtab${sub === "global"  ? " active" : ""}`} onClick={() => setSub("global")}>Global</button>
      </div>
      {sub === "mystats" && <RecallMyStats />}
      {sub === "daily"   && (
        <p style={{ textAlign: "center", color: "var(--text3)", marginTop: "24px", fontSize: "14px" }}>
          Coming soon
        </p>
      )}
      {sub === "global"  && <RecallGlobalStats />}
    </div>
  );
}

// ── "What is Recall?" info popover ────────────────────────────────────────────
function RecallInfoPopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="recall-info-wrap" ref={ref}>
      <button
        className="recall-info-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="What is Recall?"
        aria-expanded={open}
      >
        ⓘ <span className="recall-info-label">What is Recall?</span>
      </button>

      {open && (
        <div className="recall-info-popover" role="dialog" aria-label="What is Recall?">
          <p className="recall-info-heading">The reverse of Survivordle.</p>
          <p className="recall-info-body">
            You're shown a castaway's name, and have to guess their Season, Placement, Age, and Tribe Color
            from memory. Earn up to 100 points and a letter grade from A+ down to F.
          </p>
          <div className="recall-info-scoring">
            <div className="recall-info-score-row">
              <span className="recall-info-field">Season</span>
              <span className="recall-info-pts">40 pts, −4 per season off</span>
            </div>
            <div className="recall-info-score-row">
              <span className="recall-info-field">Placement</span>
              <span className="recall-info-pts">40 pts, −4 per place off</span>
            </div>
            <div className="recall-info-score-row">
              <span className="recall-info-field">Age</span>
              <span className="recall-info-pts">
                12 pts if within 3 years<br />
                8 pts if within 5 years<br />
                4 pts if within 10 years<br />
                0 pts otherwise
              </span>
            </div>
            <div className="recall-info-score-row">
              <span className="recall-info-field">Tribe Color</span>
              <span className="recall-info-pts">8 pts, exact match only</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root Recall page ───────────────────────────────────────────────────────────
export default function Recall({ contestants }) {
  const navigate = useNavigate();
  const location = useLocation();

  useSEO({
    title: "Survivordle Recall — Name the Castaway's Stats",
    description: "The reverse of Survivordle — you see the castaway's name, you recall their stats from memory.",
    canonical: "https://survivordle.com/recall",
  });

  const stintMap     = useMemo(() => buildStintMap(contestants), [contestants]);
  const tribeColors  = useMemo(() => {
    const colors = new Set(contestants.map(c => c.tribe_color).filter(Boolean));
    return Array.from(colors).sort();
  }, [contestants]);

  const path = location.pathname.replace(/\/$/, "");
  const activeTab = path === "/recall/archive"   ? "archive"
                  : path === "/recall/unlimited" ? "unlimited"
                  : path === "/recall/stats"     ? "stats"
                  : "daily";

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
        <div className="tagline">Recall Mode &nbsp;·&nbsp; Remember the stats</div>
      </header>

      <div className="ul-tabs" style={{ position: "relative" }}>
        <button className={`ul-tab${activeTab === "daily"     ? " active" : ""}`} onClick={() => navigate("/recall")}>
          🔥 Daily
        </button>
        <button className={`ul-tab${activeTab === "archive"   ? " active" : ""}`} onClick={() => navigate("/recall/archive")}>
          📁 Archive
        </button>
        <button className={`ul-tab${activeTab === "unlimited" ? " active" : ""}`} onClick={() => navigate("/recall/unlimited")}>
          ♾️ Unlimited
        </button>
        <button className={`ul-tab${activeTab === "stats"     ? " active" : ""}`} onClick={() => navigate("/recall/stats")}>
          📊 Stats
        </button>
        <RecallInfoPopover />
      </div>

      {activeTab === "daily"     && <RecallDaily     contestants={contestants} stintMap={stintMap} tribeColors={tribeColors} eligiblePool={contestants} onNavigateStats={() => navigate("/recall/stats")} />}
      {activeTab === "archive"   && <RecallArchive   contestants={contestants} stintMap={stintMap} tribeColors={tribeColors} eligiblePool={contestants} onNavigateStats={() => navigate("/recall/stats")} />}
      {activeTab === "unlimited" && <RecallUnlimited stintMap={stintMap} tribeColors={tribeColors} eligiblePool={contestants} onNavigateStats={() => navigate("/recall/stats")} />}
      {activeTab === "stats"     && <RecallInlineStats />}
    </>
  );
}
