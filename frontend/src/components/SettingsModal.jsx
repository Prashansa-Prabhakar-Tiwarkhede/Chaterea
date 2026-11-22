import React, { useState, useEffect } from "react";
import { useTheme, computeThemeColors } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { playSentSound, playReceivedSound } from "../lib/sound.js";
import MiniChatMockup from "./MiniChatMockup.jsx";
import Avatar from "./Avatar.jsx";
import {
  X,
  Palette,
  User,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Check,
  Sparkles,
  Sliders,
  Lock,
  Volume2,
  ChevronDown,
  ChevronUp,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
} from "lucide-react";

export default function SettingsModal({
  isOpen,
  onClose,
  initialTab = "appearance",
  soundEnabled = true,
  onToggleSound = () => {},
}) {
  const { user, setUser } = useAuth();
  const {
    activeThemeId,
    mode,
    customColors,
    predefinedThemes,
    curatedSwatches,
    saveTheme,
    resetToDefault,
    applyTheme,
  } = useTheme();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedThemeId, setSelectedThemeId] = useState(activeThemeId);
  const [selectedMode, setSelectedMode] = useState(mode);
  const [themeSubTab, setThemeSubTab] = useState("presets"); // "presets" | "swatches"
  const [themeCategory, setThemeCategory] = useState("all");
  const [showAdvancedHex, setShowAdvancedHex] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

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
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedThemeId(activeThemeId);
      setSelectedMode(mode);
      setProfileForm({
        displayName: user?.displayName || "",
        bio: user?.bio || "",
      });
      setProfileFeedback(null);
      setCustom(customColors || {
        primary: baseTheme.colors.primary,
        secondary: baseTheme.colors.secondary,
        accent: baseTheme.colors.accent,
        bgChat: baseTheme.colors.bgChat,
        bgSidebar: baseTheme.colors.bgSidebar,
      });
    }
  }, [isOpen, initialTab, activeThemeId, mode, customColors, user]);

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

  const isPreviewDark = selectedMode === "dark" || (selectedMode === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const currentPreviewColors = computeThemeColors(baseTheme, isPreviewDark, custom);

  const handleModeChange = (newMode) => {
    setSelectedMode(newMode);
    applyTheme(selectedThemeId, newMode, custom);
  };

  const handleThemeChange = (newThemeId) => {
    setSelectedThemeId(newThemeId);
    const newBase = predefinedThemes.find((t) => t.id === newThemeId) || predefinedThemes[0];
    const updatedCustom = {
      primary: newBase.colors.primary,
      secondary: newBase.colors.secondary,
      accent: newBase.colors.accent,
      bgChat: newBase.colors.bgChat,
      bgSidebar: newBase.colors.bgSidebar,
    };
    setCustom(updatedCustom);
    applyTheme(newThemeId, selectedMode, updatedCustom);
  };

  const handleSwatchSelect = (key, hex) => {
    const nextCustom = { ...custom, [key]: hex };
    setCustom(nextCustom);
    applyTheme(selectedThemeId, selectedMode, nextCustom);
  };

  const handleClose = () => {
    applyTheme(activeThemeId, mode, customColors);
    onClose();
  };

  const handleApplyTheme = () => {
    saveTheme(selectedThemeId, selectedMode, custom);
    onClose();
  };

  const handleResetTheme = () => {
    resetToDefault();
    setSelectedThemeId("lavender-dream");
    setSelectedMode("light");
    setCustom(null);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileFeedback(null);
    try {
      const updated = await api.updateProfile(profileForm);
      if (setUser) {
        setUser((prev) => ({ ...prev, displayName: updated.displayName, bio: updated.bio }));
        localStorage.setItem("user", JSON.stringify({ ...user, displayName: updated.displayName, bio: updated.bio }));
      }
      setProfileFeedback({ type: "success", message: "Profile updated successfully!" });
    } catch (err) {
      setProfileFeedback({ type: "error", message: err.message || "Failed to update profile" });
    } finally {
      setProfileSaving(false);
    }
  };

  const filteredThemes = themeCategory === "all"
    ? predefinedThemes
    : predefinedThemes.filter((t) => t.category.toLowerCase() === themeCategory.toLowerCase());

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
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: 880,
          height: "85vh",
          maxHeight: 720,
          backgroundColor: "var(--color-bg-card, #FFFFFF)",
          borderRadius: "var(--radius-xl, 22px)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border, #E8EAF0)",
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Settings Navigation Sidebar */}
        <div
          style={{
            width: 220,
            minWidth: 220,
            backgroundColor: "var(--color-bg-sidebar, #F1F0FA)",
            borderRight: "1px solid var(--color-border, #E8EAF0)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "20px 12px",
            userSelect: "none",
          }}
        >
          <div>
            <div style={{ padding: "0 12px 16px", borderBottom: "1px solid var(--color-border, #E8EAF0)", marginBottom: 12 }}>
              <strong style={{ fontSize: "1rem", color: "var(--color-text-primary, #1E293B)", display: "block" }}>
                Settings
              </strong>
              <span style={{ fontSize: "0.76rem", color: "var(--color-text-secondary, #64748B)" }}>
                Personalize & Manage
              </span>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { id: "appearance", label: "Appearance & Themes", icon: Palette },
                { id: "profile", label: "Profile & Account", icon: User },
                { id: "security", label: "Security & E2EE", icon: ShieldCheck },
                { id: "preferences", label: "Sound & Audio", icon: Bell },
              ].map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md, 10px)",
                      border: "none",
                      backgroundColor: isActive ? "var(--color-bg-card, #FFFFFF)" : "transparent",
                      color: isActive ? "var(--color-primary, #6366F1)" : "var(--color-text-secondary, #64748B)",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.86rem",
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: isActive ? "var(--shadow-xs)" : "none",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    <Icon size={17} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div style={{ padding: "0 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)" }}>
              <Lock size={12} />
              <span>Zero-knowledge client</span>
            </div>
          </div>
        </div>

        {/* Settings Content Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "var(--color-bg-card, #FFFFFF)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "18px 24px",
              borderBottom: "1px solid var(--color-border, #E8EAF0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary, #1E293B)" }}>
                {activeTab === "appearance" && "Appearance & Themes"}
                {activeTab === "profile" && "Profile & Account"}
                {activeTab === "security" && "Security & Cryptographic Keys"}
                {activeTab === "preferences" && "Sounds & Notification Preferences"}
              </h2>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary, #64748B)", margin: "2px 0 0" }}>
                {activeTab === "appearance" && "Select ready-made themes or customize your visual color harmony."}
                {activeTab === "profile" && "Update your public display identity on Chaterea."}
                {activeTab === "security" && "View client-side E2EE key status and verification credentials."}
                {activeTab === "preferences" && "Configure audio chimes and in-app interaction feedback."}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: "transparent",
                border: "none",
                padding: 6,
                borderRadius: "50%",
                cursor: "pointer",
                color: "var(--color-text-muted, #94A3B8)",
              }}
              title="Close (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tab Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {/* ================= TAB 1: APPEARANCE & THEMES ================= */}
            {activeTab === "appearance" && (
              <>
                {/* Mode Selector */}
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-secondary, #64748B)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
                    Display Mode
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
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
                          padding: "9px 12px",
                          borderRadius: "var(--radius-md, 10px)",
                          border: `1.5px solid ${selectedMode === id ? "var(--color-primary, #6366F1)" : "var(--color-border, #E8EAF0)"}`,
                          background: selectedMode === id ? "var(--color-primary-light, #EEF2FF)" : "transparent",
                          color: selectedMode === id ? "var(--color-primary, #6366F1)" : "var(--color-text-primary, #1E293B)",
                          fontWeight: 600,
                          fontSize: "0.85rem",
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

                {/* Subtabs: Presets vs Swatches */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border, #E8EAF0)", marginBottom: 16 }}>
                    <div style={{ display: "flex", gap: 20 }}>
                      <button
                        onClick={() => setThemeSubTab("presets")}
                        style={{
                          padding: "8px 2px 10px",
                          background: "transparent",
                          border: "none",
                          borderBottom: themeSubTab === "presets" ? "2px solid var(--color-primary, #6366F1)" : "2px solid transparent",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          color: themeSubTab === "presets" ? "var(--color-primary, #6366F1)" : "var(--color-text-secondary, #64748B)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Sparkles size={15} />
                        <span>Ready-Made Themes</span>
                      </button>
                      <button
                        onClick={() => setThemeSubTab("swatches")}
                        style={{
                          padding: "8px 2px 10px",
                          background: "transparent",
                          border: "none",
                          borderBottom: themeSubTab === "swatches" ? "2px solid var(--color-primary, #6366F1)" : "2px solid transparent",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          color: themeSubTab === "swatches" ? "var(--color-primary, #6366F1)" : "var(--color-text-secondary, #64748B)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Sliders size={15} />
                        <span>Visual Color Palette</span>
                      </button>
                    </div>

                    {themeSubTab === "presets" && (
                      <div style={{ display: "flex", gap: 4 }}>
                        {["all", "pastel", "fresh", "dark", "nature"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setThemeCategory(cat)}
                            style={{
                              padding: "2px 8px",
                              borderRadius: "var(--radius-sm, 6px)",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              textTransform: "capitalize",
                              border: "none",
                              cursor: "pointer",
                              backgroundColor: themeCategory === cat ? "var(--color-primary, #6366F1)" : "transparent",
                              color: themeCategory === cat ? "#FFFFFF" : "var(--color-text-secondary, #64748B)",
                            }}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PRESETS GRID WITH MINI CHAT INTERFACE MOCKUPS */}
                  {themeSubTab === "presets" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                      {filteredThemes.map((theme) => {
                        const isSelected = selectedThemeId === theme.id;
                        return (
                          <div
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            style={{
                              padding: "10px",
                              borderRadius: "var(--radius-lg, 14px)",
                              border: `1.5px solid ${isSelected ? "var(--color-primary, #6366F1)" : "var(--color-border, #E8EAF0)"}`,
                              backgroundColor: isSelected ? "var(--color-primary-light, #EEF2FF)" : "var(--color-bg-card, #FFFFFF)",
                              cursor: "pointer",
                              transition: "all var(--transition-fast)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            {/* Miniature Representation of the Chat Interface */}
                            <MiniChatMockup theme={theme} isDark={isPreviewDark} isSelected={isSelected} />

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
                              <div>
                                <strong style={{ fontSize: "0.88rem", color: isSelected ? "var(--color-primary, #6366F1)" : "var(--color-text-primary, #1E293B)" }}>
                                  {theme.name}
                                </strong>
                                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)", display: "block" }}>
                                  {theme.category}
                                </span>
                              </div>
                              {isSelected && (
                                <div style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: "var(--color-primary, #6366F1)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <Check size={11} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* VISUAL COLOR SWATCHES SELECTOR */}
                  {themeSubTab === "swatches" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      <p style={{ fontSize: "0.84rem", color: "var(--color-text-secondary, #64748B)", margin: 0 }}>
                        Click any curated color swatch below to instantly tint your interface:
                      </p>

                      {/* Primary Color Swatches */}
                      <div>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-primary, #1E293B)", display: "block", marginBottom: 8 }}>
                          Primary Accent Color
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {curatedSwatches.primary.map((swatch) => (
                            <button
                              key={swatch.color}
                              onClick={() => handleSwatchSelect("primary", swatch.color)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: "var(--radius-full, 9999px)",
                                border: custom?.primary === swatch.color ? `2px solid ${swatch.color}` : "1px solid var(--color-border, #E8EAF0)",
                                background: custom?.primary === swatch.color ? `${swatch.color}15` : "var(--color-bg-card, #FFFFFF)",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                                color: "var(--color-text-primary, #1E293B)",
                              }}
                            >
                              <span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: swatch.color }} />
                              <span>{swatch.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sidebar Tint Swatches */}
                      <div>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-primary, #1E293B)", display: "block", marginBottom: 8 }}>
                          Sidebar Tint
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {curatedSwatches.sidebar.map((swatch) => (
                            <button
                              key={swatch.color}
                              onClick={() => handleSwatchSelect("bgSidebar", swatch.color)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: "var(--radius-full, 9999px)",
                                border: custom?.bgSidebar === swatch.color ? "2px solid var(--color-primary, #6366F1)" : "1px solid var(--color-border, #E8EAF0)",
                                background: "var(--color-bg-card, #FFFFFF)",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                              }}
                            >
                              <span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: swatch.color, border: "1px solid rgba(0,0,0,0.1)" }} />
                              <span>{swatch.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Chat Background Swatches */}
                      <div>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-text-primary, #1E293B)", display: "block", marginBottom: 8 }}>
                          Chat Window Background
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {curatedSwatches.chat.map((swatch) => (
                            <button
                              key={swatch.color}
                              onClick={() => handleSwatchSelect("bgChat", swatch.color)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "6px 12px",
                                borderRadius: "var(--radius-full, 9999px)",
                                border: custom?.bgChat === swatch.color ? "2px solid var(--color-primary, #6366F1)" : "1px solid var(--color-border, #E8EAF0)",
                                background: "var(--color-bg-card, #FFFFFF)",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: 500,
                              }}
                            >
                              <span style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: swatch.color, border: "1px solid rgba(0,0,0,0.1)" }} />
                              <span>{swatch.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Optional Collapsed Advanced Section */}
                      <div style={{ marginTop: 6 }}>
                        <button
                          onClick={() => setShowAdvancedHex(!showAdvancedHex)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            background: "transparent",
                            border: "none",
                            color: "var(--color-text-secondary, #64748B)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {showAdvancedHex ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          <span>Advanced Color Codes (HEX)</span>
                        </button>

                        {showAdvancedHex && (
                          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                            {[
                              { label: "Primary HEX", key: "primary" },
                              { label: "Sidebar HEX", key: "bgSidebar" },
                              { label: "Chat HEX", key: "bgChat" },
                            ].map(({ label, key }) => (
                              <div key={key} style={{ padding: "8px 10px", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--color-border, #E8EAF0)" }}>
                                <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary, #64748B)", display: "block" }}>{label}</span>
                                <input
                                  type="text"
                                  value={custom?.[key] || currentPreviewColors[key] || ""}
                                  onChange={(e) => handleSwatchSelect(key, e.target.value)}
                                  style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "0.85rem", fontFamily: "monospace" }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons for Appearance */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--color-border, #E8EAF0)" }}>
                  <button
                    onClick={handleResetTheme}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background: "transparent",
                      border: "1px solid var(--color-border, #E8EAF0)",
                      borderRadius: "var(--radius-md, 10px)",
                      padding: "8px 14px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "var(--color-text-secondary, #64748B)",
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Reset to Default</span>
                  </button>
                  <button
                    onClick={handleApplyTheme}
                    style={{
                      background: "var(--color-primary, #6366F1)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "var(--radius-md, 10px)",
                      padding: "9px 20px",
                      fontSize: "0.86rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
                    }}
                  >
                    Save & Apply Theme
                  </button>
                </div>
              </>
            )}

            {/* ================= TAB 2: PROFILE & ACCOUNT ================= */}
            {activeTab === "profile" && (
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: "var(--radius-lg, 14px)", backgroundColor: "var(--color-bg-app, #F8FAFC)", border: "1px solid var(--color-border, #E8EAF0)" }}>
                  <Avatar name={profileForm.displayName || user?.displayName} size="lg" isOnline showStatus />
                  <div>
                    <strong style={{ fontSize: "1rem", color: "var(--color-text-primary, #1E293B)", display: "block" }}>
                      {profileForm.displayName || "User"}
                    </strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary, #64748B)" }}>
                      {user?.email}
                    </span>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, backgroundColor: "var(--color-primary-light, #EEF2FF)", color: "var(--color-primary, #6366F1)" }}>
                        {user?.role || "Verified User"}
                      </span>
                    </div>
                  </div>
                </div>

                {profileFeedback && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: "var(--radius-md, 10px)",
                      backgroundColor: profileFeedback.type === "success" ? "var(--color-success-bg, #ECFDF5)" : "var(--color-danger-bg, #FEF2F2)",
                      color: profileFeedback.type === "success" ? "var(--color-success, #10B981)" : "var(--color-danger, #EF4444)",
                      fontSize: "0.84rem",
                      border: `1px solid ${profileFeedback.type === "success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                    }}
                  >
                    {profileFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{profileFeedback.message}</span>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary, #64748B)", display: "block", marginBottom: 6 }}>
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md, 10px)",
                      border: "1.5px solid var(--color-border, #E8EAF0)",
                      backgroundColor: "var(--color-bg-card, #FFFFFF)",
                      color: "var(--color-text-primary, #1E293B)",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-secondary, #64748B)", display: "block", marginBottom: 6 }}>
                    About / Bio
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell your chat contacts a little about yourself..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md, 10px)",
                      border: "1.5px solid var(--color-border, #E8EAF0)",
                      backgroundColor: "var(--color-bg-card, #FFFFFF)",
                      color: "var(--color-text-primary, #1E293B)",
                      fontSize: "0.9rem",
                      outline: "none",
                      resize: "none",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "var(--color-primary, #6366F1)",
                      color: "#FFFFFF",
                      border: "none",
                      borderRadius: "var(--radius-md, 10px)",
                      padding: "10px 20px",
                      fontSize: "0.86rem",
                      fontWeight: 700,
                      cursor: profileSaving ? "default" : "pointer",
                      boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
                    }}
                  >
                    <Save size={16} />
                    <span>{profileSaving ? "Saving..." : "Save Profile"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= TAB 3: SECURITY & E2EE ================= */}
            {activeTab === "security" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: "var(--radius-lg, 14px)", backgroundColor: "var(--color-success-bg, #ECFDF5)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <ShieldCheck size={26} style={{ color: "#10B981" }} />
                  <div>
                    <strong style={{ fontSize: "0.95rem", color: "#065F46", display: "block" }}>
                      End-to-End Encryption Active
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "#047857" }}>
                      Your messages are encrypted client-side using WebCrypto before reaching the network.
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div style={{ padding: "14px", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--color-border, #E8EAF0)", backgroundColor: "var(--color-bg-app, #F8FAFC)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: "var(--color-primary, #6366F1)" }}>
                      <Key size={16} />
                      <strong style={{ fontSize: "0.85rem" }}>Key Wrapping</strong>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
                      RSA-OAEP 2048-bit with SHA-256 for wrapping per-message symmetric keys.
                    </span>
                  </div>

                  <div style={{ padding: "14px", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--color-border, #E8EAF0)", backgroundColor: "var(--color-bg-app, #F8FAFC)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, color: "var(--color-primary, #6366F1)" }}>
                      <ShieldCheck size={16} />
                      <strong style={{ fontSize: "0.85rem" }}>Digital Signatures</strong>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
                      RSASSA-PKCS1-v1_5 2048-bit verifying authentic sender identity.
                    </span>
                  </div>
                </div>

                <div style={{ padding: "12px 16px", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--color-border, #E8EAF0)" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-primary, #1E293B)", display: "block", marginBottom: 4 }}>
                    Client Private Key Storage
                  </span>
                  <p style={{ fontSize: "0.76rem", color: "var(--color-text-secondary, #64748B)", margin: 0, lineHeight: 1.4 }}>
                    Your private keys are isolated inside browser IndexedDB and are never transmitted to any server. There is deliberately zero server-side key escrow.
                  </p>
                </div>
              </div>
            )}

            {/* ================= TAB 4: SOUND & NOTIFICATIONS ================= */}
            {activeTab === "preferences" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--color-border, #E8EAF0)" }}>
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: "var(--color-text-primary, #1E293B)", display: "block" }}>
                      Sound Effects
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
                      Play subtle audio chime when sending and receiving messages.
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => playSentSound()}
                      style={{
                        padding: "6px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: "1px solid var(--color-border, #E8EAF0)",
                        borderRadius: "var(--radius-sm, 6px)",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Test Chime
                    </button>
                    <button
                      type="button"
                      onClick={onToggleSound}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: soundEnabled ? "var(--color-primary, #6366F1)" : "#CBD5E1",
                        border: "none",
                        cursor: "pointer",
                        position: "relative",
                        transition: "background var(--transition-fast)",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 2,
                          left: soundEnabled ? 22 : 2,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          backgroundColor: "#FFFFFF",
                          transition: "left var(--transition-fast)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--color-border, #E8EAF0)" }}>
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: "var(--color-text-primary, #1E293B)", display: "block" }}>
                      Typing Indicators
                    </strong>
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
                      Broadcast real-time typing status to conversation partners.
                    </span>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "var(--color-primary, #6366F1)", fontWeight: 600 }}>Enabled</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
