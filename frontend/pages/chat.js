import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

export default function Chat() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const getToken = () => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem("token") || "";
  };

  const buildAuthHeaders = () => {
    const token = getToken();
    return token ? { token } : {};
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch("http://localhost:8000/history", { headers: buildAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setMessages(data);
        }
      })
      .catch(err => console.error("Could not load history", err));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    const token = getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (!query.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: query }
    ];

    setMessages(newMessages);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...buildAuthHeaders()
        },
        body: JSON.stringify({
          messages: newMessages
        })
      });
      const data = await res.json();

      let botText = data.response || "No result found.";

      setMessages([
        ...newMessages,
        { role: "assistant", content: botText }
      ]);
    } catch (error) {
      setMessages([...newMessages, { role: "assistant", content: "Error connecting to AI." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      color: "#f8fafc",
      fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 20px"
    }}>
      <h1 style={{
        fontSize: "2.5rem",
        fontWeight: "800",
        background: "-webkit-linear-gradient(45deg, #a78bfa, #f472b6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "30px",
        textAlign: "center"
      }}>
        AI Assistant
      </h1>

      <div style={{
        width: "100%",
        maxWidth: "800px",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "20px",
        padding: "20px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        height: "60vh"
      }}>

        {/* Chat History */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginBottom: "20px"
        }}>
          {messages.length === 0 && (
            <div style={{ margin: "auto", color: "#64748b", textAlign: "center" }}>
              <p style={{ fontSize: "1.2rem" }}>Hello! How can I help you today?</p>
              <p style={{ fontSize: "0.9rem", marginTop: "10px" }}>Try asking about official forms or certificates.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                animation: "fadeIn 0.3s ease-out"
              }}
            >
              <div style={{
                background: msg.role === "user" ? "linear-gradient(45deg, #3b82f6, #6366f1)" : "rgba(255, 255, 255, 0.08)",
                color: "#fff",
                padding: "14px 20px",
                borderRadius: "20px",
                borderBottomRightRadius: msg.role === "user" ? "4px" : "20px",
                borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "20px",
                maxWidth: "75%",
                lineHeight: "1.5",
                fontSize: "1.05rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                whiteSpace: msg.role === "user" ? "pre-wrap" : "normal",
                wordBreak: "break-word"
              }}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => <a style={{ color: "#38bdf8", textDecoration: "underline", wordBreak: "break-all" }} target="_blank" rel="noopener noreferrer" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <span style={{
                background: "rgba(255, 255, 255, 0.08)",
                padding: "14px 20px",
                borderRadius: "20px",
                borderBottomLeftRadius: "4px",
                color: "#94a3b8"
              }}>
                Assistant is thinking...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask something..."
            style={{
              flex: 1,
              padding: "16px 20px",
              borderRadius: "50px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.2)",
              color: "#fff",
              fontSize: "1.1rem",
              outline: "none",
              transition: "border-color 0.3s ease"
            }}
            onFocus={(e) => e.target.style.borderColor = "#a78bfa"}
            onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !query.trim()}
            style={{
              padding: "0 30px",
              fontSize: "1.1rem",
              fontWeight: "600",
              borderRadius: "50px",
              border: "none",
              background: "linear-gradient(45deg, #a78bfa, #ec4899)",
              color: "#fff",
              cursor: (loading || !query.trim()) ? "not-allowed" : "pointer",
              boxShadow: "0 10px 15px -3px rgba(236, 72, 153, 0.3)",
              transition: "transform 0.2s ease, filter 0.2s ease",
              opacity: (loading || !query.trim()) ? 0.6 : 1
            }}
            onMouseOver={(e) => !(loading || !query.trim()) && (e.currentTarget.style.filter = "brightness(1.1)")}
            onMouseOut={(e) => e.currentTarget.style.filter = "brightness(1)"}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
