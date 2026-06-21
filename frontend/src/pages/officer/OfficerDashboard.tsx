import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { officerApi } from "../../lib/api";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import { ClipboardList, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AssignedTicket {
  id: string;
  assignedAt: string;
  ticket: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    createdAt: string;
    createdBy: { id: string; name: string };
    comments: any[];
    history: any[];
  };
}

export default function OfficerDashboard() {
  const [assignments, setAssignments] = useState<AssignedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    officerApi
      .myTickets()
      .then((r) => setAssignments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const tickets = assignments.map((a) => a.ticket);
  const counts = {
    total: tickets.length,
    active: tickets.filter((t) => ["ASSIGNED", "IN_PROGRESS"].includes(t.status)).length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    urgent: tickets.filter((t) => t.priority === "URGENT").length,
  };

  const activeTickets = assignments.filter((a) =>
    ["ASSIGNED", "IN_PROGRESS"].includes(a.ticket.status)
  );
  const resolvedTickets = assignments.filter((a) =>
    ["RESOLVED", "CLOSED"].includes(a.ticket.status)
  );

  return (
    <Layout title="Officer Dashboard">
      {/* Welcome Banner */}
      <div
        className="card mb-24"
        style={{
          background: "linear-gradient(135deg, rgba(34,211,238,0.12), rgba(99,102,241,0.08))",
          border: "1px solid rgba(34,211,238,0.2)",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
          Officer Control Center 👮
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Manage and resolve your assigned community tickets
        </p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card accent">
          <div className="stat-icon accent"><ClipboardList size={18} /></div>
          <div className="stat-label">Total Assigned</div>
          <div className="stat-value">{counts.total}</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon cyan"><Clock size={18} /></div>
          <div className="stat-label">Active</div>
          <div className="stat-value">{counts.active}</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald"><CheckCircle2 size={18} /></div>
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{counts.resolved}</div>
        </div>
        <div className="stat-card rose">
          <div className="stat-icon rose"><AlertTriangle size={18} /></div>
          <div className="stat-label">Urgent</div>
          <div className="stat-value">{counts.urgent}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          {/* Active Tickets */}
          <div className="section">
            <div className="section-header">
              <h3 className="section-title">
                Active Tickets
                {activeTickets.length > 0 && (
                  <span
                    style={{
                      marginLeft: 8,
                      background: "rgba(34,211,238,0.15)",
                      color: "var(--cyan)",
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 100,
                    }}
                  >
                    {activeTickets.length}
                  </span>
                )}
              </h3>
            </div>

            {activeTickets.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <div className="empty-icon">🎉</div>
                <div className="empty-title">All caught up!</div>
                <div className="empty-desc">No active tickets assigned to you</div>
              </div>
            ) : (
              <div className="ticket-list">
                {activeTickets.map((a) => (
                  <Link
                    key={a.id}
                    to={`/tickets/${a.ticket.id}`}
                    className="ticket-card"
                    id={`assignment-${a.id}`}
                  >
                    <div className="ticket-card-header">
                      <div className="ticket-card-title">{a.ticket.title}</div>
                      <StatusBadge status={a.ticket.status} />
                    </div>
                    <div className="ticket-card-desc">{a.ticket.description}</div>
                    <div className="ticket-card-footer">
                      <div className="ticket-card-meta">
                        <span className="ticket-card-category">{a.ticket.category}</span>
                        <PriorityBadge priority={a.ticket.priority} />
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          By: {a.ticket.createdBy.name}
                        </span>
                      </div>
                      <span className="ticket-card-date">
                        Assigned {formatDistanceToNow(new Date(a.assignedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Resolved Tickets */}
          {resolvedTickets.length > 0 && (
            <div className="section">
              <div className="section-header">
                <h3 className="section-title" style={{ color: "var(--text-secondary)" }}>Resolved Tickets</h3>
              </div>
              <div className="ticket-list">
                {resolvedTickets.slice(0, 3).map((a) => (
                  <Link
                    key={a.id}
                    to={`/tickets/${a.ticket.id}`}
                    className="ticket-card"
                    style={{ opacity: 0.7 }}
                    id={`resolved-${a.id}`}
                  >
                    <div className="ticket-card-header">
                      <div className="ticket-card-title">{a.ticket.title}</div>
                      <StatusBadge status={a.ticket.status} />
                    </div>
                    <div className="ticket-card-footer">
                      <div className="ticket-card-meta">
                        <span className="ticket-card-category">{a.ticket.category}</span>
                      </div>
                      <span className="ticket-card-date">
                        {formatDistanceToNow(new Date(a.assignedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
