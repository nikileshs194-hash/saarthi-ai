import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const googleButtonRef = useRef(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  const handleGoogleCredential = async (credential) => {
    if (!credential) {
      setError("Google sign-in failed.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("http://localhost:8000/login/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();

      if (!res.ok || data.error || data.detail) {
        setError(data.error || data.detail || "Google login failed.");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        router.push("/");
        return;
      }

      setError("Token not returned.");
    } catch (err) {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    let intervalId;

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) {
        return false;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => handleGoogleCredential(response.credential)
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 320
      });
      return true;
    };

    if (!initializeGoogle()) {
      intervalId = window.setInterval(() => {
        if (initializeGoogle()) {
          window.clearInterval(intervalId);
        }
      }, 250);
    }

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [googleClientId]);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const endpoint = mode === "signup" ? "signup" : "login";
      const res = await fetch(`http://localhost:8000/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok || data.error || data.detail) {
        setError(data.error || data.detail || "Request failed.");
        return;
      }

      if (mode === "signup") {
        setMessage("Account created. You can log in now.");
        setMode("login");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
        router.push("/");
        return;
      }

      setError("Token not returned.");
    } catch (err) {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(140deg, #0b1221 0%, #0f1b2d 55%, #101827 100%)",
      color: "#f8fafc",
      fontFamily: "'Space Grotesk', 'Segoe UI', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px"
    }}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </Head>

      <div style={{
        width: "100%",
        maxWidth: "420px",
        background: "rgba(15, 23, 42, 0.75)",
        border: "1px solid rgba(148, 163, 184, 0.25)",
        borderRadius: "20px",
        padding: "28px",
        boxShadow: "0 25px 50px -30px rgba(15, 23, 42, 0.9)"
      }}>
        <h1 style={{ fontSize: "1.9rem", marginBottom: "6px" }}>
          {mode === "signup" ? "Create account" : "Welcome back"}
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
          {mode === "signup" ? "Sign up to start searching." : "Log in to continue."}
        </p>

        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px" }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            background: "rgba(15, 23, 42, 0.6)",
            color: "#f8fafc",
            marginBottom: "14px"
          }}
        />

        <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "6px" }}>
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            background: "rgba(15, 23, 42, 0.6)",
            color: "#f8fafc",
            marginBottom: "16px"
          }}
        />

        {error && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fecaca",
            padding: "10px 12px",
            borderRadius: "12px",
            marginBottom: "12px"
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            background: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.35)",
            color: "#bbf7d0",
            padding: "10px 12px",
            borderRadius: "12px",
            marginBottom: "12px"
          }}>
            {message}
          </div>
        )}

        <div style={{
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "center"
        }}>
          <div ref={googleButtonRef} style={{ minHeight: "40px" }} />
          {!googleClientId && (
            <div style={{ fontSize: "0.85rem", color: "#94a3b8", textAlign: "center" }}>
              Set NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable Google login.
            </div>
          )}
        </div>

        <button
          onClick={submit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(120deg, #22d3ee, #f59e0b)",
            color: "#0b1221",
            fontWeight: "700",
            cursor: loading ? "wait" : "pointer",
            marginBottom: "12px"
          }}
        >
          {loading ? "Working..." : mode === "signup" ? "Create account" : "Log in"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setError("");
            setMessage("");
          }}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "12px",
            border: "1px solid rgba(148, 163, 184, 0.3)",
            background: "transparent",
            color: "#e2e8f0",
            cursor: "pointer"
          }}
        >
          {mode === "signup" ? "Already have an account? Log in" : "Need an account? Sign up"}
        </button>
      </div>
    </div>
  );
}
