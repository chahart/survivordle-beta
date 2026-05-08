import { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function NavBar({ lightMode, onToggleLight, colorblind, onToggleColorblind }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const location = useLocation();

  // Close dropdown on route change
  useEffect(() => { setMoreOpen(false); }, [location]);

  // Close dropdown on outside tap
  useEffect(() => {
    function handleClick(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  return (
    <nav className="nav">
      {/* Row 1: logo + utility buttons */}
      <div className="nav-row1">
        <NavLink to="/" className="nav-logo">SURV🔥VORDLE</NavLink>
        <div className="nav-right">
          <NavLink
            to="/how-to-play"
            className={({ isActive }) => `nav-btn how${isActive ? " active" : ""}`}
            style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
            title="How to Play"
          >
            ?
          </NavLink>
          <NavLink to="/stats"
            className={({ isActive }) => `nav-btn${isActive ? " active" : ""}`}
            style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}
            title="Stats"
          >
            📊
          </NavLink>
          <button
            className="nav-btn"
            onClick={onToggleColorblind}
            title="Colorblind mode"
            style={colorblind ? { borderColor: "#4a8aff", color: "#4a8aff" } : {}}
          >
            👁
          </button>
          <button className="nav-btn" onClick={onToggleLight} title="Toggle theme">
            {lightMode ? "🌙" : "☀️"}
          </button>
        </div>
      </div>

      {/* Row 2: page tabs + secondary */}
      <div className="nav-row2">
        <div className="nav-tabs">
          <NavLink to="/" end className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}>
            Daily
          </NavLink>
          <NavLink to="/archive" className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}>
            Archive
          </NavLink>
          <NavLink to="/unlimited" className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}>
            Unlimited
          </NavLink>
          <NavLink to="/recall" className={() => `nav-tab${location.pathname.startsWith("/recall") ? " active" : ""}`}>
            Recall
          </NavLink>
        </div>

        {/* Desktop: secondary links */}
        <div className="nav-secondary">
          <NavLink to="/how-to-play" className={({ isActive }) => `nav-secondary-link${isActive ? " active" : ""}`}>
            How to Play
          </NavLink>
          <NavLink to="/faq" className={({ isActive }) => `nav-secondary-link${isActive ? " active" : ""}`}>
            FAQ
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-secondary-link${isActive ? " active" : ""}`}>
            About
          </NavLink>
          <NavLink to="/privacy" className={({ isActive }) => `nav-secondary-link${isActive ? " active" : ""}`}>
            Privacy
          </NavLink>
        </div>

        {/* Mobile only: More dropdown */}
        <div className="nav-more-wrap" ref={moreRef}>
          <button
            className={`nav-more-btn${moreOpen ? " open" : ""}`}
            onClick={() => setMoreOpen(o => !o)}
          >
            More {moreOpen ? "▲" : "▼"}
          </button>
          {moreOpen && (
            <div className="nav-more-dropdown">
              <NavLink to="/how-to-play" className={({ isActive }) => `nav-more-item${isActive ? " active" : ""}`}>
                How to Play
              </NavLink>
              <NavLink to="/faq" className={({ isActive }) => `nav-more-item${isActive ? " active" : ""}`}>
                FAQ
              </NavLink>
              <NavLink to="/about" className={({ isActive }) => `nav-more-item${isActive ? " active" : ""}`}>
                About
              </NavLink>
              <NavLink to="/privacy" className={({ isActive }) => `nav-more-item${isActive ? " active" : ""}`}>
                Privacy
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
