import { useState } from "react";
import { loadAllRecallDailyResults, loadAllRecallArchiveResults, loadRecallUnlimitedHistory } from "./storage";

const GPA_SCALE = { "A+": 4.0, "A": 4.0, "A-": 3.66, "B+": 3.33, "B": 3.0, "B-": 2.66, "C+": 2.33, "C": 2.0, "C-": 1.66, "D+": 1.33, "D": 1.0, "F": 0.0 };
const GRADE_LETTERS = ["A", "B", "C", "D", "F"];

function gradeBase(grade) {
  if (!grade) return null;
  if (grade === "A+" || grade === "A" || grade === "A-") return "A";
  if (grade === "B+" || grade === "B" || grade === "B-") return "B";
  if (grade === "C+" || grade === "C" || grade === "C-") return "C";
  if (grade === "D+" || grade === "D")                   return "D";
  return "F";
}

function computeGPA(results) {
  if (!results.length) return null;
  const grades = results.map(r => r.grade).filter(Boolean);
  if (!grades.length) return null;
  const sum = grades.reduce((acc, g) => acc + (GPA_SCALE[g] ?? 0), 0);
  return (sum / grades.length).toFixed(2);
}

function gradeBarColor(letter) {
  if (letter === "A") return { bg: "#1a4d1a", border: "#4aaa4a" };
  if (letter === "B") return { bg: "#4a2a05", border: "#f09030" };
  if (letter === "C") return { bg: "#1a2a4a", border: "#4a8aff" };
  if (letter === "D") return { bg: "#3a3a10", border: "#aaaa4a" };
  return { bg: "#4a1a1a", border: "#aa4a4a" };
}

function RecallStatsSection({ results, emptyMsg }) {
  if (!results.length) {
    return <p style={{ textAlign: "center", color: "var(--text3)", marginTop: "24px" }}>{emptyMsg}</p>;
  }

  const gpa      = computeGPA(results);
  const played   = results.length;
  const scores   = results.map(r => r.total ?? r.total_score ?? 0).filter(n => n != null);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const best     = scores.length ? Math.max(...scores) : 0;

  const gradeCounts = Object.fromEntries(GRADE_LETTERS.map(l => [l, 0]));
  for (const r of results) {
    const base = gradeBase(r.grade);
    if (base) gradeCounts[base]++;
  }
  const gradeMax = Math.max(...Object.values(gradeCounts), 1);

  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "20px" }}>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "52px", color: "#e8742a", lineHeight: 1 }}>{gpa}</span>
        <span style={{ fontSize: "13px", color: "var(--text3)", letterSpacing: "1px", textTransform: "uppercase" }}>GPA</span>
      </div>

      <div className="stats-grid" style={{ marginBottom: "20px" }}>
        {[
          [played,   "Played"],
          [avgScore, "Avg Score"],
          [best,     "Best Score"],
        ].map(([val, lbl]) => (
          <div className="stats-grid-item" key={lbl}>
            <span className="stats-grid-num">{val}</span>
            <span className="stats-grid-label">{lbl}</span>
          </div>
        ))}
      </div>

      <div className="sp-sub-title">Grade Distribution</div>
      {GRADE_LETTERS.map(letter => {
        const count = gradeCounts[letter];
        const w = count > 0 ? `${Math.max(Math.round((count / gradeMax) * 100), 4)}%` : "0%";
        const { bg, border } = gradeBarColor(letter);
        return (
          <div key={letter} className="stat-row">
            <span className="stat-label">{letter}</span>
            <div className="stat-bar-wrap">
              <div className="stat-bar" style={{ width: w, background: `linear-gradient(90deg, ${bg}, ${bg})`, border: `1px solid ${border}` }}>
                {count > 0 && <span className="stat-bar-count">{count}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

export function RecallStatsTab({ bodyClass = "stats-page-body" }) {
  const [subTab, setSubTab] = useState("daily");

  const dailyResults   = loadAllRecallDailyResults();
  const archiveResults = loadAllRecallArchiveResults();
  const unlimHistory   = loadRecallUnlimitedHistory();

  return (
    <div className={bodyClass}>
      <div className="ul-subtabs" style={{ marginBottom: "20px", marginTop: "0" }}>
        <button className={`ul-subtab${subTab === "daily"     ? " active" : ""}`} onClick={() => setSubTab("daily")}>Daily</button>
        <button className={`ul-subtab${subTab === "archive"   ? " active" : ""}`} onClick={() => setSubTab("archive")}>Archive</button>
        <button className={`ul-subtab${subTab === "unlimited" ? " active" : ""}`} onClick={() => setSubTab("unlimited")}>Unlimited</button>
      </div>

      {subTab === "daily" && (
        <RecallStatsSection results={dailyResults}   emptyMsg="Play some Recall Daily puzzles to see your stats!" />
      )}
      {subTab === "archive" && (
        <RecallStatsSection results={archiveResults} emptyMsg="Play some Recall Archive puzzles to see your stats!" />
      )}
      {subTab === "unlimited" && (
        <RecallStatsSection results={unlimHistory}   emptyMsg="Play some Recall Unlimited rounds to see your stats!" />
      )}
    </div>
  );
}
