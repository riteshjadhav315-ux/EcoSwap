const FAST2SMS_BULK_URL = "https://www.fast2sms.com/dev/bulkV2";

export type SmsStatus = "sent" | "failed" | "skipped";

export interface OrderConfirmationSmsInput {
  phoneNumber: string;
  productName: string;
  totalAmount: number;
  orderId: string;
}

export interface SmsSendResult {
  success: boolean;
  status: SmsStatus;
  provider: "fast2sms";
  message: string;
  error?: string;
  responseBody?: unknown;
}

export function normalizeIndianPhoneNumber(phoneNumber: string): string | null {
  const digitsOnly = phoneNumber.replace(/\D/g, "");

  if (digitsOnly.length === 10) {
    return digitsOnly;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return digitsOnly.slice(2);
  }

  return null;
}

export function buildOrderConfirmationSmsMessage(input: Omit<OrderConfirmationSmsInput, "phoneNumber">): string {
  return [
    "Order Confirmed!",
    `Product: ${input.productName}`,
    `Amount: \u20b9${input.totalAmount.toFixed(2)}`,
    `Order ID: ${input.orderId}`,
    "Thank you for your purchase!",
  ].join("\n");
}

export async function sendOrderConfirmationSms(
  input: OrderConfirmationSmsInput
): Promise<SmsSendResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const route = (process.env.FAST2SMS_ROUTE || "q").trim().toLowerCase();
  const senderId = (process.env.FAST2SMS_SENDER_ID || "").trim();
  const entityId = (process.env.FAST2SMS_ENTITY_ID || "").trim();
  const templateId = (process.env.FAST2SMS_TEMPLATE_ID || "").trim();
  const normalizedPhoneNumber = normalizeIndianPhoneNumber(input.phoneNumber);
  const message = buildOrderConfirmationSmsMessage({
    productName: input.productName,
    totalAmount: input.totalAmount,
    orderId: input.orderId,
  });

  if (!apiKey) {
    return {
      success: false,
      status: "skipped",
      provider: "fast2sms",
      message,
      error: "FAST2SMS_API_KEY is not configured.",
    };
  }

  if (!normalizedPhoneNumber) {
    return {
      success: false,
      status: "skipped",
      provider: "fast2sms",
      message,
      error: "Buyer phone number is missing or invalid for Fast2SMS.",
    };
  }

  const requestBody = new URLSearchParams({
    route,
    language: "english",
    flash: "0",
    numbers: normalizedPhoneNumber,
    message,
  });

  if (senderId) {
    requestBody.set("sender_id", senderId);
  }

  if (entityId) {
    requestBody.set("entity_id", entityId);
  }

  if (templateId) {
    requestBody.set("template_id", templateId);
  }

  try {
    const response = await fetch(FAST2SMS_BULK_URL, {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody.toString(),
    });

    const responseBody = await response.json().catch(() => null);
    const responseMessage =
      typeof responseBody === "object" && responseBody !== null
        ? (responseBody as any).message || (responseBody as any).error || (responseBody as any).warning
        : undefined;
    const providerReportedFailure =
      typeof responseBody === "object" &&
      responseBody !== null &&
      (((responseBody as any).return === false) ||
        ("status_code" in (responseBody as any) && Number((responseBody as any).status_code) >= 400));

    if (!response.ok) {
      return {
        success: false,
        status: "failed",
        provider: "fast2sms",
        message,
        error: responseMessage || `Fast2SMS request failed with status ${response.status}.`,
        responseBody,
      };
    }

    if (providerReportedFailure) {
      return {
        success: false,
        status: "failed",
        provider: "fast2sms",
        message,
        error: responseMessage || "Fast2SMS rejected the SMS request.",
        responseBody,
      };
    }

    return {
      success: true,
      status: "sent",
      provider: "fast2sms",
      message,
      responseBody,
    };
  } catch (error) {
    return {
      success: false,
      status: "failed",
      provider: "fast2sms",
      message,
      error: error instanceof Error ? error.message : "Unknown Fast2SMS error",
    };
  }
}
