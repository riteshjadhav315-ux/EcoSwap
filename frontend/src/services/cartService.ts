import { apiFetch } from "./api";

export interface CartItem {
  _id: string;
  userId: string;
  productId: string;
  productTitle: string;
  productPrice: number;
  productImageUrl: string;
  quantity: number;
  createdAt: string;
}

export const getCart = async (): Promise<CartItem[]> => {
  return apiFetch("/api/cart/my");
};

export const addToCart = async (item: {
  productId: string;
  productTitle: string;
  productPrice: number;
  productImageUrl: string;
}): Promise<CartItem> => {
  return apiFetch("/api/cart", {
    method: "POST",
    body: JSON.stringify(item),
  });
};

export const updateCartQuantity = async (
  id: string,
  quantity: number
): Promise<CartItem> => {
  return apiFetch(`/api/cart/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
};

export const removeFromCart = async (id: string): Promise<void> => {
  await apiFetch(`/api/cart/${id}`, {
    method: "DELETE",
  });
};

export const clearCart = async (): Promise<void> => {
  await apiFetch("/api/cart/clear/all", {
    method: "DELETE",
  });
};
