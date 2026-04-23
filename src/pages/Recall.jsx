import { useState, useMemo } from "react";
import { logSolveEvent } from "../shared/supabase";
import { scoreSeason, scorePlacement, scoreAge, scoreTribeColor, getGrade, buildStintMap, getEligibleContestants, pickRandom } from "../shared/recallLogic";
import useSEO from "../shared/useSEO";

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
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: hex,
        border: "1px solid rgba(255,255,255,0.15)",
        flexShrink: 0,
        verticalAlign: "middle",
        marginRight: 6,
      }}
    />
  );
}

function scoreColor(pts, max) {
  if (pts === max) return "correct";
  if (pts > 0)     return "close";
  return "wrong";
}

export default function Recall({ contestants }) {
  useSEO({
    title: "Survivordle Recall — Name the Castaway's Stats",
    description: "The reverse of Survivordle — you see the castaway's name, you recall their stats from memory.",
    canonical: "https://survivordle.com/recall",
  });

  const stintMap = useMemo(() => buildStintMap(contestants), [contestants]);
  const eligiblePool = useMemo(() => getEligibleContestants(contestants), [contestants]);
  const tribeColors = useMemo(() => {
    const colors = new Set(contestants.map(c => c.tribe_color).filter(Boolean));
    return Array.from(colors).sort();
  }, [contestants]);

  const [seenIds,    setSeenIds]    = useState(() => new Set());
  const [castaway,   setCastaway]   = useState(() => pickRandom(getEligibleContestants(contestants), new Set()));
  const [submitted,  setSubmitted]  = useState(false);
  const [error,      setError]      = useState("");

  const [seasonVal,      setSeasonVal]      = useState("");
  const [placementVal,   setPlacementVal]   = useState("");
  const [ageVal,         setAgeVal]         = useState("");
  const [tribeColorVal,  setTribeColorVal]  = useState("");

  if (!castaway) {
    return <div className="recall-page"><p style={{ color: "var(--text3)", textAlign: "center" }}>Loading…</p></div>;
  }

  const stintLabel = stintMap[castaway.id];
  const displayName = stintLabel ? `${castaway.name} (${stintLabel})` : castaway.name;

  function handleSubmit() {
    if (!seasonVal || !placementVal || !ageVal || !tribeColorVal) {
      setError("Please fill in all four fields before submitting.");
      return;
    }
    setError("");
    setSubmitted(true);

    const seasonPts     = scoreSeason(Number(seasonVal),    castaway.season);
    const placementPts  = scorePlacement(Number(placementVal), castaway.placement);
    const agePts        = scoreAge(Number(ageVal),          castaway.age);
    const tribeColorPts = scoreTribeColor(tribeColorVal,    castaway.tribe_color);
    const total = seasonPts + placementPts + agePts + tribeColorPts;

    logSolveEvent({
      puzzle: `${castaway.name} - ${castaway.seasonNameFull}`,
      guesses: 1,
      hints: false,
      won: total === 100,
      mode: "recall",
      firstGuess: null,
      secondGuess: null,
    });
  }

  function handlePlayAgain() {
    const newSeen = new Set(seenIds);
    newSeen.add(castaway.id);

    let nextPool = eligiblePool;
    let next = pickRandom(nextPool, newSeen);
    if (!next) {
      // All exhausted — reset pool
      newSeen.clear();
      next = pickRandom(nextPool, newSeen);
    }

    setSeenIds(newSeen);
    setCastaway(next);
    setSubmitted(false);
    setError("");
    setSeasonVal("");
    setPlacementVal("");
    setAgeVal("");
    setTribeColorVal("");
  }

  const seasonPts    = submitted ? scoreSeason(Number(seasonVal),     castaway.season)    : null;
  const placementPts = submitted ? scorePlacement(Number(placementVal), castaway.placement) : null;
  const agePts       = submitted ? scoreAge(Number(ageVal),            castaway.age)       : null;
  const tribePts     = submitted ? scoreTribeColor(tribeColorVal,      castaway.tribe_color) : null;
  const total        = submitted ? (seasonPts + placementPts + agePts + tribePts) : null;
  const grade        = submitted ? getGrade(total) : null;

  const gradeColor = grade === "A+" || grade === "A" || grade === "A-"
    ? "#4aaa4a"
    : grade === "F"
    ? "#aa4a4a"
    : "#e8742a";

  return (
    <div className="recall-page">
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

      <div className="recall-card">
        <div className="recall-castaway-label">Who is this castaway?</div>
        <div className="recall-castaway-name">{displayName}</div>
        <div className="recall-castaway-sub">
          Fill in their stats from memory, then submit.
        </div>
      </div>

      {!submitted ? (
        <div className="recall-form">
          <div className="recall-fields">
            <div className="recall-field">
              <label className="recall-field-label">Season Number</label>
              <input
                className="recall-input"
                type="number"
                min="1"
                max="50"
                placeholder="1-50"
                value={seasonVal}
                onChange={e => setSeasonVal(e.target.value)}
              />
            </div>

            <div className="recall-field">
              <label className="recall-field-label">Placement</label>
              <input
                className="recall-input"
                type="number"
                min="1"
                max="24"
                placeholder="1-24"
                value={placementVal}
                onChange={e => setPlacementVal(e.target.value)}
              />
            </div>

            <div className="recall-field">
              <label className="recall-field-label">Age (during season)</label>
              <input
                className="recall-input"
                type="number"
                min="1"
                max="100"
                placeholder="e.g. 26"
                value={ageVal}
                onChange={e => setAgeVal(e.target.value)}
              />
            </div>

            <div className="recall-field">
              <label className="recall-field-label">Tribe Color</label>
              <div className="recall-select-wrap">
                {tribeColorVal && <TribeDot color={tribeColorVal} size={12} />}
                <select
                  className="recall-select"
                  value={tribeColorVal}
                  onChange={e => setTribeColorVal(e.target.value)}
                >
                  <option value="">Select tribe color</option>
                  {tribeColors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && <div className="recall-error">{error}</div>}

          <button className="recall-submit-btn" onClick={handleSubmit}>
            Submit Answers
          </button>
        </div>
      ) : (
        <div className="recall-results">
          <div className="recall-score-banner">
            <div className="recall-score-total">{total} / 100</div>
            <div className="recall-score-grade" style={{ color: gradeColor }}>{grade}</div>
          </div>

          <div className="recall-breakdown">
            <ResultRow
              label="Season"
              guessDisplay={`S${seasonVal}`}
              answerDisplay={`S${castaway.season}`}
              pts={seasonPts}
              maxPts={40}
            />
            <ResultRow
              label="Placement"
              guessDisplay={`#${placementVal}`}
              answerDisplay={`#${castaway.placement}`}
              pts={placementPts}
              maxPts={40}
            />
            <ResultRow
              label="Age"
              guessDisplay={ageVal}
              answerDisplay={String(castaway.age ?? "?")}
              pts={agePts}
              maxPts={12}
            />
            <ResultRowTribe
              label="Tribe Color"
              guessVal={tribeColorVal}
              answerVal={castaway.tribe_color}
              pts={tribePts}
              maxPts={8}
            />
          </div>

          <button className="recall-again-btn" onClick={handlePlayAgain}>
            🔀 Play Again
          </button>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, guessDisplay, answerDisplay, pts, maxPts }) {
  const cls = scoreColor(pts, maxPts);
  return (
    <div className={`recall-result-row recall-result-row--${cls}`}>
      <div className="recall-result-label">{label}</div>
      <div className="recall-result-guess">
        <span className="recall-result-guess-label">Your answer</span>
        <span className="recall-result-val">{guessDisplay}</span>
      </div>
      <div className="recall-result-answer">
        <span className="recall-result-guess-label">Correct</span>
        <span className="recall-result-val">{answerDisplay}</span>
      </div>
      <div className="recall-result-pts">
        <span className="recall-result-pts-num">{pts}</span>
        <span className="recall-result-pts-denom">/ {maxPts}</span>
      </div>
    </div>
  );
}

function ResultRowTribe({ label, guessVal, answerVal, pts, maxPts }) {
  const cls = scoreColor(pts, maxPts);
  return (
    <div className={`recall-result-row recall-result-row--${cls}`}>
      <div className="recall-result-label">{label}</div>
      <div className="recall-result-guess">
        <span className="recall-result-guess-label">Your answer</span>
        <span className="recall-result-val" style={{ display: "flex", alignItems: "center" }}>
          <TribeDot color={guessVal} size={10} />
          {guessVal || "—"}
        </span>
      </div>
      <div className="recall-result-answer">
        <span className="recall-result-guess-label">Correct</span>
        <span className="recall-result-val" style={{ display: "flex", alignItems: "center" }}>
          <TribeDot color={answerVal} size={10} />
          {answerVal}
        </span>
      </div>
      <div className="recall-result-pts">
        <span className="recall-result-pts-num">{pts}</span>
        <span className="recall-result-pts-denom">/ {maxPts}</span>
      </div>
    </div>
  );
}
