import { loadStorage } from "../shared/storage";

export function AnnouncementModal({ onClose, onPlayRecall }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">What's New</h2>

        <div className="modal-section-title">Season 50 Added</div>
        <p className="modal-body">
          Survivordle is fully updated with Season 50! Test your knowledge in Daily, Archive, and Unlimited modes.
        </p>

        <div className="modal-section-title">Introducing... Recall Mode!</div>
        <p className="modal-body">
          Recall flips the game: you're given a castaway's stats and must guess their name. A new way to challenge your Survivor knowledge, with an unlimited mode as well.
        </p>

        <button className="play-recall-btn" onClick={onPlayRecall}>
          Play Recall →
        </button>
      </div>
    </div>
  );
}

export function HowToPlayModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">How to Play</h2>

        <p className="modal-body">
          Each day, a new Survivor castaway is chosen as the answer. You have <strong>8 guesses</strong> to identify them.
          Because many players have appeared in multiple seasons, you are guessing a <strong>specific castaway + season appearance</strong>, not just the person.
        </p>

        <div className="modal-section-title">After each guess, each column turns:</div>
        <div className="modal-legend">
          <div className="modal-legend-row"><span className="modal-dot correct" />Exact match</div>
          <div className="modal-legend-row"><span className="modal-dot close" />Close but not exact (see thresholds below)</div>
          <div className="modal-legend-row"><span className="modal-dot wrong" />No match</div>
        </div>

        <div className="modal-section-title">Arrow direction on 🟧 close cells:</div>
        <p className="modal-body">
          <strong>↑ the answer did worse</strong> than your guess (e.g. you guessed 4th place, answer placed lower)<br/>
          <strong>↓ the answer did better</strong> than your guess (e.g. you guessed 9th place, answer placed higher)
        </p>

        <div className="modal-section-title">Column guide:</div>
        <div className="modal-cols">
          <div className="modal-col-row"><span className="modal-col-name">Season</span><span className="modal-col-desc">Season number. 🟧 if within ±2 seasons.</span></div>
          <div className="modal-col-row"><span className="modal-col-name">Placement</span><span className="modal-col-desc">Finishing position (1 = winner). 🟧 if within ±3 places.</span></div>
          <div className="modal-col-row"><span className="modal-col-name">Gender</span><span className="modal-col-desc">Exact match only.</span></div>
          <div className="modal-col-row"><span className="modal-col-name">Tribe Color</span><span className="modal-col-desc">Starting tribe color. 🟩 exact match only, no 🟧. Colors sourced from the <a href="https://survivor.fandom.com/wiki/Tribe#Tribe_Colors_Per_Season" target="_blank" rel="noopener noreferrer" className="modal-link">Survivor Wiki</a>.</span></div>
          <div className="modal-col-row"><span className="modal-col-name">Returnee</span><span className="modal-col-desc">Has this person played more than once? Yes or No, even if this is technically their first.</span></div>
          <div className="modal-col-row"><span className="modal-col-name">Age</span><span className="modal-col-desc">Age when the season aired. 🟧 if within ±5 years.</span></div>
        </div>

        <div className="modal-section-title">Hints (available after your first guess):</div>
        <p className="modal-body">
          <strong>Reveal Outcome</strong> — shows whether the answer was a pre-jury boot, juror, finalist, or winner, plus the episode and day they were eliminated.<br/><br/>
          <strong>Reveal Voted-Out Neighbors</strong> — shows the names of the castaways eliminated just before and after the answer.
        </p>

        <div className="stats-divider" />
        <p className="modal-body" style={{ fontSize: "11px", color: "var(--text4)" }}>
          Survivordle collects anonymous gameplay data (castaway guessed, number of guesses, win/loss, and hint usage) to improve the game. No personal information is collected.
        </p>

        <div className="stats-divider" />
        <div className="modal-support">
          <div className="modal-support-bmc">
          </div>
          <p className="modal-contact">
            Questions or feedback?{" "}
            <a className="modal-link" href="mailto:survivordlegame@gmail.com">survivordlegame@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export function StatsModal({ onClose, onShare, copied, gameOver }) {
  const s = loadStorage();
  const stats = s.stats || { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, dist: {} };
  const pct = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0;
  const maxVal = Math.max(...Object.values(stats.dist), 1);
  const bestGuess = Object.entries(stats.dist).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title">My Stats</h2>

        <div className="stats-grid">
          <div className="stats-grid-item">
            <span className="stats-grid-num">{stats.played}</span>
            <span className="stats-grid-label">Played</span>
          </div>
          <div className="stats-grid-item">
            <span className="stats-grid-num">{pct}%</span>
            <span className="stats-grid-label">Solved</span>
          </div>
          <div className="stats-grid-item">
            <span className="stats-grid-num">{stats.currentStreak}</span>
            <span className="stats-grid-label">Current Streak</span>
          </div>
          <div className="stats-grid-item">
            <span className="stats-grid-num">{stats.maxStreak}</span>
            <span className="stats-grid-label">Max Streak</span>
          </div>
        </div>

        {stats.wins > 0 && (
          <>
            <div className="stats-divider" />
            <div className="modal-section-title">Guess Distribution</div>
            {[1,2,3,4,5,6,7,8].map(n => {
              const count = stats.dist[n] || 0;
              const pctBar = Math.round((count / maxVal) * 100);
              return (
                <div key={n} className="stat-row">
                  <span className="stat-label">{n}</span>
                  <div className="stat-bar-wrap">
                    <div
                      className={`stat-bar${String(n) === String(bestGuess) ? " best" : ""}`}
                      style={{ width: count > 0 ? `${Math.max(pctBar, 8)}%` : "0%" }}
                    >
                      {count > 0 && <span className="stat-bar-count">{count}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {gameOver && onShare && (
          <>
            <div className="stats-divider" />
            <div style={{ textAlign: "center" }}>
              <button className="share-btn" onClick={onShare}>
                {copied ? "✓ Copied!" : "📋 Share Result"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
