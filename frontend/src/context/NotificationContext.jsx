import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { notificationsApi, describeApiError } from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

// ws://<host>/api/ws in dev (proxied by Vite - see vite.config.js's `ws: true`),
// or wss:// automatically if the site itself is served over https.
function wsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws`;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [all, count] = await Promise.all([notificationsApi.getAll(), notificationsApi.getUnreadCount()]);
      setNotifications(all);
      setUnreadCount(count);
    } catch (err) {
      setError(describeApiError(err, "load notifications"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Connect/disconnect the WebSocket in step with login/logout - not just
  // on first mount, since the app doesn't do a full page reload on login.
  useEffect(() => {
    if (!user?.token) {
      clientRef.current?.deactivate();
      clientRef.current = null;
      setConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    loadInitial();

    const client = new Client({
      brokerURL: wsUrl(),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      reconnectDelay: 5000, // auto-reconnect on drop, per the "connection-error handling where practical" requirement
      onConnect: () => {
        setConnected(true);
        client.subscribe("/user/queue/notifications", (frame) => {
          try {
            const notification = JSON.parse(frame.body);
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          } catch {
            // malformed frame - ignore rather than crash the whole notification UI
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
      onStompError: (frame) => {
        // A rejected CONNECT (see StompAuthChannelInterceptor - bad/expired
        // token) lands here, not onConnect. Real-time delivery stays down
        // until the token changes (next login) or the server accepts a
        // retry, but the notification list/count already loaded via the
        // plain REST call above, so the feature degrades to "not live" here
        // rather than breaking outright.
        console.warn("Notification WebSocket rejected the connection:", frame.headers?.message || frame.body);
      },
      // Deliberately quiet in production - stomp.js logs every frame by
      // default, which is noisy. Uncomment while debugging the connection:
      // debug: (msg) => console.log(msg),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token]);

  const markAsRead = useCallback(async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(describeApiError(err, "mark that notification as read"));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError(describeApiError(err, "mark all notifications as read"));
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, error, connected, markAsRead, markAllAsRead, refresh: loadInitial }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
