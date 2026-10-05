import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";

import { auth } from "@/lib/auth";
import { getProductById } from "@/lib/product-db";

const database = new DatabaseSync(
  "database.sqlite"
);

database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
`);

/*
 * Safe migration for existing databases.
 *
 * The checkout route already creates these columns,
 * but keeping the migration here makes this API safe
 * when it is executed against an older database.
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

type OrderRow = {
  id: string;
  user_id: string | null;
  status: string;
  payment_status: string;
  items_json: string;
  shipping_json: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  voucher_id: string | null;
  voucher_code: string | null;
  voucher_type: string | null;
  discount_amount: number;
  free_delivery: number;
};

type StoredOrderItem = {
  productId?: unknown;
  name?: unknown;
  price?: unknown;
  quantity?: unknown;
  colorKey?: unknown;
  color?: unknown;
  image?: unknown;
  sizeKey?: unknown;
  sizePrice?: unknown;
  customFields?: unknown;
  [key: string]: unknown;
};

type LocalizedColor = {
  en: string;
  de: string;
  ar: string;
};

function isLocalizedColor(
  value: unknown
): value is LocalizedColor {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const color =
    value as Record<string, unknown>;

  return (
    typeof color.en === "string" &&
    typeof color.de === "string" &&
    typeof color.ar === "string"
  );
}

function getLocalizedColor(
  color: LocalizedColor | undefined,
  language: "en" | "de" | "ar"
): string | undefined {
  if (!color) {
    return undefined;
  }

  const selected =
    color[language]?.trim();

  if (selected) {
    return selected;
  }

  const fallback =
    color.en?.trim() ||
    color.de?.trim() ||
    color.ar?.trim();

  return fallback || undefined;
}

/**
 * Resolves the stored colorKey against the current product data.
 *
 * Supports:
 * - variant index
 * - actual variant ID
 * - localized color name
 */
function resolveOrderVariant(
  product: ReturnType<typeof getProductById>,
  colorKey: unknown
) {
  if (
    !product ||
    product.variants.length === 0
  ) {
    return null;
  }

  const normalizedKey =
    String(
      colorKey ?? ""
    ).trim();

  /*
   * A product with exactly one variant
   * is unambiguous.
   */
  if (
    product.variants.length === 1 &&
    !normalizedKey
  ) {
    return product.variants[0];
  }

  if (!normalizedKey) {
    return null;
  }

  /*
   * Compatibility with orders that stored
   * the variant index.
   */
  if (
    /^\d+$/.test(
      normalizedKey
    )
  ) {
    const index =
      Number.parseInt(
        normalizedKey,
        10
      );

    if (
      Number.isInteger(index) &&
      index >= 0 &&
      index <
        product.variants.length
    ) {
      return product.variants[index];
    }
  }

  /*
   * Current checkout stores the actual
   * variant ID.
   */
  const byId =
    product.variants.find(
      (variant) =>
        variant.id ===
        normalizedKey
    );

  if (byId) {
    return byId;
  }

  /*
   * Compatibility with older orders that
   * may have stored the color name.
   */
  const normalizedColor =
    normalizedKey.toLowerCase();

  const byColor =
    product.variants.find(
      (variant) =>
        variant.color.en
          .trim()
          .toLowerCase() ===
          normalizedColor ||
        variant.color.de
          .trim()
          .toLowerCase() ===
          normalizedColor ||
        variant.color.ar
          .trim()
          .toLowerCase() ===
          normalizedColor
    );

  return byColor ?? null;
}

function enrichOrderItems(
  rawItems: unknown
) {
  if (
    !Array.isArray(
      rawItems
    )
  ) {
    return [];
  }

  return rawItems.map(
    (rawItem) => {
      if (
        typeof rawItem !== "object" ||
        rawItem === null
      ) {
        return rawItem;
      }

      const item =
        rawItem as StoredOrderItem;

      const productId =
        typeof item.productId ===
        "string"
          ? item.productId.trim()
          : "";

      if (!productId) {
        return rawItem;
      }

      /*
       * includeInactive=true is intentional.
       *
       * Historical orders must remain viewable even
       * when the product is currently inactive.
       */
      const product =
        getProductById(
          productId,
          {
            includeInactive:
              true,
          }
        );

      if (!product) {
        return rawItem;
      }

      const variant =
        resolveOrderVariant(
          product,
          item.colorKey
        );

      /*
       * Keep the original order snapshot.
       *
       * We only add missing metadata needed for
       * displaying the order correctly.
       */
      const storedColor =
        isLocalizedColor(
          item.color
        )
          ? item.color
          : undefined;

      const resolvedColor =
        storedColor ??
        variant?.color;

      return {
        ...item,

        productSlug:
          product.slug,

        /*
         * New frontend uses this localized object.
         */
        color:
          resolvedColor,

        /*
         * Kept for backwards compatibility.
         * The frontend should prefer `color`.
         */
        colorName:
          variant
            ? getLocalizedColor(
                variant.color,
                "en"
              )
            : undefined,
      };
    }
  );
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session =
      await auth.api.getSession({
        headers:
          request.headers,
      });

    if (
      !session?.user?.id
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    if (
      !id ||
      id.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const order =
      database
        .prepare(
          `
          SELECT
            id,
            user_id,
            status,
            payment_status,
            items_json,
            shipping_json,
            subtotal,
            shipping_cost,
            total,
            created_at,
            voucher_id,
            voucher_code,
            voucher_type,
            discount_amount,
            free_delivery
          FROM orders
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `
        )
        .get(
          id,
          session.user.id
        ) as
        | OrderRow
        | undefined;

    /*
     * Security rule:
     *
     * The query checks both:
     * - order ID
     * - authenticated user ID
     */
    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    let rawItems: unknown =
      [];

    try {
      rawItems =
        JSON.parse(
          order.items_json
        );
    } catch {
      rawItems = [];
    }

    const items =
      enrichOrderItems(
        rawItems
      );

    let shipping: ShippingDataSafe =
      {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        apartment: "",
        postalCode: "",
        city: "",
        country: "Germany",
      };

    try {
      const parsedShipping =
        JSON.parse(
          order.shipping_json
        );

      if (
        parsedShipping &&
        typeof parsedShipping ===
          "object"
      ) {
        shipping =
          {
            ...shipping,
            ...parsedShipping,
          };
      }
    } catch {
      // Keep the safe default object.
    }

    return NextResponse.json({
      order: {
        id:
          order.id,

        status:
          order.status,

        paymentStatus:
          order.payment_status,

        items,

        shipping,

        subtotal:
          order.subtotal,

        /*
         * These values are read directly from
         * the saved order record.
         *
         * No discount or total is recalculated
         * on the customer side.
         */
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

        total:
          order.total,

        createdAt:
          order.created_at,
      },
    });
  } catch (error) {
    console.error(
      "Get order details error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load the order.",
      },
      {
        status: 500,
      }
    );
  }
}

type ShippingDataSafe = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  postalCode: string;
  city: string;
  country: string;
};

/**
 * Customer cancellation policy:
 *
 * A customer can cancel an order ONLY when:
 *
 * - status = pending_payment
 * - payment_status = pending
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session =
      await auth.api.getSession({
        headers:
          request.headers,
      });

    if (
      !session?.user?.id
    ) {
      return NextResponse.json(
        {
          error:
            "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await params;

    if (
      !id ||
      id.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Order ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const order =
      database
        .prepare(
          `
          SELECT
            id,
            user_id,
            status,
            payment_status
          FROM orders
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `
        )
        .get(
          id,
          session.user.id
        ) as
        | {
            id: string;
            user_id:
              | string
              | null;
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
        {
          status: 404,
        }
      );
    }

    if (
      order.status !==
        "pending_payment" ||
      order.payment_status !==
        "pending"
    ) {
      return NextResponse.json(
        {
          error:
            "This order can no longer be cancelled.",
        },
        {
          status: 409,
        }
      );
    }

    const result =
      database
        .prepare(
          `
          UPDATE orders
          SET status = 'cancelled'
          WHERE id = ?
            AND user_id = ?
            AND status = 'pending_payment'
            AND payment_status = 'pending'
        `
        )
        .run(
          id,
          session.user.id
        );

    /*
     * The conditional UPDATE protects against
     * race conditions.
     */
    if (
      Number(
        result.changes
      ) !== 1
    ) {
      return NextResponse.json(
        {
          error:
            "This order can no longer be cancelled.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      success: true,

      order: {
        id:
          order.id,

        status:
          "cancelled",

        paymentStatus:
          order.payment_status,
      },
    });
  } catch (error) {
    console.error(
      "Cancel order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to cancel the order.",
      },
      {
        status: 500,
      }
    );
  }
}