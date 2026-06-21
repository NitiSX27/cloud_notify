import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { officerApi } from "../../lib/api";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import { Search } from "lucide-react";
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
    createdBy: { name: string };
    comments: any[];
  };
}

export default function OfficerTickets() {
  const [assignments, setAssignments] = useState<AssignedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    officerApi
      .myTickets()
      .then((r) => setAssignments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter((a) => {
    const matchSearch =
      a.ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      a.ticket.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || a.ticket.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Layout title="Assigned Tickets">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Assigned Tickets</h1>
          <p className="page-subtitle">{assignments.length} tickets assigned to you</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-16" style={{ padding: "12px 16px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="officer-search"
            type="text"
            className="form-input"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select
          id="officer-status-filter"
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="ALL">All Status</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <div className="loading-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No assigned tickets</div>
          <div className="empty-desc">
            {search || statusFilter !== "ALL"
              ? "No tickets match your search"
              : "You have no tickets assigned yet"}
          </div>
        </div>
      ) : (
        <div className="ticket-list">
          {filtered.map((a) => (
            <Link
              key={a.id}
              to={`/tickets/${a.ticket.id}`}
              className="ticket-card"
              id={`officer-ticket-${a.ticket.id}`}
            >
              <div className="ticket-card-header">
                <div>
                  <div className="ticket-card-title">{a.ticket.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    By: {a.ticket.createdBy.name}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <StatusBadge status={a.ticket.status} />
                  <PriorityBadge priority={a.ticket.priority} />
                </div>
              </div>
              <div className="ticket-card-desc">{a.ticket.description}</div>
              <div className="ticket-card-footer">
                <div className="ticket-card-meta">
                  <span className="ticket-card-category">{a.ticket.category}</span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    💬 {a.ticket.comments.length} comments
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
    </Layout>
  );
}
