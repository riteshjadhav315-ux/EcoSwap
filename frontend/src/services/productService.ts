import { Product } from "../types";

const API_URL = "/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const uploadProductImage = async (file: File, productId: string, userId: string) => {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: getAuthHeader(),
    body: formData,
  });
  
  if (!response.ok) throw new Error("Failed to upload image");
  const data = await response.json();
  return data.url;
};

export const createProduct = async (productData: Omit<Product, "id" | "createdAt" | "sellerId"> & { sellerId?: string }) => {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeader()
    },
    body: JSON.stringify(productData),
  });
  
  if (!response.ok) throw new Error("Failed to create product");
  const data = await response.json();
  return data._id;
};

export const createProductWithImages = async (formData: FormData) => {
  const response = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: getAuthHeader(),
    body: formData,
  });
  
  if (!response.ok) throw new Error("Failed to create product");
  return response.json();
};

export const updateProductWithImages = async (productId: string, formData: FormData) => {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: formData,
  });
  
  if (!response.ok) throw new Error("Failed to update product");
  return response.json();
};

export const getUserProducts = async (userId?: string) => {
  const url = userId ? `${API_URL}/products?sellerId=${userId}` : `${API_URL}/products/my`;
  const response = await fetch(url, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error("Failed to fetch user products");
  const data = await response.json();
  return data.map((p: any) => ({ ...p, id: p._id }));
};

export const getSoldProducts = async () => {
  const response = await fetch(`${API_URL}/products/sold`, {
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error("Failed to fetch sold products");
  const data = await response.json();
  return data.map((p: any) => ({ ...p, id: p._id }));
};

export const getAllProducts = async () => {
  const response = await fetch(`${API_URL}/products`);
  if (!response.ok) throw new Error("Failed to fetch products");
  const data = await response.json();
  return data.map((p: any) => ({ ...p, id: p._id }));
};

export const getFilteredProducts = async (category?: string, searchQuery?: string, location?: string) => {
  let url = `${API_URL}/products?`;
  if (category && category !== "All") url += `category=${category}&`;
  if (searchQuery) url += `search=${searchQuery}&`;
  if (location && location !== "All Locations") url += `location=${location}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch filtered products");
  const data = await response.json();
  return data.map((p: any) => ({ ...p, id: p._id }));
};

export const deleteProduct = async (productId: string) => {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error("Failed to delete product");
};

export const updateProductStatus = async (productId: string, status: 'available' | 'sold') => {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeader()
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update product status");
};

export const updateProduct = async (productId: string, productData: Partial<Product>) => {
  const response = await fetch(`${API_URL}/products/${productId}`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeader()
    },
    body: JSON.stringify(productData),
  });
  if (!response.ok) throw new Error("Failed to update product");
  return response.json();
};

export const getProductById = async (productId: string) => {
  const response = await fetch(`${API_URL}/products/${productId}`);
  if (!response.ok) return null;
  const data = await response.json();
  return { ...data, id: data._id };
};

export const searchProducts = async (query: string, filters?: { category?: string, minPrice?: number, maxPrice?: number, location?: string }) => {
  let url = `${API_URL}/products/search?query=${encodeURIComponent(query)}`;
  if (filters) {
    if (filters.category && filters.category !== "All") url += `&category=${filters.category}`;
    if (filters.minPrice) url += `&minPrice=${filters.minPrice}`;
    if (filters.maxPrice) url += `&maxPrice=${filters.maxPrice}`;
    if (filters.location) url += `&location=${filters.location}`;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error("Search failed");
  const data = await response.json();
  return data.map((p: any) => ({ ...p, id: p._id }));
};
