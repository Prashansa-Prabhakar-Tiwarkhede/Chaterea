import React, { useRef, useState, useEffect } from "react";
import { Send, Smile, Paperclip } from "lucide-react";

export default function ChatInput({
  draft,
  onChange,
  onSend,
  disabled = false,
}) {
  const textareaRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojis = ["👋", "👍", "❤️", "😊", "🔥", "🚀", "🎉", "👏", "✨", "💯", "🔒", "💬"];

  // Auto-resize textarea to expand naturally with typing
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [draft]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const addEmoji = (emoji) => {
    onChange(draft + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div
      style={{
        padding: "14px 20px 18px",
        backgroundColor: "var(--color-bg-chat, #FAFBFF)",
        borderTop: "1px solid var(--color-border, #E8EAF0)",
        position: "relative",
      }}
    >
      {/* Quick Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            bottom: "80px",
            left: "24px",
            backgroundColor: "var(--color-bg-card, #FFFFFF)",
            border: "1px solid var(--color-border, #E8EAF0)",
            borderRadius: "var(--radius-lg, 14px)",
            padding: "8px 10px",
            boxShadow: "var(--shadow-md)",
            display: "flex",
            gap: 6,
            zIndex: 50,
          }}
        >
          {emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addEmoji(emoji)}
              style={{
                fontSize: "1.2rem",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "var(--radius-sm, 6px)",
                transition: "transform var(--transition-fast)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: "var(--color-bg-card, #FFFFFF)",
          border: "1.5px solid var(--color-border, #E8EAF0)",
          borderRadius: "var(--radius-xl, 20px)",
          padding: "6px 10px 6px 14px",
          boxShadow: "var(--shadow-sm)",
          transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
        }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = "var(--color-primary, #6366F1)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.12)";
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border, #E8EAF0)";
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        }}
      >
        {/* Attachment button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => alert("File attachment upload is ready for backend cloud storage integration.")}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-text-muted, #94A3B8)",
            padding: 6,
            cursor: "pointer",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color var(--transition-fast)",
          }}
          title="Attach file"
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary, #6366F1)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted, #94A3B8)")}
        >
          <Paperclip size={18} />
        </button>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          style={{
            background: "transparent",
            border: "none",
            color: showEmojiPicker ? "var(--color-primary, #6366F1)" : "var(--color-text-muted, #94A3B8)",
            padding: 6,
            cursor: "pointer",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color var(--transition-fast)",
          }}
          title="Insert emoji"
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary, #6366F1)")}
          onMouseLeave={(e) => {
            if (!showEmojiPicker) e.currentTarget.style.color = "var(--color-text-muted, #94A3B8)";
          }}
        >
          <Smile size={18} />
        </button>

        {/* Text Area / Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type an encrypted message..."
          value={draft}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            backgroundColor: "transparent",
            color: "var(--color-text-primary, #1E293B)",
            fontSize: "0.92rem",
            lineHeight: 1.4,
            resize: "none",
            padding: "6px 4px",
            maxHeight: 100,
          }}
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !draft.trim()}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: draft.trim()
              ? "linear-gradient(135deg, var(--color-primary, #6366F1) 0%, var(--color-secondary, #A78BFA) 100%)"
              : "var(--color-border, #E8EAF0)",
            color: draft.trim() ? "#FFFFFF" : "var(--color-text-muted, #94A3B8)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: draft.trim() ? "pointer" : "default",
            boxShadow: draft.trim() ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none",
            transition: "all var(--transition-fast)",
            transform: draft.trim() ? "scale(1)" : "scale(0.95)",
          }}
          onMouseEnter={(e) => {
            if (draft.trim()) {
              e.currentTarget.style.transform = "scale(1.06)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (draft.trim()) {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(99, 102, 241, 0.3)";
            }
          }}
          title="Send message (Enter)"
        >
          <Send size={16} style={{ marginLeft: 2 }} />
        </button>
      </div>
    </div>
  );
}

