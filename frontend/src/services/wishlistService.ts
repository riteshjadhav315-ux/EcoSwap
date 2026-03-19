const API_URL = "https://ecoswap-backend-ows2.onrender.com/api";

export interface WishlistItem {
  id?: string;
  userId: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImageUrl: string;
  createdAt: any;
}

export const addToWishlist = async (item: Omit<WishlistItem, "id" | "createdAt">) => {
  const response = await fetch(`${API_URL}/wishlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!response.ok) throw new Error("Failed to add to wishlist");
  return await response.json();
};

export const removeFromWishlist = async (wishId: string) => {
  const response = await fetch(`${API_URL}/wishlist/${wishId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to remove from wishlist");
};

export const getWishlist = async (userId: string) => {
  const response = await fetch(`${API_URL}/wishlist?userId=${userId}`);
  if (!response.ok) throw new Error("Failed to fetch wishlist");
  const data = await response.json();
  return data.map((i: any) => ({ ...i, id: i._id }));
};

export const isInWishlist = async (userId: string, productId: string) => {
  const response = await fetch(`${API_URL}/wishlist?userId=${userId}&productId=${productId}`);
  if (!response.ok) return null;
  const data = await response.json();
  const item = data.find((i: any) => i.productId === productId);
  return item ? item._id : null;
};
