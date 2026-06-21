import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  Users,
  BarChart3,
  Bell,
  ClipboardList,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";
import { notificationsApi } from "../lib/api";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    notificationsApi
      .unreadCount()
      .then((r) => setUnread(r.data.unreadCount))
      .catch(() => {});
    const interval = setInterval(() => {
      notificationsApi
        .unreadCount()
        .then((r) => setUnread(r.data.unreadCount))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  const citizenLinks = [
    { to: "/citizen", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/citizen/tickets", label: "My Tickets", icon: <Ticket size={16} /> },
    { to: "/citizen/create-ticket", label: "New Request", icon: <PlusCircle size={16} /> },
  ];

  const officerLinks = [
    { to: "/officer", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/officer/tickets", label: "Assigned Tickets", icon: <ClipboardList size={16} /> },
  ];

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/admin/tickets", label: "All Tickets", icon: <Ticket size={16} /> },
    { to: "/admin/analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
    { to: "/admin/users", label: "Users", icon: <Users size={16} /> },
  ];

  const links =
    user?.role === "ADMIN"
      ? adminLinks
      : user?.role === "OFFICER"
      ? officerLinks
      : citizenLinks;

  const roleSection =
    user?.role === "ADMIN"
      ? "Admin Portal"
      : user?.role === "OFFICER"
      ? "Officer Portal"
      : "Citizen Portal";

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🏛️</div>
        <div className="logo-title">CivicConnect</div>
        <div className="logo-subtitle">Community Platform</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">{roleSection}</div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive: active }) =>
              `nav-link ${active || isActive(link.to) ? "active" : ""}`
            }
            end
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 16 }}>Account</div>
        <NavLink
          to="/notifications"
          className={({ isActive: active }) =>
            `nav-link ${active ? "active" : ""}`
          }
        >
          <Bell size={16} />
          Notifications
          {unread > 0 && <span className="nav-badge">{unread}</span>}
        </NavLink>

        {user?.role === "ADMIN" && (
          <NavLink
            to="/admin/assign"
            className={({ isActive: active }) =>
              `nav-link ${active ? "active" : ""}`
            }
          >
            <Shield size={16} />
            Assign Officers
          </NavLink>
        )}
      </nav>

      <div className="sidebar-user">
        <div className="user-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={logout}
          title="Logout"
          id="logout-btn"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
