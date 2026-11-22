import React from "react";

export default function MiniChatMockup({ theme, isDark = false, isSelected = false }) {
  const primary = theme.colors.primary;
  const secondary = theme.colors.secondary;
  const bgApp = isDark ? "#0B0F19" : theme.colors.bgApp;
  const bgSidebar = isDark ? "#111827" : theme.colors.bgSidebar;
  const bgChat = isDark ? "#0F172A" : theme.colors.bgChat;
  const bgCard = isDark ? "#1E293B" : theme.colors.bgCard;
  const border = isDark ? "#263346" : theme.colors.border;
  const bgBubbleMe = isDark
    ? `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`
    : theme.colors.bgBubbleMe;
  const bgBubbleOther = isDark ? "#1E293B" : theme.colors.bgBubbleOther;
  const textBubbleOther = isDark ? "#94A3B8" : theme.colors.textBubbleOther;

  return (
    <div
      style={{
        width: "100%",
        height: 105,
        borderRadius: "var(--radius-md, 10px)",
        backgroundColor: bgApp,
        border: `1.5px solid ${isSelected ? primary : border}`,
        display: "flex",
        overflow: "hidden",
        boxShadow: isSelected ? `0 0 0 2px ${primary}40, 0 4px 12px rgba(0,0,0,0.08)` : "0 2px 4px rgba(0,0,0,0.04)",
        transition: "all var(--transition-fast)",
        userSelect: "none",
      }}
    >
      {/* Mini Sidebar */}
      <div
        style={{
          width: 44,
          backgroundColor: bgSidebar,
          borderRight: `1px solid ${border}`,
          display: "flex",
          flexDirection: "column",
          padding: "6px 5px",
          gap: 5,
        }}
      >
        {/* Mini Brand Dot */}
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: primary, marginBottom: 2 }} />
        {/* Mini Chat items */}
        <div style={{ width: "100%", height: 6, borderRadius: 3, background: isSelected ? primary : `${primary}40` }} />
        <div style={{ width: "75%", height: 5, borderRadius: 3, background: isDark ? "#334155" : "#CBD5E1" }} />
        <div style={{ width: "85%", height: 5, borderRadius: 3, background: isDark ? "#334155" : "#CBD5E1" }} />
      </div>

      {/* Mini Chat Main Window */}
      <div
        style={{
          flex: 1,
          backgroundColor: bgChat,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Mini Header */}
        <div
          style={{
            height: 18,
            backgroundColor: bgCard,
            borderBottom: `1px solid ${border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: primary }} />
            <div style={{ width: 24, height: 4, borderRadius: 2, background: isDark ? "#94A3B8" : "#64748B" }} />
          </div>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981" }} />
        </div>

        {/* Mini Messages Area */}
        <div
          style={{
            flex: 1,
            padding: "6px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            justifyContent: "center",
          }}
        >
          {/* Incoming mini bubble */}
          <div
            style={{
              alignSelf: "flex-start",
              maxWidth: "70%",
              padding: "3px 6px",
              borderRadius: "6px 6px 6px 2px",
              backgroundColor: bgBubbleOther,
              border: `1px solid ${border}`,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 1.5, background: textBubbleOther, opacity: 0.8 }} />
            <div style={{ width: 22, height: 3, borderRadius: 1.5, background: textBubbleOther, opacity: 0.5 }} />
          </div>

          {/* Outgoing mini bubble */}
          <div
            style={{
              alignSelf: "flex-end",
              maxWidth: "70%",
              padding: "3px 6px",
              borderRadius: "6px 6px 2px 6px",
              background: bgBubbleMe,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <div style={{ width: 32, height: 3, borderRadius: 1.5, background: "#FFFFFF", opacity: 0.9 }} />
          </div>
        </div>

        {/* Mini Input Bar */}
        <div
          style={{
            height: 16,
            padding: "0 6px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            borderTop: `1px solid ${border}`,
            backgroundColor: bgCard,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 9,
              borderRadius: 4,
              backgroundColor: isDark ? "#0F172A" : "#F1F5F9",
              border: `0.5px solid ${border}`,
            }}
          />
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: primary,
            }}
          />
        </div>
      </div>
    </div>
  );
}
