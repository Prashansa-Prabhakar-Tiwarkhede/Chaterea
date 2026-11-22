import React from "react";

export default function TypingIndicator({ label }) {
  if (!label) return null;

  return (
    <div
      className="animate-fade-in"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        borderRadius: "var(--radius-full, 9999px)",
        backgroundColor: "var(--color-bg-card, #FFFFFF)",
        border: "1px solid var(--color-border, #E8EAF0)",
        boxShadow: "var(--shadow-xs)",
        fontSize: "0.78rem",
        color: "var(--color-text-secondary, #64748B)",
        marginBottom: 8,
        marginLeft: 8,
      }}
    >
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span style={{ fontWeight: 500 }}>{label} is typing...</span>
    </div>
  );
}

