import { useState } from "react";
import { runAgent } from "../../Servers/gemini";
import ReactMarkdown from "react-markdown";
import "./ChatBox.css";

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

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1200);
  };

  return (
    <div className="chat-container">
      <div className="bg-circle green"></div>
      <div className="bg-circle blue"></div>

      <header className="chat-header">ReadMeCraft AI</header>

      <main className="messages-section">
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
                {copiedIdx === i ? "✅ Copied" : "📋 Copy"}
              </button>
            )}
          </div>
        ))}
        {loading && <div className="chat-msg ai">⏳ Generating...</div>}
      </main>

      <footer className="input-section">
        <input
          type="text"
          value={input}
          placeholder="🔗 Enter GitHub repo link..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>⚡ Generate</button>
      </footer>
    </div>
  );
}
