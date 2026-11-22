import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { getAccessToken } from "./api.js";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:8080/ws";

let client = null;
let activeChatId = null;
let activeChatCallback = null;
let activeChatSub = null;

let notifyCallback = null;
let presenceCallback = null;

export function connectSocket({ onNotification, onPresence } = {}) {
  if (onNotification) notifyCallback = onNotification;
  if (onPresence) presenceCallback = onPresence;

  if (client && client.active) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    beforeConnect: () => {
      const token = getAccessToken();
      if (token) {
        client.connectHeaders = { Authorization: `Bearer ${token}` };
      }
    },
    reconnectDelay: 3000,
    debug: (str) => {
      // Uncomment for verbose socket debugging
      // console.log("[STOMP]", str);
    },
    onConnect: (frame) => {
      console.log("[STOMP] Connected to WebSocket broker");
      if (notifyCallback) {
        client.subscribe("/user/queue/notifications", (msg) => {
          try {
            notifyCallback(JSON.parse(msg.body));
          } catch (e) {
            console.error("Failed to parse notification", e);
          }
        });
      }
      if (presenceCallback) {
        client.subscribe("/user/queue/presence", (msg) => {
          try {
            presenceCallback(JSON.parse(msg.body));
          } catch (e) {
            console.error("Failed to parse presence", e);
          }
        });
      }

      // Automatically re-subscribe to the active chat if one was selected
      if (activeChatId && activeChatCallback) {
        resubscribeActiveChat();
      }
    },
    onStompError: (frame) => {
      console.error("[STOMP] Broker error: " + frame.headers["message"], frame.body);
    },
    onWebSocketClose: () => {
      console.log("[STOMP] WebSocket connection closed");
    },
  });

  client.activate();
  return client;
}

function resubscribeActiveChat() {
  if (!client || !client.connected || !activeChatId) return;
  if (activeChatSub) {
    try {
      activeChatSub.unsubscribe();
    } catch {}
    activeChatSub = null;
  }

  activeChatSub = client.subscribe(`/topic/chats/${activeChatId}`, (msg) => {
    try {
      const payload = JSON.parse(msg.body);
      if (activeChatCallback) activeChatCallback(payload);
    } catch (e) {
      console.error("Failed to parse chat message event", e);
    }
  });
  console.log(`[STOMP] Subscribed to /topic/chats/${activeChatId}`);
}

/** Subscribes to a specific chat's topic (messages, typing, read receipts, edits/deletes). */
export function subscribeToChat(chatId, onEvent) {
  activeChatId = chatId;
  activeChatCallback = onEvent;

  if (client && client.connected) {
    resubscribeActiveChat();
  } else if (!client || !client.active) {
    connectSocket();
  }

  return () => {
    if (activeChatId === chatId) {
      activeChatId = null;
      activeChatCallback = null;
      if (activeChatSub) {
        try {
          activeChatSub.unsubscribe();
        } catch {}
        activeChatSub = null;
      }
    }
  };
}

export function sendTyping(chatId, typing) {
  if (!client || !client.connected) return;
  client.publish({
    destination: `/app/chats/${chatId}/typing`,
    body: JSON.stringify({ typing }),
  });
}

export function disconnectSocket() {
  if (activeChatSub) {
    try {
      activeChatSub.unsubscribe();
    } catch {}
    activeChatSub = null;
  }
  activeChatId = null;
  activeChatCallback = null;

  if (client) {
    client.deactivate();
    client = null;
  }
}
