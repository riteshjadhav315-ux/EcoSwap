import { apiFetch } from "./api";

export interface Notification {
  id?: string;
  userId: string;
  type: "message" | "system";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: any;
}

export const createNotification = async (
  notification: Omit<Notification, "id" | "createdAt">
) => {
  return apiFetch("/api/notifications", {
    method: "POST",
    body: JSON.stringify(notification),
  });
};

export const getMyNotifications = async (userId: string) => {
  if (!userId) {
    return [];
  }

  try {
    const data = await apiFetch<any[]>(
      `/api/notifications?userId=${encodeURIComponent(userId)}`
    );
    return Array.isArray(data)
      ? data.map((notification) => ({ ...notification, id: notification._id }))
      : [];
  } catch (error) {
    console.error("Error in getMyNotifications:", error);
    return [];
  }
};

export const markAsRead = async (notificationId: string) => {
  await apiFetch(`/api/notifications/${notificationId}`, {
    method: "PATCH",
  });
};

export const deleteNotification = async (notificationId: string) => {
  await apiFetch(`/api/notifications/${notificationId}`, {
    method: "DELETE",
  });
};
