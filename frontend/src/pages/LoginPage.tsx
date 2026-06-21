import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      // Redirect will happen after user state is set
      setTimeout(() => navigate("/"), 100);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid credentials";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: "citizen" | "officer" | "admin") => {
    const demos: Record<string, { email: string; password: string }> = {
      citizen: { email: "citizen@demo.com", password: "password123" },
      officer: { email: "officer@demo.com", password: "password123" },
      admin: { email: "admin@demo.com", password: "password123" },
    };
    setEmail(demos[role].email);
    setPassword(demos[role].password);
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">🏛️</div>
          <div>
            <div style={{ fontFamily: "Outfit, sans-serif", fontSize: 20, fontWeight: 800 }}>CivicConnect</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Community Request Platform</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to manage community requests</p>

        {error && (
          <div
            style={{
              background: "rgba(244,63,94,0.1)",
              border: "1px solid rgba(244,63,94,0.25)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--rose)",
              marginBottom: 12,
            }}
          >
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} id="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="login-password"
                type={showPass ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                id="toggle-password"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                }}
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary btn-lg w-full"
            disabled={loading}
            style={{ marginTop: 4, justifyContent: "center" }}
          >
            {loading ? (
              <span className="loading-spinner" style={{ width: 18, height: 18 }} />
            ) : (
              <LogIn size={16} />
            )}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-divider" style={{ margin: "20px 0 16px" }}>Quick Demo</div>

        <div style={{ display: "flex", gap: 8 }}>
          {(["citizen", "officer", "admin"] as const).map((role) => (
            <button
              key={role}
              id={`demo-${role}`}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, justifyContent: "center", textTransform: "capitalize" }}
              onClick={() => fillDemo(role)}
            >
              {role}
            </button>
          ))}
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "var(--text-secondary)" }}>
          No account?{" "}
          <a
            id="go-register"
            className="auth-link"
            onClick={() => navigate("/register")}
            style={{ cursor: "pointer" }}
          >
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
