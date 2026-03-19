import { apiFetch } from "./api";

export const adminService = {
  getAnalytics: () => apiFetch("/api/admin/analytics"),

  getStats: () => apiFetch("/api/admin/stats"),

  getUsers: () => apiFetch("/api/admin/users"),

  getProducts: () => apiFetch("/api/admin/products"),

  getPayments: () => apiFetch("/api/admin/payments"),

  getReports: () => apiFetch("/api/admin/reports"),

  updateUserRole: (uid: string, role: string) =>
    apiFetch(`/api/admin/users/${uid}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  deleteUser: (uid: string) =>
    apiFetch(`/api/admin/users/${uid}`, {
      method: "DELETE",
    }),

  resolveReport: (reportId: string) =>
    apiFetch(`/api/admin/reports/${reportId}/resolve`, {
      method: "PATCH",
    }),
};