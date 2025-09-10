import { Link } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  return (
    <div className="landing-container">
      <h1 className="landing-title">🚀 ReadMeCraft</h1>
      <p className="landing-desc">
        Craft stunning, professional README files for your GitHub repositories —
        effortlessly. Paste your repo link, and let <span style={{ color: "#22c55e", fontWeight: "bold" }}>AI</span> do the rest.
      </p>

      <div className="landing-buttons">
        <Link to="/app" className="get-started-btn">
          ✨ Get Started
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="learn-more-btn"
        >
          📖 Learn More
        </a>
      </div>
    </div>
  );
}
