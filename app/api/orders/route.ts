import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";

import { auth } from "@/lib/auth";

import {
  getProductById,
  type ProductVariantRecord,
} from "@/lib/product-db";

type ProductSizeKey =
  | "small"
  | "medium"
  | "large";

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

  /*
   * These values are accepted for backwards
   * compatibility but are NEVER trusted for
   * pricing.
   */
  name?: string;
  price?: number;
  image?: string;
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
};

type CreateOrderBody = {
  items: IncomingOrderItem[];
  shipping: ShippingData;
  subtotal?: number;
  shippingCost?: number;
  total?: number;
};

type ValidatedCustomField = {
  id: string;
  label: string;
  value: string;
};

type LocalizedColor = {
  en: string;
  de: string;
  ar: string;
};

type ValidatedOrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  colorKey: string;
  color: LocalizedColor | null;
  sizeKey: ProductSizeKey | "";
  sizePrice: number | null;
  customFields: ValidatedCustomField[];
  image: string;
};

type StoredOrderItem = {
  productId?: unknown;
  colorKey?: unknown;
  color?: unknown;
  [key: string]: unknown;
};

const database = new DatabaseSync(
  "database.sqlite"
);

database.exec(`
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
    created_at TEXT NOT NULL
  )
`);

function roundMoney(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

function isValidQuantity(
  quantity: unknown
): quantity is number {
  return (
    typeof quantity === "number" &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= 100
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
    typeof shipping.firstName === "string" &&
    shipping.firstName.trim().length > 0 &&
    typeof shipping.lastName === "string" &&
    shipping.lastName.trim().length > 0 &&
    typeof shipping.email === "string" &&
    shipping.email.trim().length > 0 &&
    typeof shipping.phone === "string" &&
    shipping.phone.trim().length > 0 &&
    typeof shipping.address === "string" &&
    shipping.address.trim().length > 0 &&
    typeof shipping.postalCode === "string" &&
    shipping.postalCode.trim().length > 0 &&
    typeof shipping.city === "string" &&
    shipping.city.trim().length > 0 &&
    shipping.country === "Germany"
  );
}

function resolveVariant(
  product: NonNullable<
    ReturnType<typeof getProductById>
  >,
  colorKey?: string
) {
  const variants =
    product.variants.filter(
      (variant) => variant.active
    );

  if (
    variants.length === 1 &&
    (!colorKey ||
      colorKey.trim() === "")
  ) {
    return variants[0];
  }

  const normalizedKey = String(
    colorKey ?? ""
  )
    .trim()
    .toLowerCase();

  if (!normalizedKey) {
    return null;
  }

  const byId = variants.find(
    (variant) =>
      variant.id.toLowerCase() ===
      normalizedKey
  );

  if (byId) {
    return byId;
  }

  if (/^\d+$/.test(normalizedKey)) {
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

  const byColor = variants.find(
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

/**
 * Resolves the final color/basic price.
 *
 * Pricing priority:
 * 1. Variant/color price when explicitly configured.
 * 2. Product basic price as fallback.
 *
 * `null` means the variant has no color-specific
 * price and the product basic price must be used.
 */
function resolveColorPrice(
  productPrice: number,
  variant: ProductVariantRecord
) {
  if (
    typeof variant.price === "number" &&
    Number.isFinite(variant.price) &&
    variant.price >= 0
  ) {
    return roundMoney(
      variant.price
    );
  }

  return roundMoney(
    productPrice
  );
}

/**
 * Resolves the final price configured for a size.
 *
 * The size price is already the COMPLETE final
 * price. It is NOT an extra/additional price.
 *
 * Returns null when the size has no special price.
 */
function resolveSizePrice(
  variant: ProductVariantRecord,
  sizeKey: ProductSizeKey
): number | null {
  const size = (
    variant.sizes ?? []
  ).find(
    (item) =>
      item.key === sizeKey
  );

  if (!size) {
    return null;
  }

  if (
    typeof size.price !== "number" ||
    !Number.isFinite(size.price) ||
    size.price < 0
  ) {
    return null;
  }

  return roundMoney(
    size.price
  );
}

function validateCustomFields(
  variant: ProductVariantRecord,
  incoming:
    | IncomingCustomField[]
    | undefined
) {
  const fields =
    variant.customFields ?? [];

  const received =
    Array.isArray(incoming)
      ? incoming
      : [];

  /*
   * Every configured custom field is
   * mandatory.
   */
  if (
    received.length !==
    fields.length
  ) {
    return {
      error:
        "Please complete all required product information.",
      fields: null,
    };
  }

  const receivedById =
    new Map<string, string>();

  for (const field of received) {
    if (
      !field ||
      typeof field.id !== "string" ||
      typeof field.value !== "string"
    ) {
      return {
        error:
          "Invalid custom product information.",
        fields: null,
      };
    }

    const id = field.id.trim();
    const value = field.value.trim();

    if (
      !id ||
      !value ||
      value.length > 500
    ) {
      return {
        error:
          "Please complete all required product information.",
        fields: null,
      };
    }

    if (
      receivedById.has(id)
    ) {
      return {
        error:
          "Duplicate custom product information.",
        fields: null,
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

  for (const field of fields) {
    const value =
      receivedById.get(
        field.id
      );

    if (!value) {
      return {
        error:
          `The required field "${field.label}" is missing.`,
        fields: null,
      };
    }

    normalized.push({
      id: field.id,
      label: field.label,
      value,
    });
  }

  return {
    error: null,
    fields: normalized,
  };
}

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

function resolveStoredOrderColor(
  item: StoredOrderItem
) {
  if (
    isLocalizedColor(item.color)
  ) {
    return item.color;
  }

  const productId =
    typeof item.productId === "string"
      ? item.productId.trim()
      : "";

  if (!productId) {
    return undefined;
  }

  const product =
    getProductById(productId, {
      includeInactive: true,
    });

  if (!product) {
    return undefined;
  }

  const variant =
    resolveVariant(
      product,
      typeof item.colorKey === "string"
        ? item.colorKey
        : undefined
    );

  return variant?.color;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as CreateOrderBody;

    if (
      !Array.isArray(
        body.items
      ) ||
      body.items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Your cart is empty.",
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
        },
        {
          status: 400,
        }
      );
    }

    const validatedItems:
      ValidatedOrderItem[] =
      [];

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
              `Invalid quantity for product ${incomingItem.productId}.`,
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
          },
          {
            status: 409,
          }
        );
      }

      const variant =
        resolveVariant(
          product,
          incomingItem.colorKey
        );

      if (
        product.variants.length > 0 &&
        !variant
      ) {
        return NextResponse.json(
          {
            error:
              `The selected product variant for ${product.id} is no longer available.`,
          },
          {
            status: 400,
          }
        );
      }

      /*
       * ------------------------------------------------
       * PRODUCT WITHOUT VARIANT
       * ------------------------------------------------
       */

      if (!variant) {
        if (
          incomingItem.sizeKey
        ) {
          return NextResponse.json(
            {
              error:
                "This product does not support sizes.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          incomingItem.customFields &&
          incomingItem.customFields.length >
            0
        ) {
          return NextResponse.json(
            {
              error:
                "This product does not support custom information.",
            },
            {
              status: 400,
            }
          );
        }

        if (
          product.stock !== null &&
          (
            product.stock <= 0 ||
            incomingItem.quantity >
              product.stock
          )
        ) {
          return NextResponse.json(
            {
              error:
                `Only ${product.stock ?? 0} item${
                  product.stock === 1
                    ? ""
                    : "s"
                } of product ${
                  product.id
                } are available.`,
            },
            {
              status: 409,
            }
          );
        }

        validatedItems.push({
          productId:
            product.id,

          name:
            product.name.en,

          price:
            roundMoney(
              product.price
            ),

          quantity:
            incomingItem.quantity,

          colorKey:
            "",

          color:
            null,

          sizeKey:
            "",

          sizePrice:
            null,

          customFields:
            [],

          image:
            product.masterImage ??
            product.generalImages[0]
              ?.url ??
            "",
        });

        continue;
      }

      /*
       * ------------------------------------------------
       * VARIANT STOCK
       * ------------------------------------------------
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
              `The selected variant for product ${product.id} is currently out of stock.`,
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
              } of the selected variant are available.`,
          },
          {
            status: 409,
          }
        );
      }

      /*
       * ------------------------------------------------
       * SIZE VALIDATION
       * ------------------------------------------------
       */

      const configuredSizes =
        variant.sizes ?? [];

      let sizeKey:
        | ProductSizeKey
        | "" = "";

      let sizePrice:
        number | null = null;

      if (
        configuredSizes.length > 0
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
            },
            {
              status: 400,
            }
          );
        }

        const configuredSize =
          configuredSizes.find(
            (item) =>
              item.key ===
              incomingItem.sizeKey
          );

        if (!configuredSize) {
          return NextResponse.json(
            {
              error:
                `The selected size is not available for product ${product.id}.`,
            },
            {
              status: 400,
            }
          );
        }

        sizeKey =
          incomingItem.sizeKey;

        /*
         * `size.price` is a COMPLETE FINAL
         * price, not an additional amount.
         *
         * null means:
         * use the color price/basic price fallback.
         */
        sizePrice =
          resolveSizePrice(
            variant,
            incomingItem.sizeKey
          );
      } else if (
        incomingItem.sizeKey
      ) {
        return NextResponse.json(
          {
            error:
              "The selected variant does not support sizes.",
          },
          {
            status: 400,
          }
        );
      }

      /*
       * ------------------------------------------------
       * CUSTOM FIELD VALIDATION
       * ------------------------------------------------
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
          },
          {
            status: 400,
          }
        );
      }

      /*
       * ------------------------------------------------
       * FINAL AUTHORITATIVE PRICE
       * ------------------------------------------------
       *
       * Pricing priority:
       *
       * 1. Size price
       * 2. Color/variant price
       * 3. Basic product price
       *
       * No prices are added together.
       */

      const colorPrice =
        resolveColorPrice(
          product.price,
          variant
        );

      const finalUnitPrice =
        sizePrice !== null
          ? sizePrice
          : colorPrice;

      validatedItems.push({
        productId:
          product.id,

        name:
          product.name.en,

        price:
          roundMoney(
            finalUnitPrice
          ),

        quantity:
          incomingItem.quantity,

        colorKey:
          variant.id,

        color:
          variant.color,

        sizeKey,

        sizePrice,

        customFields:
          customFieldResult.fields ??
          [],

        image:
          variant.images[0]?.url ??
          product.masterImage ??
          product.generalImages[0]?.url ??
          "",
      });
    }

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

    const shippingCost =
      subtotal >= 50
        ? 0
        : 3;

    const total =
      roundMoney(
        subtotal +
          shippingCost
      );

    const session =
      await auth.api.getSession({
        headers:
          request.headers,
      });

    const userId =
      session?.user?.id ??
      null;

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
      };

    if (
      session?.user?.email
    ) {
      normalizedShipping.email =
        session.user.email;
    }

    const orderId =
      `JG-${Date.now()
        .toString(36)
        .toUpperCase()}`;

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
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        createdAt
      );

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

        shippingCost,

        total,
      },
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to create the order.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(
  request: Request
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

    const rows =
      database
        .prepare(`
          SELECT
            id,
            status,
            payment_status,
            items_json,
            shipping_json,
            subtotal,
            shipping_cost,
            total,
            created_at
          FROM orders
          WHERE user_id = ?
          ORDER BY created_at DESC
        `)
        .all(
          session.user.id
        ) as Array<{
          id: string;
          status: string;
          payment_status: string;
          items_json: string;
          shipping_json: string;
          subtotal: number;
          shipping_cost: number;
          total: number;
          created_at: string;
        }>;

    const orders =
      rows.map(
        (order) => {
          let rawItems: unknown[] = [];

          try {
            const parsed =
              JSON.parse(
                order.items_json
              );

            rawItems =
              Array.isArray(parsed)
                ? parsed
                : [];
          } catch {
            rawItems = [];
          }

          /*
           * Keep the stored order snapshot untouched.
           * For older orders that did not store the localized
           * color object, resolve it from the historical colorKey
           * against the current product data as a fallback.
           */
          const items =
            rawItems.map(
              (rawItem) => {
                if (
                  typeof rawItem !== "object" ||
                  rawItem === null
                ) {
                  return rawItem;
                }

                const item =
                  rawItem as StoredOrderItem;

                if (
                  isLocalizedColor(
                    item.color
                  )
                ) {
                  return rawItem;
                }

                const color =
                  resolveStoredOrderColor(
                    item
                  );

                if (!color) {
                  return rawItem;
                }

                return {
                  ...item,
                  color,
                };
              }
            );

          return {
            id:
              order.id,

            status:
              order.status,

            paymentStatus:
              order.payment_status,

            items,

            shipping:
              JSON.parse(
                order.shipping_json
              ),

            subtotal:
              order.subtotal,

            shippingCost:
              order.shipping_cost,

            total:
              order.total,

            createdAt:
              order.created_at,
          };
        }
      );

    return NextResponse.json({
      orders,
    });
  } catch (error) {
    console.error(
      "Get orders error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load orders.",
      },
      {
        status: 500,
      }
    );
  }
}