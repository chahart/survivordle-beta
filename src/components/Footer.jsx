
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
<footer className="site-footer">
  <div className="site-footer-inner">
    <div className="footer-left">
      <span className="footer-logo">SURV🔥VORDLE</span>
      <span className="footer-copy">© {year} Survivordle. Not affiliated with CBS or Survivor.</span>
      <div className="footer-nav-links">
        <Link to="/blog" className="footer-nav-link">Blog</Link>
        <Link to="/faq" className="footer-nav-link">FAQ</Link>
        <Link to="/about" className="footer-nav-link">About</Link>
        <Link to="/privacy" className="footer-nav-link">Privacy</Link>
      </div>
    </div>
    <div className="footer-right">
      <a href="mailto:survivordlegame@gmail.com" className="footer-link" title="Email">
        ✉️ Contact
      </a>
      <a href="https://x.com/Survivordle" target="_blank" rel="noopener noreferrer" className="footer-link" title="X / Twitter">
        𝕏 Twitter
      </a>
      <a href="https://instagram.com/charl13hart" target="_blank" rel="noopener noreferrer" className="footer-link" title="Instagram">
        📷 Instagram
      </a>
      <a href="https://www.buymeacoffee.com/chahart" target="_blank" rel="noopener noreferrer" className="footer-link footer-bmc" title="Buy me a beer">
        🍺 Support
      </a>
<p><a href="https://www.playwire.com/contact-direct-sales" rel="noopener">
          <img
            src="https://www.playwire.com/hubfs/Powered-by-Playwire-Badges/Ads-Powered-by-playwire-2021-standalone-small-white-300px.png"
            alt="Ads-Powered-by-playwire-2021-standalone-small-white-300px"
            width="200"
            height="56"
            loading="lazy"
            style={{ width: "200px", marginLeft: "auto", marginRight: "auto", display: "block", height: "auto", maxWidth: "100%" }}
          />
        </a>
      </p>
      <p style={{ textAlign: "center" }}>
        <a href="https://www.playwire.com/contact-direct-sales" rel="noopener" target="_blank">
          Advertise on this site.
        </a></p>
    </div>
  </div>
</footer>
  );
}