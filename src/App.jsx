import { useState } from "react";
import { runAgent } from "./Servers/gemini";
import ReactMarkdown from "react-markdown";
import "./App.css";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);

  async function handleSend() {
    if (!input) return;
    setInput("");
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const aiReply = await runAgent(input);
      const aiMsg = { role: "ai", text: aiReply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = { role: "ai", text: "Error: " + err.message };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setLoading(false);
  }

  // Copy to clipboard handler
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  return (
    <div className="page-container">
      <div className="header">ReadMeCraft</div>

      <div className="messages-section">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            <div className="markdown-content">
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
            {msg.role === "ai" && (
              <button
                className="copy-btn"
                onClick={() => handleCopy(msg.text, i)}
                title="Copy to clipboard"
              >
                {copiedIdx === i ? "Copied!" : (
                  <>
                    <svg width="16" height="16" fill="none" viewBox="0 0 20 20">
                      <rect x="5" y="5" width="10" height="12" rx="2" fill="#fff" fillOpacity="0.7"/>
                      <rect x="3" y="3" width="10" height="12" rx="2" stroke="#fff" strokeWidth="1.2"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        ))}
        {loading && <div className="chat-msg ai">⏳ Generating...</div>}
      </div>

      <div className="input-section">
        <input
          type="text"
          value={input}
          placeholder="Enter GitHub repo link..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Generate</button>
      </div>
    </div>
  );
}


