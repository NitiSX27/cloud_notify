import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/Layout";
import { ticketsApi } from "../../lib/api";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import { Search, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Ticket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  createdBy: { name: string; email: string };
  assignments: { officer: { name: string } }[];
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

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
      t.createdBy.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchPriority = priorityFilter === "ALL" || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <Layout title="All Tickets">
      {/* Filters */}
      <div className="card mb-20" style={{ padding: "14px 20px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="admin-search"
            type="text"
            className="form-input"
            placeholder="Search by title, user, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select id="admin-status-filter" className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 150 }}>
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select id="admin-priority-filter" className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ width: 150 }}>
          <option value="ALL">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)" }}>
          <Filter size={14} />
          {filtered.length} results
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Category</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Submitted By</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
                    No tickets found
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => (
                  <tr key={ticket.id} id={`admin-ticket-${ticket.id}`}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)", maxWidth: 200 }} className="truncate">
                        {ticket.title}
                      </div>
                    </td>
                    <td>
                      <span className="ticket-card-category">{ticket.category}</span>
                    </td>
                    <td><StatusBadge status={ticket.status} /></td>
                    <td><PriorityBadge priority={ticket.priority} /></td>
                    <td style={{ fontSize: 13 }}>{ticket.createdBy.name}</td>
                    <td style={{ fontSize: 13 }}>
                      {ticket.assignments.length > 0
                        ? ticket.assignments[0].officer.name
                        : <span style={{ color: "var(--text-muted)" }}>Unassigned</span>}
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </td>
                    <td>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="btn btn-secondary btn-sm"
                        id={`view-ticket-${ticket.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
