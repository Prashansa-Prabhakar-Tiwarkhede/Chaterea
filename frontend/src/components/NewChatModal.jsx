import React, { useState, useEffect } from "react";
import { Search, X, MessageSquarePlus, Users, ArrowRight, Loader2, Check } from "lucide-react";
import Avatar from "./Avatar.jsx";
import { api } from "../lib/api.js";

export default function NewChatModal({ isOpen, onClose, onStartChat, onGroupCreated }) {
  const [tab, setTab] = useState("direct"); // "direct" | "group"
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Group creation state
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setHasSearched(false);
      setGroupName("");
      setGroupDesc("");
      setSelectedUserIds([]);
      setGroupError("");
      setTab("direct");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const page = await api.searchUsers(query.trim());
      setResults(page.content || []);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setGroupError("Please enter a group name");
      return;
    }
    setCreatingGroup(true);
    setGroupError("");
    try {
      const newGroup = await api.createGroup({
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        memberIds: selectedUserIds,
      });
      if (onGroupCreated) onGroupCreated(newGroup);
      onClose();
    } catch (err) {
      setGroupError(err.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  if (!isOpen) return null;

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
          maxWidth: 520,
          backgroundColor: "var(--color-bg-card, #FFFFFF)",
          borderRadius: "var(--radius-xl, 20px)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--color-border, #E8EAF0)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid var(--color-border, #E8EAF0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-md, 10px)",
                background: "var(--color-primary-light, #EEF2FF)",
                color: "var(--color-primary, #6366F1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {tab === "direct" ? <MessageSquarePlus size={20} /> : <Users size={20} />}
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary, #1E293B)" }}>
                {tab === "direct" ? "New Direct Message" : "Create Group Chat"}
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary, #64748B)", margin: 0 }}>
                {tab === "direct" ? "Search contacts to chat securely." : "Collaborate with multiple members."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              padding: 6,
              borderRadius: "50%",
              cursor: "pointer",
              color: "var(--color-text-muted, #94A3B8)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            padding: "8px 22px 0",
            gap: 12,
            borderBottom: "1px solid var(--color-border, #E8EAF0)",
          }}
        >
          <button
            type="button"
            onClick={() => setTab("direct")}
            style={{
              background: "transparent",
              border: "none",
              padding: "10px 4px",
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              color: tab === "direct" ? "var(--color-primary, #6366F1)" : "var(--color-text-secondary, #64748B)",
              borderBottom: tab === "direct" ? "2px solid var(--color-primary, #6366F1)" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MessageSquarePlus size={16} />
            Direct Message
          </button>
          <button
            type="button"
            onClick={() => setTab("group")}
            style={{
              background: "transparent",
              border: "none",
              padding: "10px 4px",
              fontSize: "0.86rem",
              fontWeight: 600,
              cursor: "pointer",
              color: tab === "group" ? "var(--color-primary, #6366F1)" : "var(--color-text-secondary, #64748B)",
              borderBottom: tab === "group" ? "2px solid var(--color-primary, #6366F1)" : "2px solid transparent",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Users size={16} />
            Create Group
          </button>
        </div>

        {/* Tab 1: Direct Message Search */}
        {tab === "direct" && (
          <>
            <div style={{ padding: "16px 22px" }}>
              <form onSubmit={handleSearch} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: 14,
                    color: "var(--color-text-muted, #94A3B8)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "11px 40px 11px 42px",
                    borderRadius: "var(--radius-lg, 14px)",
                    border: "1.5px solid var(--color-border, #E8EAF0)",
                    backgroundColor: "var(--color-bg-app, #F8FAFC)",
                    color: "var(--color-text-primary, #1E293B)",
                    fontSize: "0.9rem",
                    outline: "none",
                  }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setResults([]);
                      setHasSearched(false);
                    }}
                    style={{
                      position: "absolute",
                      right: 12,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--color-text-muted, #94A3B8)",
                      display: "flex",
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
              </form>
            </div>

            <div style={{ maxHeight: 300, overflowY: "auto", padding: "0 22px 16px" }}>
              {loading && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 10, color: "var(--color-primary, #6366F1)" }}>
                  <Loader2 size={22} className="animate-spin" />
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary, #64748B)" }}>Searching users...</span>
                </div>
              )}

              {!loading && hasSearched && results.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--color-text-secondary, #64748B)" }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>No users found</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--color-text-muted, #94A3B8)" }}>
                    Try searching with a different name or full email address.
                  </p>
                </div>
              )}

              {!loading && !hasSearched && (
                <div style={{ textAlign: "center", padding: "24px 16px", color: "var(--color-text-muted, #94A3B8)" }}>
                  <p style={{ margin: 0, fontSize: "0.85rem" }}>
                    Type a name or email and press Enter to find contacts.
                  </p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {results.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        onStartChat(u.id);
                        onClose();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-md, 10px)",
                        border: "1px solid var(--color-border, #E8EAF0)",
                        background: "var(--color-bg-card, #FFFFFF)",
                        cursor: "pointer",
                        transition: "all var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-primary-light, #EEF2FF)";
                        e.currentTarget.style.borderColor = "var(--color-primary, #6366F1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--color-bg-card, #FFFFFF)";
                        e.currentTarget.style.borderColor = "var(--color-border, #E8EAF0)";
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar name={u.displayName} size="md" isOnline={u.online} showStatus />
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "var(--color-text-primary, #1E293B)", display: "block" }}>
                            {u.displayName}
                          </strong>
                          <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary, #64748B)" }}>
                            {u.email}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          backgroundColor: "var(--color-primary-light, #EEF2FF)",
                          color: "var(--color-primary, #6366F1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Tab 2: Create Group */}
        {tab === "group" && (
          <form onSubmit={handleCreateGroup} style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {groupError && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#FEE2E2",
                  color: "#B91C1C",
                  borderRadius: "var(--radius-md, 8px)",
                  fontSize: "0.82rem",
                }}
              >
                {groupError}
              </div>
            )}

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-primary, #1E293B)", display: "block", marginBottom: 6 }}>
                Group Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Design Systems, Frontend Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md, 10px)",
                  border: "1.5px solid var(--color-border, #E8EAF0)",
                  backgroundColor: "var(--color-bg-app, #F8FAFC)",
                  color: "var(--color-text-primary, #1E293B)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-primary, #1E293B)", display: "block", marginBottom: 6 }}>
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="Project discussions, updates, and reviews"
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-md, 10px)",
                  border: "1.5px solid var(--color-border, #E8EAF0)",
                  backgroundColor: "var(--color-bg-app, #F8FAFC)",
                  color: "var(--color-text-primary, #1E293B)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--color-text-primary, #1E293B)", display: "block", marginBottom: 6 }}>
                Add Members by Name
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Search user to add..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: "var(--radius-md, 10px)",
                    border: "1.5px solid var(--color-border, #E8EAF0)",
                    backgroundColor: "var(--color-bg-app, #F8FAFC)",
                    color: "var(--color-text-primary, #1E293B)",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  style={{
                    padding: "9px 14px",
                    borderRadius: "var(--radius-md, 10px)",
                    border: "none",
                    backgroundColor: "var(--color-primary-light, #EEF2FF)",
                    color: "var(--color-primary, #6366F1)",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Search"}
                </button>
              </div>

              {/* Members search results with toggle selection */}
              {results.length > 0 && (
                <div style={{ maxHeight: 140, overflowY: "auto", marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {results.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleSelectUser(u.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: "var(--radius-md, 8px)",
                          border: isSelected ? "1.5px solid var(--color-primary, #6366F1)" : "1px solid var(--color-border, #E8EAF0)",
                          backgroundColor: isSelected ? "var(--color-primary-light, #EEF2FF)" : "var(--color-bg-card, #FFFFFF)",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={u.displayName} size="sm" />
                          <span style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--color-text-primary, #1E293B)" }}>
                            {u.displayName}
                          </span>
                        </div>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "4px",
                            border: "1.5px solid var(--color-primary, #6366F1)",
                            backgroundColor: isSelected ? "var(--color-primary, #6366F1)" : "transparent",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={creatingGroup || !groupName.trim()}
              style={{
                marginTop: 6,
                padding: "11px",
                borderRadius: "var(--radius-lg, 12px)",
                border: "none",
                background: "linear-gradient(135deg, var(--color-primary, #6366F1) 0%, var(--color-secondary, #A78BFA) 100%)",
                color: "#FFFFFF",
                fontWeight: 700,
                cursor: creatingGroup || !groupName.trim() ? "not-allowed" : "pointer",
                opacity: creatingGroup || !groupName.trim() ? 0.6 : 1,
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
              }}
            >
              {creatingGroup ? "Creating Group..." : "Create Group"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
