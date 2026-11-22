import React from "react";

// Generate a deterministic soft pastel gradient from a name/id
function getGradient(name = "") {
  const gradients = [
    "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
    "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
    "linear-gradient(135deg, #10B981 0%, #14B8A6 100%)",
    "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
    "linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)",
    "linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(name = "") {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function Avatar({
  name = "",
  src = null,
  size = "md",
  isOnline = false,
  showStatus = false,
  className = "",
  style = {},
}) {
  const sizeMap = {
    xs: { width: 24, height: 24, fontSize: "0.65rem", statusSize: 7 },
    sm: { width: 32, height: 32, fontSize: "0.75rem", statusSize: 9 },
    md: { width: 40, height: 40, fontSize: "0.875rem", statusSize: 11 },
    lg: { width: 48, height: 48, fontSize: "1.05rem", statusSize: 13 },
    xl: { width: 64, height: 64, fontSize: "1.35rem", statusSize: 16 },
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: dim.width,
        height: dim.height,
        minWidth: dim.width,
        minHeight: dim.height,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: getGradient(name),
            color: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: dim.fontSize,
            letterSpacing: "0.02em",
            boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
            userSelect: "none",
          }}
        >
          {getInitials(name)}
        </div>
      )}

      {showStatus && (
        <span
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: dim.statusSize,
            height: dim.statusSize,
            borderRadius: "50%",
            backgroundColor: isOnline ? "#10B981" : "#94A3B8",
            border: "2px solid var(--color-bg-card, #FFFFFF)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          }}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}

