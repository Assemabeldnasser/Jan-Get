import { NextResponse } from "next/server";
import Stripe from "stripe";
import { DatabaseSync } from "node:sqlite";
import { Resend } from "resend";

import { stripe } from "@/lib/stripe";
import { getProductById } from "@/lib/product-db";

const database = new DatabaseSync("database.sqlite");

database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    items_json TEXT NOT NULL,
    shipping_json TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping_cost REAL NOT NULL,
    total REAL NOT NULL,
    created_at TEXT NOT NULL,

    payment_confirmation_sent INTEGER NOT NULL DEFAULT 0,

    voucher_id TEXT,
    voucher_code TEXT,
    voucher_type TEXT,
    discount_amount REAL NOT NULL DEFAULT 0,
    free_delivery INTEGER NOT NULL DEFAULT 0,
    voucher_usage_recorded INTEGER NOT NULL DEFAULT 0,

    stock_processed INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS webhook_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    value REAL,
    minimum_subtotal REAL,
    max_discount REAL,
    active INTEGER NOT NULL DEFAULT 1,
    valid_from TEXT,
    valid_until TEXT,
    usage_limit INTEGER,
    usage_limit_per_user INTEGER NOT NULL DEFAULT 1,
    total_usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS voucher_usages (
    id TEXT PRIMARY KEY,
    voucher_id TEXT NOT NULL,
    user_key TEXT NOT NULL,
    order_id TEXT NOT NULL UNIQUE,
    used_at TEXT NOT NULL,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
  );

  CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher_id
    ON voucher_usages(voucher_id);

  CREATE INDEX IF NOT EXISTS idx_voucher_usages_user_key
    ON voucher_usages(user_key);

  CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher_user
    ON voucher_usages(voucher_id, user_key);
`);

/*
 * --------------------------------------------------
 * SAFE DATABASE MIGRATIONS
 * --------------------------------------------------
 */

function ensureColumn(
  tableName: string,
  columnName: string,
  definition: string
) {
  const columns = database
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{
    name: string;
  }>;

  if (
    columns.some(
      (column) => column.name === columnName
    )
  ) {
    return;
  }

  database.exec(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
  );
}

ensureColumn(
  "orders",
  "payment_confirmation_sent",
  "INTEGER NOT NULL DEFAULT 0"
);

ensureColumn(
  "orders",
  "voucher_id",
  "TEXT"
);

ensureColumn(
  "orders",
  "voucher_code",
  "TEXT"
);

ensureColumn(
  "orders",
  "voucher_type",
  "TEXT"
);

ensureColumn(
  "orders",
  "discount_amount",
  "REAL NOT NULL DEFAULT 0"
);

ensureColumn(
  "orders",
  "free_delivery",
  "INTEGER NOT NULL DEFAULT 0"
);

ensureColumn(
  "orders",
  "voucher_usage_recorded",
  "INTEGER NOT NULL DEFAULT 0"
);

ensureColumn(
  "orders",
  "stock_processed",
  "INTEGER NOT NULL DEFAULT 0"
);

/*
 * Make sure the vouchers table exists even when
 * the checkout route has not been executed yet.
 */

database.exec(`
  CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    value REAL,
    minimum_subtotal REAL,
    max_discount REAL,
    active INTEGER NOT NULL DEFAULT 1,
    valid_from TEXT,
    valid_until TEXT,
    usage_limit INTEGER,
    usage_limit_per_user INTEGER NOT NULL DEFAULT 1,
    total_usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

ensureColumn(
  "vouchers",
  "minimum_subtotal",
  "REAL"
);

ensureColumn(
  "vouchers",
  "max_discount",
  "REAL"
);

ensureColumn(
  "vouchers",
  "valid_from",
  "TEXT"
);

ensureColumn(
  "vouchers",
  "valid_until",
  "TEXT"
);

ensureColumn(
  "vouchers",
  "usage_limit",
  "INTEGER"
);

ensureColumn(
  "vouchers",
  "usage_limit_per_user",
  "INTEGER NOT NULL DEFAULT 1"
);

ensureColumn(
  "vouchers",
  "total_usage_limit",
  "INTEGER"
);

ensureColumn(
  "vouchers",
  "used_count",
  "INTEGER NOT NULL DEFAULT 0"
);

/*
 * --------------------------------------------------
 * LEGACY VOUCHER USAGE LIMIT MIGRATION
 * --------------------------------------------------
 */

database.exec(`
  UPDATE vouchers
  SET
    total_usage_limit = usage_limit,
    usage_limit = NULL
  WHERE
    total_usage_limit IS NULL
    AND usage_limit IS NOT NULL;
`);

database.exec(`
  UPDATE vouchers
  SET usage_limit_per_user = 1
  WHERE
    usage_limit_per_user IS NULL
    OR usage_limit_per_user <= 0;
`);

/*
 * --------------------------------------------------
 * VOUCHER USAGE TABLE
 * --------------------------------------------------
 */

database.exec(`
  CREATE TABLE IF NOT EXISTS voucher_usages (
    id TEXT PRIMARY KEY,
    voucher_id TEXT NOT NULL,
    user_key TEXT NOT NULL,
    order_id TEXT NOT NULL UNIQUE,
    used_at TEXT NOT NULL,
    FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
  );

  CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher_id
    ON voucher_usages(voucher_id);

  CREATE INDEX IF NOT EXISTS idx_voucher_usages_user_key
    ON voucher_usages(user_key);

  CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher_user
    ON voucher_usages(voucher_id, user_key);
`);

const resend = new Resend(
  process.env.RESEND_API_KEY
);

const fromEmail =
  process.env.RESEND_FROM_EMAIL ||
  "JAN-GET <onboarding@resend.dev>";

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

  payment_confirmation_sent: number;

  voucher_id: string | null;
  voucher_code: string | null;
  voucher_type: string | null;
  discount_amount: number;
  free_delivery: number;
  voucher_usage_recorded: number;

  stock_processed: number;
};

type DiscountLevel =
  | "basic"
  | "color"
  | "size"
  | null;

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  colorKey: string;

  /*
   * Selected size.
   *
   * Required for size-level discount consumption.
   *
   * Old orders may not contain this field.
   */
  sizeKey?:
    | "small"
    | "medium"
    | "large"
    | "";

  image: string;

  /*
   * Product discount snapshot.
   *
   * These fields are written by the checkout route.
   *
   * Old orders may not contain them, therefore the
   * webhook treats them as optional.
   */
  originalPrice?: number;
  discountApplied?: boolean;
  discountLevel?: DiscountLevel;
};

type ShippingData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  postalCode: string;
  city: string;
  country: string;
};

type StockFailure = {
  available: false;
  reason:
    | "PRODUCT_NOT_AVAILABLE"
    | "PRODUCT_OUT_OF_STOCK"
    | "VARIANT_NOT_AVAILABLE"
    | "VARIANT_OUT_OF_STOCK"
    | "INSUFFICIENT_PRODUCT_STOCK"
    | "INSUFFICIENT_VARIANT_STOCK";
  productId: string;
  variantId?: string;
};

type StockSuccess = {
  available: true;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function toCents(value: number) {
  return Math.round(
    (value + Number.EPSILON) * 100
  );
}

function getLanguageFromShipping(
  shipping: ShippingData
): "en" | "de" | "ar" {
  const language = (
    shipping as ShippingData & {
      language?: string;
    }
  ).language;

  if (language === "de") {
    return "de";
  }

  if (language === "ar") {
    return "ar";
  }

  return "en";
}

/*
 * --------------------------------------------------
 * STRIPE SESSION / ORDER VALIDATION
 * --------------------------------------------------
 */

function assertStripeSessionMatchesOrder(
  order: OrderRow,
  session: Stripe.Checkout.Session,
  expectedOrderId: string
) {
  const metadataOrderId =
    session.metadata?.orderId;

  const clientReferenceOrderId =
    session.client_reference_id;

  if (
    !metadataOrderId &&
    !clientReferenceOrderId
  ) {
    throw new Error(
      `STRIPE_ORDER_ID_MISSING:${expectedOrderId}`
    );
  }

  if (
    metadataOrderId &&
    metadataOrderId !== expectedOrderId
  ) {
    throw new Error(
      `STRIPE_ORDER_ID_MISMATCH:${expectedOrderId}:metadata=${metadataOrderId}`
    );
  }

  if (
    clientReferenceOrderId &&
    clientReferenceOrderId !== expectedOrderId
  ) {
    throw new Error(
      `STRIPE_CLIENT_REFERENCE_MISMATCH:${expectedOrderId}:reference=${clientReferenceOrderId}`
    );
  }

  const expectedAmount = toCents(order.total);

  const actualAmount = session.amount_total;

  if (
    actualAmount === null ||
    actualAmount === undefined
  ) {
    throw new Error(
      `PAYMENT_AMOUNT_MISSING:${order.id}`
    );
  }

  if (actualAmount !== expectedAmount) {
    throw new Error(
      `PAYMENT_AMOUNT_MISMATCH:${order.id}:expected=${expectedAmount}:actual=${actualAmount}`
    );
  }

  if (!session.currency) {
    throw new Error(
      `PAYMENT_CURRENCY_MISSING:${order.id}`
    );
  }

  if (
    session.currency.toLowerCase() !== "eur"
  ) {
    throw new Error(
      `PAYMENT_CURRENCY_MISMATCH:${order.id}:expected=eur:actual=${session.currency}`
    );
  }
}

/*
 * --------------------------------------------------
 * STOCK AVAILABILITY CHECK
 * --------------------------------------------------
 */

function getOrderAvailability(
  items: OrderItem[]
):
  | StockSuccess
  | StockFailure {
  for (const item of items) {
    const product = getProductById(
      item.productId,
      {
        includeInactive: true,
      }
    );

    if (
      !product ||
      !product.active
    ) {
      return {
        available: false,
        reason:
          "PRODUCT_NOT_AVAILABLE",
        productId: item.productId,
        variantId: item.colorKey,
      };
    }

    if (!product.inStock) {
      return {
        available: false,
        reason:
          "PRODUCT_OUT_OF_STOCK",
        productId: item.productId,
        variantId: item.colorKey,
      };
    }

    /*
     * Product without variants.
     */

    if (product.variants.length === 0) {
      if (product.stock === null) {
        continue;
      }

      if (product.stock <= 0) {
        return {
          available: false,
          reason:
            "PRODUCT_OUT_OF_STOCK",
          productId: item.productId,
        };
      }

      if (item.quantity > product.stock) {
        return {
          available: false,
          reason:
            "INSUFFICIENT_PRODUCT_STOCK",
          productId: item.productId,
        };
      }

      continue;
    }

    /*
     * Product with variants.
     */

    const variant =
      product.variants.find(
        (candidate) =>
          candidate.id === item.colorKey
      );

    if (
      !variant ||
      !variant.active
    ) {
      return {
        available: false,
        reason:
          "VARIANT_NOT_AVAILABLE",
        productId: item.productId,
        variantId: item.colorKey,
      };
    }

    if (!variant.inStock) {
      return {
        available: false,
        reason:
          "VARIANT_OUT_OF_STOCK",
        productId: item.productId,
        variantId: item.colorKey,
      };
    }

    if (variant.stock === null) {
      continue;
    }

    if (variant.stock <= 0) {
      return {
        available: false,
        reason:
          "VARIANT_OUT_OF_STOCK",
        productId: item.productId,
        variantId: item.colorKey,
      };
    }

    if (item.quantity > variant.stock) {
      return {
        available: false,
        reason:
          "INSUFFICIENT_VARIANT_STOCK",
        productId: item.productId,
        variantId: item.colorKey,
      };
    }
  }

  return {
    available: true,
  };
}

/*
 * --------------------------------------------------
 * ATOMIC STOCK DECREMENT
 * --------------------------------------------------
 */

function decrementOrderStockWithinTransaction(
  items: OrderItem[]
) {
  for (const item of items) {
    const product = getProductById(
      item.productId,
      {
        includeInactive: true,
      }
    );

    if (
      !product ||
      !product.active ||
      !product.inStock
    ) {
      throw new Error(
        `PRODUCT_NOT_AVAILABLE:${item.productId}`
      );
    }

    /*
     * --------------------------------------------------
     * PRODUCT WITHOUT VARIANTS
     * --------------------------------------------------
     */

    if (product.variants.length === 0) {
      if (product.stock === null) {
        continue;
      }

      const result = database
        .prepare(
          `
            UPDATE products
            SET
              stock = stock - ?,
              in_stock = CASE
                WHEN stock - ? <= 0
                THEN 0
                ELSE 1
              END
            WHERE id = ?
              AND active = 1
              AND in_stock = 1
              AND stock >= ?
          `
        )
        .run(
          item.quantity,
          item.quantity,
          item.productId,
          item.quantity
        );

      if (result.changes !== 1) {
        throw new Error(
          `INSUFFICIENT_PRODUCT_STOCK:${item.productId}`
        );
      }

      continue;
    }

    /*
     * --------------------------------------------------
     * PRODUCT WITH VARIANTS
     * --------------------------------------------------
     */

    const variant =
      product.variants.find(
        (candidate) =>
          candidate.id === item.colorKey
      );

    if (
      !variant ||
      !variant.active ||
      !variant.inStock
    ) {
      throw new Error(
        `VARIANT_NOT_AVAILABLE:${item.productId}:${item.colorKey}`
      );
    }

    if (variant.stock === null) {
      continue;
    }

    const result = database
      .prepare(
        `
          UPDATE product_variants
          SET
            stock = stock - ?,
            in_stock = CASE
              WHEN stock - ? <= 0
              THEN 0
              ELSE 1
            END
          WHERE id = ?
            AND product_id = ?
            AND active = 1
            AND in_stock = 1
            AND stock >= ?
        `
      )
      .run(
        item.quantity,
        item.quantity,
        item.colorKey,
        item.productId,
        item.quantity
      );

    if (result.changes !== 1) {
      throw new Error(
        `INSUFFICIENT_VARIANT_STOCK:${item.productId}:${item.colorKey}`
      );
    }
  }
}

/*
 * --------------------------------------------------
 * PRODUCT DISCOUNT USAGE
 * --------------------------------------------------
 *
 * Product discounts are consumed ONLY after the
 * payment has succeeded.
 *
 * The checkout route stores:
 *
 *   discountApplied
 *   discountLevel
 *   originalPrice
 *   sizeKey
 *
 * inside the order item snapshot.
 *
 * This function runs inside BEGIN IMMEDIATE, so
 * quantitySold updates are serialized together with
 * stock and voucher consumption.
 *
 * Important:
 *
 * - Basic discount -> products.discount_json
 * - Color discount -> product_variants.discount_json
 * - Size discount -> product_variants.sizes_json
 *
 * A more specific price/discount level is never
 * replaced by a less specific discount.
 *
 * The current discount price must still match the
 * price captured by checkout. If the discount was
 * changed after checkout, the payment is refunded
 * instead of corrupting discount counters.
 *
 * Date activation is intentionally NOT checked here.
 * A discount may naturally expire between checkout
 * and webhook delivery; the customer already paid
 * using the snapshot captured at checkout.
 */

type DiscountConsumption = {
  item: OrderItem;
  quantity: number;
};

function getDiscountConsumptionKey(
  item: OrderItem
) {
  /*
   * A Basic discount belongs to the product itself,
   * not to a specific variant.
   *
   * Therefore colorKey MUST NOT be part of the key
   * for Basic discounts.
   *
   * Color discount belongs to the variant.
   *
   * Size discount belongs to the variant + size.
   */
  if (
    item.discountLevel ===
    "basic"
  ) {
    return [
      item.productId,
      "basic",
    ].join("|");
  }

  if (
    item.discountLevel ===
    "color"
  ) {
    return [
      item.productId,
      "color",
      item.colorKey,
    ].join("|");
  }

  if (
    item.discountLevel ===
    "size"
  ) {
    return [
      item.productId,
      "size",
      item.colorKey,
      item.sizeKey ?? "",
    ].join("|");
  }

  return [
    item.productId,
    "",
    item.colorKey,
    "",
  ].join("|");
}

function assertDiscountPriceMatchesSnapshot(
  item: OrderItem,
  currentDiscountPrice: number,
  currentOriginalPrice: number,
  context: string
) {
  if (
    !Number.isFinite(
      currentDiscountPrice
    ) ||
    !Number.isFinite(
      currentOriginalPrice
    )
  ) {
    throw new Error(
      `DISCOUNT_PRICE_INVALID:${context}`
    );
  }

  if (
    toCents(currentDiscountPrice) !==
    toCents(item.price)
  ) {
    throw new Error(
      `DISCOUNT_PRICE_CHANGED:${context}:checkout=${item.price}:current=${currentDiscountPrice}`
    );
  }

  if (
    item.originalPrice !==
      undefined &&
    Number.isFinite(
      item.originalPrice
    ) &&
    toCents(
      currentOriginalPrice
    ) !==
      toCents(
        item.originalPrice
      )
  ) {
    throw new Error(
      `DISCOUNT_ORIGINAL_PRICE_CHANGED:${context}:checkout=${item.originalPrice}:current=${currentOriginalPrice}`
    );
  }
}

function consumeProductDiscountGroupWithinTransaction(
  consumption: DiscountConsumption
) {
  const item = consumption.item;
  const quantity =
    consumption.quantity;

  if (
    item.discountApplied !== true ||
    !item.discountLevel
  ) {
    return;
  }

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    throw new Error(
      `INVALID_DISCOUNT_QUANTITY:${item.productId}`
    );
  }

  const product = getProductById(
    item.productId,
    {
      includeInactive: true,
    }
  );

  if (!product) {
    throw new Error(
      `PRODUCT_NOT_FOUND_FOR_DISCOUNT:${item.productId}`
    );
  }

  /*
   * --------------------------------------------------
   * BASIC PRODUCT DISCOUNT
   * --------------------------------------------------
   */

  if (
    item.discountLevel ===
    "basic"
  ) {
    const discount =
      product.discount;

    if (!discount) {
      throw new Error(
        `BASIC_DISCOUNT_NOT_FOUND:${item.productId}`
      );
    }

    assertDiscountPriceMatchesSnapshot(
      item,
      discount.price,
      product.price,
      `basic:${item.productId}`
    );

    if (
      !Number.isFinite(
        discount.quantitySold
      ) ||
      discount.quantitySold < 0
    ) {
      throw new Error(
        `BASIC_DISCOUNT_QUANTITY_INVALID:${item.productId}`
      );
    }

    const newQuantitySold =
      discount.quantitySold +
      quantity;

    if (
      discount.quantityLimit !== null &&
      newQuantitySold >
        discount.quantityLimit
    ) {
      throw new Error(
        `BASIC_DISCOUNT_QUANTITY_LIMIT_REACHED:${item.productId}`
      );
    }

    const updatedDiscount = {
      ...discount,
      quantitySold:
        newQuantitySold,
    };

    const result =
      database
        .prepare(
          `
            UPDATE products
            SET discount_json = ?
            WHERE id = ?
          `
        )
        .run(
          JSON.stringify(
            updatedDiscount
          ),
          item.productId
        );

    if (result.changes !== 1) {
      throw new Error(
        `BASIC_DISCOUNT_UPDATE_FAILED:${item.productId}`
      );
    }

    return;
  }

  /*
   * --------------------------------------------------
   * FIND VARIANT
   * --------------------------------------------------
   */

  const variant =
    product.variants.find(
      (candidate) =>
        candidate.id ===
        item.colorKey
    );

  if (!variant) {
    throw new Error(
      `VARIANT_NOT_FOUND_FOR_DISCOUNT:${item.productId}:${item.colorKey}`
    );
  }

  /*
   * --------------------------------------------------
   * COLOR DISCOUNT
   * --------------------------------------------------
   */

  if (
    item.discountLevel ===
    "color"
  ) {
    const discount =
      variant.discount;

    if (!discount) {
      throw new Error(
        `COLOR_DISCOUNT_NOT_FOUND:${item.productId}:${variant.id}`
      );
    }

    if (variant.price === null) {
      throw new Error(
        `COLOR_DISCOUNT_DIRECT_PRICE_MISSING:${item.productId}:${variant.id}`
      );
    }

    assertDiscountPriceMatchesSnapshot(
      item,
      discount.price,
      variant.price,
      `color:${item.productId}:${variant.id}`
    );

    if (
      !Number.isFinite(
        discount.quantitySold
      ) ||
      discount.quantitySold < 0
    ) {
      throw new Error(
        `COLOR_DISCOUNT_QUANTITY_INVALID:${item.productId}:${variant.id}`
      );
    }

    const newQuantitySold =
      discount.quantitySold +
      quantity;

    if (
      discount.quantityLimit !== null &&
      newQuantitySold >
        discount.quantityLimit
    ) {
      throw new Error(
        `COLOR_DISCOUNT_QUANTITY_LIMIT_REACHED:${item.productId}:${variant.id}`
      );
    }

    const updatedDiscount = {
      ...discount,
      quantitySold:
        newQuantitySold,
    };

    const result =
      database
        .prepare(
          `
            UPDATE product_variants
            SET discount_json = ?
            WHERE id = ?
              AND product_id = ?
          `
        )
        .run(
          JSON.stringify(
            updatedDiscount
          ),
          variant.id,
          item.productId
        );

    if (result.changes !== 1) {
      throw new Error(
        `COLOR_DISCOUNT_UPDATE_FAILED:${item.productId}:${variant.id}`
      );
    }

    return;
  }

  /*
   * --------------------------------------------------
   * SIZE DISCOUNT
   * --------------------------------------------------
   */

  if (
    item.discountLevel ===
    "size"
  ) {
    const actualSizeKey =
      item.sizeKey;

    if (
      !actualSizeKey
    ) {
      throw new Error(
        `SIZE_KEY_MISSING_FOR_DISCOUNT:${item.productId}:${variant.id}`
      );
    }

    const size =
      (variant.sizes ?? []).find(
        (candidate) =>
          candidate.key ===
          actualSizeKey
      );

    if (!size) {
      throw new Error(
        `SIZE_NOT_FOUND_FOR_DISCOUNT:${item.productId}:${variant.id}:${actualSizeKey}`
      );
    }

    if (size.price === null) {
      throw new Error(
        `SIZE_DISCOUNT_DIRECT_PRICE_MISSING:${item.productId}:${variant.id}:${actualSizeKey}`
      );
    }

    const discount =
      size.discount;

    if (!discount) {
      throw new Error(
        `SIZE_DISCOUNT_NOT_FOUND:${item.productId}:${variant.id}:${actualSizeKey}`
      );
    }

    assertDiscountPriceMatchesSnapshot(
      item,
      discount.price,
      size.price,
      `size:${item.productId}:${variant.id}:${actualSizeKey}`
    );

    if (
      !Number.isFinite(
        discount.quantitySold
      ) ||
      discount.quantitySold < 0
    ) {
      throw new Error(
        `SIZE_DISCOUNT_QUANTITY_INVALID:${item.productId}:${variant.id}:${actualSizeKey}`
      );
    }

    const newQuantitySold =
      discount.quantitySold +
      quantity;

    if (
      discount.quantityLimit !== null &&
      newQuantitySold >
        discount.quantityLimit
    ) {
      throw new Error(
        `SIZE_DISCOUNT_QUANTITY_LIMIT_REACHED:${item.productId}:${variant.id}:${actualSizeKey}`
      );
    }

    const updatedSizes =
      (variant.sizes ?? []).map(
        (candidate) => {
          if (
            candidate.key !==
            actualSizeKey
          ) {
            return candidate;
          }

          return {
            ...candidate,
            discount: {
              ...discount,
              quantitySold:
                newQuantitySold,
            },
          };
        }
      );

    const result =
      database
        .prepare(
          `
            UPDATE product_variants
            SET sizes_json = ?
            WHERE id = ?
              AND product_id = ?
          `
        )
        .run(
          JSON.stringify(
            updatedSizes
          ),
          variant.id,
          item.productId
        );

    if (result.changes !== 1) {
      throw new Error(
        `SIZE_DISCOUNT_UPDATE_FAILED:${item.productId}:${variant.id}:${actualSizeKey}`
      );
    }

    return;
  }

  throw new Error(
    `UNKNOWN_DISCOUNT_LEVEL:${item.productId}`
  );
}

/*
 * --------------------------------------------------
 * PRODUCT DISCOUNT CONSUMPTION
 * --------------------------------------------------
 *
 * Duplicate cart/order lines can refer to the same
 * discount. Aggregate them first so quantitySold is
 * increased exactly once per discount target.
 *
 * This is especially important for quantity-limited
 * discounts.
 */

function consumeOrderProductDiscountsWithinTransaction(
  items: OrderItem[]
) {
  const grouped =
    new Map<
      string,
      DiscountConsumption
    >();

  for (const item of items) {
    if (
      item.discountApplied !== true ||
      !item.discountLevel
    ) {
      continue;
    }

    if (
      !Number.isInteger(
        item.quantity
      ) ||
      item.quantity <= 0
    ) {
      throw new Error(
        `INVALID_DISCOUNT_QUANTITY:${item.productId}`
      );
    }

    const key =
      getDiscountConsumptionKey(
        item
      );

    const existing =
      grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        item,
        quantity:
          item.quantity,
      });

      continue;
    }

    if (
      toCents(
        existing.item.price
      ) !==
      toCents(item.price)
    ) {
      throw new Error(
        `DISCOUNT_SNAPSHOT_PRICE_MISMATCH:${key}`
      );
    }

    if (
      existing.item.originalPrice !==
        undefined &&
      item.originalPrice !==
        undefined &&
      toCents(
        existing.item.originalPrice
      ) !==
      toCents(
        item.originalPrice
      )
    ) {
      throw new Error(
        `DISCOUNT_SNAPSHOT_ORIGINAL_PRICE_MISMATCH:${key}`
      );
    }

    existing.quantity +=
      item.quantity;
  }

  for (const consumption of grouped.values()) {
    consumeProductDiscountGroupWithinTransaction(
      consumption
    );
  }
}

/*
 * --------------------------------------------------
 * REFUND
 * --------------------------------------------------
 */

async function refundOrder(
  orderId: string,
  session: Stripe.Checkout.Session,
  reason: string
) {
  const paymentIntent =
    session.payment_intent;

  if (!paymentIntent) {
    throw new Error(
      `Paid Stripe session ${session.id} has no payment intent. Unable to refund order ${orderId}.`
    );
  }

  const paymentIntentId =
    typeof paymentIntent === "string"
      ? paymentIntent
      : paymentIntent.id;

  const refund =
    await stripe.refunds.create(
      {
        payment_intent:
          paymentIntentId,
      },
      {
        idempotencyKey:
          `jan-get-refund-${orderId}`,
      }
    );

  database
    .prepare(
      `
        UPDATE orders
        SET
          status = ?,
          payment_status = ?
        WHERE id = ?
          AND payment_status != ?
      `
    )
    .run(
      "cancelled",
      "refunded",
      orderId,
      "refunded"
    );

  console.log(
    `Order ${orderId} refunded. Reason: ${reason}. Refund: ${refund.id}`
  );

  return refund;
}

/*
 * --------------------------------------------------
 * VOUCHER USAGE
 * --------------------------------------------------
 */

function consumeVoucherUsageWithinTransaction(
  voucherId: string,
  order: OrderRow
) {
  let shipping: ShippingData;

  try {
    shipping =
      JSON.parse(
        order.shipping_json
      ) as ShippingData;
  } catch {
    throw new Error(
      `VOUCHER_SHIPPING_DATA_INVALID:${order.id}`
    );
  }

  const normalizedUserId =
    order.user_id?.trim() || "";

  const normalizedEmail =
    shipping.email
      ?.trim()
      .toLowerCase() || "";

  const userKey = normalizedUserId
    ? `user:${normalizedUserId}`
    : normalizedEmail
      ? `email:${normalizedEmail}`
      : "";

  if (!userKey) {
    throw new Error(
      `VOUCHER_USER_IDENTITY_MISSING:${order.id}`
    );
  }

  const voucher =
    database
      .prepare(
        `
          SELECT
            id,
            active,
            usage_limit_per_user,
            total_usage_limit,
            used_count
          FROM vouchers
          WHERE id = ?
          LIMIT 1
        `
      )
      .get(voucherId) as
      | {
          id: string;
          active: number;
          usage_limit_per_user:
            | number
            | null;
          total_usage_limit:
            | number
            | null;
          used_count: number;
        }
      | undefined;

  if (!voucher) {
    return false;
  }

  if (voucher.active !== 1) {
    return false;
  }

  const usageLimitPerUser =
    voucher.usage_limit_per_user ===
      null ||
    voucher.usage_limit_per_user ===
      undefined
      ? 1
      : voucher.usage_limit_per_user;

  const totalUsageLimit =
    voucher.total_usage_limit;

  if (
    totalUsageLimit !== null &&
    voucher.used_count >=
      totalUsageLimit
  ) {
    return false;
  }

  const userUsage =
    database
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM voucher_usages
          WHERE voucher_id = ?
            AND user_key = ?
        `
      )
      .get(
        voucherId,
        userKey
      ) as
      | {
          count: number;
        }
      | undefined;

  const userUsageCount =
    userUsage?.count ?? 0;

  if (
    userUsageCount >=
    usageLimitPerUser
  ) {
    return false;
  }

  const updateResult =
    database
      .prepare(
        `
          UPDATE vouchers
          SET
            used_count = used_count + 1,
            updated_at = ?
          WHERE id = ?
            AND active = 1
            AND (
              total_usage_limit IS NULL
              OR used_count < total_usage_limit
            )
        `
      )
      .run(
        new Date().toISOString(),
        voucherId
      );

  if (updateResult.changes !== 1) {
    return false;
  }

  database
    .prepare(
      `
        INSERT INTO voucher_usages (
          id,
          voucher_id,
          user_key,
          order_id,
          used_at
        )
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(
      crypto.randomUUID(),
      voucherId,
      userKey,
      order.id,
      new Date().toISOString()
    );

  return true;
}

/*
 * --------------------------------------------------
 * SUCCESSFUL PAYMENT PROCESSING
 * --------------------------------------------------
 */

async function processSuccessfulPayment(
  order: OrderRow,
  items: OrderItem[],
  session: Stripe.Checkout.Session
) {
  /*
   * --------------------------------------------------
   * VERIFY STRIPE SESSION
   * --------------------------------------------------
   */

  try {
    assertStripeSessionMatchesOrder(
      order,
      session,
      order.id
    );
  } catch (error) {
    console.error(
      `Stripe session validation failed for order ${order.id}:`,
      error
    );

    await refundOrder(
      order.id,
      session,
      error instanceof Error
        ? error.message
        : "Stripe session validation failed"
    );

    return false;
  }

  /*
   * --------------------------------------------------
   * START ATOMIC TRANSACTION
   * --------------------------------------------------
   */

  try {
    database.exec(
      "BEGIN IMMEDIATE"
    );

    const currentOrder =
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
              payment_confirmation_sent,
              voucher_id,
              voucher_code,
              voucher_type,
              discount_amount,
              free_delivery,
              voucher_usage_recorded,
              stock_processed
            FROM orders
            WHERE id = ?
            LIMIT 1
          `
        )
        .get(order.id) as
        | OrderRow
        | undefined;

    if (!currentOrder) {
      throw new Error(
        `Order ${order.id} was not found inside payment transaction.`
      );
    }

    /*
     * --------------------------------------------------
     * VERIFY STRIPE SESSION AGAIN
     * --------------------------------------------------
     */

    assertStripeSessionMatchesOrder(
      currentOrder,
      session,
      currentOrder.id
    );

    /*
     * --------------------------------------------------
     * ALREADY REFUNDED / CANCELLED
     * --------------------------------------------------
     */

    if (
      currentOrder.payment_status ===
        "refunded" ||
      currentOrder.status ===
        "cancelled"
    ) {
      database.exec(
        "ROLLBACK"
      );

      console.log(
        `Order ${order.id} was already refunded/cancelled.`
      );

      return true;
    }

    /*
     * --------------------------------------------------
     * ALREADY PAID
     * --------------------------------------------------
     */

    if (
      currentOrder.payment_status ===
      "paid"
    ) {
      database.exec(
        "ROLLBACK"
      );

      console.log(
        `Order ${order.id} is already marked as paid. No stock, voucher, or product discount processing required.`
      );

      return true;
    }

    /*
     * --------------------------------------------------
     * VOUCHER METADATA VALIDATION
     * --------------------------------------------------
     */

    const metadataVoucherId =
      session.metadata?.voucherId ||
      null;

    const metadataVoucherCode =
      session.metadata?.voucherCode ||
      "";

    const voucherId =
      currentOrder.voucher_id ||
      metadataVoucherId ||
      null;

    if (
      currentOrder.voucher_id &&
      metadataVoucherId &&
      currentOrder.voucher_id !==
        metadataVoucherId
    ) {
      throw new Error(
        `VOUCHER_ID_MISMATCH:${currentOrder.id}`
      );
    }

    if (
      !currentOrder.voucher_id &&
      metadataVoucherId &&
      !currentOrder.voucher_code
    ) {
      throw new Error(
        `UNEXPECTED_VOUCHER_METADATA:${currentOrder.id}`
      );
    }

    /*
     * --------------------------------------------------
     * VERIFY VOUCHER CODE
     * --------------------------------------------------
     */

    if (
      currentOrder.voucher_code &&
      metadataVoucherCode &&
      currentOrder.voucher_code !==
        metadataVoucherCode
    ) {
      throw new Error(
        `VOUCHER_CODE_MISMATCH:${currentOrder.id}`
      );
    }

    if (
      currentOrder.voucher_code &&
      metadataVoucherCode !==
        currentOrder.voucher_code
    ) {
      throw new Error(
        `VOUCHER_CODE_MISSING_OR_MISMATCH:${currentOrder.id}`
      );
    }

    /*
     * --------------------------------------------------
     * VERIFY VOUCHER TYPE
     * --------------------------------------------------
     */

    const metadataVoucherType =
      session.metadata?.voucherType ||
      "";

    if (
      currentOrder.voucher_type &&
      metadataVoucherType &&
      currentOrder.voucher_type !==
        metadataVoucherType
    ) {
      throw new Error(
        `VOUCHER_TYPE_MISMATCH:${currentOrder.id}`
      );
    }

    if (
      currentOrder.voucher_type &&
      !metadataVoucherType
    ) {
      throw new Error(
        `VOUCHER_TYPE_MISSING:${currentOrder.id}`
      );
    }

    /*
     * --------------------------------------------------
     * VERIFY VOUCHER DISCOUNT METADATA
     * --------------------------------------------------
     */

    const metadataDiscount =
      session.metadata?.discountAmount;

    if (
      metadataDiscount !== undefined &&
      metadataDiscount !== ""
    ) {
      const parsedDiscount =
        Number(metadataDiscount);

      if (
        !Number.isFinite(
          parsedDiscount
        ) ||
        toCents(parsedDiscount) !==
          toCents(
            currentOrder.discount_amount
          )
      ) {
        throw new Error(
          `VOUCHER_DISCOUNT_MISMATCH:${currentOrder.id}`
        );
      }
    }

    if (
      currentOrder.discount_amount > 0 &&
      (
        metadataDiscount === undefined ||
        metadataDiscount === ""
      )
    ) {
      throw new Error(
        `VOUCHER_DISCOUNT_MISSING:${currentOrder.id}`
      );
    }

    /*
     * --------------------------------------------------
     * VERIFY FREE DELIVERY METADATA
     * --------------------------------------------------
     */

    const metadataFreeDelivery =
      session.metadata?.freeDelivery;

    if (
      metadataFreeDelivery !== undefined &&
      metadataFreeDelivery !== ""
    ) {
      const expectedFreeDelivery =
        currentOrder.free_delivery === 1
          ? "true"
          : "false";

      if (
        metadataFreeDelivery !==
        expectedFreeDelivery
      ) {
        throw new Error(
          `FREE_DELIVERY_MISMATCH:${currentOrder.id}`
        );
      }
    }

    if (
      currentOrder.free_delivery === 1 &&
      (
        metadataFreeDelivery === undefined ||
        metadataFreeDelivery === ""
      )
    ) {
      throw new Error(
        `FREE_DELIVERY_MISSING:${currentOrder.id}`
      );
    }

    /*
     * --------------------------------------------------
     * QUICK STOCK CHECK
     * --------------------------------------------------
     */

    const availability =
      getOrderAvailability(items);

    if (!availability.available) {
      throw new Error(
        `STOCK_UNAVAILABLE:${availability.reason}:${availability.productId}:${availability.variantId ?? "none"}`
      );
    }

    /*
     * --------------------------------------------------
     * CONSUME VOUCHER USAGE
     * --------------------------------------------------
     */

    if (
      voucherId &&
      currentOrder.voucher_usage_recorded !==
        1
    ) {
      const voucherUsageSuccess =
        consumeVoucherUsageWithinTransaction(
          voucherId,
          currentOrder
        );

      if (!voucherUsageSuccess) {
        throw new Error(
          `VOUCHER_USAGE_LIMIT_REACHED:${voucherId}`
        );
      }
    }

    /*
     * --------------------------------------------------
     * CONSUME PRODUCT DISCOUNT USAGE
     * --------------------------------------------------
     *
     * This MUST happen before COMMIT and inside the
     * same transaction as stock/voucher processing.
     *
     * If the discount quantity limit has been reached
     * since checkout was created, or the discount
     * price/original price has changed, the transaction
     * fails and the successful Stripe payment is
     * refunded.
     */

    consumeOrderProductDiscountsWithinTransaction(
      items
    );

    /*
     * --------------------------------------------------
     * ATOMIC STOCK DECREMENT
     * --------------------------------------------------
     */

    if (
      currentOrder.stock_processed !==
      1
    ) {
      decrementOrderStockWithinTransaction(
        items
      );
    }

    /*
     * --------------------------------------------------
     * MARK ORDER AS PAID
     * --------------------------------------------------
     */

    const updateResult =
      database
        .prepare(
          `
            UPDATE orders
            SET
              payment_status = ?,
              status = ?,
              voucher_id = COALESCE(?, voucher_id),
              voucher_usage_recorded = CASE
                WHEN ? IS NOT NULL
                THEN 1
                ELSE voucher_usage_recorded
              END,
              stock_processed = 1
            WHERE id = ?
              AND payment_status = ?
          `
        )
        .run(
          "paid",
          "processing",
          voucherId,
          voucherId,
          currentOrder.id,
          "pending"
        );

    if (
      updateResult.changes !== 1
    ) {
      throw new Error(
        `ORDER_UPDATE_FAILED:${currentOrder.id}`
      );
    }

    /*
     * --------------------------------------------------
     * COMMIT
     * --------------------------------------------------
     */

    database.exec(
      "COMMIT"
    );

    console.log(
      `Payment successfully processed for order ${order.id}. Stock, voucher usage, and product discount usage committed atomically.`
    );

    return true;
  } catch (error) {
    try {
      database.exec(
        "ROLLBACK"
      );
    } catch {
      // Ignore rollback errors.
    }

    console.error(
      `Payment transaction failed for order ${order.id}:`,
      error
    );

    /*
     * Stripe payment succeeded but the local
     * transaction could not safely finalize.
     *
     * Refund the customer.
     */

    await refundOrder(
      order.id,
      session,
      error instanceof Error
        ? error.message
        : "Payment processing transaction failed"
    );

    return false;
  }
}

async function sendPaymentConfirmationEmail(
  order: OrderRow
) {
  const shipping =
    JSON.parse(
      order.shipping_json
    ) as ShippingData;

  const items =
    JSON.parse(
      order.items_json
    ) as OrderItem[];

  if (!shipping.email) {
    console.error(
      `Order ${order.id} has no customer email.`
    );

    return false;
  }

  const language =
    getLanguageFromShipping(
      shipping
    );

  const translations = {
    en: {
      subject:
        `Order confirmation ${order.id} – JAN-GET`,
      title:
        "Thank you for your order!",
      greeting:
        `Hello ${shipping.firstName},`,
      intro:
        "Your payment has been confirmed and your order is now being processed.",
      orderNumber:
        "Order number",
      items:
        "Your items",
      product:
        "Product",
      qty:
        "Qty",
      price:
        "Price",
      subtotal:
        "Subtotal",
      discount:
        "Discount",
      voucher:
        "Voucher",
      shipping:
        "Shipping",
      free:
        "Free",
      total:
        "Total",
      shippingAddress:
        "Shipping address",
      viewOrder:
        "View Order",
      footer:
        "Thank you for shopping with JAN-GET – 3D Printed Creations.",
    },

    de: {
      subject:
        `Bestellbestätigung ${order.id} – JAN-GET`,
      title:
        "Vielen Dank für deine Bestellung!",
      greeting:
        `Hallo ${shipping.firstName},`,
      intro:
        "Deine Zahlung wurde bestätigt und deine Bestellung wird jetzt bearbeitet.",
      orderNumber:
        "Bestellnummer",
      items:
        "Deine Artikel",
      product:
        "Produkt",
      qty:
        "Menge",
      price:
        "Preis",
      subtotal:
        "Zwischensumme",
      discount:
        "Rabatt",
      voucher:
        "Gutschein",
      shipping:
        "Versand",
      free:
        "Kostenlos",
      total:
        "Gesamt",
      shippingAddress:
        "Lieferadresse",
      viewOrder:
        "Bestellung ansehen",
      footer:
        "Vielen Dank für deinen Einkauf bei JAN-GET – 3D Printed Creations.",
    },

    ar: {
      subject:
        `تأكيد الطلب ${order.id} – JAN-GET`,
      title:
        "شكرًا لك على طلبك!",
      greeting:
        `مرحبًا ${shipping.firstName}،`,
      intro:
        "تم تأكيد عملية الدفع، ويجري الآن تجهيز طلبك.",
      orderNumber:
        "رقم الطلب",
      items:
        "المنتجات",
      product:
        "المنتج",
      qty:
        "الكمية",
      price:
        "السعر",
      subtotal:
        "المجموع الفرعي",
      discount:
        "الخصم",
      voucher:
        "قسيمة الخصم",
      shipping:
        "الشحن",
      free:
        "مجاني",
      total:
        "الإجمالي",
      shippingAddress:
        "عنوان الشحن",
      viewOrder:
        "عرض الطلب",
      footer:
        "شكرًا لتسوقك من JAN-GET – 3D Printed Creations.",
    },
  };

  const t =
    translations[language];

  const direction =
    language === "ar"
      ? "rtl"
      : "ltr";

  const itemsHtml =
    items
      .map(
        (item) => `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eee;">
              <strong>${escapeHtml(item.name)}</strong>
            </td>

            <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:center;">
              ${item.quantity}
            </td>

            <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;">
              ${formatPrice(
                item.price *
                  item.quantity
              )}
            </td>
          </tr>
        `
      )
      .join("");

  const apartment =
    shipping.apartment?.trim()
      ? `<br />${escapeHtml(
          shipping.apartment
        )}`
      : "";

  const orderUrl =
    `${
      process.env
        .NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000"
    }` +
    `/account/orders/${encodeURIComponent(
      order.id
    )}`;

  const voucherHtml =
    order.voucher_code
      ? `
          <p style="margin:8px 0;">
            <strong>${t.voucher}:</strong>
            ${escapeHtml(
              order.voucher_code
            )}
          </p>
        `
      : "";

  const discountHtml =
    order.discount_amount > 0
      ? `
          <p style="margin:8px 0;">
            <strong>${t.discount}:</strong>
            -${formatPrice(
              order.discount_amount
            )}
          </p>
        `
      : "";

  const shippingHtml =
    order.free_delivery === 1
      ? `
          <strong>${t.shipping}:</strong>
          ${t.free}
        `
      : `
          <strong>${t.shipping}:</strong>
          ${formatPrice(
            order.shipping_cost
          )}
        `;

  const html = `
    <div
      dir="${direction}"
      style="
        font-family:Arial,Helvetica,sans-serif;
        background:#fdf8fa;
        padding:32px 16px;
        color:#333;
      "
    >
      <div
        style="
          max-width:640px;
          margin:0 auto;
          background:#ffffff;
          border-radius:20px;
          padding:32px;
          border:1px solid #eadde1;
        "
      >
        <div style="text-align:center;margin-bottom:28px;">
          <h1 style="margin:0;color:#b96f86;">
            JAN-GET
          </h1>

          <p style="margin:6px 0 0;color:#777;">
            3D Printed Creations
          </p>
        </div>

        <h2 style="margin-bottom:12px;">
          ${t.title}
        </h2>

        <p>
          ${t.greeting}
        </p>

        <p style="line-height:1.7;">
          ${t.intro}
        </p>

        <div
          style="
            background:#faf3f6;
            border-radius:12px;
            padding:16px;
            margin:24px 0;
          "
        >
          <strong>${t.orderNumber}:</strong>

          <br />

          <span style="font-size:18px;color:#b96f86;">
            ${escapeHtml(order.id)}
          </span>
        </div>

        <h3>${t.items}</h3>

        <table
          style="
            width:100%;
            border-collapse:collapse;
            margin-bottom:20px;
          "
        >
          <thead>
            <tr>
              <th
                style="
                  text-align:left;
                  padding:10px 0;
                  border-bottom:2px solid #eee;
                "
              >
                ${t.product}
              </th>

              <th
                style="
                  text-align:center;
                  padding:10px 0;
                  border-bottom:2px solid #eee;
                "
              >
                ${t.qty}
              </th>

              <th
                style="
                  text-align:right;
                  padding:10px 0;
                  border-bottom:2px solid #eee;
                "
              >
                ${t.price}
              </th>
            </tr>
          </thead>

          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div
          style="
            border-top:1px solid #eee;
            padding-top:16px;
          "
        >
          <p style="margin:8px 0;">
            <strong>${t.subtotal}:</strong>
            ${formatPrice(
              order.subtotal
            )}
          </p>

          ${voucherHtml}

          ${discountHtml}

          <p style="margin:8px 0;">
            ${shippingHtml}
          </p>

          <p
            style="
              margin:16px 0 0;
              font-size:18px;
            "
          >
            <strong>${t.total}:</strong>
            ${formatPrice(
              order.total
            )}
          </p>
        </div>

        <h3 style="margin-top:30px;">
          ${t.shippingAddress}
        </h3>

        <p style="line-height:1.7;">
          ${escapeHtml(
            shipping.firstName
          )}
          ${escapeHtml(
            shipping.lastName
          )}
          <br />
          ${escapeHtml(
            shipping.address
          )}
          ${apartment}
          <br />
          ${escapeHtml(
            shipping.postalCode
          )}
          ${escapeHtml(
            shipping.city
          )}
          <br />
          ${escapeHtml(
            shipping.country
          )}
        </p>

        <div style="text-align:center;margin:32px 0;">
          <a
            href="${orderUrl}"
            style="
              display:inline-block;
              padding:13px 24px;
              background:#c98298;
              color:#ffffff;
              text-decoration:none;
              border-radius:999px;
              font-weight:bold;
            "
          >
            ${t.viewOrder}
          </a>
        </div>

        <p
          style="
            color:#777;
            font-size:13px;
            line-height:1.6;
            text-align:center;
            margin-top:32px;
          "
        >
          ${t.footer}
        </p>
      </div>
    </div>
  `;

  const result =
    await resend.emails.send({
      from: fromEmail,
      to: shipping.email,
      subject: t.subject,
      html,
    });

  if (result.error) {
    console.error(
      `Failed to send payment confirmation for ${order.id}:`,
      result.error
    );

    return false;
  }

  console.log(
    `Payment confirmation email sent for order ${order.id}.`
  );

  return true;
}

async function getOrderById(
  orderId: string
) {
  return database
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
          payment_confirmation_sent,
          voucher_id,
          voucher_code,
          voucher_type,
          discount_amount,
          free_delivery,
          voucher_usage_recorded,
          stock_processed
        FROM orders
        WHERE id = ?
        LIMIT 1
      `
    )
    .get(orderId) as
    | OrderRow
    | undefined;
}

async function handleSuccessfulPayment(
  orderId: string,
  session: Stripe.Checkout.Session
) {
  const order =
    await getOrderById(orderId);

  if (!order) {
    throw new Error(
      `Paid order ${orderId} was not found.`
    );
  }

  try {
    assertStripeSessionMatchesOrder(
      order,
      session,
      orderId
    );
  } catch (error) {
    console.error(
      `Stripe session/order validation failed for ${orderId}:`,
      error
    );

    await refundOrder(
      orderId,
      session,
      error instanceof Error
        ? error.message
        : "Stripe session/order validation failed"
    );

    return;
  }

  if (
    order.payment_status ===
      "refunded" ||
    order.status === "cancelled"
  ) {
    console.log(
      `Order ${orderId} is already refunded/cancelled.`
    );

    return;
  }

  const items =
    JSON.parse(
      order.items_json
    ) as OrderItem[];

  const processed =
    await processSuccessfulPayment(
      order,
      items,
      session
    );

  if (!processed) {
    return;
  }

  const updatedOrder =
    await getOrderById(orderId);

  if (!updatedOrder) {
    throw new Error(
      `Paid order ${orderId} was not found after update.`
    );
  }

  if (
    updatedOrder.payment_status !==
    "paid"
  ) {
    throw new Error(
      `Order ${orderId} was not marked as paid after successful Stripe payment processing.`
    );
  }

  if (
    updatedOrder.payment_confirmation_sent ===
    1
  ) {
    console.log(
      `Payment confirmation already sent for ${orderId}.`
    );

    return;
  }

  const emailSent =
    await sendPaymentConfirmationEmail(
      updatedOrder
    );

  if (!emailSent) {
    throw new Error(
      `PAYMENT_CONFIRMATION_EMAIL_FAILED:${orderId}`
    );
  }

  const emailUpdate =
    database
      .prepare(
        `
          UPDATE orders
          SET payment_confirmation_sent = 1
          WHERE id = ?
            AND payment_confirmation_sent = 0
        `
      )
      .run(orderId);

  if (
    emailUpdate.changes !== 1
  ) {
    const finalOrder =
      await getOrderById(
        orderId
      );

    if (
      !finalOrder ||
      finalOrder.payment_confirmation_sent !==
        1
    ) {
      throw new Error(
        `PAYMENT_CONFIRMATION_STATUS_UPDATE_FAILED:${orderId}`
      );
    }
  }

  console.log(
    `Order ${orderId} marked as confirmation email sent.`
  );
}

export async function POST(
  request: Request
) {
  const webhookSecret =
    process.env
      .STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "STRIPE_WEBHOOK_SECRET is not configured."
    );

    return NextResponse.json(
      {
        error:
          "Webhook secret is not configured.",
      },
      {
        status: 500,
      }
    );
  }

  const signature =
    request.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return NextResponse.json(
      {
        error:
          "Missing Stripe signature.",
      },
      {
        status: 400,
      }
    );
  }

  let event: Stripe.Event;

  try {
    const body =
      await request.text();

    event =
      stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Invalid webhook signature.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    /*
     * --------------------------------------------------
     * DUPLICATE EVENT PROTECTION
     * --------------------------------------------------
     */

    const existingEvent =
      database
        .prepare(
          `
            SELECT id
            FROM webhook_events
            WHERE id = ?
            LIMIT 1
          `
        )
        .get(event.id) as
        | {
            id: string;
          }
        | undefined;

    if (existingEvent) {
      console.log(
        `Stripe event ${event.id} already processed.`
      );

      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    /*
     * --------------------------------------------------
     * HANDLE STRIPE EVENTS
     * --------------------------------------------------
     */

    switch (event.type) {
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const orderId =
          session.metadata?.orderId ||
          session.client_reference_id;

        if (!orderId) {
          throw new Error(
            `CHECKOUT_SESSION_ORDER_ID_MISSING:${session.id}`
          );
        }

        if (
          session.payment_status ===
          "paid"
        ) {
          await handleSuccessfulPayment(
            orderId,
            session
          );
        } else {
          console.log(
            `Order ${orderId} checkout completed with payment status: ${session.payment_status}.`
          );
        }

        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const orderId =
          session.metadata?.orderId ||
          session.client_reference_id;

        if (!orderId) {
          throw new Error(
            `ASYNC_PAYMENT_ORDER_ID_MISSING:${session.id}`
          );
        }

        await handleSuccessfulPayment(
          orderId,
          session
        );

        break;
      }

      case "checkout.session.async_payment_failed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const orderId =
          session.metadata?.orderId ||
          session.client_reference_id;

        if (!orderId) {
          throw new Error(
            `ASYNC_PAYMENT_FAILURE_ORDER_ID_MISSING:${session.id}`
          );
        }

        const order =
          await getOrderById(orderId);

        if (!order) {
          throw new Error(
            `Order ${orderId} was not found for async payment failure.`
          );
        }

        assertStripeSessionMatchesOrder(
          order,
          session,
          orderId
        );

        database
          .prepare(
            `
              UPDATE orders
              SET payment_status = ?
              WHERE id = ?
                AND payment_status = ?
            `
          )
          .run(
            "failed",
            orderId,
            "pending"
          );

        console.log(
          `Async payment failed for order ${orderId}.`
        );

        break;
      }

      case "checkout.session.expired": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const orderId =
          session.metadata?.orderId ||
          session.client_reference_id;

        if (!orderId) {
          throw new Error(
            `EXPIRED_SESSION_ORDER_ID_MISSING:${session.id}`
          );
        }

        const order =
          await getOrderById(orderId);

        if (!order) {
          throw new Error(
            `Order ${orderId} was not found for expired checkout session.`
          );
        }

        assertStripeSessionMatchesOrder(
          order,
          session,
          orderId
        );

        database
          .prepare(
            `
              UPDATE orders
              SET
                status = ?,
                payment_status = ?
              WHERE id = ?
                AND status = ?
                AND payment_status = ?
            `
          )
          .run(
            "cancelled",
            "expired",
            orderId,
            "pending_payment",
            "pending"
          );

        console.log(
          `Checkout session expired for order ${orderId}.`
        );

        break;
      }

      default:
        console.log(
          `Unhandled Stripe event: ${event.type}`
        );
    }

    /*
     * --------------------------------------------------
     * SAVE EVENT
     * --------------------------------------------------
     */

    database
      .prepare(
        `
          INSERT OR IGNORE INTO webhook_events
          (id, type, created_at)
          VALUES (?, ?, ?)
        `
      )
      .run(
        event.id,
        event.type,
        new Date().toISOString()
      );

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Stripe webhook processing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}