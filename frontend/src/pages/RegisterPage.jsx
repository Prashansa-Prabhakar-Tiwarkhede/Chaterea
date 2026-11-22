import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Shield, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setStatus("Generating 2048-bit RSA encryption & signing key pairs in your browser...");
    try {
      await register(form);
      setStatus("Registration successful! Check your email to verify your account, then log in.");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.message || "Registration failed");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-bg-app, #F8FAFC)",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background ambient gradient glow */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.14) 0%, rgba(99,102,241,0.04) 70%, transparent 100%)",
          top: "-120px",
          left: "-100px",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 450,
          height: 450,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(125,211,252,0.12) 0%, transparent 70%)",
          bottom: "-80px",
          right: "-80px",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 440,
          backgroundColor: "var(--color-bg-card, #FFFFFF)",
          borderRadius: "var(--radius-xl, 22px)",
          boxShadow: "0 20px 40px -8px rgba(16, 24, 40, 0.12), 0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid var(--color-border, #E8EAF0)",
          padding: "36px 32px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Brand Logo & Heading */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-lg, 14px)",
              background: "linear-gradient(135deg, var(--color-primary, #6366F1) 0%, var(--color-secondary, #A78BFA) 100%)",
              color: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 6px 16px rgba(99,102,241,0.28)",
              marginBottom: 12,
            }}
          >
            <Shield size={26} />
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-text-primary, #1E293B)", margin: 0 }}>
            Create your account
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)", marginTop: 6, marginBottom: 0 }}>
            Join Chaterea for zero-knowledge encrypted messaging.
          </p>
        </div>

        {/* Status indicator */}
        {status && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: "var(--radius-md, 10px)",
              backgroundColor: "var(--color-success-bg, #ECFDF5)",
              color: "var(--color-success, #10B981)",
              fontSize: "0.82rem",
              marginBottom: 18,
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            <span>{status}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: "var(--radius-md, 10px)",
              backgroundColor: "var(--color-danger-bg, #FEF2F2)",
              color: "var(--color-danger, #EF4444)",
              fontSize: "0.82rem",
              marginBottom: 18,
              border: "1px solid rgba(239, 68, 68, 0.2)",
              whiteSpace: "pre-line",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary, #64748B)", display: "block", marginBottom: 6 }}>
              Display name
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <User size={17} style={{ position: "absolute", left: 12, color: "var(--color-text-muted, #94A3B8)" }} />
              <input
                type="text"
                placeholder="e.g. Alice"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: "var(--radius-md, 10px)",
                  border: "1.5px solid var(--color-border, #E8EAF0)",
                  backgroundColor: "var(--color-bg-app, #F8FAFC)",
                  color: "var(--color-text-primary, #1E293B)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary, #64748B)", display: "block", marginBottom: 6 }}>
              Email address
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Mail size={17} style={{ position: "absolute", left: 12, color: "var(--color-text-muted, #94A3B8)" }} />
              <input
                type="email"
                placeholder="alice@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: "var(--radius-md, 10px)",
                  border: "1.5px solid var(--color-border, #E8EAF0)",
                  backgroundColor: "var(--color-bg-app, #F8FAFC)",
                  color: "var(--color-text-primary, #1E293B)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary, #64748B)", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Lock size={17} style={{ position: "absolute", left: 12, color: "var(--color-text-muted, #94A3B8)" }} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "10px 40px 10px 38px",
                  borderRadius: "var(--radius-md, 10px)",
                  border: "1.5px solid var(--color-border, #E8EAF0)",
                  backgroundColor: "var(--color-bg-app, #F8FAFC)",
                  color: "var(--color-text-primary, #1E293B)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted, #94A3B8)",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <small style={{ color: "var(--color-text-muted, #94A3B8)", fontSize: "0.74rem", lineHeight: 1.3, display: "block", marginTop: 4 }}>
              Must contain uppercase, lowercase, a digit, and a special character (@$!%*?&#^()_+-=).
            </small>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              padding: "12px",
              borderRadius: "var(--radius-md, 10px)",
              background: "linear-gradient(135deg, var(--color-primary, #6366F1) 0%, var(--color-secondary, #A78BFA) 100%)",
              color: "#FFFFFF",
              border: "none",
              fontSize: "0.92rem",
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <span>{loading ? "Generating encryption keys..." : "Create Account"}</span>
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Switch to Login */}
        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)", marginTop: 24, marginBottom: 0 }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{ color: "var(--color-primary, #6366F1)", fontWeight: 700, textDecoration: "none" }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
