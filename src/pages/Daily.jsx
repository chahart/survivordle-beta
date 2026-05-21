import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDailyAnswer, getPuzzleNumber, msUntilMidnightET } from "../shared/gameLogic";
import { loadTodayGame, saveCompletedGame, saveMidGame, loadStorage, saveStorage } from "../shared/storage";
import GameBoard from "../components/GameBoard";
import useSEO from "../shared/useSEO";

export default function Daily({ contestants, colorblind }) {
  const [answer,  setAnswer]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved,   setSaved]   = useState(null);

  const navigate  = useNavigate();
  const puzzleNum = getPuzzleNumber();
  useSEO({
    title: "Survivordle — Daily Survivor Castaway Puzzle",
    description: "Guess today's Survivor castaway in 8 tries. A new puzzle every day — test your Survivor knowledge!",
    canonical: "https://survivordle.com/",
  });

  useEffect(() => {
    if (!contestants.length) return;
    const ans = getDailyAnswer(contestants);
    setAnswer(ans);
    const todaySaved = loadTodayGame(puzzleNum);
    if (todaySaved) {
      setSaved(todaySaved);
      // Only auto-show stats if the game was already finished
    }
    setLoading(false);
  }, [contestants]);

  // Auto-refresh at midnight ET
  useEffect(() => {
    const timer = setTimeout(() => window.location.reload(), msUntilMidnightET());
    return () => clearTimeout(timer);
  }, []);

  function handleMidGame({ guesses, results, hintEpisode, hintNeighbors }) {
    saveMidGame({ puzzleNum, guesses, results, hintEpisode, hintNeighbors });
  }

  function handleComplete({ won, guessCount, emojiGrid, guesses, results, gaveUp }) {
    saveCompletedGame({ puzzleNum, won, gaveUp, guessCount, emojiGrid });
    const s = loadStorage();
    saveStorage({ ...s, guessObjects: guesses, resultObjects: results });
  }

  if (loading || !answer) return <div className="loading">🔥 Loading the tribe…</div>;

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
        <div className="tagline">Guess the Survivor Castaway &nbsp;·&nbsp; #{puzzleNum}</div>
      </header>

      <GameBoard
        key={puzzleNum}
        answer={answer}
        mode="daily"
        puzzleNum={puzzleNum}
        contestants={contestants}
        onMidGame={handleMidGame}
        onNavigateStats={() => navigate("/stats")}
        onNavigateRecall={() => navigate("/recall")}
        onComplete={handleComplete}
        colorblind={colorblind}
        initialGuesses={saved?.guessObjects   || []}
        initialResults={saved?.resultObjects  || []}
        initialGameOver={saved?.gameOver      || false}
        initialWon={saved?.won                || false}
        initialGaveUp={saved?.gaveUp          || false}
        initialHintEpisode={saved?.hintEpisode     || false}
        initialHintNeighbors={saved?.hintNeighbors || false}
      />
    </>
  );
}
