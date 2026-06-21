import { useState, useEffect, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { ticketsApi } from "../lib/api";
import { StatusBadge, PriorityBadge } from "../components/Badges";
import { useAuth } from "../contexts/AuthContext";
import { MessageSquare, History, MapPin, ArrowLeft, Send } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import toast from "react-hot-toast";

interface Comment {
  id: string;
  comment: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
}

interface HistoryItem {
  id: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  createdAt: string;
}

interface Assignment {
  id: string;
  assignedAt: string;
  officer: { id: string; name: string; email: string };
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  imageUrl?: string;
  locationText?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: string; name: string; email: string };
  comments: Comment[];
  history: HistoryItem[];
  assignments: Assignment[];
}

const STATUS_ICONS: Record<string, string> = {
  OPEN: "📋",
  ASSIGNED: "👤",
  IN_PROGRESS: "⚙️",
  RESOLVED: "✅",
  CLOSED: "🔒",
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchTicket = () => {
    if (!id) return;
    ticketsApi
      .get(id)
      .then((r) => {
        setTicket(r.data);
        setNewStatus(r.data.status);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !id) return;
    setPostingComment(true);
    try {
      await ticketsApi.addComment(id, comment);
      setComment("");
      toast.success("Comment posted");
      fetchTicket();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  const updateStatus = async () => {
    if (!id || !newStatus || newStatus === ticket?.status) return;
    setUpdatingStatus(true);
    try {
      await ticketsApi.changeStatus(id, newStatus);
      toast.success("Status updated");
      fetchTicket();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Ticket Details">
        <div className="loading-screen" style={{ minHeight: 400 }}>
          <div className="loading-spinner" />
          <p>Loading ticket...</p>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout title="Ticket Not Found">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">Ticket not found</div>
          <button className="btn btn-primary" onClick={() => navigate(-1)} style={{ marginTop: 20 }}>
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  const canUpdateStatus = user?.role === "OFFICER" || user?.role === "ADMIN";

  return (
    <Layout title="Ticket Details">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Back */}
        <button
          id="back-btn"
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(-1)}
          style={{ marginBottom: 20 }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <div className="grid-2" style={{ gap: 24, alignItems: "start" }}>
          {/* Main Content */}
          <div style={{ gridColumn: "span 2" }}>
            <div className="card mb-16">
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{ticket.title}</h1>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                    <span className="ticket-card-category">{ticket.category}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-muted)" }}>
                  <div>#{ticket.id.slice(-8).toUpperCase()}</div>
                  <div style={{ marginTop: 4 }}>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</div>
                </div>
              </div>

              <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
                {ticket.description}
              </p>

              {ticket.locationText && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
                  <MapPin size={14} />
                  {ticket.locationText}
                </div>
              )}

              {ticket.imageUrl && (
                <img
                  src={ticket.imageUrl}
                  alt="Ticket attachment"
                  style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}
                />
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div>
            {/* Ticket Meta */}
            <div className="card mb-16">
              <div className="section-title" style={{ marginBottom: 14, fontSize: 14 }}>Ticket Info</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>Submitted by</span>
                  <span style={{ fontWeight: 600 }}>{ticket.createdBy.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>Created</span>
                  <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--text-muted)" }}>Last updated</span>
                  <span>{formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}</span>
                </div>
                {ticket.assignments.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Assigned to</span>
                    <span style={{ fontWeight: 600 }}>{ticket.assignments[0].officer.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Update Status (Officer/Admin only) */}
            {canUpdateStatus && (
              <div className="card mb-16">
                <div className="section-title" style={{ marginBottom: 14, fontSize: 14 }}>Update Status</div>
                <select
                  id="status-update-select"
                  className="form-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{ marginBottom: 12 }}
                >
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
                <button
                  id="update-status-btn"
                  className="btn btn-primary w-full"
                  style={{ justifyContent: "center" }}
                  onClick={updateStatus}
                  disabled={updatingStatus || newStatus === ticket.status}
                >
                  {updatingStatus ? <span className="loading-spinner" style={{ width: 15, height: 15 }} /> : null}
                  {updatingStatus ? "Updating..." : "Update Status"}
                </button>
              </div>
            )}
          </div>

          {/* Status History */}
          <div>
            {ticket.history.length > 0 && (
              <div className="card mb-16">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <History size={15} style={{ color: "var(--text-muted)" }} />
                  <span className="section-title" style={{ fontSize: 14 }}>Status History</span>
                </div>
                <div className="timeline">
                  {ticket.history.map((h) => (
                    <div key={h.id} className="timeline-item">
                      <div className="timeline-dot">{STATUS_ICONS[h.newStatus] || "📌"}</div>
                      <div className="timeline-content">
                        <div className="timeline-title">
                          <StatusBadge status={h.newStatus} />
                        </div>
                        <div className="timeline-time">
                          {formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Comments */}
          <div style={{ gridColumn: "span 2" }}>
            <div className="card">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <MessageSquare size={15} style={{ color: "var(--text-muted)" }} />
                <span className="section-title" style={{ fontSize: 16 }}>
                  Comments ({ticket.comments.length})
                </span>
              </div>

              {ticket.comments.length > 0 ? (
                <div className="comment-list" style={{ marginBottom: 24 }}>
                  {ticket.comments.map((c) => (
                    <div key={c.id} className="comment-item">
                      <div className="comment-avatar">
                        {c.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="comment-body">
                        <div className="comment-header">
                          <span className="comment-author">{c.user.name}</span>
                          <span
                            className={`badge badge-${c.user.role.toLowerCase()}`}
                            style={{ fontSize: 10, padding: "1px 6px" }}
                          >
                            {c.user.role}
                          </span>
                          <span className="comment-time">
                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <div className="comment-text">{c.comment}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0", fontSize: 14, marginBottom: 20 }}>
                  No comments yet. Be the first to comment!
                </div>
              )}

              {/* Add Comment */}
              <form onSubmit={submitComment} id="comment-form" style={{ display: "flex", gap: 10 }}>
                <textarea
                  id="comment-input"
                  className="form-textarea"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  style={{ minHeight: 72, resize: "none", flex: 1 }}
                />
                <button
                  type="submit"
                  id="submit-comment"
                  className="btn btn-primary"
                  disabled={postingComment || !comment.trim()}
                  style={{ alignSelf: "flex-end", padding: "10px 16px" }}
                >
                  {postingComment ? <span className="loading-spinner" style={{ width: 15, height: 15 }} /> : <Send size={15} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
