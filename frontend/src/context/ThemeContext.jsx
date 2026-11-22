import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";

export const PREDEFINED_THEMES = [
  {
    id: "lavender-dream",
    name: "Lavender Dream",
    category: "Pastel",
    description: "Soft indigo, delicate lavender, and calming off-white.",
    colors: {
      primary: "#6366F1",
      primaryHover: "#4F46E5",
      primaryLight: "#EEF2FF",
      secondary: "#A78BFA",
      accent: "#7DD3FC",
      bgApp: "#F8FAFC",
      bgSidebar: "#F1F0FA",
      bgSidebarHover: "#E8E6F5",
      bgSidebarActive: "#E4E1F5",
      bgChat: "#FAFBFF",
      bgCard: "#FFFFFF",
      bgInput: "#FFFFFF",
      bgBubbleMe: "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#FFFFFF",
      textBubbleOther: "#1E293B",
      textPrimary: "#1E293B",
      textSecondary: "#64748B",
      textMuted: "#94A3B8",
      border: "#E8EAF0",
    },
  },
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    category: "Fresh",
    description: "Crisp cerulean and gentle sky blue inspired by Nordic waters.",
    colors: {
      primary: "#0284C7",
      primaryHover: "#0369A1",
      primaryLight: "#F0F9FF",
      secondary: "#38BDF8",
      accent: "#7DD3FC",
      bgApp: "#F8FAFC",
      bgSidebar: "#E0F2FE",
      bgSidebarHover: "#BAE6FD",
      bgSidebarActive: "#BAE6FD90",
      bgChat: "#F8FAFC",
      bgCard: "#FFFFFF",
      bgInput: "#FFFFFF",
      bgBubbleMe: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#FFFFFF",
      textBubbleOther: "#0F172A",
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      textMuted: "#94A3B8",
      border: "#E2E8F0",
    },
  },
  {
    id: "mint-serenity",
    name: "Mint Serenity",
    category: "Nature",
    description: "Calming eucalyptus sage, crisp mint, and emerald accents.",
    colors: {
      primary: "#10B981",
      primaryHover: "#059669",
      primaryLight: "#ECFDF5",
      secondary: "#34D399",
      accent: "#6EE7B7",
      bgApp: "#F8FAFC",
      bgSidebar: "#ECFDF5",
      bgSidebarHover: "#D1FAE5",
      bgSidebarActive: "#A7F3D0",
      bgChat: "#F7FEE720",
      bgCard: "#FFFFFF",
      bgInput: "#FFFFFF",
      bgBubbleMe: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#FFFFFF",
      textBubbleOther: "#064E3B",
      textPrimary: "#064E3B",
      textSecondary: "#047857",
      textMuted: "#6EE7B7",
      border: "#D1FAE5",
    },
  },
  {
    id: "rose-blush",
    name: "Rose Blush",
    category: "Pastel",
    description: "Dusty rose and delicate blush with gentle warm undertones.",
    colors: {
      primary: "#EC4899",
      primaryHover: "#DB2777",
      primaryLight: "#FDF2F8",
      secondary: "#F472B6",
      accent: "#FBCFE8",
      bgApp: "#FDF4F8",
      bgSidebar: "#FCE7F3",
      bgSidebarHover: "#FBCFE8",
      bgSidebarActive: "#F9A8D4",
      bgChat: "#FFF1F240",
      bgCard: "#FFFFFF",
      bgInput: "#FFFFFF",
      bgBubbleMe: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#FFFFFF",
      textBubbleOther: "#831843",
      textPrimary: "#831843",
      textSecondary: "#9D174D",
      textMuted: "#F472B6",
      border: "#FCE7F3",
    },
  },
  {
    id: "peach-glow",
    name: "Peach Glow",
    category: "Warm",
    description: "Warm sunset apricot and soft ivory for a welcoming touch.",
    colors: {
      primary: "#F97316",
      primaryHover: "#EA580C",
      primaryLight: "#FFF7ED",
      secondary: "#FB923C",
      accent: "#FDBA74",
      bgApp: "#FFFBEB20",
      bgSidebar: "#FEF3C7",
      bgSidebarHover: "#FDE68A",
      bgSidebarActive: "#FCD34D",
      bgChat: "#FFFDF7",
      bgCard: "#FFFFFF",
      bgInput: "#FFFFFF",
      bgBubbleMe: "linear-gradient(135deg, #F97316 0%, #D97706 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#FFFFFF",
      textBubbleOther: "#78350F",
      textPrimary: "#78350F",
      textSecondary: "#92400E",
      textMuted: "#B45309",
      border: "#FED7AA",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    category: "Dark",
    description: "Deep obsidian surfaces with vibrant violet and indigo radiance.",
    colors: {
      primary: "#818CF8",
      primaryHover: "#6366F1",
      primaryLight: "#1E1B4B",
      secondary: "#C084FC",
      accent: "#38BDF8",
      bgApp: "#0B0F19",
      bgSidebar: "#111827",
      bgSidebarHover: "#1F2937",
      bgSidebarActive: "#242E42",
      bgChat: "#0F172A",
      bgCard: "#1E293B",
      bgInput: "#1E293B",
      bgBubbleMe: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#1E293B",
      textBubbleOther: "#F8FAFC",
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
      textMuted: "#64748B",
      border: "#263346",
    },
  },
  {
    id: "arctic-blue",
    name: "Arctic Blue",
    category: "Cool",
    description: "Glacier blue, frosted slate, and crystal-clear ice accents.",
    colors: {
      primary: "#0EA5E9",
      primaryHover: "#0284C7",
      primaryLight: "#F0F9FF",
      secondary: "#67E8F9",
      accent: "#A5F3FC",
      bgApp: "#F8FAFC",
      bgSidebar: "#E0F2FE",
      bgSidebarHover: "#BAE6FD",
      bgSidebarActive: "#7DD3FC80",
      bgChat: "#F8FAFC",
      bgCard: "#FFFFFF",
      bgInput: "#FFFFFF",
      bgBubbleMe: "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#FFFFFF",
      textBubbleOther: "#082F49",
      textPrimary: "#082F49",
      textSecondary: "#0369A1",
      textMuted: "#7DD3FC",
      border: "#BAE6FD",
    },
  },
  {
    id: "minimal-white",
    name: "Minimal White",
    category: "Minimal",
    description: "Pure monochrome aesthetic with subtle graphite contrast.",
    colors: {
      primary: "#0F172A",
      primaryHover: "#334155",
      primaryLight: "#F1F5F9",
      secondary: "#64748B",
      accent: "#94A3B8",
      bgApp: "#FAFAFA",
      bgSidebar: "#F4F4F5",
      bgSidebarHover: "#E4E4E7",
      bgSidebarActive: "#D4D4D8",
      bgChat: "#FFFFFF",
      bgCard: "#FFFFFF",
      bgInput: "#FFFFFF",
      bgBubbleMe: "linear-gradient(135deg, #18181B 0%, #27272A 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#F4F4F5",
      textBubbleOther: "#18181B",
      textPrimary: "#09090B",
      textSecondary: "#71717A",
      textMuted: "#A1A1AA",
      border: "#E4E4E7",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    category: "Vibrant",
    description: "Vibrant twilight purple meeting golden dusk radiance.",
    colors: {
      primary: "#7C3AED",
      primaryHover: "#6D28D9",
      primaryLight: "#F5F3FF",
      secondary: "#EC4899",
      accent: "#F59E0B",
      bgApp: "#FAF5FF",
      bgSidebar: "#F3E8FF",
      bgSidebarHover: "#E9D5FF",
      bgSidebarActive: "#D8B4FE",
      bgChat: "#FFFBEB30",
      bgCard: "#FFFFFF",
      bgInput: "#FFFFFF",
      bgBubbleMe: "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#FFFFFF",
      textBubbleOther: "#1E1B4B",
      textPrimary: "#1E1B4B",
      textSecondary: "#5B21B6",
      textMuted: "#8B5CF6",
      border: "#E9D5FF",
    },
  },
  {
    id: "forest-calm",
    name: "Forest Calm",
    category: "Nature",
    description: "Deep pine greens, evergreen needles, and muted earthy stones.",
    colors: {
      primary: "#059669",
      primaryHover: "#047857",
      primaryLight: "#ECFDF5",
      secondary: "#10B981",
      accent: "#34D399",
      bgApp: "#F8FAF8",
      bgSidebar: "#E8F5E9",
      bgSidebarHover: "#C8E6C9",
      bgSidebarActive: "#A5D6A7",
      bgChat: "#FAFDF7",
      bgCard: "#FFFFFF",
      bgInput: "#FFFFFF",
      bgBubbleMe: "linear-gradient(135deg, #059669 0%, #15803D 100%)",
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#FFFFFF",
      textBubbleOther: "#14532D",
      textPrimary: "#14532D",
      textSecondary: "#166534",
      textMuted: "#4ADE80",
      border: "#C8E6C9",
    },
  },
];

export const CURATED_SWATCHES = {
  primary: [
    { label: "Soft Indigo", color: "#6366F1" },
    { label: "Sapphire", color: "#0284C7" },
    { label: "Emerald", color: "#10B981" },
    { label: "Rose", color: "#EC4899" },
    { label: "Amber Coral", color: "#F97316" },
    { label: "Electric Violet", color: "#8B5CF6" },
    { label: "Glacier Cyan", color: "#06B6D4" },
    { label: "Forest Pine", color: "#059669" },
    { label: "Crimson", color: "#E11D48" },
    { label: "Sleek Slate", color: "#0F172A" },
  ],
  sidebar: [
    { label: "Soft Lavender", color: "#F1F0FA" },
    { label: "Cloud Off-White", color: "#F8FAFC" },
    { label: "Ice Blue", color: "#E0F2FE" },
    { label: "Mint Dew", color: "#ECFDF5" },
    { label: "Blush Mist", color: "#FCE7F3" },
    { label: "Warm Sand", color: "#FEF3C7" },
    { label: "Pale Lilac", color: "#F3E8FF" },
    { label: "Clean White", color: "#FFFFFF" },
  ],
  chat: [
    { label: "Crisp Tint", color: "#FAFBFF" },
    { label: "Pure White", color: "#FFFFFF" },
    { label: "Soft Cream", color: "#FFFDF7" },
    { label: "Ice Tint", color: "#F0F9FF" },
    { label: "Mint Tint", color: "#F7FEE7" },
    { label: "Muted Cloud", color: "#F8FAFC" },
  ],
};

export function computeThemeColors(baseTheme, isDark, custom) {
  if (isDark) {
    const primary = custom?.primary || baseTheme.colors.primary;
    const secondary = custom?.secondary || baseTheme.colors.secondary;
    const accent = custom?.accent || baseTheme.colors.accent;

    return {
      primary,
      primaryHover: custom?.primaryHover || primary,
      primaryLight: "rgba(99, 102, 241, 0.22)",
      secondary,
      accent,
      bgApp: custom?.bgApp || "#0B0F19",
      bgSidebar: custom?.bgSidebar || "#111827",
      bgSidebarHover: "#1F2937",
      bgSidebarActive: "#283548",
      bgChat: custom?.bgChat || "#0F172A",
      bgCard: "#1E293B",
      bgInput: "#1E293B",
      bgBubbleMe: custom?.bgBubbleMe || `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
      textBubbleMe: "#FFFFFF",
      bgBubbleOther: "#1E293B",
      textBubbleOther: "#F8FAFC",
      textPrimary: "#F8FAFC",
      textSecondary: "#94A3B8",
      textMuted: "#64748B",
      border: "#263346",
    };
  }

  // Light Mode
  return {
    ...baseTheme.colors,
    ...(custom || {}),
  };
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const storageKey = user?.id ? `chatapp_theme_${user.id}` : "chatapp_theme_default";

  const [activeThemeId, setActiveThemeId] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.themeId || "lavender-dream";
      }
    } catch {}
    return "lavender-dream";
  });

  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.mode || "light";
      }
    } catch {}
    return "light";
  });

  const [customColors, setCustomColors] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.customColors || null;
      }
    } catch {}
    return null;
  });

  // Re-hydrate user's specific theme on auth state change
  useEffect(() => {
    if (user?.id) {
      const userKey = `chatapp_theme_${user.id}`;
      const saved = localStorage.getItem(userKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.themeId) setActiveThemeId(parsed.themeId);
          if (parsed.mode) setMode(parsed.mode);
          if (parsed.customColors) setCustomColors(parsed.customColors);
        } catch {}
      }
    }
  }, [user?.id]);

  // Apply CSS variables dynamically to the document root
  const applyTheme = useCallback((themeId, currentMode, custom) => {
    const root = document.documentElement;
    const baseTheme = PREDEFINED_THEMES.find((t) => t.id === themeId) || PREDEFINED_THEMES[0];

    const isDark = currentMode === "dark" || (currentMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.setAttribute("data-theme", isDark ? "dark" : "light");

    const activeColors = computeThemeColors(baseTheme, isDark, custom);

    root.style.setProperty("--color-primary", activeColors.primary);
    root.style.setProperty("--color-primary-hover", activeColors.primaryHover || activeColors.primary);
    root.style.setProperty("--color-primary-light", activeColors.primaryLight || "#EEF2FF");
    root.style.setProperty("--color-secondary", activeColors.secondary);
    root.style.setProperty("--color-accent", activeColors.accent);
    root.style.setProperty("--color-bg-app", activeColors.bgApp);
    root.style.setProperty("--color-bg-sidebar", activeColors.bgSidebar);
    root.style.setProperty("--color-bg-sidebar-hover", activeColors.bgSidebarHover);
    root.style.setProperty("--color-bg-sidebar-active", activeColors.bgSidebarActive);
    root.style.setProperty("--color-bg-chat", activeColors.bgChat);
    root.style.setProperty("--color-bg-card", activeColors.bgCard);
    root.style.setProperty("--color-bg-input", activeColors.bgInput);
    root.style.setProperty("--color-bg-bubble-me", activeColors.bgBubbleMe);
    root.style.setProperty("--color-text-bubble-me", activeColors.textBubbleMe || "#FFFFFF");
    root.style.setProperty("--color-bg-bubble-other", activeColors.bgBubbleOther);
    root.style.setProperty("--color-text-bubble-other", activeColors.textBubbleOther);
    root.style.setProperty("--color-text-primary", activeColors.textPrimary);
    root.style.setProperty("--color-text-secondary", activeColors.textSecondary);
    root.style.setProperty("--color-text-muted", activeColors.textMuted);
    root.style.setProperty("--color-border", activeColors.border);
  }, []);

  // Update DOM on state changes
  useEffect(() => {
    applyTheme(activeThemeId, mode, customColors);
  }, [activeThemeId, mode, customColors, applyTheme]);

  // Persist preferences
  const saveTheme = useCallback((themeId, newMode, custom) => {
    setActiveThemeId(themeId);
    setMode(newMode);
    setCustomColors(custom);

    const payload = {
      themeId,
      mode: newMode,
      customColors: custom,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    applyTheme(themeId, newMode, custom);
  }, [storageKey, applyTheme]);

  const toggleMode = useCallback(() => {
    const nextMode = mode === "dark" ? "light" : "dark";
    saveTheme(activeThemeId, nextMode, customColors);
  }, [mode, activeThemeId, customColors, saveTheme]);

  const resetToDefault = useCallback(() => {
    saveTheme("lavender-dream", "light", null);
  }, [saveTheme]);

  return (
    <ThemeContext.Provider
      value={{
        activeThemeId,
        mode,
        isDark: mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches),
        customColors,
        predefinedThemes: PREDEFINED_THEMES,
        curatedSwatches: CURATED_SWATCHES,
        currentTheme: PREDEFINED_THEMES.find((t) => t.id === activeThemeId) || PREDEFINED_THEMES[0],
        saveTheme,
        toggleMode,
        resetToDefault,
        applyTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
