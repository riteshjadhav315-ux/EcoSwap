const BASE_URL = "https://ecoswap-backend-ows2.onrender.com"; // 🔥 put your real backend URL

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "API error");
  }

  return data;
};