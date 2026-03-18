const API_URL = "/api/payment";
const PAYMENTS_API_URL = "/api/payments";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const createOrder = async (productId: string) => {
  const response = await fetch(`${API_URL}/create-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...getAuthHeader()
    },
    body: JSON.stringify({ productId }),
  });
  if (!response.ok) throw new Error("Failed to create order");
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response during order creation");
  }
  
  return response.json();
};

export const verifyPayment = async (paymentData: any) => {
  const response = await fetch(`${PAYMENTS_API_URL}/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...getAuthHeader()
    },
    body: JSON.stringify(paymentData),
  });
  if (!response.ok) throw new Error("Payment verification failed");
  
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response during payment verification");
  }
  
  return response.json();
};
