import React, { useState } from "react";
import {
  Search,
  Plus,
  Settings,
  LogOut,
  Shield,
  MessageSquare,
  Users,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Avatar from "./Avatar.jsx";

export default function Sidebar({
  user,
  chats = [],
  activeChatId,
  onSelectChat,
  onOpenNewChat,
  onOpenSettingsModal,
  onLogout,
  isMobileOpen = false,
  onCloseMobile = () => {},
}) {
  const [searchFilter, setSearchFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "direct" | "group"

  const filteredChats = chats.filter((c) => {
    const name = c.type === "DIRECT" ? (c.otherDisplayName || "Direct Chat") : (c.groupName || "Group");
    const matchesSearch = name.toLowerCase().includes(searchFilter.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === "direct") return c.type === "DIRECT";
    if (activeTab === "group") return c.type === "GROUP";
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      <aside
        style={{
          width: 320,
          minWidth: 320,
          maxWidth: 320,
          height: "100vh",
          backgroundColor: "var(--color-bg-sidebar, #F1F0FA)",
          borderRight: "1px solid var(--color-border, #E8EAF0)",
          display: "flex",
          flexDirection: "column",
          position: isMobileOpen ? "fixed" : "relative",
          left: 0,
          top: 0,
          zIndex: isMobileOpen ? 100 : 10,
          transform: isMobileOpen ? "translateX(0)" : undefined,
          transition: "transform var(--transition-normal)",
          userSelect: "none",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: "20px 20px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--color-border, #E8EAF0)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "var(--radius-md, 10px)",
                background: "linear-gradient(135deg, var(--color-primary, #6366F1) 0%, var(--color-secondary, #A78BFA) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 4px 10px rgba(99, 102, 241, 0.28)",
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <h1 style={{ fontSize: "1.15rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--color-text-primary, #1E293B)", margin: 0 }}>
                  Chaterea
                </h1>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    backgroundColor: "var(--color-primary-light, #EEF2FF)",
                    color: "var(--color-primary, #6366F1)",
                    padding: "2px 6px",
                    borderRadius: "var(--radius-sm, 6px)",
                  }}
                >
                  E2EE
                </span>
              </div>
              <p style={{ fontSize: "0.74rem", color: "var(--color-text-secondary, #64748B)", margin: 0 }}>
                End-to-End Encrypted
              </p>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={onOpenNewChat}
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md, 10px)",
              background: "linear-gradient(135deg, var(--color-primary, #6366F1) 0%, var(--color-secondary, #A78BFA) 100%)",
              color: "#FFFFFF",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.25)",
              transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
            }}
            title="Start new conversation"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.35)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(99, 102, 241, 0.25)";
            }}
          >
            <Plus size={20} strokeWidth={2.4} />
          </button>
        </div>

        {/* Search Bar & Filter Tabs */}
        <div style={{ padding: "14px 18px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                color: "var(--color-text-muted, #94A3B8)",
              }}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "var(--radius-md, 10px)",
                border: "1px solid var(--color-border, #E8EAF0)",
                backgroundColor: "var(--color-bg-card, #FFFFFF)",
                color: "var(--color-text-primary, #1E293B)",
                fontSize: "0.85rem",
                outline: "none",
                transition: "all var(--transition-fast)",
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 6, padding: "2px 0" }}>
            {[
              { id: "all", label: "All Chats" },
              { id: "direct", label: "Direct" },
              { id: "group", label: "Groups" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "4px 12px",
                  borderRadius: "var(--radius-full, 9999px)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: activeTab === tab.id ? "var(--color-primary, #6366F1)" : "transparent",
                  color: activeTab === tab.id ? "#FFFFFF" : "var(--color-text-secondary, #64748B)",
                  transition: "all var(--transition-fast)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "6px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {filteredChats.length === 0 ? (
            <div
              style={{
                padding: "40px 16px",
                textAlign: "center",
                color: "var(--color-text-muted, #94A3B8)",
              }}
            >
              <MessageSquare size={32} strokeWidth={1.5} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
              <p style={{ fontSize: "0.85rem", fontWeight: 600, margin: 0 }}>
                {searchFilter ? "No conversations match" : "No active chats yet"}
              </p>
              <button
                onClick={onOpenNewChat}
                style={{
                  marginTop: 12,
                  padding: "6px 14px",
                  borderRadius: "var(--radius-md, 10px)",
                  background: "var(--color-primary-light, #EEF2FF)",
                  color: "var(--color-primary, #6366F1)",
                  border: "none",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Start a conversation
              </button>
            </div>
          ) : (
            filteredChats.map((c) => {
              const isActive = c.chatId === activeChatId;
              const title = c.type === "DIRECT" ? (c.otherDisplayName || "Direct Chat") : (c.groupName || "Group");

              return (
                <div
                  key={c.chatId}
                  onClick={() => {
                    onSelectChat(c);
                    onCloseMobile();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: "var(--radius-lg, 12px)",
                    cursor: "pointer",
                    backgroundColor: isActive ? "var(--color-bg-sidebar-active, #E4E1F5)" : "transparent",
                    transition: "all var(--transition-fast)",
                    border: isActive ? "1px solid var(--color-border, #E8EAF0)" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "var(--color-bg-sidebar-hover, #E8E6F5)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Avatar name={title} size="md" isOnline={true} showStatus={c.type === "DIRECT"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                      <strong
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: isActive ? 700 : 600,
                          color: "var(--color-text-primary, #1E293B)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {title}
                      </strong>
                      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted, #94A3B8)" }}>
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Lock size={11} style={{ color: "var(--color-primary, #6366F1)", opacity: 0.8 }} />
                      <span
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--color-text-secondary, #64748B)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Encrypted message
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Card at Bottom */}
        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px solid var(--color-border, #E8EAF0)",
            backgroundColor: "var(--color-bg-card, #FFFFFF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Avatar name={user?.displayName || "Me"} size="md" isOnline={true} showStatus />
            <div style={{ minWidth: 0 }}>
              <strong
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary, #1E293B)",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.displayName || "User"}
              </strong>
              <span
                style={{
                  fontSize: "0.74rem",
                  color: "var(--color-text-secondary, #64748B)",
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email || "Connected"}
              </span>
            </div>
          </div>

          {/* Quick Actions (Settings & Themes Modal + Logout) */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={onOpenSettingsModal}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md, 8px)",
                border: "none",
                backgroundColor: "var(--color-primary-light, #EEF2FF)",
                color: "var(--color-primary, #6366F1)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all var(--transition-fast)",
              }}
              title="Settings & Themes"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={onLogout}
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md, 8px)",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--color-text-secondary, #64748B)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all var(--transition-fast)",
              }}
              title="Log out"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FEE2E2";
                e.currentTarget.style.color = "#EF4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--color-text-secondary, #64748B)";
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

