import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";
import { Resend } from "resend";

import { getAdminSession } from "@/lib/admin";
import { getProductById } from "@/lib/product-db";

const database = new DatabaseSync("database.sqlite");

database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
`);

/*
 * Safe migration for existing databases.
 */
function ensureOrderColumn(
  columnName: string,
  definition: string
) {
  const columns =
    database
      .prepare(
        "PRAGMA table_info(orders)"
      )
      .all() as Array<{
        name: string;
      }>;

  const exists =
    columns.some(
      (column) =>
        column.name === columnName
    );

  if (exists) {
    return;
  }

  database.exec(
    `ALTER TABLE orders ADD COLUMN ${columnName} ${definition}`
  );
}

ensureOrderColumn(
  "tracking_number",
  "TEXT"
);

ensureOrderColumn(
  "voucher_id",
  "TEXT"
);

ensureOrderColumn(
  "voucher_code",
  "TEXT"
);

ensureOrderColumn(
  "voucher_type",
  "TEXT"
);

ensureOrderColumn(
  "discount_amount",
  "REAL NOT NULL DEFAULT 0"
);

ensureOrderColumn(
  "free_delivery",
  "INTEGER NOT NULL DEFAULT 0"
);

const allowedStatuses = [
  "pending_payment",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus =
  (typeof allowedStatuses)[number];

type Language = "en" | "de" | "ar";

function isValidStatus(
  status: string
): status is OrderStatus {
  return allowedStatuses.includes(
    status as OrderStatus
  );
}

function isValidLanguage(
  language: unknown
): language is Language {
  return (
    language === "en" ||
    language === "de" ||
    language === "ar"
  );
}

type OrderRow = {
  id: string;
  status: string;
  payment_status: string;
  tracking_number: string | null;
  shipping_json: string;
};

type OrderItem = {
  productId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  colorKey?: string | number | null;
  colorName?: {
    en: string;
    de: string;
    ar: string;
  } | null;
  image?: string;
  [key: string]: unknown;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getStatusLabel(
  status: OrderStatus,
  language: Language
) {
  const labels: Record<
    Language,
    Record<OrderStatus, string>
  > = {
    en: {
      pending_payment: "Pending Payment",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    },

    de: {
      pending_payment: "Zahlung ausstehend",
      processing: "In Bearbeitung",
      shipped: "Versendet",
      delivered: "Zugestellt",
      cancelled: "Storniert",
    },

    ar: {
      pending_payment: "في انتظار الدفع",
      processing: "قيد المعالجة",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغى",
    },
  };

  return labels[language][status];
}

function getEmailSubject(
  orderId: string,
  status: OrderStatus,
  language: Language
) {
  const subjects: Record<
    Language,
    Record<OrderStatus, string>
  > = {
    en: {
      pending_payment: `Order ${orderId} status updated`,
      processing: `Order ${orderId} is being processed`,
      shipped: `Order ${orderId} has been shipped`,
      delivered: `Order ${orderId} has been delivered`,
      cancelled: `Order ${orderId} has been cancelled`,
    },

    de: {
      pending_payment: `Bestellstatus ${orderId} aktualisiert`,
      processing: `Bestellung ${orderId} wird bearbeitet`,
      shipped: `Bestellung ${orderId} wurde versendet`,
      delivered: `Bestellung ${orderId} wurde zugestellt`,
      cancelled: `Bestellung ${orderId} wurde storniert`,
    },

    ar: {
      pending_payment: `تم تحديث حالة الطلب ${orderId}`,
      processing: `جارٍ تجهيز الطلب ${orderId}`,
      shipped: `تم شحن الطلب ${orderId}`,
      delivered: `تم تسليم الطلب ${orderId}`,
      cancelled: `تم إلغاء الطلب ${orderId}`,
    },
  };

  return subjects[language][status];
}

function getEmailContent(
  orderId: string,
  status: OrderStatus,
  trackingNumber: string | null,
  language: Language,
  customerName: string
) {
  const safeOrderId = escapeHtml(orderId);
  const safeCustomerName = escapeHtml(
    customerName
  );

  const statusLabel = escapeHtml(
    getStatusLabel(status, language)
  );

  const safeTrackingNumber =
    trackingNumber
      ? escapeHtml(trackingNumber)
      : "";

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const orderUrl =
    `${baseUrl}/account/orders/${encodeURIComponent(
      orderId
    )}`;

  const safeOrderUrl =
    escapeHtml(orderUrl);

  if (language === "de") {
    return {
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Hallo ${safeCustomerName},</h2>

          <p>
            der Status Ihrer Bestellung
            <strong>${safeOrderId}</strong>
            wurde aktualisiert.
          </p>

          <p>
            <strong>Neuer Status:</strong>
            ${statusLabel}
          </p>

          ${
            status === "shipped" &&
            safeTrackingNumber
              ? `
                <p>
                  <strong>Sendungsnummer:</strong>
                  ${safeTrackingNumber}
                </p>
              `
              : ""
          }

          <p>
            Sie können Ihre Bestellung hier ansehen:
          </p>

          <p>
            <a
              href="${safeOrderUrl}"
              style="
                display:inline-block;
                padding:10px 18px;
                background:#d8a0b6;
                color:#fff;
                text-decoration:none;
                border-radius:8px;
              "
            >
              Bestellung ansehen
            </a>
          </p>

          <p>
            Vielen Dank für Ihre Bestellung bei JAN-GET.
          </p>
        </div>
      `,
    };
  }

  if (language === "ar") {
    return {
      html: `
        <div
          dir="rtl"
          style="font-family: Arial, sans-serif; line-height: 1.8; color: #333;"
        >
          <h2>مرحبًا ${safeCustomerName}،</h2>

          <p>
            تم تحديث حالة طلبك
            <strong>${safeOrderId}</strong>.
          </p>

          <p>
            <strong>الحالة الجديدة:</strong>
            ${statusLabel}
          </p>

          ${
            status === "shipped" &&
            safeTrackingNumber
              ? `
                <p>
                  <strong>رقم التتبع:</strong>
                  ${safeTrackingNumber}
                </p>
              `
              : ""
          }

          <p>
            يمكنك مشاهدة تفاصيل طلبك من هنا:
          </p>

          <p>
            <a
              href="${safeOrderUrl}"
              style="
                display:inline-block;
                padding:10px 18px;
                background:#d8a0b6;
                color:#fff;
                text-decoration:none;
                border-radius:8px;
              "
            >
              عرض الطلب
            </a>
          </p>

          <p>
            شكرًا لطلبك من JAN-GET.
          </p>
        </div>
      `,
    };
  }

  return {
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2>Hello ${safeCustomerName},</h2>

        <p>
          The status of your order
          <strong>${safeOrderId}</strong>
          has been updated.
        </p>

        <p>
          <strong>New status:</strong>
          ${statusLabel}
        </p>

        ${
          status === "shipped" &&
          safeTrackingNumber
            ? `
              <p>
                <strong>Tracking number:</strong>
                ${safeTrackingNumber}
              </p>
            `
            : ""
        }

        <p>
          You can view your order here:
        </p>

        <p>
          <a
            href="${safeOrderUrl}"
            style="
              display:inline-block;
              padding:10px 18px;
              background:#d8a0b6;
              color:#fff;
              text-decoration:none;
              border-radius:8px;
            "
          >
            View Order
          </a>
        </p>

        <p>
          Thank you for your order with JAN-GET.
        </p>
      </div>
    `,
  };
}

async function sendStatusChangeEmail(
  order: OrderRow,
  newStatus: OrderStatus,
  trackingNumber: string | null
) {
  const shipping = JSON.parse(
    order.shipping_json
  ) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    language?: Language;
  };

  const email =
    shipping.email?.trim();

  if (!email) {
    return {
      sent: false,
      reason:
        "Customer email address is missing.",
    };
  }

  const language: Language =
    isValidLanguage(
      shipping.language
    )
      ? shipping.language
      : "en";

  const customerName =
    `${shipping.firstName ?? ""} ${shipping.lastName ?? ""}`.trim() ||
    "Customer";

  const resendApiKey =
    process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error(
      "RESEND_API_KEY is not configured."
    );

    return {
      sent: false,
      reason:
        "Email service is not configured.",
    };
  }

  const from =
    process.env.RESEND_FROM_EMAIL ||
    "JAN-GET <onboarding@resend.dev>";

  const resend =
    new Resend(resendApiKey);

  const content =
    getEmailContent(
      order.id,
      newStatus,
      trackingNumber,
      language,
      customerName
    );

  await resend.emails.send({
    from,
    to: email,
    subject:
      getEmailSubject(
        order.id,
        newStatus,
        language
      ),
    html: content.html,
  });

  return {
    sent: true,
  };
}

/**
 * Resolves an order item's stored colorKey against the
 * current product/variant data in the database.
 *
 * Supported historical formats:
 *
 * 1. Variant ID
 *    e.g. "pasta-001-variant-1"
 *
 * 2. Variant array index
 *    e.g. "0", "1", "2"
 *
 * 3. Existing localized color name
 *    e.g. "Yellow", "Gelb", "أصفر"
 *
 * The returned colorName always contains all available
 * localized names from the database.
 */
function resolveOrderItemColor(
  item: OrderItem
): OrderItem {
  const productId =
    typeof item.productId === "string"
      ? item.productId.trim()
      : "";

  const colorKey =
    item.colorKey === null ||
    item.colorKey === undefined
      ? ""
      : String(item.colorKey).trim();

  if (!productId || !colorKey) {
    return {
      ...item,
      colorName: null,
    };
  }

  try {
    const product =
      getProductById(productId, {
        includeInactive: true,
      });

    if (!product) {
      return {
        ...item,
        colorName: null,
      };
    }

    let variant =
      product.variants.find(
        (productVariant) =>
          productVariant.id === colorKey
      );

    if (!variant) {
      const variantIndex =
        Number.parseInt(
          colorKey,
          10
        );

      if (
        Number.isInteger(variantIndex) &&
        variantIndex >= 0 &&
        variantIndex <
          product.variants.length
      ) {
        variant =
          product.variants[
            variantIndex
          ];
      }
    }

    if (!variant) {
      variant =
        product.variants.find(
          (productVariant) =>
            productVariant.color.en ===
              colorKey ||
            productVariant.color.de ===
              colorKey ||
            productVariant.color.ar ===
              colorKey
        );
    }

    if (!variant) {
      return {
        ...item,
        colorName: null,
      };
    }

    return {
      ...item,
      colorName: {
        en: variant.color.en,
        de: variant.color.de,
        ar: variant.color.ar,
      },
    };
  } catch (error) {
    console.error(
      "Failed to resolve order item color:",
      {
        productId,
        colorKey,
        error,
      }
    );

    return {
      ...item,
      colorName: null,
    };
  }
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session =
      await getAdminSession(request);

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Admin access required.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const order =
      database
        .prepare(
          `
            SELECT
              id,
              status,
              payment_status,
              items_json,
              shipping_json,
              subtotal,
              shipping_cost,
              total,
              created_at,
              tracking_number,
              voucher_id,
              voucher_code,
              voucher_type,
              discount_amount,
              free_delivery
            FROM orders
            WHERE id = ?
            LIMIT 1
          `
        )
        .get(id) as
      | {
          id: string;
          status: string;
          payment_status: string;
          items_json: string;
          shipping_json: string;
          subtotal: number;
          shipping_cost: number;
          total: number;
          created_at: string;
          tracking_number: string | null;
          voucher_id: string | null;
          voucher_code: string | null;
          voucher_type: string | null;
          discount_amount: number;
          free_delivery: number;
        }
      | undefined;

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        { status: 404 }
      );
    }

    const parsedItems =
      JSON.parse(
        order.items_json
      ) as unknown;

    const items: OrderItem[] =
      Array.isArray(parsedItems)
        ? parsedItems.map(
            (item) =>
              resolveOrderItemColor(
                item as OrderItem
              )
          )
        : [];

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        paymentStatus:
          order.payment_status,
        items,
        shipping: JSON.parse(
          order.shipping_json
        ),
        subtotal: order.subtotal,
        discountAmount:
          order.discount_amount ?? 0,
        voucherCode:
          order.voucher_code ?? null,
        voucherType:
          order.voucher_type ?? null,
        freeDelivery:
          Boolean(
            order.free_delivery
          ),
        shippingCost:
          order.shipping_cost,
        total: order.total,
        createdAt:
          order.created_at,
        trackingNumber:
          order.tracking_number ??
          null,
      },
    });
  } catch (error) {
    console.error(
      "Admin get order details error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load the order.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session =
      await getAdminSession(request);

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Admin access required.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const body =
      (await request.json()) as {
        status?: string;
        trackingNumber?: string | null;
      };

    const requestedStatus =
      body.status?.trim();

    const hasTrackingUpdate =
      Object.prototype.hasOwnProperty.call(
        body,
        "trackingNumber"
      );

    const normalizedTrackingNumber =
      typeof body.trackingNumber ===
        "string"
        ? body.trackingNumber.trim()
        : body.trackingNumber === null
          ? null
          : undefined;

    if (
      !requestedStatus &&
      !hasTrackingUpdate
    ) {
      return NextResponse.json(
        {
          error:
            "A status or tracking number update is required.",
        },
        { status: 400 }
      );
    }

    if (
      requestedStatus &&
      !isValidStatus(
        requestedStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid order status.",
        },
        { status: 400 }
      );
    }

    if (
      hasTrackingUpdate &&
      normalizedTrackingNumber !==
        null &&
      normalizedTrackingNumber !==
        undefined &&
      normalizedTrackingNumber.length >
        100
    ) {
      return NextResponse.json(
        {
          error:
            "Tracking number is too long.",
        },
        { status: 400 }
      );
    }

    const order =
      database
        .prepare(
          `
            SELECT
              id,
              status,
              payment_status,
              tracking_number,
              shipping_json
            FROM orders
            WHERE id = ?
            LIMIT 1
          `
        )
        .get(id) as
      | OrderRow
      | undefined;

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        { status: 404 }
      );
    }

    const currentStatus =
      order.status as OrderStatus;

    const newStatus =
      requestedStatus ??
      currentStatus;

    const statusChanged =
      newStatus !==
      currentStatus;

    const finalTrackingNumber =
      hasTrackingUpdate
        ? normalizedTrackingNumber ??
          null
        : order.tracking_number ??
          null;

    const trackingChanged =
      finalTrackingNumber !==
      (order.tracking_number ??
        null);

    if (
      !statusChanged &&
      !trackingChanged
    ) {
      return NextResponse.json({
        success: true,
        statusChanged: false,
        trackingChanged: false,
        emailSent: false,
        order: {
          id: order.id,
          status:
            currentStatus,
          paymentStatus:
            order.payment_status,
          trackingNumber:
            order.tracking_number ??
            null,
        },
      });
    }

    if (
      newStatus === "shipped" &&
      !finalTrackingNumber
    ) {
      return NextResponse.json(
        {
          error:
            "A tracking number is required when an order is shipped.",
        },
        { status: 400 }
      );
    }

    if (
      statusChanged &&
      newStatus ===
        "processing" &&
      order.payment_status !==
        "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "This order cannot be moved to processing until the payment is confirmed.",
        },
        { status: 409 }
      );
    }

    if (
      statusChanged &&
      newStatus ===
        "cancelled"
    ) {
      if (
        currentStatus ===
          "shipped" ||
        currentStatus ===
          "delivered"
      ) {
        return NextResponse.json(
          {
            error:
              "This order cannot be cancelled after it has been shipped or delivered.",
          },
          { status: 409 }
        );
      }
    }

    if (
      statusChanged &&
      trackingChanged
    ) {
      database
        .prepare(
          `
            UPDATE orders
            SET
              status = ?,
              tracking_number = ?
            WHERE id = ?
              AND status = ?
          `
        )
        .run(
          newStatus,
          finalTrackingNumber,
          id,
          currentStatus
        );
    } else if (statusChanged) {
      database
        .prepare(
          `
            UPDATE orders
            SET
              status = ?
            WHERE id = ?
              AND status = ?
          `
        )
        .run(
          newStatus,
          id,
          currentStatus
        );
    } else {
      database
        .prepare(
          `
            UPDATE orders
            SET
              tracking_number = ?
            WHERE id = ?
          `
        )
        .run(
          finalTrackingNumber,
          id
        );
    }

    const updatedOrder =
      database
        .prepare(
          `
            SELECT
              id,
              status,
              payment_status,
              tracking_number,
              shipping_json
            FROM orders
            WHERE id = ?
            LIMIT 1
          `
        )
        .get(id) as
      | OrderRow
      | undefined;

    if (!updatedOrder) {
      return NextResponse.json(
        {
          error:
            "Order could not be updated.",
        },
        { status: 500 }
      );
    }

    if (
      statusChanged &&
      updatedOrder.status !==
        newStatus
    ) {
      return NextResponse.json(
        {
          error:
            "The order status changed before this update could be completed.",
        },
        { status: 409 }
      );
    }

    let emailSent = false;
    let emailWarning: string | null =
      null;

    if (
      statusChanged &&
      newStatus === "shipped" &&
      updatedOrder.tracking_number
    ) {
      try {
        const emailResult =
          await sendStatusChangeEmail(
            updatedOrder,
            newStatus as OrderStatus,
            updatedOrder.tracking_number ??
              null
          );

        emailSent =
          emailResult.sent;

        if (!emailResult.sent) {
          emailWarning =
            emailResult.reason ??
            "The status was updated, but the customer email could not be sent.";
        }
      } catch (emailError) {
        console.error(
          "Admin order status email error:",
          emailError
        );

        emailWarning =
          "The order status was updated, but the customer email could not be sent.";
      }
    }

    return NextResponse.json({
      success: true,
      statusChanged,
      trackingChanged,
      emailSent,
      ...(emailWarning
        ? {
            warning:
              emailWarning,
          }
        : {}),
      previousStatus:
        currentStatus,
      order: {
        id:
          updatedOrder.id,
        status:
          updatedOrder.status,
        paymentStatus:
          updatedOrder.payment_status,
        trackingNumber:
          updatedOrder.tracking_number ??
          null,
      },
    });
  } catch (error) {
    console.error(
      "Admin update order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to update the order.",
      },
      { status: 500 }
    );
  }
}

/*
 * -------------------------------------------------------------
 * DELETE ORDER
 * -------------------------------------------------------------
 *
 * Admin can delete:
 *
 * 1. pending_payment + unpaid
 * 2. any cancelled order
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const session =
      await getAdminSession(request);

    if (!session) {
      return NextResponse.json(
        {
          error:
            "Admin access required.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const order =
      database
        .prepare(
          `
            SELECT
              id,
              status,
              payment_status
            FROM orders
            WHERE id = ?
            LIMIT 1
          `
        )
        .get(id) as
      | {
          id: string;
          status: string;
          payment_status: string;
        }
      | undefined;

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        { status: 404 }
      );
    }

    const canDelete =
      order.status ===
        "cancelled" ||
      (
        order.status ===
          "pending_payment" &&
        order.payment_status ===
          "pending"
      );

    if (!canDelete) {
      return NextResponse.json(
        {
          error:
            "This order cannot be deleted. Only cancelled orders or unpaid pending-payment orders can be deleted.",
        },
        { status: 409 }
      );
    }

    const result =
      database
        .prepare(
          `
            DELETE FROM orders
            WHERE id = ?
          `
        )
        .run(id);

    if (
      Number(result.changes) !== 1
    ) {
      return NextResponse.json(
        {
          error:
            "The order could not be deleted.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: id,
    });
  } catch (error) {
    console.error(
      "Admin delete order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to delete the order.",
      },
      { status: 500 }
    );
  }
}