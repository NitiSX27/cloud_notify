import axios from "axios";

// In dev, Vite proxy handles /api → http://localhost:8080/api
// In prod, set VITE_API_URL to the backend URL
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (name: string, email: string, password: string) =>
    api.post("/auth/register", { name, email, password }),
  me: () => api.get("/auth/me"),
};

// ─── Tickets ──────────────────────────────────────────────────────────────────
export const ticketsApi = {
  list: () => api.get("/tickets"),
  get: (id: string) => api.get(`/tickets/${id}`),
  create: (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
    imageUrl?: string;
    locationText?: string;
  }) => api.post("/tickets", data),
  assign: (ticketId: string, officerId: string) =>
    api.post(`/tickets/${ticketId}/assign`, { officerId }),
  changeStatus: (ticketId: string, status: string) =>
    api.post(`/tickets/${ticketId}/status`, { status }),
  addComment: (ticketId: string, comment: string) =>
    api.post(`/tickets/${ticketId}/comment`, { comment }),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => api.get("/notifications"),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  unreadCount: () => api.get("/notifications/unread/count"),
};

// ─── Officer ──────────────────────────────────────────────────────────────────
export const officerApi = {
  myTickets: () => api.get("/officer/my-tickets"),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () => api.get("/admin/stats"),
  officers: () => api.get("/admin/officers"),
  allUsers: () => api.get("/admin/users"),
};

// ─── Uploads ──────────────────────────────────────────────────────────────────
export const uploadsApi = {
  presign: (contentType: string, folder?: string) =>
    api.get("/uploads/presign", { params: { contentType, folder } }),
};
