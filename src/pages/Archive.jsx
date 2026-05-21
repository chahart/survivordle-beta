import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAnswerForPuzzle, getDateForPuzzle, getPuzzleNumber } from "../shared/gameLogic";
import GameBoard from "../components/GameBoard";
import useSEO from "../shared/useSEO";

export default function Archive({ contestants, colorblind }) {
  const [selectedPuzzle, setSelectedPuzzle] = useState(null);
  const [answer, setAnswer] = useState(null);
  const navigate = useNavigate();
  const puzzleNum = getPuzzleNumber();
  useSEO({
    title: "Survivordle Archive — Past Daily Puzzles",
    description: "Play any past Survivordle puzzle. Browse and replay every daily castaway puzzle from the beginning.",
    canonical: "https://survivordle.com/archive",
  });
  const pastPuzzles = Array.from({ length: puzzleNum - 1 }, (_, i) => puzzleNum - 1 - i);

  function selectPuzzle(n) {
    setSelectedPuzzle(n);
    setAnswer(getAnswerForPuzzle(contestants, n));
  }

  function backToList() {
    setSelectedPuzzle(null);
    setAnswer(null);
  }

  if (selectedPuzzle !== null && answer) {
    return (
      <>
        <div className="mode-banner">
          <div className="mode-banner-left">
            <span className="mode-banner-label">Archive Mode</span>
            <span className="mode-banner-title">Puzzle #{selectedPuzzle} · {getDateForPuzzle(selectedPuzzle)}</span>
          </div>
          <button className="archive-play-btn" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text2)", fontFamily: "'DM Sans', sans-serif", fontSize: "12px", fontWeight: 600 }} onClick={backToList}>
            ← Back to Archive
          </button>
        </div>
        <GameBoard
          key={selectedPuzzle}
          colorblind={colorblind}
          answer={answer}
          mode="archive"
          puzzleNum={selectedPuzzle}
          contestants={contestants}
          onNavigateStats={() => navigate("/stats")}
          onNavigateRecall={() => navigate("/recall")}
        />
      </>
    );
  }

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
        <div className="tagline">Archive &nbsp;·&nbsp; Past Puzzles</div>
      </header>

      <p className="modal-body" style={{ textAlign: "center", marginBottom: "20px" }}>
        Play any past puzzle. Archive games don't affect your stats or streak.
      </p>

      {pastPuzzles.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text3)", fontSize: "14px" }}>
          No past puzzles yet — check back tomorrow!
        </p>
      ) : (
        <div className="archive-list">
          {pastPuzzles.map(n => (
            <div key={n} className="archive-item" onClick={() => selectPuzzle(n)}>
              <div className="archive-item-left">
                <span className="archive-item-num">#{n}</span>
                <span className="archive-item-date">{getDateForPuzzle(n)}</span>
              </div>
              <button className="archive-play-btn">Play</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
