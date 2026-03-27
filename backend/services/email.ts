const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_TIMEOUT_MS = Number(process.env.EMAIL_TIMEOUT_MS || 12000);

export type EmailStatus = "sent" | "failed" | "skipped";

export interface InvoiceOrderItem {
  productName: string;
  price: number;
  quantity: number;
  totalAmount: number;
}

export interface InvoiceOrderSummary {
  buyerName: string;
  orderId: string;
  paymentId: string;
  items: InvoiceOrderItem[];
  quantity: number;
  totalAmount: number;
  currency?: string;
  createdAt: Date | string;
}

export interface InvoiceEmailResult {
  success: boolean;
  status: EmailStatus;
  provider: "resend";
  messageId?: string;
  error?: string;
  responseBody?: unknown;
}

interface ResendSendEmailResponse {
  id?: string;
  message?: string;
  name?: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatCurrency = (amount: number, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `Rs. ${amount.toFixed(2)}`;
  }
};

export const buildInvoiceEmailHtml = (order: InvoiceOrderSummary) => {
  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.productName)}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
          <td style="padding:12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.totalAmount, order.currency)}</td>
        </tr>
      `
    )
    .join("");

  const orderDate = new Date(order.createdAt);

  return `
    <div style="margin:0;padding:24px;background:#f0fdf4;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #d1fae5;">
        <div style="background:#059669;padding:28px 32px;color:#ffffff;">
          <h1 style="margin:0;font-size:28px;line-height:1.2;">EcoSwap Order Invoice</h1>
          <p style="margin:8px 0 0;font-size:15px;opacity:0.95;">Thank you for your purchase, ${escapeHtml(order.buyerName)}.</p>
        </div>

        <div style="padding:32px;">
          <p style="margin:0 0 20px;font-size:15px;color:#334155;">
            Your order has been successfully confirmed. Here is your invoice summary.
          </p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
            <tr>
              <td style="padding:8px 0;color:#475569;">Order ID</td>
              <td style="padding:8px 0;text-align:right;color:#0f172a;font-weight:600;">${escapeHtml(order.orderId)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#475569;">Payment ID</td>
              <td style="padding:8px 0;text-align:right;color:#0f172a;font-weight:600;">${escapeHtml(order.paymentId)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#475569;">Date &amp; Time</td>
              <td style="padding:8px 0;text-align:right;color:#0f172a;font-weight:600;">${escapeHtml(orderDate.toLocaleString("en-IN"))}</td>
            </tr>
          </table>

          <div style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;">
              <thead style="background:#ecfdf5;">
                <tr>
                  <th style="padding:12px;text-align:left;color:#065f46;">Product</th>
                  <th style="padding:12px;text-align:center;color:#065f46;">Qty</th>
                  <th style="padding:12px;text-align:right;color:#065f46;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border-radius:14px;padding:16px 18px;margin-bottom:24px;">
            <span style="font-size:16px;color:#334155;">Total Amount</span>
            <strong style="font-size:22px;color:#059669;">${formatCurrency(order.totalAmount, order.currency)}</strong>
          </div>

          <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">
            Thank you for choosing EcoSwap. If you need help with your order, just reply to this email.
          </p>
        </div>
      </div>
    </div>
  `;
};

const normalizeResendError = (status: number, body: unknown) => {
  const bodyMessage =
    typeof body === "object" && body !== null
      ? ((body as Record<string, unknown>).message as string | undefined) ||
        ((body as Record<string, unknown>).name as string | undefined)
      : undefined;

  if (bodyMessage && /verify a domain|onboarding@resend\.dev|testing emails/i.test(bodyMessage)) {
    return "Resend accepted only test-recipient sending for your current sender. Verify a domain in Resend to send invoices to any buyer email.";
  }

  if (status === 401 || /api key/i.test(bodyMessage || "")) {
    return "Resend authentication failed. Check RESEND_API_KEY.";
  }

  if (status === 422) {
    return bodyMessage || "Resend rejected the email request. Check EMAIL_FROM and recipient email.";
  }

  return bodyMessage || `Resend email request failed with status ${status}.`;
};

export async function sendInvoiceEmail(
  userEmail: string,
  order: InvoiceOrderSummary
): Promise<InvoiceEmailResult> {
  const apiKey = (process.env.RESEND_API_KEY || "").trim();
  const from = (process.env.EMAIL_FROM || "").trim();
  const replyTo = (process.env.EMAIL_REPLY_TO || "").trim();

  if (!apiKey) {
    return {
      success: false,
      status: "failed",
      provider: "resend",
      error: "RESEND_API_KEY is not configured.",
    };
  }

  if (!from) {
    return {
      success: false,
      status: "failed",
      provider: "resend",
      error: "EMAIL_FROM is not configured.",
    };
  }

  if (!userEmail) {
    return {
      success: false,
      status: "failed",
      provider: "resend",
      error: "Buyer email is missing.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

  try {
    const payload: Record<string, unknown> = {
      from,
      to: [userEmail],
      subject: "Order Invoice - EcoSwap",
      html: buildInvoiceEmailHtml(order),
      headers: {
        "X-EcoSwap-Order-Id": order.orderId,
        "X-EcoSwap-Payment-Id": order.paymentId,
      },
    };

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const responseBody: ResendSendEmailResponse | null = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        status: "failed",
        provider: "resend",
        error: normalizeResendError(response.status, responseBody),
        responseBody,
      };
    }

    return {
      success: true,
      status: "sent",
      provider: "resend",
      messageId: responseBody?.id,
      responseBody,
    };
  } catch (error) {
    const rawError = error instanceof Error ? error.message : "Unknown email error";
    const normalizedError =
      rawError === "This operation was aborted" || /aborted/i.test(rawError)
        ? "Invoice email timed out on the server. Payment succeeded, but email could not be confirmed."
        : rawError;

    return {
      success: false,
      status: "failed",
      provider: "resend",
      error: normalizedError,
    };
  } finally {
    clearTimeout(timeout);
  }
}
