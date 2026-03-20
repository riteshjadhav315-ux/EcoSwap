import { apiFetch } from "./api";

export interface WishlistItem {
  id?: string;
  userId: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImageUrl: string;
  createdAt: any;
}

export const addToWishlist = async (
  item: Omit<WishlistItem, "id" | "createdAt">
) => {
  return apiFetch("/api/wishlist", {
    method: "POST",
    body: JSON.stringify(item),
  });
};

export const removeFromWishlist = async (wishId: string) => {
  await apiFetch(`/api/wishlist/${wishId}`, {
    method: "DELETE",
  });
};

export const getWishlist = async (userId: string) => {
  const data = await apiFetch<any[]>(
    `/api/wishlist?userId=${encodeURIComponent(userId)}`
  );
  return data.map((item) => ({ ...item, id: item._id }));
};

export const isInWishlist = async (userId: string, productId: string) => {
  try {
    const data = await apiFetch<any[]>(
      `/api/wishlist?userId=${encodeURIComponent(userId)}&productId=${encodeURIComponent(productId)}`
    );
    const item = data.find((entry) => entry.productId === productId);
    return item ? item._id : null;
  } catch {
    return null;
  }
};
