import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { notificationsApi } from "../lib/api";
import { Bell, CheckCheck, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const fetchNotifications = () => {
    notificationsApi
      .list()
      .then((r) => {
        setNotifications(r.data.notifications);
        setUnreadCount(r.data.unreadCount);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    setMarking(id);
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      toast.error("Failed to mark as read");
    } finally {
      setMarking(null);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    for (const n of unread) {
      await notificationsApi.markRead(n.id).catch(() => {});
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  };

  const NOTIF_ICONS: Record<string, string> = {
    "New Ticket Assigned": "📋",
    "Ticket Assigned": "👤",
    "Ticket Status Updated": "🔄",
    "Ticket Updated": "📝",
  };

  return (
    <Layout
      title="Notifications"
      actions={
        unreadCount > 0 ? (
          <button
            id="mark-all-read"
            className="btn btn-secondary btn-sm"
            onClick={markAllRead}
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        ) : undefined
      }
    >
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Notifications</h1>
            <p className="page-subtitle">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <div className="loading-spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Bell size={40} style={{ opacity: 0.3 }} /></div>
            <div className="empty-title">No notifications yet</div>
            <div className="empty-desc">
              You'll receive notifications when tickets are assigned or status changes
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notifications.map((n) => (
              <div
                key={n.id}
                id={`notification-${n.id}`}
                style={{
                  background: n.isRead ? "var(--bg-card)" : "rgba(99,102,241,0.06)",
                  border: `1px solid ${n.isRead ? "var(--border)" : "rgba(99,102,241,0.2)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  transition: "all var(--transition)",
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 42, height: 42,
                    borderRadius: "var(--radius-sm)",
                    background: n.isRead ? "rgba(255,255,255,0.04)" : "rgba(99,102,241,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {NOTIF_ICONS[n.title] || "🔔"}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: n.isRead ? 500 : 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {n.title}
                    </span>
                    {!n.isRead && (
                      <Circle size={8} style={{ color: "var(--accent)", fill: "var(--accent)", flexShrink: 0 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </div>
                </div>

                {/* Mark Read Button */}
                {!n.isRead && (
                  <button
                    id={`mark-read-${n.id}`}
                    className="btn btn-ghost btn-sm"
                    onClick={() => markRead(n.id)}
                    disabled={marking === n.id}
                    style={{ flexShrink: 0, fontSize: 12 }}
                  >
                    {marking === n.id ? (
                      <span className="loading-spinner" style={{ width: 12, height: 12 }} />
                    ) : (
                      <CheckCheck size={14} />
                    )}
                    Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
