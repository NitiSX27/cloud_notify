import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { adminApi } from "../../lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Ticket, Users, BarChart3, ClipboardList, MessageSquare, Timer } from "lucide-react";

interface Stats {
  tickets: {
    total: number;
    status: { open: number; assigned: number; inProgress: number; resolved: number; closed: number };
    priority: { low: number; medium: number; high: number; urgent: number };
    avgResolutionDays: number;
  };
  users: {
    total: number;
    roles: { citizen: number; officer: number; admin: number };
  };
  assignments: { total: number };
  comments: { total: number };
  categories: { name: string; count: number }[];
}

const STATUS_COLORS = ["#22d3ee", "#6366f1", "#f59e0b", "#10b981", "#475569"];
const PRIORITY_COLORS = ["#10b981", "#f59e0b", "#fb923c", "#f43f5e"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: "10px 14px",
          fontSize: 13,
        }}
      >
        <p style={{ color: "var(--text-secondary)", marginBottom: 4 }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .stats()
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="loading-screen" style={{ minHeight: 400 }}>
          <div className="loading-spinner" />
          <p>Loading analytics...</p>
        </div>
      </Layout>
    );
  }

  if (!stats) return null;

  const statusChartData = [
    { name: "Open", value: stats.tickets.status.open },
    { name: "Assigned", value: stats.tickets.status.assigned },
    { name: "In Progress", value: stats.tickets.status.inProgress },
    { name: "Resolved", value: stats.tickets.status.resolved },
    { name: "Closed", value: stats.tickets.status.closed },
  ];

  const priorityChartData = [
    { name: "Low", value: stats.tickets.priority.low },
    { name: "Medium", value: stats.tickets.priority.medium },
    { name: "High", value: stats.tickets.priority.high },
    { name: "Urgent", value: stats.tickets.priority.urgent },
  ];

  const categoryChartData = stats.categories.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    tickets: c.count,
  }));

  return (
    <Layout title="Admin Dashboard">
      {/* Welcome */}
      <div
        className="card mb-24"
        style={{
          background: "linear-gradient(135deg, rgba(244,63,94,0.1), rgba(99,102,241,0.1))",
          border: "1px solid rgba(244,63,94,0.2)",
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
          System Overview ⚡
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Real-time analytics and platform management
        </p>
      </div>

      {/* Top Stats */}
      <div className="stat-grid">
        <div className="stat-card accent">
          <div className="stat-icon accent"><Ticket size={18} /></div>
          <div className="stat-label">Total Tickets</div>
          <div className="stat-value">{stats.tickets.total}</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon cyan"><Users size={18} /></div>
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.users.total}</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-icon emerald"><ClipboardList size={18} /></div>
          <div className="stat-label">Assignments</div>
          <div className="stat-value">{stats.assignments.total}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><MessageSquare size={18} /></div>
          <div className="stat-label">Comments</div>
          <div className="stat-value">{stats.comments.total}</div>
        </div>
        <div className="stat-card rose">
          <div className="stat-icon rose"><Timer size={18} /></div>
          <div className="stat-label">Avg Resolution</div>
          <div className="stat-value" style={{ fontSize: 22 }}>
            {stats.tickets.avgResolutionDays > 0
              ? `${stats.tickets.avgResolutionDays.toFixed(1)}d`
              : "—"}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2 mb-24">
        {/* Status Distribution */}
        <div className="card">
          <div className="section-title mb-16">Ticket Status Distribution</div>
          <div className="chart-container" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChartData.map((_, i) => (
                    <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <div className="section-title mb-16">Priority Breakdown</div>
          <div className="chart-container" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Tickets">
                  {priorityChartData.map((_, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[i % PRIORITY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Chart */}
      {categoryChartData.length > 0 && (
        <div className="card mb-24">
          <div className="section-title mb-16">
            <BarChart3 size={16} style={{ display: "inline", marginRight: 8 }} />
            Top Categories
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="tickets" fill="#6366f1" radius={[6, 6, 0, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* User Breakdown */}
      <div className="card">
        <div className="section-title mb-16">User Roles</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Citizens", count: stats.users.roles.citizen, color: "var(--cyan)", bg: "rgba(34,211,238,0.1)" },
            { label: "Officers", count: stats.users.roles.officer, color: "var(--accent-light)", bg: "rgba(99,102,241,0.1)" },
            { label: "Admins", count: stats.users.roles.admin, color: "var(--rose)", bg: "rgba(244,63,94,0.1)" },
          ].map(({ label, count, color, bg }) => (
            <div
              key={label}
              style={{
                flex: 1,
                minWidth: 140,
                background: bg,
                borderRadius: "var(--radius)",
                padding: "20px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 800, color, fontFamily: "Outfit, sans-serif" }}>
                {count}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
