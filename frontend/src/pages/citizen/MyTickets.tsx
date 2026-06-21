import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { ticketsApi } from "../../lib/api";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import { PlusCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    ticketsApi
      .list()
      .then((r) => setTickets(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Layout
      title="My Requests"
      actions={
        <Link to="/citizen/create-ticket" className="btn btn-primary btn-sm" id="create-ticket-topbar-btn">
          <PlusCircle size={15} />
          New Request
        </Link>
      }
    >
      {/* Filters */}
      <div
        className="card mb-24"
        style={{ display: "flex", gap: 12, flexWrap: "wrap", padding: "16px 20px" }}
      >
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            id="ticket-search"
            type="text"
            className="form-input"
            placeholder="Search requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select
          id="status-filter"
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 160 }}
        >
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
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
          <div className="empty-icon">🔍</div>
          <div className="empty-title">{search || statusFilter !== "ALL" ? "No results found" : "No requests yet"}</div>
          <div className="empty-desc">
            {search || statusFilter !== "ALL"
              ? "Try adjusting your search filters"
              : "Start by submitting your first community request"}
          </div>
          {!search && statusFilter === "ALL" && (
            <Link to="/citizen/create-ticket" className="btn btn-primary" style={{ marginTop: 20 }} id="empty-state-create-btn">
              <PlusCircle size={16} /> Create Request
            </Link>
          )}
        </div>
      ) : (
        <div className="ticket-list">
          {filtered.map((ticket) => (
            <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="ticket-card" id={`ticket-item-${ticket.id}`}>
              <div className="ticket-card-header">
                <div className="ticket-card-title">{ticket.title}</div>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="ticket-card-desc">{ticket.description}</div>
              <div className="ticket-card-footer">
                <div className="ticket-card-meta">
                  <span className="ticket-card-category">{ticket.category}</span>
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <span className="ticket-card-date">
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
