const API_URL = "/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const getDashboardSummary = async () => {
  const response = await fetch(`${API_URL}/dashboard/summary`, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard summary");
  return response.json();
};

export const getMyPurchases = async () => {
  const response = await fetch(`${API_URL}/payments/my`, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error("Failed to fetch purchases");
  return response.json();
};

export const getMyWishlist = async () => {
  const response = await fetch(`${API_URL}/wishlist/my`, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error("Failed to fetch wishlist");
  return response.json();
};

export const getMyReviews = async () => {
  const response = await fetch(`${API_URL}/reviews/my`, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error("Failed to fetch reviews");
  return response.json();
};

export const getMyNotifications = async () => {
  const response = await fetch(`${API_URL}/notifications/my`, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error("Failed to fetch notifications");
  return response.json();
};
