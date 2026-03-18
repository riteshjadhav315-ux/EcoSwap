const API_URL = "/api/reviews";

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
  const response = await fetch(`${API_URL}/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(reviewData),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to add review");
  return data;
};

export const getProductReviews = async (productId: string): Promise<Review[]> => {
  const response = await fetch(`${API_URL}/product/${productId}`, {
    headers: { "Accept": "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch product reviews");
  return response.json();
};

export const getSellerReviews = async (sellerId: string): Promise<Review[]> => {
  const response = await fetch(`${API_URL}/seller/${sellerId}`, {
    headers: { "Accept": "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch seller reviews");
  return response.json();
};

export const getSellerAverageRating = async (sellerId: string): Promise<{ averageRating: number; reviewCount: number }> => {
  const response = await fetch(`${API_URL}/average/${sellerId}`, {
    headers: { "Accept": "application/json" }
  });
  if (!response.ok) throw new Error("Failed to fetch average rating");
  return response.json();
};
