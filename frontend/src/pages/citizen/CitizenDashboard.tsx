import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { ticketsApi } from "../../lib/api";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import { PlusCircle, Ticket, Clock, CheckCircle2, RefreshCw } from "lucide-react";
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

export default function CitizenDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ticketsApi
      .list()
      .then((r) => setTickets(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => ["ASSIGNED", "IN_PROGRESS"].includes(t.status)).length,
    resolved: tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status)).length,
  };

  const recent = tickets.slice(0, 5);

  return (
    <Layout title="Citizen Dashboard">
      {/* Hero greeting */}
      <div
        className="card mb-24"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.08))",
          border: "1px solid rgba(99,102,241,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
            Community Request Center 🏛️
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Submit and track your community service requests
          </p>
        </div>
        <Link to="/citizen/create-ticket" className="btn btn-primary btn-lg" id="hero-create-btn">
          <PlusCircle size={18} />
          New Request
        </Link>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card accent">
          <div className="stat-icon accent"><Ticket size={18} /></div>
          <div className="stat-label">Total Requests</div>
          <div className="stat-value">{counts.total}</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon cyan"><Clock size={18} /></div>
          <div className="stat-label">Open</div>
          <div className="stat-value">{counts.open}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><RefreshCw size={18} /></div>
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{counts.inProgress}</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald"><CheckCircle2 size={18} /></div>
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{counts.resolved}</div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="section">
        <div className="section-header">
          <h3 className="section-title">Recent Requests</h3>
          <Link to="/citizen/tickets" className="btn btn-secondary btn-sm" id="view-all-tickets-btn">
            View All
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div className="loading-spinner" />
          </div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No requests yet</div>
            <div className="empty-desc">Submit your first community request to get started</div>
            <Link to="/citizen/create-ticket" className="btn btn-primary" style={{ marginTop: 20 }} id="empty-create-btn">
              <PlusCircle size={16} /> Create Request
            </Link>
          </div>
        ) : (
          <div className="ticket-list">
            {recent.map((ticket) => (
              <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="ticket-card" id={`ticket-${ticket.id}`}>
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
      </div>
    </Layout>
  );
}
