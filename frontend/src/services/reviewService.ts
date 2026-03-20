import { apiFetch } from "./api";

export interface Review {
  _id?: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const addReview = async (reviewData: Omit<Review, "_id" | "createdAt">) => {
  return apiFetch("/api/reviews/add", {
    method: "POST",
    body: JSON.stringify(reviewData),
  });
};

export const getProductReviews = async (productId: string): Promise<Review[]> => {
  return apiFetch(`/api/reviews/product/${productId}`);
};

export const getSellerReviews = async (sellerId: string): Promise<Review[]> => {
  return apiFetch(`/api/reviews/seller/${sellerId}`);
};

export const getSellerAverageRating = async (
  sellerId: string
): Promise<{ averageRating: number; reviewCount: number }> => {
  return apiFetch(`/api/reviews/average/${sellerId}`);
};
