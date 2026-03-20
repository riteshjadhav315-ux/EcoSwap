import { apiFetch } from "./api";

export const createOrder = async (productId: string) => {
  return apiFetch("/api/payment/create-order", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
};

export const createCartOrder = async (_amount?: number) => {
  return apiFetch("/api/payment/create-cart-order", {
    method: "POST",
  });
};

export const verifyPayment = async (paymentData: any) => {
  return apiFetch("/api/payments/verify", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });
};
