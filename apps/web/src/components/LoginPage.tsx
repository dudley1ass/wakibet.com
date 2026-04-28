import { FormEvent, useState } from "react";
import { apiPost, finalizeAuthFromLoginResponse } from "../api";

type Props = {
  onAuthSuccess: (payload: {
    access_token: string;
    user: { user_id: string; email: string; display_name: string; virtual_cents?: number };
  }) => void;
};

export default function LoginPage({ onAuthSuccess }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetMessages() {
    setMessage(null);
    setError(null);
  }

  async function handleLogin() {
    resetMessages();
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    try {
      setLoading(true);
      const data = await apiPost<Record<string, unknown>>("/api/v1/auth/login", { email, password });
      const payload = await finalizeAuthFromLoginResponse(data);
      setMessage("Logged in.");
      onAuthSuccess(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    resetMessages();
    if (!email.trim() || !password || !dob || !stateVal) {
      setError("Email, password, DOB, and state are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    try {
      setLoading(true);
      const body: Record<string, string> = {
        email,
        password,
        dob,
        state: stateVal,
      };
      const dn = displayName.trim();
      if (dn) body.display_name = dn;
      const data = await apiPost<Record<string, unknown>>("/api/v1/auth/register", body);
      const payload = await finalizeAuthFromLoginResponse(data);
      setMessage("Account created. You're signed in.");
      onAuthSuccess(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === "login") {
      void handleLogin();
    } else {
      void handleRegister();
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        background: "rgba(18, 12, 12, 0.92)",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
        border: "1px solid rgba(245, 158, 11, 0.35)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", color: "#facc15" }}>
            <img src="/brand/logo-primary.svg" alt="WakiBet" style={{ height: "36px", width: "auto" }} />
          </h1>
          <div style={{ fontSize: "11px", color: "#92400e" }}>
            Fantasy contests — WakiPoints only.
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            background: "rgba(14, 10, 10, 0.7)",
            borderRadius: "999px",
            padding: "2px",
            border: "1px solid #f59e0b",
          }}
        >
          <button
            type="button"
            onClick={() => setMode("login")}
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: mode === "login" ? "#b45309" : "transparent",
              color: mode === "login" ? "white" : "#fcd34d",
            }}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            style={{
              fontSize: "11px",
              padding: "4px 8px",
              borderRadius: "999px",
              border: "none",
              cursor: "pointer",
              background: mode === "register" ? "#b45309" : "transparent",
              color: mode === "register" ? "white" : "#fcd34d",
            }}
          >
            Create
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ fontSize: "13px" }}>
        <div style={{ marginBottom: "8px" }}>
          <label style={{ display: "block", fontSize: "11px", color: "#fcd34d" }}>Email</label>
          <input
            type="email"
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "10px",
              border: "1px solid rgba(251, 191, 36, 0.42)",
              background: "rgba(10, 8, 8, 0.85)",
              color: "#fef3c7",
              outline: "none",
            }}
          />
        </div>

        <div style={{ marginBottom: "8px" }}>
          <label style={{ display: "block", fontSize: "11px", color: "#fcd34d" }}>Password</label>
          <input
            type="password"
            value={password}
            placeholder="At least 8 characters"
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "10px",
              border: "1px solid rgba(251, 191, 36, 0.42)",
              background: "rgba(10, 8, 8, 0.85)",
              color: "#fef3c7",
              outline: "none",
            }}
          />
          <div style={{ fontSize: "10px", color: "#fcd34d", marginTop: "2px" }}>
            Passwords are hashed on the server (bcrypt).
          </div>
        </div>

        {mode === "register" && (
          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#fcd34d" }}>
              Screen name (optional)
            </label>
            <input
              type="text"
              value={displayName}
              placeholder="Shown on leaderboards"
              onChange={(e) => setDisplayName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "10px",
                border: "1px solid rgba(251, 191, 36, 0.42)",
                background: "rgba(10, 8, 8, 0.85)",
                color: "#fef3c7",
                outline: "none",
              }}
            />
          </div>
        )}

        {mode === "register" && (
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "11px", color: "#fcd34d" }}>State</label>
              <select
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "10px",
                  border: "1px solid rgba(251, 191, 36, 0.42)",
                  background: "rgba(10, 8, 8, 0.85)",
                  color: "#fef3c7",
                  outline: "none",
                }}
              >
                <option value="">Select…</option>
                <option value="FL">FL</option>
                <option value="GA">GA</option>
                <option value="AL">AL</option>
                <option value="NC">NC</option>
                <option value="SC">SC</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "11px", color: "#fcd34d" }}>Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "10px",
                  border: "1px solid rgba(251, 191, 36, 0.42)",
                  background: "rgba(10, 8, 8, 0.85)",
                  color: "#fef3c7",
                  outline: "none",
                }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "8px",
            padding: "10px",
            borderRadius: "999px",
            border: "none",
            background: "linear-gradient(135deg, #b45309, #7f1d1d)",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? mode === "login"
              ? "Logging in..."
              : "Creating account..."
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </form>

      <div style={{ marginTop: "8px", minHeight: "20px", fontSize: "11px" }}>
        {message && <div style={{ color: "#166534", fontWeight: "600" }}>{message}</div>}
        {error && (
          <div style={{ color: "#b91c1c", fontWeight: "600", whiteSpace: "pre-wrap" }}>{error}</div>
        )}
      </div>
    </div>
  );
}
