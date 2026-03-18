export const adminService = {
  getAnalytics: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/analytics", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch analytics");
    }
    return response.json();
  },

  getStats: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/stats", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }
    return response.json();
  },

  getUsers: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  },

  getProducts: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  },

  getPayments: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/payments", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch payments");
    }
    return response.json();
  },

  getReports: async () => {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/admin/reports", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch reports");
    }
    return response.json();
  },

  updateUserRole: async (uid: string, role: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/admin/users/${uid}/role`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });
    if (!response.ok) {
      throw new Error("Failed to update user role");
    }
    return response.json();
  },

  deleteUser: async (uid: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/admin/users/${uid}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to delete user");
    }
    return response.json();
  },

  resolveReport: async (reportId: string) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to resolve report");
    }
    return response.json();
  },
};
