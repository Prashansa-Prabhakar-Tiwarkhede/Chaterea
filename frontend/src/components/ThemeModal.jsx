import React, { useState, useEffect } from "react";
import { useTheme, computeThemeColors } from "../context/ThemeContext.jsx";
import {
  X,
  Palette,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Check,
  Sparkles,
  Sliders,
  ShieldCheck,
} from "lucide-react";

export default function ThemeModal({ isOpen, onClose }) {
  const {
    activeThemeId,
    mode,
    customColors,
    predefinedThemes,
    saveTheme,
    resetToDefault,
    applyTheme,
  } = useTheme();

  const [selectedThemeId, setSelectedThemeId] = useState(activeThemeId);
  const [selectedMode, setSelectedMode] = useState(mode);
  const [activeTab, setActiveTab] = useState("presets"); // "presets" | "custom"

  // Custom colors local state
  const baseTheme = predefinedThemes.find((t) => t.id === selectedThemeId) || predefinedThemes[0];
  const [custom, setCustom] = useState(customColors || {
    primary: baseTheme.colors.primary,
    secondary: baseTheme.colors.secondary,
    accent: baseTheme.colors.accent,
    bgChat: baseTheme.colors.bgChat,
    bgSidebar: baseTheme.colors.bgSidebar,
  });

  useEffect(() => {
    setSelectedThemeId(activeThemeId);
    setSelectedMode(mode);
    setCustom(customColors || {
      primary: baseTheme.colors.primary,
      secondary: baseTheme.colors.secondary,
      accent: baseTheme.colors.accent,
      bgChat: baseTheme.colors.bgChat,
      bgSidebar: baseTheme.colors.bgSidebar,
    });
  }, [activeThemeId, mode, customColors, isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        applyTheme(activeThemeId, mode, customColors);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, activeThemeId, mode, customColors, applyTheme]);

  if (!isOpen) return null;

  const isPreviewDark = selectedMode === "dark" || (selectedMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const currentPreviewColors = computeThemeColors(baseTheme, isPreviewDark, activeTab === "custom" ? custom : null);

  const handleModeChange = (newMode) => {
    setSelectedMode(newMode);
    applyTheme(selectedThemeId, newMode, activeTab === "custom" ? custom : null);
  };

  const handleThemeChange = (newThemeId) => {
    setSelectedThemeId(newThemeId);
    applyTheme(newThemeId, selectedMode, activeTab === "custom" ? custom : null);
  };

  const handleCustomColorChange = (key, val) => {
    const nextCustom = { ...custom, [key]: val };
    setCustom(nextCustom);
    applyTheme(selectedThemeId, selectedMode, nextCustom);
  };

  const handleClose = () => {
    applyTheme(activeThemeId, mode, customColors);
    onClose();
  };

  const handleApply = () => {
    saveTheme(selectedThemeId, selectedMode, activeTab === "custom" ? custom : null);
    onClose();
  };

  const handleReset = () => {
    resetToDefault();
    setSelectedThemeId("soft-lavender");
    setSelectedMode("light");
    setCustom(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(6px)",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 780,
          maxHeight: "90vh",
          backgroundColor: "var(--color-bg-card, #FFFFFF)",
          borderRadius: "var(--radius-xl, 20px)",
          boxShadow: "0 20px 40px -8px rgba(0,0,0,0.22)",
          border: "1px solid var(--color-border, #E8EAF0)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border, #E8EAF0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "var(--radius-md, 10px)",
                background: "var(--color-primary-light, #EEF2FF)",
                color: "var(--color-primary, #6366F1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Palette size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                Appearance & Theme
              </h2>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)", margin: 0 }}>
                Customize your personal colors, themes, and display modes.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              padding: 8,
              borderRadius: "50%",
              cursor: "pointer",
              color: "var(--color-text-muted, #94A3B8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background var(--transition-fast)",
            }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Mode Selector (Light, Dark, System) */}
          <div>
            <label
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--color-text-secondary, #64748B)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 10,
              }}
            >
              Display Mode
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { id: "light", label: "Light Mode", icon: Sun },
                { id: "dark", label: "Dark Mode", icon: Moon },
                { id: "system", label: "System Default", icon: Monitor },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleModeChange(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md, 10px)",
                    border: `1.5px solid ${selectedMode === id ? "var(--color-primary, #6366F1)" : "var(--color-border, #E8EAF0)"}`,
                    background: selectedMode === id ? "var(--color-primary-light, #EEF2FF)" : "var(--color-bg-card, #FFFFFF)",
                    color: selectedMode === id ? "var(--color-primary, #6366F1)" : "var(--color-text-primary, #1E293B)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Tabs (Presets vs Custom) */}
          <div>
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid var(--color-border, #E8EAF0)",
                gap: 24,
                marginBottom: 16,
              }}
            >
              <button
                onClick={() => setActiveTab("presets")}
                style={{
                  padding: "8px 4px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === "presets" ? "2px solid var(--color-primary, #6366F1)" : "2px solid transparent",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  color: activeTab === "presets" ? "var(--color-primary, #6366F1)" : "var(--color-text-secondary, #64748B)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Sparkles size={16} />
                <span>Predefined Themes</span>
              </button>
              <button
                onClick={() => setActiveTab("custom")}
                style={{
                  padding: "8px 4px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === "custom" ? "2px solid var(--color-primary, #6366F1)" : "2px solid transparent",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  color: activeTab === "custom" ? "var(--color-primary, #6366F1)" : "var(--color-text-secondary, #64748B)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Sliders size={16} />
                <span>Custom Palette</span>
              </button>
            </div>

            {/* Presets Grid */}
            {activeTab === "presets" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                  gap: 12,
                }}
              >
                {predefinedThemes.map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      style={{
                        padding: "14px",
                        borderRadius: "var(--radius-lg, 14px)",
                        border: `1.5px solid ${isSelected ? "var(--color-primary, #6366F1)" : "var(--color-border, #E8EAF0)"}`,
                        background: isSelected ? "var(--color-primary-light, #EEF2FF)" : "var(--color-bg-card, #FFFFFF)",
                        cursor: "pointer",
                        transition: "all var(--transition-fast)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <strong style={{ fontSize: "0.9rem", color: isSelected ? "var(--color-primary, #6366F1)" : "var(--color-text-primary, #1E293B)" }}>
                          {theme.name}
                        </strong>
                        {isSelected && (
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              backgroundColor: "var(--color-primary, #6366F1)",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      {/* Color swatches bar */}
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: theme.colors.primary, border: "1px solid rgba(0,0,0,0.1)" }} />
                        <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: theme.colors.secondary, border: "1px solid rgba(0,0,0,0.1)" }} />
                        <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: theme.colors.accent, border: "1px solid rgba(0,0,0,0.1)" }} />
                        <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: theme.colors.bgSidebar, border: "1px solid rgba(0,0,0,0.1)" }} />
                        <span style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: theme.colors.bgChat, border: "1px solid rgba(0,0,0,0.1)" }} />
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary, #64748B)", margin: 0, lineHeight: 1.3 }}>
                        {theme.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Custom Palette Tab */}
            {activeTab === "custom" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)" }}>
                  Select or input hex codes for each element to tailor your personal color harmony:
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {[
                    { label: "Primary Accent", key: "primary" },
                    { label: "Secondary Color", key: "secondary" },
                    { label: "Soft Accent", key: "accent" },
                    { label: "Sidebar Tint", key: "bgSidebar" },
                    { label: "Chat Background", key: "bgChat" },
                  ].map(({ label, key }) => (
                    <div
                      key={key}
                      style={{
                        padding: "12px",
                        border: "1px solid var(--color-border, #E8EAF0)",
                        borderRadius: "var(--radius-md, 10px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary, #64748B)" }}>
                        {label}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input
                          type="color"
                          value={custom?.[key] || currentPreviewColors[key] || "#6366F1"}
                          onChange={(e) => handleCustomColorChange(key, e.target.value)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: "var(--radius-sm, 6px)",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: "transparent",
                          }}
                        />
                        <input
                          type="text"
                          value={custom?.[key] || currentPreviewColors[key] || ""}
                          onChange={(e) => handleCustomColorChange(key, e.target.value)}
                          style={{
                            width: 90,
                            padding: "6px 8px",
                            fontSize: "0.85rem",
                            borderRadius: "var(--radius-sm, 6px)",
                            border: "1px solid var(--color-border, #E8EAF0)",
                            fontFamily: "monospace",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Interactive Preview Card */}
          <div>
            <label
              style={{
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--color-text-secondary, #64748B)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 10,
              }}
            >
              Live Theme Preview
            </label>
            <div
              style={{
                borderRadius: "var(--radius-lg, 14px)",
                border: "1px solid var(--color-border, #E8EAF0)",
                overflow: "hidden",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Mock Chat Header */}
              <div
                style={{
                  padding: "10px 16px",
                  backgroundColor: currentPreviewColors.bgCard || "#FFFFFF",
                  borderBottom: `1px solid ${currentPreviewColors.border || "#E8EAF0"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      backgroundColor: currentPreviewColors.primary,
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    D1
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.85rem", color: currentPreviewColors.textPrimary }}>Demo1</strong>
                    <div style={{ fontSize: "0.7rem", color: "#10B981" }}>Active now</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", color: currentPreviewColors.primary }}>
                  <ShieldCheck size={14} />
                  <span>E2EE Active</span>
                </div>
              </div>

              {/* Mock Message Area */}
              <div
                style={{
                  padding: "16px",
                  backgroundColor: currentPreviewColors.bgChat || "#FAFBFF",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Incoming message */}
                <div style={{ alignSelf: "flex-start", maxWidth: "75%" }}>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "14px 14px 14px 4px",
                      backgroundColor: currentPreviewColors.bgBubbleOther || "#FFFFFF",
                      color: currentPreviewColors.textBubbleOther || "#1E293B",
                      fontSize: "0.85rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      border: `1px solid ${currentPreviewColors.border || "#E8EAF0"}`,
                    }}
                  >
                    Welcome to Chaterea! Notice how gentle and legible this theme is.
                  </div>
                  <div style={{ fontSize: "0.68rem", color: currentPreviewColors.textMuted || "#94A3B8", marginTop: 3 }}>
                    10:24 AM • Verified Signature
                  </div>
                </div>

                {/* Outgoing user message */}
                <div style={{ alignSelf: "flex-end", maxWidth: "75%" }}>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "14px 14px 4px 14px",
                      background: currentPreviewColors.bgBubbleMe || currentPreviewColors.primary,
                      color: currentPreviewColors.textBubbleMe || "#FFFFFF",
                      fontSize: "0.85rem",
                      boxShadow: "0 2px 6px rgba(99,102,241,0.2)",
                    }}
                  >
                    Love this design! The typography and colors feel truly premium.
                  </div>
                  <div style={{ fontSize: "0.68rem", color: currentPreviewColors.textMuted || "#94A3B8", marginTop: 3, textAlign: "right" }}>
                    10:25 AM • Delivered
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--color-border, #E8EAF0)",
            backgroundColor: "var(--color-bg-sidebar, #F1F0FA)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={handleReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "1px solid var(--color-border, #E8EAF0)",
              borderRadius: "var(--radius-md, 10px)",
              padding: "8px 14px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--color-text-secondary, #64748B)",
              cursor: "pointer",
            }}
          >
            <RotateCcw size={15} />
            <span>Reset to Default</span>
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "none",
                padding: "8px 16px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-secondary, #64748B)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              style={{
                background: "var(--color-primary, #6366F1)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "var(--radius-md, 10px)",
                padding: "9px 20px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(99,102,241,0.3)",
                transition: "all var(--transition-fast)",
              }}
            >
              Save & Apply Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

