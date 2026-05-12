import { useEffect } from "react";

const HOW_TO_PLAY_CSS = `
.htp-page {
  max-width: 680px;
  margin: 0 auto;
  padding: 32px 20px 64px;
  color: var(--text1);
  font-family: inherit;
}

.htp-hero {
  text-align: center;
  margin-bottom: 40px;
}

.htp-hero h1 {
  font-size: clamp(26px, 5vw, 36px);
  font-weight: 800;
  letter-spacing: -0.5px;
  margin: 0 0 10px;
  color: var(--text1);
}

.htp-hero p {
  font-size: 15px;
  color: var(--text3);
  line-height: 1.6;
  max-width: 520px;
  margin: 0 auto;
}

.htp-section {
  margin-bottom: 36px;
}

.htp-section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text4);
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.htp-body {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text2);
  margin: 0 0 12px;
}

.htp-body strong {
  color: var(--text1);
}

.htp-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.htp-legend-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--text2);
}

.htp-dot {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  flex-shrink: 0;
}

.htp-dot.correct { background: var(--correct); }
.htp-dot.close { background: var(--close); }
.htp-dot.wrong { background: var(--wrong); }

.htp-cols {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.htp-col-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  font-size: 14px;
  align-items: start;
}

.htp-col-name {
  font-weight: 700;
  color: var(--text1);
  padding-top: 1px;
}

.htp-col-desc {
  color: var(--text2);
  line-height: 1.6;
}

.htp-col-desc a {
  color: var(--accent, #e17055);
  text-decoration: none;
}

.htp-col-desc a:hover {
  text-decoration: underline;
}

.htp-arrow-block {
  background: var(--tile-bg, rgba(255,255,255,0.04));
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 14px;
  color: var(--text2);
  line-height: 1.75;
}

.htp-arrow-block strong {
  color: var(--text1);
}

.htp-hint-block {
  background: var(--tile-bg, rgba(255,255,255,0.04));
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.htp-hint-item {
  font-size: 14px;
  color: var(--text2);
  line-height: 1.6;
}

.htp-hint-item strong {
  color: var(--text1);
  display: block;
  margin-bottom: 2px;
}

.htp-tip {
  background: rgba(225, 112, 85, 0.08);
  border-left: 3px solid var(--accent, #e17055);
  border-radius: 0 6px 6px 0;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--text3);
  line-height: 1.65;
  margin-top: 8px;
}

.htp-divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 32px 0;
}

.htp-footer {
  font-size: 12px;
  color: var(--text4);
  line-height: 1.7;
  text-align: center;
}

.htp-footer a {
  color: var(--text3);
  text-decoration: none;
}

.htp-footer a:hover {
  text-decoration: underline;
}
`;

export default function HowToPlay() {
  useEffect(() => {
    document.title = "How to Play | Survivordle";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
    meta.content = "Learn how to play Survivordle — the daily Survivor castaway guessing game. Understand every column, hint, and scoring rule.";
    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
    canon.href = "https://survivordle.com/how-to-play";
  }, []);

  return (
    <>
      <style>{HOW_TO_PLAY_CSS}</style>
      <div className="htp-page">

        <div className="htp-hero">
          <h1>How to Play Survivordle</h1>
          <p>
            A daily guessing game for Survivor fans. Every day at midnight ET, a new castaway is chosen,
            figure out who it is using as few guesses as possible. Survivors ready... go!
          </p>
        </div>

        {/* The Basics */}
        <div className="htp-section">
          <div className="htp-section-title">The Basics</div>
          <p className="htp-body">
            Each day, a Survivor castaway is selected as the answer. You have <strong>8 guesses</strong> to identify them.
            Because players have appeared in multiple seasons, you are guessing a <strong>specific castaway + season appearance</strong> — not just the person.
            For example, "Amanda Kimmel — Survivor: China" and "Amanda Kimmel — Survivor: Heroes vs. Villains" are treated as separate answers.
          </p>
          <p className="htp-body">
            Type a name into the search bar and select a castaway. After each guess, every column will reveal how close you are.
          </p>
        </div>

        {/* Color Guide */}
        <div className="htp-section">
          <div className="htp-section-title">Color Guide</div>
          <div className="htp-legend">
            <div className="htp-legend-row"><span className="htp-dot correct" /><span><strong>Green</strong>: Exact match for that column</span></div>
            <div className="htp-legend-row"><span className="htp-dot close" /><span><strong>Orange</strong>: Close but not exact (see thresholds below)</span></div>
            <div className="htp-legend-row"><span className="htp-dot wrong" /><span><strong>Gray</strong>: No match</span></div>
          </div>
          <div className="htp-tip">
            In <strong>Colorblind Mode</strong> (toggle via the 👁 button), green is replaced with blue for better contrast.
          </div>
        </div>

        {/* Arrows */}
        <div className="htp-section">
          <div className="htp-section-title">Arrows on Orange Cells</div>
          <div className="htp-arrow-block">
            <strong>↑ The answer did worse</strong> than your guess — e.g. you guessed 4th place, the answer placed lower (higher number).<br />
            <strong>↓ The answer did better</strong> than your guess — e.g. you guessed 9th place, the answer placed higher (lower number).
          </div>
          <p className="htp-body" style={{ marginTop: "12px" }}>
            Arrows appear on <strong>Season</strong>, <strong>Placement</strong>, and <strong>Age</strong> when the cell is orange.
          </p>
        </div>

        {/* Column Guide */}
        <div className="htp-section">
          <div className="htp-section-title">Column Guide</div>
          <div className="htp-cols">
            <div className="htp-col-row">
              <span className="htp-col-name">Season</span>
              <span className="htp-col-desc">The season number this appearance is from. 🟧 Orange if within ±2 seasons of the answer.</span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Placement</span>
              <span className="htp-col-desc">Finishing position (1st = winner, higher number = earlier boot). 🟧 Orange if within ±3 places.</span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Gender</span>
              <span className="htp-col-desc">Exact match only, green or gray, no orange.</span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Tribe Color</span>
              <span className="htp-col-desc">
                The castaway's starting tribe color. Green or gray only, no orange. Colors sourced from the{" "}
                <a href="https://survivor.fandom.com/wiki/Tribe#Tribe_Colors_Per_Season" target="_blank" rel="noopener noreferrer">
                  Survivor Wiki
                </a>.
              </span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Returnee</span>
              <span className="htp-col-desc">Has this castaway played Survivor more than once? Shows Yes or No, even if this is technically their first appearance.</span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Age</span>
              <span className="htp-col-desc">Age at the time the season aired. 🟧 Orange if within ±5 years of the answer.</span>
            </div>
          </div>
        </div>

        {/* Hints */}
        <div className="htp-section">
          <div className="htp-section-title">Hints</div>
          <p className="htp-body">After your first guess, two optional hints become available. Using hints does not count against your guesses.</p>
          <div className="htp-hint-block">
            <div className="htp-hint-item">
              <strong>Reveal Outcome</strong>
              Shows whether the answer was a pre-jury boot, juror, finalist, or winner — along with the episode and day they were eliminated.
            </div>
            <div className="htp-hint-item">
              <strong>Reveal Voted-Out Neighbors</strong>
              Shows the names of the castaways eliminated just before and just after the answer.
            </div>
          </div>
          <div className="htp-tip">
            Hints are tracked in your stats — use them strategically. A win with no hints is bragging rights.
          </div>
        </div>

        {/* Give Up */}
        <div className="htp-section">
          <div className="htp-section-title">Giving Up</div>
          <p className="htp-body">
            After your first guess, a <strong>Give Up</strong> button appears in the hint bar. Pressing it reveals the answer and counts as a loss — but it's better than being stuck all day.
          </p>
        </div>

        {/* Game Modes */}
        <div className="htp-section">
          <div className="htp-section-title">Game Modes</div>
          <div className="htp-cols">
            <div className="htp-col-row">
              <span className="htp-col-name">Daily</span>
              <span className="htp-col-desc">One new puzzle every day at midnight ET. Everyone plays the same castaway. Compare with friends.</span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Archive</span>
              <span className="htp-col-desc">Play any past daily puzzle you may have missed.</span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Unlimited</span>
              <span className="htp-col-desc">Practice mode, a random castaway every round, play as much as you like! Stats tracked separately from Daily.</span>
            </div>
          </div>
        </div>

        {/* Recall Mode */}
        <div className="htp-section">
          <div className="htp-section-title">Recall Mode</div>
          <p className="htp-body">
            Recall is the reverse of Survivordle — you're shown a castaway's name and must recall their stats from memory.
            Guess their Season, Placement, Age, and Tribe Color to earn a score out of 100 and a letter grade.
            Play at <a href="/recall" style={{ color: "var(--accent, #e17055)", textDecoration: "none" }}>/recall</a>.
          </p>
          <div className="htp-cols" style={{ marginBottom: "12px" }}>
            <div className="htp-col-row">
              <span className="htp-col-name">Season</span>
              <span className="htp-col-desc">Up to 40 pts. −4 pts for each season away from the correct answer (10+ off = 0).</span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Placement</span>
              <span className="htp-col-desc">Up to 40 pts. −4 pts for each place away from the correct finish (10+ off = 0).</span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Age</span>
              <span className="htp-col-desc">Up to 12 pts. Within ±3 years = 12 · ±4–5 = 8 · ±6–10 = 4 · more than 10 off = 0.</span>
            </div>
            <div className="htp-col-row">
              <span className="htp-col-name">Tribe Color</span>
              <span className="htp-col-desc">Up to 8 pts. Exact match = 8, wrong = 0. No partial credit.</span>
            </div>
          </div>
          <div className="htp-tip">
            <strong>Grading scale:</strong> A+ = 100 &nbsp;·&nbsp; A = 93–99 &nbsp;·&nbsp; A- = 90–92 &nbsp;·&nbsp; B+ = 87–89 &nbsp;·&nbsp; B = 83–86 &nbsp;·&nbsp; B- = 80–82 &nbsp;·&nbsp; C+ = 77–79 &nbsp;·&nbsp; C = 73–76 &nbsp;·&nbsp; C- = 70–72 &nbsp;·&nbsp; D+ = 67–69 &nbsp;·&nbsp; D = 63–66 &nbsp;·&nbsp; D- = 60–62 &nbsp;·&nbsp; F = below 60
            <br /><br />
            Recall has <strong>Daily</strong>, <strong>Archive</strong>, and <strong>Unlimited</strong> sub-modes — stats for each are tracked separately.
          </div>
        </div>

        <hr className="htp-divider" />

        <div className="htp-footer">
          <p>
            Questions or feedback?{" "}
            <a href="mailto:survivordlegame@gmail.com">survivordlegame@gmail.com</a>
          </p>
          <p style={{ marginTop: "6px" }}>
            Survivordle collects anonymous gameplay data to improve the game. No personal information is collected.{" "}
            <a href="/privacy">Privacy Policy</a>
          </p>
        </div>

      </div>
    </>
  );
}
