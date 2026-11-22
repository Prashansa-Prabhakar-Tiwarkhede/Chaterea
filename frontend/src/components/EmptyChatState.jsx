import React from "react";
import { Shield, Lock, Zap, Palette, Settings, MessageSquarePlus } from "lucide-react";

export default function EmptyChatState({ onOpenNewChat, onOpenSettingsModal }) {
  return (
    <div
      className="animate-fade-in"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px",
        backgroundColor: "var(--color-bg-chat, #FAFBFF)",
        textAlign: "center",
        userSelect: "none",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-xl, 20px)",
          background: "linear-gradient(135deg, var(--color-primary, #6366F1) 0%, var(--color-secondary, #A78BFA) 100%)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 24px -4px rgba(99, 102, 241, 0.35)",
          marginBottom: 20,
        }}
      >
        <Shield size={32} />
      </div>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--color-text-primary, #1E293B)",
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        Welcome to Chaterea
      </h2>
      <p
        style={{
          fontSize: "0.92rem",
          color: "var(--color-text-secondary, #64748B)",
          maxWidth: 440,
          marginTop: 8,
          marginBottom: 28,
          lineHeight: 1.5,
        }}
      >
        Select an existing conversation from the sidebar or start a new encrypted chat.
        Your privacy is guaranteed with client-side cryptographic keys.
      </p>

      {/* Feature Pills */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          maxWidth: 600,
          width: "100%",
          marginBottom: 32,
        }}
      >
        {[
          { icon: Lock, title: "Zero-Knowledge E2EE", desc: "RSA-OAEP & AES-GCM 256" },
          { icon: Zap, title: "Real-Time Sync", desc: "Instant WebSocket push" },
          { icon: Palette, title: "Custom Themes", desc: "Soft pastel & custom colors" },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            style={{
              padding: "14px 16px",
              borderRadius: "var(--radius-lg, 14px)",
              backgroundColor: "var(--color-bg-card, #FFFFFF)",
              border: "1px solid var(--color-border, #E8EAF0)",
              boxShadow: "var(--shadow-xs)",
              textAlign: "left",
            }}
          >
            <div style={{ color: "var(--color-primary, #6366F1)", marginBottom: 6 }}>
              <Icon size={18} />
            </div>
            <strong style={{ fontSize: "0.85rem", color: "var(--color-text-primary, #1E293B)", display: "block" }}>
              {title}
            </strong>
            <span style={{ fontSize: "0.74rem", color: "var(--color-text-secondary, #64748B)" }}>
              {desc}
            </span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onOpenNewChat}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: "var(--radius-md, 10px)",
            background: "linear-gradient(135deg, var(--color-primary, #6366F1) 0%, var(--color-secondary, #A78BFA) 100%)",
            color: "#FFFFFF",
            border: "none",
            fontWeight: 600,
            fontSize: "0.88rem",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <MessageSquarePlus size={18} />
          <span>Start a New Chat</span>
        </button>

        <button
          onClick={onOpenSettingsModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: "var(--radius-md, 10px)",
            backgroundColor: "var(--color-bg-card, #FFFFFF)",
            color: "var(--color-text-primary, #1E293B)",
            border: "1px solid var(--color-border, #E8EAF0)",
            fontWeight: 600,
            fontSize: "0.88rem",
            cursor: "pointer",
            boxShadow: "var(--shadow-xs)",
            transition: "all var(--transition-fast)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary, #6366F1)";
            e.currentTarget.style.color = "var(--color-primary, #6366F1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border, #E8EAF0)";
            e.currentTarget.style.color = "var(--color-text-primary, #1E293B)";
          }}
        >
          <Settings size={18} />
          <span>Theme & Settings</span>
        </button>
      </div>
    </div>
  );
}

