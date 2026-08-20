import { useState, useRef, useEffect } from "react";
import "./App.css";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";
const STORAGE_KEY = "chatassit_api_key";

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [showSettings, setShowSettings] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your AI assistant powered by Groq. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const saveApiKey = () => {
    const key = tempApiKey.trim();
    if (!key) return;
    localStorage.setItem(STORAGE_KEY, key);
    setApiKey(key);
    setShowSettings(false);
    inputRef.current?.focus();
  };

  const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey("");
    setTempApiKey("");
    setShowSettings(true);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    const userMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: updatedMessages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry, something went wrong: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I help you?",
      },
    ]);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">🤖</div>
          <div>
            <h1>ChatAssist</h1>
            <span className="subtitle">Powered by Groq &amp; GPT-OSS 120B</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="clear-btn" onClick={clearChat} title="Clear chat">
            🗑️ Clear
          </button>
          {apiKey && (
            <button className="clear-btn" onClick={clearApiKey} title="Change API key">
              🔑 Key
            </button>
          )}
        </div>
      </header>

      {showSettings && (
        <div className="settings-banner">
          <div className="settings-content">
            <p className="settings-title">🔑 Enter your Groq API Key</p>
            <p className="settings-hint">
              Get a free key at{" "}
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                console.groq.com/keys
              </a>
            </p>
            <div className="settings-input-row">
              <input
                type="password"
                className="settings-input"
                placeholder="gsk_..."
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveApiKey()}
              />
              <button className="send-btn" onClick={saveApiKey} disabled={!tempApiKey.trim()}>
                ✓
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="chat-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === "user" ? "👤" : "🤖"}
            </div>
            <div className="message-bubble">
              <div className="message-role">
                {msg.role === "user" ? "You" : "Assistant"}
              </div>
              <div className="message-content">
                {msg.content.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < msg.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-bubble">
              <div className="message-role">Assistant</div>
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      <footer className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            rows="1"
            placeholder={apiKey ? "Type your message..." : "Set your API key first ↑"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            title="Send message"
          >
            {loading ? "⏳" : "➤"}
          </button>
        </div>
        <p className="hint">Press Enter to send · Shift+Enter for new line</p>
      </footer>
    </div>
  );
}

export default App;
