const API_BASE_URL = import.meta.env.VITE_API_URL;

export const apiFetch = async (endpoint: string, options: any = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const text = await response.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error("❌ Not JSON response:", text);
    throw new Error("Server returned invalid response");
  }

  if (!response.ok) {
    throw new Error(data.error || "API error");
  }

  return data;
};