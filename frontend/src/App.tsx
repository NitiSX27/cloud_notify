import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Pages
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import MyTickets from "./pages/citizen/MyTickets";
import CreateTicket from "./pages/citizen/CreateTicket";
import TicketDetail from "./pages/TicketDetail";
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import OfficerTickets from "./pages/officer/OfficerTickets";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminUsers from "./pages/admin/AdminUsers";
import AssignOfficers from "./pages/admin/AssignOfficers";
import NotificationsPage from "./pages/NotificationsPage";

// ─── Protected Route ────────────────────────────────────────────────────────
function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: string[];
}) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" style={{ width: 36, height: 36 }} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === "ADMIN") return <Navigate to="/admin" replace />;
    if (user.role === "OFFICER") return <Navigate to="/officer" replace />;
    return <Navigate to="/citizen" replace />;
  }

  return <>{children}</>;
}

// ─── Root Redirect ─────────────────────────────────────────────────────────
function RootRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" style={{ width: 36, height: 36 }} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === "ADMIN") return <Navigate to="/admin" replace />;
  if (user?.role === "OFFICER") return <Navigate to="/officer" replace />;
  return <Navigate to="/citizen" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Root → Role-based redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* Citizen */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute roles={["CITIZEN"]}>
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/tickets"
        element={
          <ProtectedRoute roles={["CITIZEN"]}>
            <MyTickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/create-ticket"
        element={
          <ProtectedRoute roles={["CITIZEN", "ADMIN"]}>
            <CreateTicket />
          </ProtectedRoute>
        }
      />

      {/* Officer */}
      <Route
        path="/officer"
        element={
          <ProtectedRoute roles={["OFFICER"]}>
            <OfficerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer/tickets"
        element={
          <ProtectedRoute roles={["OFFICER"]}>
            <OfficerTickets />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tickets"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminTickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/assign"
        element={
          <ProtectedRoute roles={["ADMIN"]}>
            <AssignOfficers />
          </ProtectedRoute>
        }
      />

      {/* Shared */}
      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* 404 → redirect home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#10b981", secondary: "white" },
            },
            error: {
              iconTheme: { primary: "#f43f5e", secondary: "white" },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
