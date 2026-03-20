import { Product } from "../types";
import { apiFetch } from "./api";

export const uploadProductImage = async (
  file: File,
  _productId: string,
  _userId: string
) => {
  const formData = new FormData();
  formData.append("file", file);

  const data = await apiFetch<{ url: string }>("/api/upload", {
    method: "POST",
    body: formData,
  });

  return data.url;
};

export const createProduct = async (
  productData: Omit<Product, "id" | "createdAt" | "sellerId"> & { sellerId?: string }
) => {
  const data = await apiFetch<{ _id: string }>("/api/products", {
    method: "POST",
    body: JSON.stringify(productData),
  });

  return data._id;
};

export const createProductWithImages = async (formData: FormData) => {
  return apiFetch("/api/products", {
    method: "POST",
    body: formData,
  });
};

export const updateProductWithImages = async (productId: string, formData: FormData) => {
  return apiFetch(`/api/products/${productId}`, {
    method: "PATCH",
    body: formData,
  });
};

export const getUserProducts = async (userId?: string) => {
  const endpoint = userId
    ? `/api/products?sellerId=${encodeURIComponent(userId)}`
    : "/api/products/my";
  const data = await apiFetch<any[]>(endpoint);

  return data.map((product) => ({ ...product, id: product._id }));
};

export const getSoldProducts = async () => {
  const data = await apiFetch<any[]>("/api/products/sold");
  return data.map((product) => ({ ...product, id: product._id }));
};

export const getAllProducts = async () => {
  const data = await apiFetch<any[]>("/api/products");
  return data.map((product) => ({ ...product, id: product._id }));
};

export const getFilteredProducts = async (
  category?: string,
  searchQuery?: string,
  location?: string
) => {
  const params = new URLSearchParams();

  if (category && category !== "All") {
    params.set("category", category);
  }

  if (searchQuery) {
    params.set("search", searchQuery);
  }

  if (location && location !== "All Locations") {
    params.set("location", location);
  }

  const query = params.toString();
  const data = await apiFetch<any[]>(`/api/products${query ? `?${query}` : ""}`);
  return data.map((product) => ({ ...product, id: product._id }));
};

export const deleteProduct = async (productId: string) => {
  await apiFetch(`/api/products/${productId}`, {
    method: "DELETE",
  });
};

export const updateProductStatus = async (
  productId: string,
  status: "available" | "sold"
) => {
  await apiFetch(`/api/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

export const updateProduct = async (
  productId: string,
  productData: Partial<Product>
) => {
  return apiFetch(`/api/products/${productId}`, {
    method: "PATCH",
    body: JSON.stringify(productData),
  });
};

export const getProductById = async (productId: string) => {
  try {
    const data = await apiFetch<any>(`/api/products/${productId}`);
    return { ...data, id: data._id };
  } catch {
    return null;
  }
};

export const searchProducts = async (
  query: string,
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
  }
) => {
  const params = new URLSearchParams({ query });

  if (filters?.category && filters.category !== "All") {
    params.set("category", filters.category);
  }

  if (filters?.minPrice) {
    params.set("minPrice", String(filters.minPrice));
  }

  if (filters?.maxPrice) {
    params.set("maxPrice", String(filters.maxPrice));
  }

  if (filters?.location) {
    params.set("location", filters.location);
  }

  const data = await apiFetch<any[]>(`/api/products/search?${params.toString()}`);
  return data.map((product) => ({ ...product, id: product._id }));
};
