import React, { useState } from "react";
import { Copy, Check, ShieldCheck, AlertTriangle } from "lucide-react";
import Avatar from "./Avatar.jsx";

function formatTimestamp(isoString) {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Parses lightweight markdown: code blocks, inline code, bold, links, line breaks */
function renderFormattedContent(text = "") {
  if (!text) return null;

  // Handle multi-line code blocks
  if (text.includes("```")) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const codeContent = part.slice(3, -3).trim();
        return <CodeSnippet key={index} code={codeContent} />;
      }
      return <span key={index}>{renderInline(part)}</span>;
    });
  }

  return renderInline(text);
}

function renderInline(str = "") {
  const lines = str.split("\n");
  return lines.map((line, lIdx) => (
    <React.Fragment key={lIdx}>
      {line.split(/(`[^`]+`)/g).map((chunk, cIdx) => {
        if (chunk.startsWith("`") && chunk.endsWith("`")) {
          return (
            <code key={cIdx} className="message-code-block">
              {chunk.slice(1, -1)}
            </code>
          );
        }
        return chunk;
      })}
      {lIdx < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

function CodeSnippet({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        margin: "6px 0",
        borderRadius: "var(--radius-md, 8px)",
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        color: "#F8FAFC",
        overflow: "hidden",
        fontSize: "0.82rem",
        fontFamily: "'JetBrains Mono', monospace",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 10px",
          backgroundColor: "rgba(0,0,0,0.25)",
          fontSize: "0.72rem",
          color: "#94A3B8",
        }}
      >
        <span>code</span>
        <button
          onClick={handleCopy}
          style={{
            background: "transparent",
            border: "none",
            color: copied ? "#10B981" : "#94A3B8",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: "0.72rem",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre style={{ margin: 0, padding: "8px 12px", overflowX: "auto" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MessageBubble({ message, isMe, senderName, hideSenderHeader = false }) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    if (message.plaintext) {
      navigator.clipboard.writeText(message.plaintext);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDeleted = message.isDeletedForEveryone || message.deletedForEveryone;

  return (
    <div
      className="animate-fade-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex",
        flexDirection: isMe ? "row-reverse" : "row",
        alignItems: "flex-end",
        gap: 8,
        width: "100%",
        marginBottom: hideSenderHeader ? 4 : 10,
        position: "relative",
      }}
    >
      {/* Avatar for other user */}
      {!isMe && (
        <div style={{ width: 28, height: 28, flexShrink: 0 }}>
          {!hideSenderHeader ? (
            <Avatar name={senderName || "User"} size="sm" style={{ marginBottom: 4 }} />
          ) : null}
        </div>
      )}

      {/* Bubble Container */}
      <div
        style={{
          maxWidth: "68%",
          minWidth: 90,
          position: "relative",
        }}
      >
        {!isMe && senderName && !hideSenderHeader && (
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--color-text-secondary, #64748B)",
              marginLeft: 4,
              marginBottom: 3,
              display: "block",
            }}
          >
            {senderName}
          </span>
        )}

        <div
          style={{
            padding: "10px 14px",
            borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            background: isMe
              ? "var(--color-bg-bubble-me, linear-gradient(135deg, #6366F1 0%, #7C3AED 100%))"
              : "var(--color-bg-bubble-other, #FFFFFF)",
            color: isMe
              ? "var(--color-text-bubble-me, #FFFFFF)"
              : "var(--color-text-bubble-other, #1E293B)",
            boxShadow: isMe ? "var(--shadow-bubble)" : "var(--shadow-sm)",
            border: isMe ? "none" : "1px solid var(--color-border, #E8EAF0)",
            fontSize: "0.92rem",
            lineHeight: 1.45,
            wordBreak: "break-word",
            position: "relative",
          }}
        >
          {isDeleted ? (
            <span style={{ fontStyle: "italic", opacity: 0.7 }}>[message deleted]</span>
          ) : (
            renderFormattedContent(message.plaintext)
          )}

          {/* Signature validity warning */}
          {message.signatureValid === false && !isDeleted && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 4,
                fontSize: "0.72rem",
                color: isMe ? "#FECDD3" : "#EF4444",
                fontWeight: 600,
              }}
            >
              <AlertTriangle size={12} />
              <span>Signature verification failed</span>
            </div>
          )}

          {/* Time & Read/Verified indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 4,
              marginTop: 4,
              fontSize: "0.68rem",
              color: isMe ? "rgba(255, 255, 255, 0.75)" : "var(--color-text-muted, #94A3B8)",
              userSelect: "none",
            }}
          >
            <span>{formatTimestamp(message.createdAt)}</span>
            {message.signatureValid && !isDeleted && (
              <ShieldCheck size={11} title="Digitally signed & verified with sender's RSASSA key" />
            )}
          </div>
        </div>
      </div>

      {/* Hover action bar (Copy button) */}
      {isHovered && !isDeleted && message.plaintext && (
        <div
          className="animate-fade-in"
          style={{
            alignSelf: "center",
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: "var(--color-bg-card, #FFFFFF)",
            border: "1px solid var(--color-border, #E8EAF0)",
            borderRadius: "var(--radius-md, 8px)",
            padding: 4,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <button
            onClick={handleCopyMessage}
            style={{
              background: "transparent",
              border: "none",
              color: copied ? "#10B981" : "var(--color-text-secondary, #64748B)",
              padding: 4,
              cursor: "pointer",
              borderRadius: "4px",
              display: "flex",
            }}
            title={copied ? "Copied" : "Copy text"}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      )}
    </div>
  );
}

