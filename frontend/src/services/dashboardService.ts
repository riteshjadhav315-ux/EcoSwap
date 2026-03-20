import { apiFetch } from "./api";

export const getDashboardSummary = async () => {
  return apiFetch("/api/dashboard/summary");
};

export const getMyPurchases = async () => {
  return apiFetch("/api/payments/my");
};

export const getMyWishlist = async () => {
  return apiFetch("/api/wishlist/my");
};

export const getMyReviews = async () => {
  return apiFetch("/api/reviews/my");
};

export const getMyNotifications = async () => {
  return apiFetch("/api/notifications/my");
};
