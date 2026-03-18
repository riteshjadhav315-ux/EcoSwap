const API_URL = "/api";

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

export const createNotification = async (notification: Omit<Notification, "id" | "createdAt">) => {
  const response = await fetch(`${API_URL}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notification),
  });
  if (!response.ok) throw new Error("Failed to create notification");
  return await response.json();
};

export const getMyNotifications = async (userId: string) => {
  if (!userId) return [];
  try {
    const response = await fetch(`${API_URL}/notifications?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      }
    });
    if (!response.ok) {
      console.warn(`Notifications API returned ${response.status}`);
      return [];
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Notifications API returned non-JSON response");
      return [];
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data.map((n: any) => ({ ...n, id: n._id })) : [];
  } catch (error) {
    // Only log if it's not a common network interruption during dev
    if (error instanceof Error && error.message !== "Failed to fetch") {
      console.error("Error in getMyNotifications:", error);
    }
    return [];
  }
};

export const markAsRead = async (notificationId: string) => {
  const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("Failed to mark notification as read");
};

export const deleteNotification = async (notificationId: string) => {
  const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete notification");
};
