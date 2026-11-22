import React from "react";
import { ShieldCheck, Settings, Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import Avatar from "./Avatar.jsx";

export default function ChatHeader({
  activeChat,
  onOpenSettingsModal,
  onOpenMobileSidebar,
}) {
  const { isDark, toggleMode } = useTheme();

  if (!activeChat) return null;

  const title = activeChat.type === "DIRECT"
    ? (activeChat.otherDisplayName || "Direct Chat")
    : (activeChat.groupName || "Group Chat");

  return (
    <header
      style={{
        height: 68,
        minHeight: 68,
        padding: "0 20px",
        backgroundColor: "var(--color-bg-card, #FFFFFF)",
        borderBottom: "1px solid var(--color-border, #E8EAF0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        userSelect: "none",
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobileSidebar}
          style={{
            display: "none",
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md, 10px)",
            border: "1px solid var(--color-border, #E8EAF0)",
            background: "transparent",
            color: "var(--color-text-primary, #1E293B)",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          className="mobile-menu-btn"
        >
          <Menu size={18} />
        </button>

        <Avatar name={title} size="md" isOnline={true} showStatus={activeChat.type === "DIRECT"} />

        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary, #1E293B)", margin: 0, lineHeight: 1.2 }}>
            {title}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10B981" }} />
            <span style={{ fontSize: "0.74rem", color: "var(--color-text-secondary, #64748B)" }}>
              {activeChat.type === "DIRECT" ? "Active now" : "Group Chat"}
            </span>
          </div>
        </div>
      </div>

      {/* Header Actions & Encryption Pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* End-to-End Encryption Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: "var(--radius-full, 9999px)",
            backgroundColor: "var(--color-primary-light, #EEF2FF)",
            color: "var(--color-primary, #6366F1)",
            fontSize: "0.75rem",
            fontWeight: 600,
            border: "1px solid rgba(99, 102, 241, 0.15)",
          }}
          title="All messages in this chat are encrypted using RSA-OAEP 2048 & AES-256-GCM. The server never sees plaintext."
        >
          <ShieldCheck size={14} />
          <span className="hidden-mobile">End-to-End Encrypted</span>
        </div>

        {/* Theme / Settings Button */}
        <button
          onClick={onOpenSettingsModal}
          style={{
            padding: "7px 12px",
            borderRadius: "var(--radius-md, 10px)",
            border: "1px solid var(--color-border, #E8EAF0)",
            backgroundColor: "var(--color-bg-card, #FFFFFF)",
            color: "var(--color-text-secondary, #64748B)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: "0.82rem",
            fontWeight: 600,
            transition: "all var(--transition-fast)",
          }}
          title="Customize Theme & Settings"
        >
          <Settings size={15} />
          <span className="hidden-mobile">Settings</span>
        </button>

        {/* Dark / Light Toggle Quick Switch */}
        <button
          onClick={toggleMode}
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md, 10px)",
            border: "1px solid var(--color-border, #E8EAF0)",
            backgroundColor: "var(--color-bg-card, #FFFFFF)",
            color: "var(--color-text-primary, #1E293B)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all var(--transition-fast)",
          }}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={17} color="#FBBF24" /> : <Moon size={17} color="#6366F1" />}
        </button>
      </div>
    </header>
  );
}

