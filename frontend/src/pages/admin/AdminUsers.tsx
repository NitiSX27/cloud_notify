import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { api } from "../../lib/api";
import { RoleBadge } from "../../components/Badges";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    api
      .get("/admin/users")
      .then((r) => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <Layout title="Users">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Users</h1>
          <p className="page-subtitle">{users.length} total registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-16" style={{ padding: "12px 16px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            id="user-search"
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>
        <select
          id="role-filter"
          className="form-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ width: 150 }}
        >
          <option value="ALL">All Roles</option>
          <option value="CITIZEN">Citizen</option>
          <option value="OFFICER">Officer</option>
          <option value="ADMIN">Admin</option>
        </select>
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
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} id={`user-row-${user.id}`}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 36, height: 36,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--accent), var(--cyan))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 700, color: "white",
                            flexShrink: 0,
                          }}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{user.email}</td>
                    <td><RoleBadge role={user.role} /></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
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
