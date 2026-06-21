import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { ticketsApi, api } from "../../lib/api";
import { StatusBadge, PriorityBadge } from "../../components/Badges";
import { UserCheck, X, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

interface Officer {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Ticket {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  createdBy: { name: string };
  assignments: { officer: { id: string; name: string } }[];
}

export default function AssignOfficers() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    Promise.all([
      ticketsApi.list(),
      api.get("/admin/officers").catch(() => api.get("/auth/me").then((r) => ({ data: [r.data] }))),
    ])
      .then(([ticketsRes, officersRes]) => {
        setTickets(ticketsRes.data);
        setOfficers(officersRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unassignedTickets = tickets.filter(
    (t) => t.status === "OPEN" || t.assignments.length === 0
  );

  const filtered = unassignedTickets.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAssignModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const handleAssign = async (ticket: Ticket, officerId: string) => {
    setAssigning(ticket.id);
    try {
      await ticketsApi.assign(ticket.id, officerId);
      toast.success(`Ticket assigned to officer`);
      setShowModal(false);
      // Refresh tickets
      const res = await ticketsApi.list();
      setTickets(res.data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Assignment failed");
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Layout title="Assign Officers">
      {/* Header */}
      <div
        className="card mb-24"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(34,211,238,0.08))",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
          Officer Assignment Center 👮
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          {unassignedTickets.length} unassigned tickets waiting for assignment
        </p>
      </div>

      {/* Search */}
      <div className="card mb-16" style={{ padding: "12px 16px" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="assign-search"
            type="text"
            className="form-input"
            placeholder="Search unassigned tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <div className="loading-spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <div className="empty-title">All tickets assigned!</div>
          <div className="empty-desc">Every ticket has been assigned to an officer</div>
        </div>
      ) : (
        <div className="ticket-list">
          {filtered.map((ticket) => (
            <div key={ticket.id} className="ticket-card" style={{ cursor: "default", flexDirection: "row", alignItems: "center" }} id={`assign-ticket-${ticket.id}`}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{ticket.title}</span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--text-muted)" }}>
                  <span>{ticket.category}</span>
                  <span>·</span>
                  <span>By: {ticket.createdBy.name}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
                </div>
                {ticket.assignments.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "var(--emerald)" }}>
                    ✓ Already assigned to: {ticket.assignments[0].officer.name}
                  </div>
                )}
              </div>
              <button
                id={`assign-btn-${ticket.id}`}
                className="btn btn-primary btn-sm"
                onClick={() => openAssignModal(ticket)}
                disabled={assigning === ticket.id}
                style={{ flexShrink: 0 }}
              >
                {assigning === ticket.id ? (
                  <span className="loading-spinner" style={{ width: 14, height: 14 }} />
                ) : (
                  <UserCheck size={14} />
                )}
                {ticket.assignments.length > 0 ? "Re-assign" : "Assign"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} id="assign-modal">
            <div className="modal-header">
              <div className="modal-title">Assign Officer</div>
              <button
                id="close-assign-modal"
                className="btn btn-ghost btn-icon"
                onClick={() => setShowModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="card mb-16" style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{selectedTicket.title}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <StatusBadge status={selectedTicket.status} />
                <PriorityBadge priority={selectedTicket.priority} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Select Officer</label>
              {officers.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "20px 0", fontSize: 14 }}>
                  No officers available. Create officer accounts first.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {officers.map((officer) => (
                    <button
                      key={officer.id}
                      id={`officer-select-${officer.id}`}
                      className="btn btn-secondary"
                      style={{ justifyContent: "flex-start", textAlign: "left" }}
                      onClick={() => handleAssign(selectedTicket, officer.id)}
                      disabled={assigning === selectedTicket.id}
                    >
                      <div
                        style={{
                          width: 32, height: 32,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, var(--accent), var(--cyan))",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {officer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{officer.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{officer.email}</div>
                      </div>
                      {assigning === selectedTicket.id && (
                        <span className="loading-spinner" style={{ width: 14, height: 14, marginLeft: "auto" }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
