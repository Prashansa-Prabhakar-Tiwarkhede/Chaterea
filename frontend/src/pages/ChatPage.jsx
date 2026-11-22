import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { connectSocket, subscribeToChat, sendTyping, disconnectSocket } from "../lib/socket.js";
import { loadKeyPem, KEYS } from "../lib/keyStore.js";
import {
  importEncryptionPrivateKey,
  importSigningPrivateKey,
  prepareOutgoingMessage,
  decryptIncomingMessage,
} from "../lib/crypto.js";
import { playSentSound, playReceivedSound } from "../lib/sound.js";

import Sidebar from "../components/Sidebar.jsx";
import ChatHeader from "../components/ChatHeader.jsx";
import MessageBubble from "../components/MessageBubble.jsx";
import ChatInput from "../components/ChatInput.jsx";
import TypingIndicator from "../components/TypingIndicator.jsx";
import EmptyChatState from "../components/EmptyChatState.jsx";
import SettingsModal from "../components/SettingsModal.jsx";
import NewChatModal from "../components/NewChatModal.jsx";

// Helper to format date separators ("Today", "Yesterday", or formatted date)
function getDateLabel(isoDate) {
  if (!isoDate) return "Today";
  const date = new Date(isoDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export default function ChatPage() {
  const { user, logout, updateUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [typingUsers, setTypingUsers] = useState({});

  // Sound preferences (loaded from localStorage)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("chaterea_sound_enabled") !== "false";
  });

  const handleToggleSound = (enabled) => {
    setSoundEnabled(enabled);
    localStorage.setItem("chaterea_sound_enabled", enabled ? "true" : "false");
  };

  // Modals & Navigation state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const myKeysRef = useRef({ encryptionPrivateKey: null, signingPrivateKey: null });
  const publicKeyCacheRef = useRef(new Map()); // userId -> { encryptionPublicKey, signingPublicKey }
  const unsubscribeRef = useRef(() => {});
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  };

  const ensureKeysLoaded = useCallback(async () => {
    if (myKeysRef.current.encryptionPrivateKey && myKeysRef.current.signingPrivateKey) {
      return myKeysRef.current;
    }
    const userIdentifier = user?.id || user?.email;
    const encPem = await loadKeyPem(KEYS.ENCRYPTION_PRIVATE, userIdentifier);
    const sigPem = await loadKeyPem(KEYS.SIGNING_PRIVATE, userIdentifier);
    if (encPem) myKeysRef.current.encryptionPrivateKey = await importEncryptionPrivateKey(encPem);
    if (sigPem) myKeysRef.current.signingPrivateKey = await importSigningPrivateKey(sigPem);
    return myKeysRef.current;
  }, [user]);

  // Load private keys and connect socket
  useEffect(() => {
    ensureKeysLoaded();

    connectSocket({
      onNotification: () => refreshChats(),
      onPresence: () => {},
    });

    refreshChats();
  }, [ensureKeysLoaded]);

  // Auto scroll down when messages change
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, typingUsers]);

  async function refreshChats() {
    try {
      const list = await api.listChats();
      setChats(list);
    } catch (err) {
      console.error("Failed to refresh chats", err);
    }
  }

  async function getPublicKeysCached(userId) {
    if (publicKeyCacheRef.current.has(userId)) return publicKeyCacheRef.current.get(userId);
    const keys = await api.getPublicKeys(userId);
    publicKeyCacheRef.current.set(userId, keys);
    return keys;
  }

  async function decryptForDisplay(message, chat) {
    if (message.deletedForEveryone) {
      return { ...message, plaintext: "[message deleted]", signatureValid: true };
    }

    await ensureKeysLoaded();

    // If this message has a wrapped key for me, attempt full decrypt + signature verification
    if (message.encryptedAesKeyForMe && myKeysRef.current.encryptionPrivateKey) {
      try {
        const senderKeys = await getPublicKeysCached(message.senderId);
        const { plaintext, signatureValid } = await decryptIncomingMessage(
          message,
          myKeysRef.current.encryptionPrivateKey,
          senderKeys.signingPublicKey
        );
        return { ...message, plaintext, signatureValid };
      } catch (e) {
        console.warn("Could not unwrap/decrypt with keyForMe:", e);
      }
    }

    // If sent by current user and no separate decrypt available, display cleanly
    if (message.senderId === user?.id) {
      return { ...message, plaintext: message.plaintext || "(sent by you)", signatureValid: true };
    }

    try {
      const senderKeys = await getPublicKeysCached(message.senderId);
      const { plaintext, signatureValid } = await decryptIncomingMessage(
        message,
        myKeysRef.current.encryptionPrivateKey,
        senderKeys.signingPublicKey
      );
      return { ...message, plaintext, signatureValid };
    } catch (e) {
      return { ...message, plaintext: "[unable to decrypt]", signatureValid: false };
    }
  }

  async function openChat(chat) {
    setActiveChatId(chat.chatId);
    unsubscribeRef.current();

    await ensureKeysLoaded();

    try {
      const page = await api.getHistory(chat.chatId);
      const decrypted = await Promise.all(
        (page.content || []).map((m) => decryptForDisplay(m, chat))
      );
      setMessages(decrypted.reverse());
      setTimeout(() => scrollToBottom("auto"), 50);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }

    unsubscribeRef.current = subscribeToChat(chat.chatId, async (event) => {
      if (event.type === "MESSAGE_EDITED" || event.type === "MESSAGE_DELETED") {
        const refreshed = await api.getHistory(chat.chatId);
        const dec = await Promise.all(refreshed.content.map((m) => decryptForDisplay(m, chat)));
        setMessages(dec.reverse());
        return;
      }
      if ("typing" in event) {
        setTypingUsers((prev) => ({ ...prev, [event.userId]: event.typing ? event.displayName : undefined }));
        return;
      }
      if (event.ciphertext !== undefined) {
        const decoratedMessage = await decryptForDisplay(event, chat);
        setMessages((prev) => {
          if (event.id && prev.some((m) => m.id === event.id)) return prev;
          return [...prev, decoratedMessage];
        });
        if (event.senderId !== user?.id) {
          if (soundEnabled) playReceivedSound();
          await api.markSeen(event.id).catch(() => {});
        }
      }
    });
  }

  async function handleSend() {
    if (!draft.trim() || !activeChatId) return;
    const chat = chats.find((c) => c.chatId === activeChatId);
    if (!chat) return;

    await ensureKeysLoaded();

    // Include the recipient AND the sender, so both parties can decrypt history
    const recipientIds = chat.type === "DIRECT"
      ? (user?.id ? [chat.otherUserId, user.id] : [chat.otherUserId])
      : [chat.otherUserId];

    const recipients = await Promise.all(
      recipientIds.map(async (id) => ({
        userId: id,
        encryptionPublicKeyPem: (await getPublicKeysCached(id)).encryptionPublicKey,
      }))
    );

    const outgoing = await prepareOutgoingMessage(draft, recipients, myKeysRef.current.signingPrivateKey);

    const saved = await api.sendMessage({
      chatId: activeChatId,
      messageType: "TEXT",
      ...outgoing,
    });

    if (soundEnabled) playSentSound();

    setMessages((prev) => [
      ...prev,
      {
        ...saved,
        plaintext: draft,
        senderId: user?.id,
        signatureValid: true,
        createdAt: saved?.createdAt || new Date().toISOString(),
      },
    ]);

    setDraft("");
    sendTyping(activeChatId, false);
    setTimeout(() => scrollToBottom("smooth"), 40);
  }

  function handleDraftChange(value) {
    setDraft(value);
    if (!activeChatId) return;
    sendTyping(activeChatId, true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => sendTyping(activeChatId, false), 2000);
  }

  async function startChatWith(userId) {
    const chat = await api.getOrCreateDirectChat(userId);
    await refreshChats();
    openChat(chat);
  }

  async function handleGroupCreated(group) {
    await refreshChats();
    if (group && group.id) {
      // Find new group in refreshed list
      const updatedList = await api.listChats();
      setChats(updatedList);
      const newChat = updatedList.find((c) => c.groupId === group.id);
      if (newChat) openChat(newChat);
    }
  }

  const activeChat = chats.find((c) => c.chatId === activeChatId);
  const activeTypingLabel = Object.values(typingUsers).filter(Boolean).join(", ");

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "var(--color-bg-app, #F8FAFC)",
      }}
    >
      {/* Sidebar */}
      <Sidebar
        user={user}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={openChat}
        onOpenNewChat={() => setIsNewChatModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onLogout={logout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Conversation Panel */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          backgroundColor: "var(--color-bg-chat, #FAFBFF)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {activeChat ? (
          <>
            {/* Header */}
            <ChatHeader
              activeChat={activeChat}
              onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
              onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            />

            {/* Messages Scroll Area */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Messages list with Date Separators and consecutive grouping */}
              {messages.map((m, i) => {
                const isMe = m.senderId === user?.id;
                const senderName = isMe ? "You" : (activeChat.otherDisplayName || "Other");

                // Check date separation
                const prevMsg = messages[i - 1];
                const showDateSeparator =
                  !prevMsg ||
                  new Date(m.createdAt || Date.now()).toDateString() !==
                    new Date(prevMsg.createdAt || Date.now()).toDateString();

                // Check consecutive sender within 2 minutes
                const isConsecutive =
                  prevMsg &&
                  prevMsg.senderId === m.senderId &&
                  Math.abs(new Date(m.createdAt || 0) - new Date(prevMsg.createdAt || 0)) < 120000;

                return (
                  <div key={m.id || i} style={{ display: "flex", flexDirection: "column" }}>
                    {showDateSeparator && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "18px 0 12px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            letterSpacing: "0.02em",
                            padding: "4px 12px",
                            borderRadius: "var(--radius-full, 9999px)",
                            backgroundColor: "var(--color-bg-card, #FFFFFF)",
                            border: "1px solid var(--color-border, #E8EAF0)",
                            color: "var(--color-text-secondary, #64748B)",
                            boxShadow: "var(--shadow-xs)",
                          }}
                        >
                          {getDateLabel(m.createdAt)}
                        </span>
                      </div>
                    )}

                    <MessageBubble
                      message={m}
                      isMe={isMe}
                      senderName={senderName}
                      hideSenderHeader={isConsecutive}
                    />
                  </div>
                );
              })}

              {/* Typing indicator */}
              <TypingIndicator label={activeTypingLabel} />

              <div ref={messagesEndRef} style={{ height: 1 }} />
            </div>

            {/* Input Container */}
            <ChatInput
              draft={draft}
              onChange={handleDraftChange}
              onSend={handleSend}
            />
          </>
        ) : (
          <EmptyChatState
            onOpenNewChat={() => setIsNewChatModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          />
        )}
      </main>

      {/* Unified Settings & Themes Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        onUserUpdated={updateUser}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* New Conversation Modal (Direct Message & Create Group) */}
      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onStartChat={startChatWith}
        onGroupCreated={handleGroupCreated}
      />
    </div>
  );
}
