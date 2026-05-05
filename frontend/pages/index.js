import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [recent, setRecent] = useState([]);
  const [popular, setPopular] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authWarning, setAuthWarning] = useState("");

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

  const loadDiscovery = async () => {
    const token = getToken();
    if (!token) {
      return;
    }

    try {
      const headers = buildAuthHeaders();
      const [historyRes, recentRes, popularRes, recRes] = await Promise.all([
        fetch("http://localhost:8000/search-history", { headers }),
        fetch("http://localhost:8000/recent-searches", { headers }),
        fetch("http://localhost:8000/popular-searches", { headers }),
        fetch("http://localhost:8000/recommendations", { headers })
      ]);

      const readJson = async (res, fallback) => {
        if (!res.ok) {
          return fallback;
        }
        try {
          return await res.json();
        } catch {
          return fallback;
        }
      };

      setHistory(await readJson(historyRes, []));
      setRecent(await readJson(recentRes, []));
      setPopular(await readJson(popularRes, []));
      setRecommended(await readJson(recRes, []));
    } catch (error) {
      console.error("Could not load discovery data", error);
    }
  };

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(Boolean(token));
    setAuthChecked(true);
    if (token) {
      setAuthWarning("");
      loadDiscovery();
    }
  }, []);

  const search = async (value) => {
    const token = getToken();
    if (!token) {
      setAuthWarning("Please log in to search.");
      setIsAuthenticated(false);
      return;
    }

    const searchValue = (value ?? query).trim();
    if (!searchValue) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/search?q=${encodeURIComponent(searchValue)}`,
        { headers: buildAuthHeaders() }
      );
      if (res.status === 401) {
        setAuthWarning("Session expired. Please log in again.");
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      setResult(data);
      setQuery(searchValue);
      setSuggestions([]);
      setAiSuggestions([]);
      await loadDiscovery();
    } finally {
      setLoading(false);
    }
  };

  const showDiscovery = isAuthenticated && !loading && !result && !query.trim();
  const showSuggestions =
    !loading &&
    !result &&
    query.trim().length > 1 &&
    (suggestions.length > 0 || aiSuggestions.length > 0);

  const handleChange = async (value) => {
    setQuery(value);
    if (result) {
      setResult(null);
    }

    const token = getToken();
    if (!token) {
      setAuthWarning("Please log in to use suggestions.");
      setIsAuthenticated(false);
      return;
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setAiSuggestions([]);
      return;
    }

    try {
      const headers = buildAuthHeaders();
      const [autoRes, aiRes] = await Promise.all([
        fetch(`http://localhost:8000/autocomplete?q=${encodeURIComponent(trimmed)}`, { headers }),
        fetch(`http://localhost:8000/ai-recommend?q=${encodeURIComponent(trimmed)}`, { headers })
      ]);

      const [autoData, aiData] = await Promise.all([
        autoRes.ok ? autoRes.json() : [],
        aiRes.ok ? aiRes.json() : []
      ]);

      setSuggestions(Array.isArray(autoData) ? autoData : []);
      setAiSuggestions(Array.isArray(aiData) ? aiData : []);
    } catch (error) {
      setSuggestions([]);
      setAiSuggestions([]);
    }
  };

  const trackClick = (searchQuery) => {
    if (!searchQuery) {
      return;
    }

    fetch("http://localhost:8000/track-click", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...buildAuthHeaders()
      },
      body: JSON.stringify({ query: searchQuery }),
      keepalive: true
    }).catch(() => {});
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setAuthWarning("You are signed out.");
    setHistory([]);
    setRecent([]);
    setPopular([]);
    setRecommended([]);
    setSuggestions([]);
    setAiSuggestions([]);
    setResult(null);
  };

  const sectionCardStyle = {
    background: "rgba(15, 23, 42, 0.68)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 20px 40px -20px rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)"
  };

  const chipStyle = {
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.45)",
    color: "#e2e8f0",
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "transform 0.2s ease, border-color 0.2s ease, color 0.2s ease"
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(1200px circle at 15% -10%, rgba(14, 165, 233, 0.2), transparent 55%), radial-gradient(900px circle at 90% 5%, rgba(249, 115, 22, 0.18), transparent 55%), linear-gradient(140deg, #0b1221 0%, #0f1b2d 45%, #101827 100%)",
      color: "#f8fafc",
      fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
      padding: "70px 20px 90px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "relative",
      overflow: "hidden"
    }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <style jsx global>{`
        :root {
          --bg-ink: #0b1221;
          --bg-deep: #0f1b2d;
          --card: rgba(15, 23, 42, 0.68);
          --card-border: rgba(148, 163, 184, 0.2);
          --text-strong: #f8fafc;
          --text-soft: #cbd5e1;
          --accent-cool: #22d3ee;
          --accent-warm: #f59e0b;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: var(--bg-ink);
          color: var(--text-strong);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-160px",
          right: "-120px",
          width: "320px",
          height: "320px",
          background: "radial-gradient(circle, rgba(34, 211, 238, 0.35), transparent 65%)",
          filter: "blur(4px)",
          opacity: 0.6,
          pointerEvents: "none"
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-180px",
          left: "-120px",
          width: "360px",
          height: "360px",
          background: "radial-gradient(circle, rgba(249, 115, 22, 0.35), transparent 70%)",
          filter: "blur(6px)",
          opacity: 0.55,
          pointerEvents: "none"
        }}
      />

      <div style={{ maxWidth: "980px", width: "100%", position: "relative", zIndex: 1 }}>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "12px",
          flexWrap: "wrap"
        }}>
          <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
            {isAuthenticated ? "Signed in" : "Guest"}
          </div>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                border: "1px solid rgba(148, 163, 184, 0.3)",
                background: "transparent",
                color: "#e2e8f0",
                padding: "8px 14px",
                borderRadius: "999px",
                cursor: "pointer"
              }}
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              style={{
                border: "1px solid rgba(148, 163, 184, 0.3)",
                background: "transparent",
                color: "#e2e8f0",
                padding: "8px 14px",
                borderRadius: "999px",
                textDecoration: "none"
              }}
            >
              Sign in
            </Link>
          )}
        </div>

        <h1 style={{
          fontSize: "2.8rem",
          fontWeight: "800",
          background: "linear-gradient(90deg, #22d3ee, #f59e0b)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
          marginBottom: "40px"
        }}>
          🚀 Official Link Finder
        </h1>

        {authWarning && (
          <div style={{
            ...sectionCardStyle,
            borderColor: "rgba(249, 115, 22, 0.4)",
            marginBottom: "20px"
          }}>
            {authWarning}
          </div>
        )}

        {authChecked && !isAuthenticated && (
          <div style={{
            ...sectionCardStyle,
            marginBottom: "32px"
          }}>
            <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
              Please sign in to continue
            </h3>
            <p style={{ color: "#94a3b8", marginTop: 0, marginBottom: "16px" }}>
              Your searches and recommendations are linked to your account.
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-block",
                padding: "10px 16px",
                borderRadius: "12px",
                background: "linear-gradient(120deg, #22d3ee, #f59e0b)",
                color: "#0b1221",
                fontWeight: "700",
                textDecoration: "none"
              }}
            >
              Go to login
            </Link>
          </div>
        )}

        {/* Search Bar Container */}
        <div style={{
          display: "flex",
          gap: "10px",
          marginBottom: "40px",
          justifyContent: "center"
        }}>
          <input
            type="text"
            placeholder="Search for certificates, forms..."
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search()}
            style={{
              padding: "16px 24px",
              width: "100%",
              maxWidth: "500px",
              fontSize: "1.1rem",
              borderRadius: "50px",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              background: "rgba(15, 23, 42, 0.65)",
              color: "#f8fafc",
              outline: "none",
              boxShadow: "0 12px 30px -20px rgba(15, 23, 42, 0.8)",
              transition: "all 0.3s ease"
            }}
          />

          <button
            onClick={search}
            disabled={loading}
            style={{
              padding: "16px 32px",
              fontSize: "1.1rem",
              fontWeight: "600",
              borderRadius: "50px",
              border: "none",
              background: "linear-gradient(120deg, #22d3ee, #f59e0b)",
              color: "#fff",
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 16px 30px -20px rgba(15, 23, 42, 0.85)",
              transition: "transform 0.2s ease, filter 0.2s ease",
              opacity: loading ? 0.7 : 1
            }}
            onMouseOver={(e) => e.currentTarget.style.filter = "brightness(1.1)"}
            onMouseOut={(e) => e.currentTarget.style.filter = "brightness(1)"}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>

        {showSuggestions && (
          <div style={{
            ...sectionCardStyle,
            marginTop: "-24px",
            marginBottom: "36px",
            animation: "fadeIn 0.4s ease-out"
          }}>
            {suggestions.length > 0 && (
              <div style={{ marginBottom: aiSuggestions.length > 0 ? "18px" : "0" }}>
                <div style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#94a3b8",
                  marginBottom: "10px"
                }}>
                  Suggestions
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {suggestions.map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      onClick={() => search(item)}
                      style={chipStyle}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.7)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.25)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {aiSuggestions.length > 0 && (
              <div>
                <div style={{
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#94a3b8",
                  marginBottom: "10px"
                }}>
                  AI Recommendations
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {aiSuggestions.map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      onClick={() => search(item)}
                      style={chipStyle}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.7)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.25)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showDiscovery && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "18px",
            marginBottom: "36px",
            animation: "fadeIn 0.6s ease-out"
          }}>
            <div style={sectionCardStyle}>
              <h3 style={{
                fontSize: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#94a3b8",
                marginBottom: "14px"
              }}>
                Recent Searches
              </h3>

              {recent.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {recent.map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      onClick={() => search(item)}
                      style={{
                        ...chipStyle,
                        animation: "riseIn 0.5s ease-out",
                        animationDelay: `${index * 0.04}s`,
                        animationFillMode: "both"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "rgba(34, 211, 238, 0.7)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.25)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                  No recent searches yet.
                </p>
              )}

              {history.length > 0 && (
                <div style={{ marginTop: "18px", borderTop: "1px solid rgba(148, 163, 184, 0.2)", paddingTop: "14px" }}>
                  <div style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#64748b",
                    marginBottom: "10px"
                  }}>
                    Latest Results
                  </div>
                  {history.slice(0, 3).map((entry, index) => (
                    <div key={`${entry.query}-${index}`} style={{ marginBottom: "12px" }}>
                      <div style={{ fontWeight: "600", fontSize: "0.95rem", color: "#e2e8f0" }}>
                        {entry.query || "Untitled search"}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#94a3b8", lineHeight: "1.4" }}>
                        {entry.response || "No response stored yet."}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={sectionCardStyle}>
              <h3 style={{
                fontSize: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#94a3b8",
                marginBottom: "14px"
              }}>
                Popular Searches
              </h3>

              {popular.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {popular.map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      onClick={() => search(item)}
                      style={{
                        ...chipStyle,
                        animation: "riseIn 0.5s ease-out",
                        animationDelay: `${index * 0.05}s`,
                        animationFillMode: "both"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "rgba(249, 115, 22, 0.7)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.25)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                  Nothing trending yet.
                </p>
              )}
            </div>

            <div style={sectionCardStyle}>
              <h3 style={{
                fontSize: "1rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#94a3b8",
                marginBottom: "14px"
              }}>
                Recommended
              </h3>

              {recommended.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {recommended.map((item, index) => (
                    <button
                      key={`${item}-${index}`}
                      type="button"
                      onClick={() => search(item)}
                      style={{
                        ...chipStyle,
                        animation: "riseIn 0.5s ease-out",
                        animationDelay: `${index * 0.05}s`,
                        animationFillMode: "both"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.7)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.25)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                  No recommendations yet.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Results Container */}
        {result && result.best_result && (
          <div style={{
            animation: "fadeIn 0.5s ease-out"
          }}>
            <h2 style={{
              fontSize: "1.5rem",
              color: "#34d399",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "20px"
            }}>
              ⭐ Best Result
            </h2>

            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              backdropFilter: "blur(10px)",
              padding: "25px",
              borderRadius: "16px",
              marginBottom: "40px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}>
              <a
                href={result.best_result.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackClick(query)}
                style={{
                  fontSize: "1.4rem",
                  fontWeight: "700",
                  color: "#60a5fa",
                  textDecoration: "none",
                  display: "block",
                  marginBottom: "15px",
                  transition: "color 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.color = "#93c5fd"}
                onMouseOut={(e) => e.currentTarget.style.color = "#60a5fa"}
              >
                {result.best_result.title}
              </a>

              <p style={{
                color: "#cbd5e1",
                fontSize: "1.1rem",
                lineHeight: "1.7",
                letterSpacing: "0.2px"
              }}>
                {result.best_result.content}
              </p>
            </div>
          </div>
        )}

        {result && result.all_results && result.all_results.length > 1 && (
          <div style={{ animation: "fadeIn 0.8s ease-out" }}>
            <h2 style={{
              fontSize: "1.2rem",
              color: "#94a3b8",
              marginBottom: "15px"
            }}>
              📌 Other Results
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {result.all_results.slice(1).map((item, index) => (
               <div
                  key={index}
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    padding: "15px 20px",
                    borderRadius: "12px",
                    transition: "all 0.2s ease"
                  }}
               >
                  <a 
                    href={item.url} 
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackClick(query)}
                    style={{
                      color: "#94a3b8",
                      textDecoration: "none",
                      fontSize: "1.05rem",
                      fontWeight: "500",
                      display: "block"
                    }}
                    onMouseOver={(e) => Object.assign(e.currentTarget.style, { color: "#e2e8f0", textDecoration: "underline" })}
                    onMouseOut={(e) => Object.assign(e.currentTarget.style, { color: "#94a3b8", textDecoration: "none" })}
                  >
                    {item.title}
                  </a>
               </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <Link
        href="/chat"
        style={{
          position: "fixed",
          right: "24px",
          bottom: "24px",
          padding: "14px 20px",
          borderRadius: "999px",
          background: "linear-gradient(120deg, #22d3ee, #f59e0b)",
          color: "#0b1221",
          fontWeight: "700",
          fontSize: "0.95rem",
          textDecoration: "none",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 12px 20px -6px rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(6px)",
          cursor: "pointer",
          zIndex: 30,
          transition: "transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.filter = "brightness(1.05)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.filter = "brightness(1)";
        }}
      >
        AI Assistant
      </Link>
    </div>
  );
}
