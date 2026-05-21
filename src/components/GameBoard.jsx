import { useState, useEffect, useRef, useMemo} from "react";

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

function TribeColorCell({ value }) {
  const hex = TRIBE_COLOR_MAP[value] || "#888";
  return (
    <span style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px", width: "100%" }}>
      <span className="tribe-color-dot" style={{ background: hex }} />
      <span style={{ textAlign: "center", wordBreak: "break-word", hyphens: "auto", lineHeight: 1.2 }}>{value}</span>
    </span>
  );
}
import { evaluateGuess, isWin, normalize } from "../shared/gameLogic";
import { MAX_GUESSES, COLUMNS, STATUS_EMOJI } from "../shared/constants";
import { logSolveEvent } from "../shared/supabase";

export default function GameBoard({
  answer,
  mode,
  puzzleNum,
  contestants,
  onComplete,
  initialGuesses,
  initialResults,
  initialGameOver,
  initialWon,
  initialGaveUp,
  onShowStats,
  onNavigateStats,
  onNavigateRecall,
  colorblind,
  onMidGame,
  initialHintEpisode,
  initialHintNeighbors,
}) {
  const [guesses,       setGuesses]       = useState(initialGuesses  || []);
  const [results,       setResults]       = useState(initialResults  || []);
  const [gameOver,      setGameOver]      = useState(initialGameOver || false);
  const [won,           setWon]           = useState(initialWon      || false);
  const [gaveUp,        setGaveUp]        = useState(initialGaveUp   || false);
  const [query,         setQuery]         = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input — only filter after 150ms pause in typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);
  const [activeIdx,     setActiveIdx]     = useState(-1);
  const [error,         setError]         = useState("");
  const [copied,        setCopied]        = useState(false);
  const [hintEpisode,   setHintEpisode]   = useState(initialHintEpisode   || false);
  const [hintNeighbors, setHintNeighbors] = useState(initialHintNeighbors || false);
  const [firstGuess,    setFirstGuess]    = useState(null);
  const [secondGuess,  setSecondGuess]   = useState(null);
  const inputRef = useRef(null);
  const initialCount = initialGuesses?.length ?? 0;

  const suggestions = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = normalize(debouncedQuery);
    return contestants
      .filter(c =>
        (c.nameNorm || normalize(c.name)).includes(q) ||
        (c.showNameNorm || normalize(c.showName)).includes(q)
      )
      .slice(0, 10);
  }, [debouncedQuery, contestants]);

  const remaining = MAX_GUESSES - guesses.length;

  function finish(newGuesses, newResults, didWin, didGiveUp) {
    const emojiGrid = newResults.map(row =>
      row.map(c => STATUS_EMOJI[c.status] || "⬛").join("")
    ).join("\n");
    const fg = firstGuess || (newGuesses[0] ? `${newGuesses[0].name} - ${newGuesses[0].seasonNameFull}` : null);
    const sg = secondGuess || (newGuesses[1] ? `${newGuesses[1].name} - ${newGuesses[1].seasonNameFull}` : null);

    logSolveEvent({
      puzzle: `${answer.name} - ${answer.seasonNameFull}`,
      guesses: newGuesses.length,
      hints: hintEpisode || hintNeighbors,
      won: didWin,
      mode: didGiveUp ? `${mode}-giveup` : mode,
      firstGuess: fg,
      secondGuess: sg,
    });

    onComplete?.({ won: didWin, guessCount: newGuesses.length, emojiGrid, guesses: newGuesses, results: newResults, gaveUp: didGiveUp });
    if (mode === "daily") {
      setTimeout(() => onShowStats?.(), didGiveUp ? 800 : 1500);
    }
  }

  function submitGuess(c) {
    if (!c || gameOver) return;
    if (guesses.some(g => g.id === c.id)) { setError("Already guessed that appearance!"); return; }
    setError("");
    const result     = evaluateGuess(c, answer);
    const newGuesses = [...guesses, c];
    const newResults = [...results, result];

    if (newGuesses.length === 1) {
      setFirstGuess(`${c.name} - ${c.seasonNameFull}`);
    }
    if (newGuesses.length === 2) {
      setSecondGuess(`${c.name} - ${c.seasonNameFull}`);
    }

    setGuesses(newGuesses);
    setResults(newResults);
    setQuery(""); setDebouncedQuery(""); setActiveIdx(-1);
    const didWin  = isWin(result);
    const didFail = !didWin && newGuesses.length >= MAX_GUESSES;
    if (!didWin && !didFail) {
      onMidGame?.({ guesses: newGuesses, results: newResults, hintEpisode, hintNeighbors });
    }
    // Delay banner until all 6 cells finish flipping (625ms stagger + 350ms flip = 975ms)
    if (didWin || didFail) {
      setTimeout(() => {
        if (didWin) setWon(true);
        setGameOver(true);
        finish(newGuesses, newResults, didWin, false);
      }, 2000);
    }
  }

  function handleGiveUp() {
    setGaveUp(true); setGameOver(true);
    finish(guesses, results, false, true);
  }

  function handleHintEpisode() {
    setHintEpisode(true);
    onMidGame?.({ guesses, results, hintEpisode: true, hintNeighbors });
  }

  function handleHintNeighbors() {
    setHintNeighbors(true);
    onMidGame?.({ guesses, results, hintEpisode, hintNeighbors: true });
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === "Enter") { const t = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0]; if (t) submitGuess(t); }
    else if (e.key === "Escape") { setQuery(""); }
  }

  function handleShare() {
    const label = mode === "unlimited"
      ? "Survivordle Unlimited"
      : mode === "archive"
      ? `Survivordle Archive #${puzzleNum}`
      : `Survivordle #${puzzleNum}`;
    const shareUrl = mode === "unlimited"
      ? "survivordle.com/unlimited"
      : mode === "archive"
      ? "survivordle.com/archive"
      : "Survivordle.com";
    const hintLines = [];
    if (hintEpisode)   hintLines.push("💡 Outcome hint used");
    if (hintNeighbors) hintLines.push("💡 Neighbors hint used");
    const hintBlock = hintLines.length ? "\n" + hintLines.join("\n") : "";
    const text = `${label} — ${won ? guesses.length : "X"}/${MAX_GUESSES} 🔥${hintBlock}\n`
      + results.map(row => row.map(c => STATUS_EMOJI[c.status] || "⬛").join("")).join("\n")
      + `\n${shareUrl}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const bannerLabel = mode === "unlimited"
    ? "Unlimited"
    : mode === "archive"
    ? `Archive #${puzzleNum}`
    : `Survivordle #${puzzleNum}`;
  const bannerIcon = mode === "unlimited" ? "♾️" : mode === "archive" ? "🗓️" : "🔥";

  const cbStyle = colorblind ? `
    .guess-cell.correct { background: #0a2a5a; border: 1px solid #4a8aff; color: #b0d0ff; }
    .legend-dot.correct { background: #0a2a5a; border: 1px solid #4a8aff; }
    .modal-dot.correct  { background: #0a2a5a; border: 1px solid #4a8aff; }
    .status-banner.win  { background: #0a1a3a; border: 1px solid #4a8aff; color: #b0d0ff; }
  ` : "";

  return (
    <div>
      {cbStyle && <style>{cbStyle}</style>}

      {/* Legend */}
      <div className="legend">
        {[["correct","Exact match"],["close","Close"],["wrong","No match"]].map(([cls,lbl]) => (
          <div className="legend-item" key={cls}><div className={`legend-dot ${cls}`}/>{lbl}</div>
        ))}
      </div>

      {/* Search */}
      {!gameOver && (
        <div className="input-area">
          <div className="search-wrap">
            <input
              ref={inputRef}
              className="search-input"
              placeholder="Search by castaway name…"
              value={query}
              autoComplete="off"
              onChange={e => { setQuery(e.target.value); setActiveIdx(-1); }}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="search-note">You are guessing a castaway and their specific season appearance</div>
          {suggestions.length > 0 && (
            <div className="autocomplete">
              {suggestions.map((c, i) => (
                <div
                  key={c.id}
                  className={`ac-item${i === activeIdx ? " active" : ""}`}
                  onMouseDown={() => submitGuess(c)}
                >
                  <span className="ac-name">{c.name}</span>
                  <span className="ac-meta">{c.seasonNameFull} · S{c.season}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      {!gameOver && (
        <div className="guess-counter">
          {guesses.length === 0
            ? `${MAX_GUESSES} guesses`
            : `${remaining} guess${remaining !== 1 ? "es" : ""} remaining`}
        </div>
      )}

      {/* Hints */}
      {guesses.length > 0 && (
        <div className="hint-bar">
          <span className="hint-label">Hints:</span>
          <button
            className={`hint-btn${hintEpisode ? " revealed" : ""}`}
            onClick={handleHintEpisode}
            disabled={hintEpisode}
          >
            {hintEpisode ? "✓ Outcome Revealed" : "💡 Reveal Outcome"}
          </button>
          <button
            className={`hint-btn${hintNeighbors ? " revealed" : ""}`}
            onClick={handleHintNeighbors}
            disabled={hintNeighbors}
          >
            {hintNeighbors ? "✓ Neighbors Revealed" : "💡 Reveal Voted-Out Neighbors"}
          </button>
          {!gameOver && !won &&(
            <button className="giveup-btn" onClick={handleGiveUp}>Give Up</button>
          )}
        </div>
      )}

      {(hintEpisode || hintNeighbors) && answer && (() => {
        const tier = answer.juryTier;
        const isWinner   = tier === "Winner";
        const isFinalist = tier === "Finalist";
        const tierLabel  = isWinner || isFinalist ? "Finalist" : tier === "Jury" ? "Juror" : "Pre-Jury";
        const outcomeText = isWinner
          ? "Survived until Final Tribal Council (Won)"
          : isFinalist
          ? "Survived until Final Tribal Council"
          : `Eliminated during Episode ${answer.episodeOut ?? "?"}, Day ${answer.day ?? "?"}`;
        return (
          <div className="hint-panels">
            {hintEpisode && (
              <div className="hint-panel">
                <div className="hint-panel-label">Outcome</div>
                <div className="hint-panel-value">{tierLabel} — {outcomeText}</div>
              </div>
            )}
            {hintNeighbors && (
              <div className="hint-panel">
                <div className="hint-panel-label">Voted Out Between</div>
                <div className="hint-panel-value">
                  {[answer.placedAfter, answer.placedBefore].filter(Boolean).join(" → ") || "No data"}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Game over banner */}
      {gameOver && (
        <div className={`status-banner ${won ? "win" : "lose"}`}>
          {won
            ? <>{bannerIcon} {bannerLabel} — got it in {guesses.length}!</>
            : gaveUp
            ? <>{bannerLabel} — you gave up. {mode !== "daily" ? "Try another!" : "Better luck tomorrow."}</>
            : <>{bannerLabel} — the tribe has voted you out.</>
          }
          <span className="status-name">{answer.name}</span>
          <span className="status-sub">{answer.seasonNameFull} · {answer.result}</span>
          <br />
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px", flexWrap: "wrap" }}>
            {!gaveUp && (
              <button className="share-btn" onClick={handleShare}>
                {copied ? "✓ Copied!" : "📋 Share"}
              </button>
            )}
            {onNavigateStats && (
              <button className="share-btn" onClick={onNavigateStats}>
                📊 Stats
              </button>
            )}
            {onNavigateRecall && (
              <button className="share-btn" onClick={onNavigateRecall}>
                🔥 Recall
              </button>
            )}
          </div>
          <br />
          <a href="https://x.com/Survivordle" target="_blank" rel="noopener noreferrer" className="about-link">
            Follow us on 𝕏 @Survivordle
          </a>
        </div>
      )}

      {/* Column headers */}
      <div className="col-headers">
        <div className="col-head">Castaway</div>
        {COLUMNS.map(c => (
          <div key={c.full} className="col-head">
            <span className="col-full">{c.full}</span>
            <span className="col-short">{c.short}</span>
          </div>
        ))}
      </div>

      {/* Guess grid */}
      <div className="guesses">
        {guesses.map((g, i) => (
          <div key={g.id} className="guess-row">
            <div className="guess-name">{g.name}</div>
            {results[i].map((cell, j) => {
              const isRestored = i < initialCount;
              return (
                <div key={j} className="gb-cell-wrap">
                  <div
                    className={`gb-cell-inner${isRestored ? " no-anim" : ""}`}
                    style={isRestored ? undefined : { animationDelay: `${j * 300}ms` }}
                  >
                    <div className="gb-cell-front" />
                    <div className={`gb-cell-back guess-cell ${cell.status}`}>
                      <span className="cell-main">
                        {cell.label === "Tribe Color"
                          ? <TribeColorCell value={cell.displayMain} />
                          : cell.displayMain}
                      </span>
                      {cell.displaySub && <span className="cell-sub">{cell.displaySub}</span>}
                      {cell.hint && <span className="cell-hint">{cell.hint}</span>}
                      {cell.hint && cell.label === "Placement" && (
                        <span className="cell-arrow-label">{cell.hint === "↑" ? "worse" : "better"}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {!gameOver && Array.from({ length: remaining }).map((_, i) => (
          <div key={i} className="empty-row">
            <div className="empty-cell" />
            {Array.from({ length: 6 }).map((_, j) => <div key={j} className="empty-cell" />)}
          </div>
        ))}
      </div>
    </div>
  );
}
