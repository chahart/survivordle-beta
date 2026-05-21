import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getRandomAnswer } from "../shared/gameLogic";
import { saveUnlimitedGame } from "../shared/storage";
import GameBoard from "../components/GameBoard";
import useSEO from "../shared/useSEO";

export default function Unlimited({ contestants, colorblind }) {
  const navigate    = useNavigate();
  const [answer,    setAnswer]    = useState(() => getRandomAnswer(contestants));
  const [gameKey,   setGameKey]   = useState(0);
  const [gameOver,  setGameOver]  = useState(false);
  const [activeTab, setActiveTab] = useState("play");
  useSEO({
    title: "Survivordle Unlimited — Play as Many as You Like",
    description: "No limits — play Survivordle with random Survivor castaways as many times as you want.",
    canonical: "https://survivordle.com/unlimited",
  });
  const newGame = useCallback(() => {
    setAnswer(getRandomAnswer(contestants));
    setGameKey(k => k + 1);
    setGameOver(false);
    setActiveTab("play");
  }, [contestants]);

  function handleComplete({ won, guessCount }) {
    saveUnlimitedGame({ won, guessCount });
    setGameOver(true);
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
        <div className="tagline">Unlimited Mode &nbsp;·&nbsp; Play as many as you like</div>
      </header>

      {/* Top tabs: Play / Stats */}
      <div className="ul-tabs">
        <button className={`ul-tab${activeTab === "play" ? " active" : ""}`} onClick={() => setActiveTab("play")}>
          ♾️ Play
        </button>
        <button className="ul-tab" onClick={() => navigate("/stats")}>
          📊 Stats
        </button>
      </div>

      {activeTab === "play" && (
        <>
          <div className="mode-banner">
            <div className="mode-banner-left">
              <span className="mode-banner-label">Unlimited Mode</span>
              <span className="mode-banner-title">♾️ Random castaway every game</span>
            </div>
            {gameOver && (
              <button className="archive-play-btn" onClick={newGame}>
                🔀 New Game
              </button>
            )}
          </div>
          <GameBoard
            key={gameKey}
            answer={answer}
            mode="unlimited"
            puzzleNum={null}
            contestants={contestants}
            onComplete={handleComplete}
            colorblind={colorblind}
            onNavigateStats={() => navigate("/stats")}
            onNavigateRecall={() => navigate("/recall")}
          />
        </>
      )}

    </>
  );
}
