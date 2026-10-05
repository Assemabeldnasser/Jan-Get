import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";

import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

import {
  getProductById,
  isDiscountActive,
  type ProductPriceDiscount,
  type ProductVariantRecord,
} from "@/lib/product-db";

import {
  validateVoucherForUser,
  type VoucherType,
} from "@/lib/voucher-db";

type Language =
  | "en"
  | "de"
  | "ar";

type ProductSizeKey =
  | "small"
  | "medium"
  | "large";

type DiscountLevel =
  | "basic"
  | "color"
  | "size"
  | null;

type IncomingCustomField = {
  id: string;
  value: string;
};

type IncomingOrderItem = {
  productId: string;
  quantity: number;
  colorKey?: string;
  sizeKey?: ProductSizeKey | "";
  customFields?: IncomingCustomField[];
};

type ShippingData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment: string;
  postalCode: string;
  city: string;
  country: string;
  language: Language;
};

type CheckoutRequest = {
  items: IncomingOrderItem[];
  shipping: ShippingData;
  language?: Language;
  voucherCode?: string;
};

type ValidatedCustomField = {
  id: string;
  label: string;
  value: string;
};

type ValidatedItem = {
  productId: string;
  name: string;

  /*
   * Final product unit price actually charged
   * before voucher discount.
   *
   * This can be:
   * - size discounted/final price
   * - color discounted/final price
   * - basic discounted/final price
   * - original direct price when no product discount applies
   */
  price: number;

  /*
   * Authoritative original unit price before
   * any product-level discount.
   *
   * This is stored in the order snapshot so
   * historical orders retain the exact pricing
   * context used at checkout.
   */
  originalPrice: number;

  quantity: number;
  colorKey: string;

  color: {
    en: string;
    de: string;
    ar: string;
  } | null;

  sizeKey: ProductSizeKey | "";

  customFields: ValidatedCustomField[];

  image: string;

  /*
   * Identifies which direct-price level supplied
   * the applied product discount.
   *
   * null means no product discount was applied.
   */
  discountLevel: DiscountLevel;

  discountApplied: boolean;
};

type StripeLineItem = {
  price_data: {
    currency: "eur";
    product_data: {
      name: string;
    };
    unit_amount: number;
  };
  quantity: number;
};

const database =
  new DatabaseSync(
    "database.sqlite"
  );

/*
 * --------------------------------------------------
 * DATABASE INITIALIZATION
 * --------------------------------------------------
 */

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
    tracking_number TEXT,
    voucher_id TEXT,
    voucher_code TEXT,
    voucher_type TEXT,
    discount_amount REAL NOT NULL DEFAULT 0,
    free_delivery INTEGER NOT NULL DEFAULT 0,
    voucher_usage_recorded INTEGER NOT NULL DEFAULT 0,
    stock_processed INTEGER NOT NULL DEFAULT 0
  )
`);

/*
 * --------------------------------------------------
 * SAFE ORDER SCHEMA MIGRATION
 * --------------------------------------------------
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
        column.name ===
        columnName
    );

  if (exists) {
    return;
  }

  database.exec(
    `ALTER TABLE orders ADD COLUMN ${columnName} ${definition}`
  );
}

ensureOrderColumn(
  "payment_confirmation_sent",
  "INTEGER NOT NULL DEFAULT 0"
);

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

ensureOrderColumn(
  "voucher_usage_recorded",
  "INTEGER NOT NULL DEFAULT 0"
);

ensureOrderColumn(
  "stock_processed",
  "INTEGER NOT NULL DEFAULT 0"
);

/*
 * --------------------------------------------------
 * HELPERS
 * --------------------------------------------------
 */

function roundMoney(
  value: number
) {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100
    ) / 100
  );
}

function toCents(
  value: number
) {
  return Math.round(
    (value + Number.EPSILON) *
      100
  );
}

function isValidQuantity(
  quantity: unknown
): quantity is number {
  return (
    typeof quantity ===
      "number" &&
    Number.isInteger(
      quantity
    ) &&
    quantity >= 1 &&
    quantity <= 10
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

function isValidSizeKey(
  value: unknown
): value is ProductSizeKey {
  return (
    value === "small" ||
    value === "medium" ||
    value === "large"
  );
}

function isValidShipping(
  shipping: ShippingData
) {
  return (
    typeof shipping.firstName ===
      "string" &&
    shipping.firstName.trim()
      .length > 0 &&

    typeof shipping.lastName ===
      "string" &&
    shipping.lastName.trim()
      .length > 0 &&

    typeof shipping.email ===
      "string" &&
    shipping.email.trim()
      .length > 0 &&

    typeof shipping.phone ===
      "string" &&
    shipping.phone.trim()
      .length > 0 &&

    typeof shipping.address ===
      "string" &&
    shipping.address.trim()
      .length > 0 &&

    typeof shipping.postalCode ===
      "string" &&
    shipping.postalCode.trim()
      .length > 0 &&

    typeof shipping.city ===
      "string" &&
    shipping.city.trim()
      .length > 0 &&

    shipping.country ===
      "Germany"
  );
}

function resolveVariant(
  product: NonNullable<
    ReturnType<
      typeof getProductById
    >
  >,
  colorKey?: string
) {
  const variants =
    product.variants.filter(
      (variant) =>
        variant.active
    );

  if (
    variants.length === 1 &&
    (!colorKey ||
      colorKey.trim() === "")
  ) {
    return variants[0];
  }

  const normalizedKey =
    String(colorKey ?? "")
      .trim()
      .toLowerCase();

  if (!normalizedKey) {
    return null;
  }

  const byId =
    variants.find(
      (variant) =>
        variant.id
          .toLowerCase() ===
        normalizedKey
    );

  if (byId) {
    return byId;
  }

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
      index >= 0 &&
      index < variants.length
    ) {
      return variants[index];
    }
  }

  const byColor =
    variants.find(
      (variant) =>
        variant.color.en
          .trim()
          .toLowerCase() ===
          normalizedKey ||

        variant.color.de
          .trim()
          .toLowerCase() ===
          normalizedKey ||

        variant.color.ar
          .trim()
          .toLowerCase() ===
          normalizedKey
    );

  return byColor ?? null;
}

function getLocalizedText(
  language: Language,
  text: {
    en: string;
    de: string;
    ar: string;
  }
) {
  return text[language];
}

/*
 * --------------------------------------------------
 * AUTHORITATIVE PRICE + DISCOUNT RESOLUTION
 * --------------------------------------------------
 *
 * Original price priority:
 *
 *   1. Selected size direct price
 *   2. Variant/color direct price
 *   3. Product basic price
 *
 * Discount priority follows the SAME level:
 *
 *   1. Size discount
 *   2. Color discount
 *   3. Basic discount
 *
 * A discount is valid only when that same level
 * has its own direct original price.
 *
 * `discount.price` is the COMPLETE FINAL
 * discounted unit price.
 *
 * It is NOT an extra price and is NOT subtracted
 * from the original price.
 *
 * `null` means no direct price at that level.
 *
 * `0` is a valid direct price.
 * --------------------------------------------------
 */

function resolveSize(
  variant: ProductVariantRecord,
  sizeKey: ProductSizeKey
) {
  return (
    variant.sizes ?? []
  ).find(
    (item) =>
      item.key ===
      sizeKey
  ) ?? null;
}

function isValidDirectPrice(
  value: unknown
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value
    ) &&
    value >= 0
  );
}

function resolveOriginalPriceAndDiscount(
  productPrice: number,
  productDiscount:
    | ProductPriceDiscount
    | null,
  variant:
    | ProductVariantRecord
    | null,
  sizeKey:
    | ProductSizeKey
    | ""
) {
  /*
   * --------------------------------------------------
   * SIZE LEVEL
   * --------------------------------------------------
   *
   * Size discount is considered ONLY when
   * the selected size has its own direct price.
   */

  if (
    variant &&
    sizeKey
  ) {
    const size =
      resolveSize(
        variant,
        sizeKey
      );

    if (
      size &&
      isValidDirectPrice(
        size.price
      )
    ) {
      const originalPrice =
        roundMoney(
          size.price
        );

      const discount =
        size.discount;

      if (
        discount &&
        isDiscountActive(
          discount
        ) &&
        isValidDirectPrice(
          discount.price
        )
      ) {
        return {
          originalPrice,

          discount,

          discountLevel:
            "size" as const,

          finalPrice:
            roundMoney(
              discount.price
            ),
        };
      }

      return {
        originalPrice,

        discount:
          null,

        discountLevel:
          null,

        finalPrice:
          originalPrice,
      };
    }
  }

  /*
   * --------------------------------------------------
   * COLOR / VARIANT LEVEL
   * --------------------------------------------------
   *
   * Color discount is considered ONLY when
   * the color has its own direct price.
   */

  if (
    variant &&
    isValidDirectPrice(
      variant.price
    )
  ) {
    const originalPrice =
      roundMoney(
        variant.price
      );

    const discount =
      variant.discount;

    if (
      discount &&
      isDiscountActive(
        discount
      ) &&
      isValidDirectPrice(
        discount.price
      )
    ) {
      return {
        originalPrice,

        discount,

        discountLevel:
          "color" as const,

        finalPrice:
          roundMoney(
            discount.price
          ),
      };
    }

    return {
      originalPrice,

      discount:
        null,

      discountLevel:
        null,

      finalPrice:
        originalPrice,
    };
  }

  /*
   * --------------------------------------------------
   * BASIC PRODUCT LEVEL
   * --------------------------------------------------
   */

  const originalPrice =
    roundMoney(
      productPrice
    );

  if (
    productDiscount &&
    isDiscountActive(
      productDiscount
    ) &&
    isValidDirectPrice(
      productDiscount.price
    )
  ) {
    return {
      originalPrice,

      discount:
        productDiscount,

      discountLevel:
        "basic" as const,

      finalPrice:
        roundMoney(
          productDiscount.price
        ),
    };
  }

  return {
    originalPrice,

    discount:
      null,

    discountLevel:
      null,

    finalPrice:
      originalPrice,
  };
}

/*
 * --------------------------------------------------
 * DISCOUNT QUANTITY VALIDATION
 * --------------------------------------------------
 *
 * Discount quantity limits are based on units.
 *
 * `alreadyRequestedQuantity` is the quantity of
 * the SAME discount already reserved by previous
 * cart lines during this checkout request.
 *
 * This is important because the same discount can
 * appear in multiple cart lines.
 *
 * Example:
 *
 * limit = 5
 * sold  = 3
 *
 * line 1 requests 1
 * line 2 requests 2
 *
 * Total requested = 3
 * => both lines can use the discount.
 *
 * But:
 *
 * line 1 requests 2
 * line 2 requests 2
 *
 * Remaining = 2
 * => both can still use it.
 *
 * line 1 requests 2
 * line 2 requests 3
 *
 * Remaining = 3
 * => line 1 uses discount
 * => line 2 does NOT use discount
 *
 * We never partially discount a single line.
 * --------------------------------------------------
 */

function canUseDiscountForQuantity(
  discount:
    | ProductPriceDiscount
    | null,
  quantity: number,
  alreadyRequestedQuantity = 0
) {
  if (
    !discount ||
    !isDiscountActive(
      discount
    )
  ) {
    return false;
  }

  if (
    !isValidDirectPrice(
      discount.price
    )
  ) {
    return false;
  }

  if (
    discount.quantityLimit ===
    null
  ) {
    return true;
  }

  return (
    discount.quantitySold +
      alreadyRequestedQuantity +
      quantity <=
    discount.quantityLimit
  );
}

function getFinalPriceForQuantity(
  productPrice: number,
  productDiscount:
    | ProductPriceDiscount
    | null,
  variant:
    | ProductVariantRecord
    | null,
  sizeKey:
    | ProductSizeKey
    | "",
  quantity: number,
  alreadyRequestedQuantity = 0
) {
  const resolved =
    resolveOriginalPriceAndDiscount(
      productPrice,
      productDiscount,
      variant,
      sizeKey
    );

  /*
   * No applicable product discount.
   */
  if (
    !resolved.discount
  ) {
    return {
      originalPrice:
        resolved.originalPrice,

      finalPrice:
        resolved.originalPrice,

      discount:
        null,

      discountLevel:
        null,

      discountApplied:
        false,
    };
  }

  /*
   * Discount exists but the complete requested
   * quantity cannot use the remaining quantity,
   * including quantities already assigned to the
   * same discount by previous cart lines.
   *
   * Use the original direct price for the
   * complete order line.
   */
  if (
    !canUseDiscountForQuantity(
      resolved.discount,
      quantity,
      alreadyRequestedQuantity
    )
  ) {
    return {
      originalPrice:
        resolved.originalPrice,

      finalPrice:
        resolved.originalPrice,

      discount:
        null,

      discountLevel:
        null,

      discountApplied:
        false,
    };
  }

  return {
    originalPrice:
      resolved.originalPrice,

    finalPrice:
      roundMoney(
        resolved.discount.price
      ),

    discount:
      resolved.discount,

    discountLevel:
      resolved.discountLevel,

    discountApplied:
      true,
  };
}

/*
 * --------------------------------------------------
 * DISCOUNT USAGE KEY
 * --------------------------------------------------
 *
 * A discount is identified by:
 *
 * basic:
 *   product
 *
 * color:
 *   product + variant
 *
 * size:
 *   product + variant + size
 *
 * This lets multiple cart lines share the same
 * quantity-limited discount safely.
 * --------------------------------------------------
 */

function getDiscountUsageKey(
  productId: string,
  variant:
    | ProductVariantRecord
    | null,
  sizeKey:
    | ProductSizeKey
    | "",
  discountLevel: DiscountLevel
) {
  if (!discountLevel) {
    return null;
  }

  if (
    discountLevel ===
    "basic"
  ) {
    return `basic:${productId}`;
  }

  if (
    discountLevel ===
    "color"
  ) {
    return `color:${productId}:${variant?.id ?? ""}`;
  }

  return `size:${productId}:${variant?.id ?? ""}:${sizeKey}`;
}

function validateCustomFields(
  variant: ProductVariantRecord,
  incoming:
    | IncomingCustomField[]
    | undefined
) {
  const configuredFields =
    variant.customFields ?? [];

  const received =
    Array.isArray(incoming)
      ? incoming
      : [];

  if (
    configuredFields.length ===
    0
  ) {
    if (
      received.length > 0
    ) {
      return {
        error:
          "This product variant does not support custom information.",

        fields:
          null,
      };
    }

    return {
      error:
        null,

      fields:
        [] as ValidatedCustomField[],
    };
  }

  if (
    received.length !==
    configuredFields.length
  ) {
    return {
      error:
        "Please complete all required product information.",

      fields:
        null,
    };
  }

  const receivedById =
    new Map<
      string,
      string
    >();

  for (
    const field of received
  ) {
    if (
      !field ||
      typeof field.id !==
        "string" ||
      typeof field.value !==
        "string"
    ) {
      return {
        error:
          "Invalid custom product information.",

        fields:
          null,
      };
    }

    const id =
      field.id.trim();

    const value =
      field.value.trim();

    if (
      !id ||
      !value ||
      value.length > 500
    ) {
      return {
        error:
          "Please complete all required product information.",

        fields:
          null,
      };
    }

    if (
      receivedById.has(id)
    ) {
      return {
        error:
          "Duplicate custom product information.",

        fields:
          null,
      };
    }

    receivedById.set(
      id,
      value
    );
  }

  const normalized:
    ValidatedCustomField[] =
    [];

  for (
    const field of
      configuredFields
  ) {
    const value =
      receivedById.get(
        field.id
      );

    if (
      !value
    ) {
      return {
        error:
          `The required field "${field.label}" is missing.`,

        fields:
          null,
      };
    }

    normalized.push({
      id:
        field.id,

      label:
        field.label,

      value,
    });
  }

  return {
    error:
      null,

    fields:
      normalized,
  };
}

/*
 * --------------------------------------------------
 * BUILD STRIPE PRODUCT LINE ITEMS
 * --------------------------------------------------
 *
 * `item.price` already contains any applicable
 * product-level discount.
 *
 * Voucher discount is then allocated over those
 * final product prices.
 *
 * Shipping is kept outside the voucher allocation.
 * --------------------------------------------------
 */

function buildStripeProductLineItems(
  items: ValidatedItem[],
  discountAmount: number
): StripeLineItem[] {
  const originalLineTotalsCents =
    items.map(
      (item) =>
        toCents(
          item.price
        ) *
        item.quantity
    );

  const subtotalCents =
    originalLineTotalsCents.reduce(
      (
        sum,
        value
      ) =>
        sum + value,
      0
    );

  const discountCents =
    Math.min(
      Math.max(
        0,
        toCents(
          discountAmount
        )
      ),
      subtotalCents
    );

  if (
    discountCents === 0
  ) {
    return items.map(
      (item) => ({
        price_data: {
          currency:
            "eur",

          product_data: {
            name:
              item.name,
          },

          unit_amount:
            toCents(
              item.price
            ),
        },

        quantity:
          item.quantity,
      })
    );
  }

  const allocatedDiscounts:
    number[] = [];

  let allocatedSoFar =
    0;

  for (
    let index = 0;
    index <
    originalLineTotalsCents.length;
    index += 1
  ) {
    if (
      index ===
      originalLineTotalsCents.length -
        1
    ) {
      allocatedDiscounts.push(
        discountCents -
          allocatedSoFar
      );

      continue;
    }

    const lineSubtotal =
      originalLineTotalsCents[
        index
      ];

    const lineDiscount =
      Math.floor(
        (
          discountCents *
          lineSubtotal
        ) /
          subtotalCents
      );

    allocatedDiscounts.push(
      lineDiscount
    );

    allocatedSoFar +=
      lineDiscount;
  }

  const lineItems:
    StripeLineItem[] = [];

  for (
    let index = 0;
    index < items.length;
    index += 1
  ) {
    const item =
      items[index];

    const originalLineTotal =
      originalLineTotalsCents[
        index
      ];

    const lineDiscount =
      allocatedDiscounts[
        index
      ];

    const discountedLineTotal =
      Math.max(
        0,
        originalLineTotal -
          lineDiscount
      );

    if (
      discountedLineTotal === 0
    ) {
      continue;
    }

    const quantity =
      item.quantity;

    const baseUnitAmount =
      Math.floor(
        discountedLineTotal /
          quantity
      );

    const remainder =
      discountedLineTotal %
      quantity;

    const regularQuantity =
      quantity -
      remainder;

    if (
      baseUnitAmount > 0 &&
      regularQuantity > 0
    ) {
      lineItems.push({
        price_data: {
          currency:
            "eur",

          product_data: {
            name:
              item.name,
          },

          unit_amount:
            baseUnitAmount,
        },

        quantity:
          regularQuantity,
      });
    }

    if (
      remainder > 0
    ) {
      lineItems.push({
        price_data: {
          currency:
            "eur",

          product_data: {
            name:
              item.name,
          },

          unit_amount:
            baseUnitAmount +
            1,
        },

        quantity:
          remainder,
      });
    }
  }

  return lineItems;
}

/*
 * --------------------------------------------------
 * CREATE CHECKOUT
 * --------------------------------------------------
 */

export async function POST(
  request: Request
) {
  let createdOrderId:
    string | null = null;

  try {
    const body =
      (await request.json()) as CheckoutRequest;

    /*
     * --------------------------------------------------
     * BASIC REQUEST VALIDATION
     * --------------------------------------------------
     */

    if (
      !Array.isArray(
        body.items
      ) ||
      body.items.length ===
        0
    ) {
      return NextResponse.json(
        {
          error:
            "Your cart is empty.",

          code:
            "EMPTY_CART",
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.items.length > 50
    ) {
      return NextResponse.json(
        {
          error:
            "Too many different products in the order.",

          code:
            "TOO_MANY_PRODUCTS",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !body.shipping ||
      !isValidShipping(
        body.shipping
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Shipping information is missing or invalid.",

          code:
            "INVALID_SHIPPING",
        },
        {
          status: 400,
        }
      );
    }

    const language:
      Language =
      isValidLanguage(
        body.language
      )
        ? body.language
        : "en";

    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     */

    const session =
      await auth.api.getSession(
        {
          headers:
            request.headers,
        }
      );

    const userId =
      session?.user?.id ??
      null;

    const voucherUserEmail =
      session?.user?.email?.trim() ||
      body.shipping.email.trim();

    /*
     * --------------------------------------------------
     * VALIDATE PRODUCTS, VARIANTS, OPTIONS,
     * PRICES, DISCOUNTS AND STOCK
     * --------------------------------------------------
     */

    const validatedItems:
      ValidatedItem[] =
      [];

    /*
     * Tracks quantities already assigned to
     * quantity-limited product discounts during
     * this checkout request.
     *
     * This prevents duplicate cart lines from
     * consuming more discount quantity than is
     * actually available.
     */
    const discountUsageByKey =
      new Map<
        string,
        number
      >();

    for (
      const incomingItem of
        body.items
    ) {
      if (
        !incomingItem?.productId
      ) {
        return NextResponse.json(
          {
            error:
              "A product is missing from the order.",

            code:
              "PRODUCT_MISSING",
          },
          {
            status: 400,
          }
        );
      }

      if (
        !isValidQuantity(
          incomingItem.quantity
        )
      ) {
        return NextResponse.json(
          {
            error:
              `Invalid quantity for product ${incomingItem.productId}. Quantity must be between 1 and 10.`,

            code:
              "INVALID_QUANTITY",

            productId:
              incomingItem.productId,
          },
          {
            status: 400,
          }
        );
      }

      const product =
        getProductById(
          incomingItem.productId,
          {
            includeInactive:
              false,
          }
        );

      if (
        !product ||
        !product.active
      ) {
        return NextResponse.json(
          {
            error:
              `Product ${incomingItem.productId} is no longer available.`,

            code:
              "PRODUCT_NOT_AVAILABLE",

            productId:
              incomingItem.productId,
          },
          {
            status: 400,
          }
        );
      }

      if (
        !product.inStock
      ) {
        return NextResponse.json(
          {
            error:
              `Product ${product.id} is currently out of stock.`,

            code:
              "PRODUCT_OUT_OF_STOCK",

            productId:
              product.id,
          },
          {
            status: 409,
          }
        );
      }

      const hasVariants =
        product.variants.length >
        0;

      /*
       * --------------------------------------------------
       * PRODUCT WITHOUT VARIANTS
       * --------------------------------------------------
       */

      if (!hasVariants) {
        if (
          incomingItem.sizeKey
        ) {
          return NextResponse.json(
            {
              error:
                "This product does not support sizes.",

              code:
                "SIZE_NOT_SUPPORTED",

              productId:
                product.id,
            },
            {
              status: 400,
            }
          );
        }

        if (
          Array.isArray(
            incomingItem.customFields
          ) &&
          incomingItem.customFields
            .length > 0
        ) {
          return NextResponse.json(
            {
              error:
                "This product does not support custom information.",

              code:
                "CUSTOM_FIELDS_NOT_SUPPORTED",

              productId:
                product.id,
            },
            {
              status: 400,
            }
          );
        }

        const productStock =
          product.stock;

        if (
          productStock !== null &&
          productStock <= 0
        ) {
          return NextResponse.json(
            {
              error:
                `Product ${product.id} is currently out of stock.`,

              code:
                "PRODUCT_OUT_OF_STOCK",

              productId:
                product.id,
            },
            {
              status: 409,
            }
          );
        }

        if (
          productStock !== null &&
          incomingItem.quantity >
            productStock
        ) {
          return NextResponse.json(
            {
              error:
                `Only ${productStock} item${
                  productStock === 1
                    ? ""
                    : "s"
                } of product ${
                  product.id
                } ${
                  productStock === 1
                    ? "is"
                    : "are"
                } available.`,

              code:
                "INSUFFICIENT_PRODUCT_STOCK",

              productId:
                product.id,

              available:
                productStock,

              requested:
                incomingItem.quantity,
            },
            {
              status: 409,
            }
          );
        }

        const discountUsageKey =
          getDiscountUsageKey(
            product.id,
            null,
            "",
            product.discount &&
              isDiscountActive(
                product.discount
              ) &&
              isValidDirectPrice(
                product.discount.price
              )
              ? "basic"
              : null
          );

        const alreadyRequestedQuantity =
          discountUsageKey
            ? discountUsageByKey.get(
                discountUsageKey
              ) ?? 0
            : 0;

        const resolvedPrice =
          getFinalPriceForQuantity(
            product.price,
            product.discount,
            null,
            "",
            incomingItem.quantity,
            alreadyRequestedQuantity
          );

        if (
          resolvedPrice.discountApplied &&
          discountUsageKey
        ) {
          discountUsageByKey.set(
            discountUsageKey,
            alreadyRequestedQuantity +
              incomingItem.quantity
          );
        }

        validatedItems.push({
          productId:
            product.id,

          name:
            getLocalizedText(
              language,
              product.name
            ),

          price:
            resolvedPrice.finalPrice,

          originalPrice:
            resolvedPrice.originalPrice,

          quantity:
            incomingItem.quantity,

          colorKey:
            "",

          color:
            null,

          sizeKey:
            "",

          customFields:
            [],

          image:
            product.masterImage ??
            product.generalImages[0]
              ?.url ??
            "",

          discountLevel:
            resolvedPrice.discountLevel,

          discountApplied:
            resolvedPrice.discountApplied,
        });

        continue;
      }

      /*
       * --------------------------------------------------
       * PRODUCT WITH VARIANTS
       * --------------------------------------------------
       */

      const variant =
        resolveVariant(
          product,
          incomingItem.colorKey
        );

      if (!variant) {
        return NextResponse.json(
          {
            error:
              `The selected product variant for ${product.id} is no longer available.`,

            code:
              "VARIANT_NOT_AVAILABLE",

            productId:
              product.id,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * --------------------------------------------------
       * VARIANT STOCK
       * --------------------------------------------------
       */

      if (
        !variant.inStock ||
        (
          variant.stock !== null &&
          variant.stock <= 0
        )
      ) {
        return NextResponse.json(
          {
            error:
              `The selected variant of product ${product.id} is currently out of stock.`,

            code:
              "VARIANT_OUT_OF_STOCK",

            productId:
              product.id,

            variantId:
              variant.id,
          },
          {
            status: 409,
          }
        );
      }

      if (
        variant.stock !== null &&
        incomingItem.quantity >
          variant.stock
      ) {
        return NextResponse.json(
          {
            error:
              `Only ${variant.stock} item${
                variant.stock === 1
                  ? ""
                  : "s"
              } of the selected color are available.`,

            code:
              "INSUFFICIENT_VARIANT_STOCK",

            productId:
              product.id,

            variantId:
              variant.id,

            available:
              variant.stock,

            requested:
              incomingItem.quantity,
          },
          {
            status: 409,
          }
        );
      }

      /*
       * --------------------------------------------------
       * SIZE VALIDATION
       * --------------------------------------------------
       */

      const configuredSizes =
        variant.sizes ?? [];

      let sizeKey:
        | ProductSizeKey
        | "" = "";

      if (
        configuredSizes.length >
        0
      ) {
        if (
          !isValidSizeKey(
            incomingItem.sizeKey
          )
        ) {
          return NextResponse.json(
            {
              error:
                `Please select a size for the selected variant of product ${product.id}.`,

              code:
                "SIZE_REQUIRED",

              productId:
                product.id,

              variantId:
                variant.id,
            },
            {
              status: 400,
            }
          );
        }

        const selectedSize =
          configuredSizes.find(
            (size) =>
              size.key ===
              incomingItem.sizeKey
          );

        if (!selectedSize) {
          return NextResponse.json(
            {
              error:
                `The selected size is not available for product ${product.id}.`,

              code:
                "SIZE_NOT_AVAILABLE",

              productId:
                product.id,

              variantId:
                variant.id,

              sizeKey:
                incomingItem.sizeKey,
            },
            {
              status: 400,
            }
          );
        }

        sizeKey =
          incomingItem.sizeKey;
      } else if (
        incomingItem.sizeKey
      ) {
        return NextResponse.json(
          {
            error:
              "The selected variant does not support sizes.",

            code:
              "SIZE_NOT_SUPPORTED",

            productId:
              product.id,

            variantId:
              variant.id,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * --------------------------------------------------
       * CUSTOM FIELD VALIDATION
       * --------------------------------------------------
       */

      const customFieldResult =
        validateCustomFields(
          variant,
          incomingItem.customFields
        );

      if (
        customFieldResult.error
      ) {
        return NextResponse.json(
          {
            error:
              customFieldResult.error,

            code:
              "INVALID_CUSTOM_FIELDS",

            productId:
              product.id,

            variantId:
              variant.id,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * --------------------------------------------------
       * AUTHORITATIVE FINAL UNIT PRICE
       * --------------------------------------------------
       *
       * Original:
       *
       *   size direct price
       *   OR
       *   color direct price
       *   OR
       *   basic price
       *
       * Discount:
       *
       *   only from the same level.
       *
       * No fallback discount is used when a more
       * specific direct price exists without its
       * own discount.
       */

      const resolvedForLevel =
        resolveOriginalPriceAndDiscount(
          product.price,
          product.discount,
          variant,
          sizeKey
        );

      const discountUsageKey =
        getDiscountUsageKey(
          product.id,
          variant,
          sizeKey,
          resolvedForLevel.discountLevel
        );

      const alreadyRequestedQuantity =
        discountUsageKey
          ? discountUsageByKey.get(
              discountUsageKey
            ) ?? 0
          : 0;

      const resolvedPrice =
        getFinalPriceForQuantity(
          product.price,
          product.discount,
          variant,
          sizeKey,
          incomingItem.quantity,
          alreadyRequestedQuantity
        );

      if (
        resolvedPrice.discountApplied &&
        discountUsageKey
      ) {
        discountUsageByKey.set(
          discountUsageKey,
          alreadyRequestedQuantity +
            incomingItem.quantity
        );
      }

      validatedItems.push({
        productId:
          product.id,

        name:
          getLocalizedText(
            language,
            product.name
          ),

        price:
          resolvedPrice.finalPrice,

        originalPrice:
          resolvedPrice.originalPrice,

        quantity:
          incomingItem.quantity,

        colorKey:
          variant.id,

        color:
          variant.color,

        sizeKey,

        customFields:
          customFieldResult.fields ??
          [],

        image:
          variant.images[0]
            ?.url ??
          product.masterImage ??
          product.generalImages[0]
            ?.url ??
          "",

        discountLevel:
          resolvedPrice.discountLevel,

        discountApplied:
          resolvedPrice.discountApplied,
      });
    }

    /*
     * --------------------------------------------------
     * SERVER-SIDE SUBTOTAL
     * --------------------------------------------------
     *
     * `subtotal` is the actual product subtotal
     * AFTER product-level discounts and BEFORE
     * voucher discount.
     *
     * This is the amount used for:
     * - voucher validation
     * - voucher calculation
     * - normal shipping threshold
     */

    const subtotal =
      roundMoney(
        validatedItems.reduce(
          (
            sum,
            item
          ) =>
            sum +
            item.price *
              item.quantity,
          0
        )
      );

    /*
     * --------------------------------------------------
     * VOUCHER
     * --------------------------------------------------
     */

    const normalizedVoucherCode =
      typeof body.voucherCode ===
        "string"
        ? body.voucherCode
            .trim()
            .toUpperCase()
        : "";

    let voucherCode:
      string | null = null;

    let voucherType:
      VoucherType | null = null;

    let voucherId:
      string | null = null;

    let discountAmount =
      0;

    let freeDelivery =
      false;

    if (
      normalizedVoucherCode
    ) {
      try {
        const voucherResult =
          validateVoucherForUser(
            normalizedVoucherCode,
            subtotal,
            userId,
            voucherUserEmail
          );

        voucherCode =
          voucherResult.voucher.code;

        voucherType =
          voucherResult.voucher.type;

        voucherId =
          voucherResult.voucher.id;

        discountAmount =
          roundMoney(
            Math.max(
              0,
              Math.min(
                voucherResult.discountAmount,
                subtotal
              )
            )
          );

        freeDelivery =
          voucherResult.freeDelivery;
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Invalid voucher code.",

            code:
              "INVALID_VOUCHER",
          },
          {
            status: 400,
          }
        );
      }
    }

    /*
     * --------------------------------------------------
     * SHIPPING
     * --------------------------------------------------
     *
     * Normal shipping is based on the product
     * subtotal AFTER product-level discounts and
     * BEFORE voucher discount.
     *
     * Example:
     *
     * Original product price = €55
     * Product discount = €45
     *
     * subtotal = €45
     * => shipping = €3
     *
     * If the discounted product subtotal is
     * €50 or more:
     *
     * => shipping = €0
     *
     * A free-delivery voucher can additionally
     * make shipping free.
     */

    const normalShippingCost =
      subtotal >= 50
        ? 0
        : 3;

    const shippingCost =
      freeDelivery
        ? 0
        : normalShippingCost;

    /*
     * --------------------------------------------------
     * FINAL TOTAL
     * --------------------------------------------------
     */

    const discountedSubtotal =
      roundMoney(
        Math.max(
          0,
          subtotal -
            discountAmount
        )
      );

    const total =
      roundMoney(
        discountedSubtotal +
          shippingCost
      );

    if (
      total <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "The final order total must be greater than €0.00.",

          code:
            "ZERO_ORDER_TOTAL",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * NORMALIZE SHIPPING
     * --------------------------------------------------
     */

    const normalizedShipping:
      ShippingData = {
      firstName:
        body.shipping.firstName.trim(),

      lastName:
        body.shipping.lastName.trim(),

      email:
        body.shipping.email.trim(),

      phone:
        body.shipping.phone.trim(),

      address:
        body.shipping.address.trim(),

      apartment:
        body.shipping.apartment?.trim() ??
        "",

      postalCode:
        body.shipping.postalCode.trim(),

      city:
        body.shipping.city.trim(),

      country:
        "Germany",

      language,
    };

    if (
      session?.user?.email
    ) {
      normalizedShipping.email =
        session.user.email;
    }

    /*
     * --------------------------------------------------
     * CREATE ORDER
     * --------------------------------------------------
     *
     * Each item stores:
     *
     * - final product price actually charged
     * - original direct price
     * - selected color/size
     * - whether a product discount was applied
     * - which pricing level supplied that discount
     *
     * Voucher information remains stored separately
     * in the order columns.
     *
     * Stock, voucher usage and product discount
     * quantitySold are finalized after successful
     * Stripe payment.
     */

    const orderId =
      `JG-${Date.now()
        .toString(36)
        .toUpperCase()}`;

    createdOrderId =
      orderId;

    const createdAt =
      new Date().toISOString();

    database
      .prepare(`
        INSERT INTO orders (
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
          free_delivery,
          voucher_usage_recorded,
          stock_processed
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `)
      .run(
        orderId,

        userId,

        "pending_payment",

        "pending",

        JSON.stringify(
          validatedItems
        ),

        JSON.stringify(
          normalizedShipping
        ),

        subtotal,

        shippingCost,

        total,

        createdAt,

        voucherId,

        voucherCode,

        voucherType,

        discountAmount,

        freeDelivery
          ? 1
          : 0,

        0,

        0
      );

    /*
     * --------------------------------------------------
     * STRIPE CHECKOUT
     * --------------------------------------------------
     */

    const baseUrl =
      process.env
        .NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const stripeLocale =
      language === "de"
        ? "de"
        : language === "ar"
          ? "auto"
          : "en";

    /*
     * Product discounts are already included
     * in `validatedItems.price`.
     *
     * Voucher discount is allocated separately
     * over those already-discounted prices.
     */

    const lineItems =
      buildStripeProductLineItems(
        validatedItems,
        discountAmount
      );

    /*
     * --------------------------------------------------
     * SHIPPING LINE ITEM
     * --------------------------------------------------
     */

    if (
      shippingCost > 0
    ) {
      const shippingNames:
        Record<
          Language,
          string
        > = {
        en:
          "Shipping",

        de:
          "Versand",

        ar:
          "الشحن",
      };

      lineItems.push({
        price_data: {
          currency:
            "eur",

          product_data: {
            name:
              shippingNames[
                language
              ],
          },

          unit_amount:
            toCents(
              shippingCost
            ),
        },

        quantity: 1,
      });
    }

    /*
     * --------------------------------------------------
     * VERIFY STRIPE TOTAL
     * --------------------------------------------------
     */

    const stripeTotalCents =
      lineItems.reduce(
        (
          sum,
          lineItem
        ) =>
          sum +
          lineItem.price_data
            .unit_amount *
            lineItem.quantity,
        0
      );

    const expectedTotalCents =
      toCents(total);

    if (
      stripeTotalCents !==
      expectedTotalCents
    ) {
      console.error(
        "Stripe total mismatch:",
        {
          orderId,

          stripeTotalCents,

          expectedTotalCents,

          subtotal,

          discountAmount,

          shippingCost,

          total,
        }
      );

      return NextResponse.json(
        {
          error:
            "Unable to create the payment session because the calculated order total does not match the payment amount.",

          code:
            "PAYMENT_TOTAL_MISMATCH",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * --------------------------------------------------
     * CREATE STRIPE SESSION
     * --------------------------------------------------
     */

    const checkoutSession =
      await stripe.checkout.sessions.create(
        {
          mode:
            "payment",

          line_items:
            lineItems,

          /*
           * Product discounts are already reflected
           * in the item prices.
           *
           * Voucher discount is allocated directly
           * into the product line items.
           *
           * Shipping remains untouched.
           */

          customer_email:
            normalizedShipping.email,

          client_reference_id:
            orderId,

          metadata: {
            orderId,

            userId:
              userId ?? "",

            language,

            voucherCode:
              voucherCode ?? "",

            voucherType:
              voucherType ?? "",

            voucherId:
              voucherId ?? "",

            discountAmount:
              discountAmount.toFixed(
                2
              ),

            freeDelivery:
              freeDelivery
                ? "true"
                : "false",
          },

          locale:
            stripeLocale,

          submit_type:
            "pay",

          success_url:
            `${baseUrl}/order-success?order=${encodeURIComponent(
              orderId
            )}`,

          cancel_url:
            `${baseUrl}/payment?payment=cancelled&order=${encodeURIComponent(
              orderId
            )}`,
        }
      );

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return NextResponse.json({
      success: true,

      order: {
        id:
          orderId,

        status:
          "pending_payment",

        paymentStatus:
          "pending",

        createdAt,

        subtotal,

        voucherCode,

        voucherType,

        discountAmount,

        freeDelivery,

        discountedSubtotal,

        shippingCost,

        total,
      },

      checkoutUrl:
        checkoutSession.url,
    });
  } catch (error) {
    console.error(
      "Create Stripe checkout error:",
      error
    );

    /*
     * If the order was created but Stripe
     * checkout creation failed, remove the
     * still-pending order.
     *
     * No stock, voucher usage or product
     * discount quantity has been consumed
     * at this stage.
     */

    if (
      createdOrderId
    ) {
      try {
        database
          .prepare(
            `
              DELETE FROM orders
              WHERE id = ?
                AND status = 'pending_payment'
                AND payment_status = 'pending'
            `
          )
          .run(
            createdOrderId
          );
      } catch (
        cleanupError
      ) {
        console.error(
          "Failed to clean up pending order after checkout error:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Unable to start the payment process. Please try again.",

        code:
          "CHECKOUT_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}