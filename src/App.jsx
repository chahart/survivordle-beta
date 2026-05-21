import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import CSS, { TAB_CSS, SUBTAB_CSS, PRIVACY_CSS, STATS_PAGE_CSS, ABOUT_CSS, FOOTER_CSS, RECALL_CSS } from "./shared/styles";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Ramp from "./components/RAMP";
import Daily from "./pages/Daily";
import Archive from "./pages/Archive";
import Unlimited from "./pages/Unlimited";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Stats from "./pages/Stats";
import HowToPlay from "./pages/HowToPlay";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Recall from "./pages/Recall";
import { AnnouncementModal } from "./components/Modals";

const BANNER_KEY = "survivordle_announcement_may22";
const BANNER_EXPIRY = new Date("2026-05-22T12:00:00");

const PUB_ID = import.meta.env.VITE_PLAYWIRE_PUB_ID;
const WEBSITE_ID = import.meta.env.VITE_PLAYWIRE_WEBSITE_ID;

export default function App() {
  const [contestants,      setContestants]      = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [lightMode,        setLightMode]        = useState(false);
  const [colorblind,       setColorblind]       = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/contestants.json")
      .then(r => r.json())
      .then(data => { setContestants(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading) return;
    const now = new Date();
    if (!localStorage.getItem(BANNER_KEY) && now < BANNER_EXPIRY) {
      const timer = setTimeout(() => setShowAnnouncement(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  function dismissAnnouncement() {
    localStorage.setItem(BANNER_KEY, "1");
    setShowAnnouncement(false);
  }

  function goToRecall() {
    dismissAnnouncement();
    navigate("/recall");
  }

  if (loading) return (
    <>
      <style>{CSS}</style>
      <style>{TAB_CSS}{SUBTAB_CSS}{PRIVACY_CSS}{STATS_PAGE_CSS}{ABOUT_CSS}{FOOTER_CSS}{RECALL_CSS}</style>
      <div className="page"><div className="loading">🔥 Loading the tribe…</div></div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <style>{TAB_CSS}{SUBTAB_CSS}{PRIVACY_CSS}{STATS_PAGE_CSS}{ABOUT_CSS}{FOOTER_CSS}{RECALL_CSS}</style>
      <style>{lightMode ? "body{background:#f5f0e8}" : "body{background:#0a0a0a}"}</style>
      <div className={lightMode ? "light" : ""}>

        <Ramp PUB_ID={PUB_ID} WEBSITE_ID={WEBSITE_ID} />

        <NavBar
          lightMode={lightMode}
          onToggleLight={() => setLightMode(m => !m)}
          colorblind={colorblind}
          onToggleColorblind={() => setColorblind(m => !m)}
        />

        <div className="page">
          <Routes>
            <Route path="/"            element={<Daily     contestants={contestants} colorblind={colorblind} />} />
            <Route path="/archive"     element={<Archive   contestants={contestants} colorblind={colorblind} />} />
            <Route path="/unlimited"   element={<Unlimited contestants={contestants} colorblind={colorblind} />} />
            <Route path="/stats"       element={<Stats />} />
            <Route path="/privacy"     element={<Privacy />} />
            <Route path="/about"       element={<About />} />
            <Route path="/how-to-play" element={<HowToPlay />} />
            <Route path="/faq"         element={<FAQ />} />
            <Route path="/blog"        element={<Blog />} />
            <Route path="/blog/:slug"  element={<BlogPost />} />
            <Route path="/recall"             element={<Recall contestants={contestants} />} />
            <Route path="/recall/archive"   element={<Recall contestants={contestants} />} />
            <Route path="/recall/unlimited" element={<Recall contestants={contestants} />} />
            <Route path="/recall/stats"     element={<Recall contestants={contestants} />} />
          </Routes>
        </div>

        <Footer />

        {showAnnouncement && (
          <AnnouncementModal
            onClose={dismissAnnouncement}
            onPlayRecall={goToRecall}
          />
        )}

      </div>
    </>
  );
}