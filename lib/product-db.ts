import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export type ProductLanguage =
  | "en"
  | "de"
  | "ar";

export type ProductLocalizedText =
  Record<ProductLanguage, string>;

export type ProductImageRecord = {
  id: string;
  url: string;
  sortOrder: number;
};

export type ProductPriceDiscount = {
  /*
   * Percentage of the original price that is discounted.
   *
   * Example:
   * original price = €30
   * percentage = 20
   * price = €24
   */
  percentage: number;

  /*
   * Complete final price while the discount is active.
   *
   * This is NOT an extra amount.
   */
  price: number;

  /*
   * Maximum number of units that can use this discount.
   *
   * null = unlimited.
   */
  quantityLimit: number | null;

  /*
   * Number of units already sold using this discount.
   */
  quantitySold: number;

  /*
   * Optional validity period.
   *
   * null = no restriction.
   */
  startsAt: string | null;
  endsAt: string | null;
};

export type ProductVariantSizeKey =
  | "small"
  | "medium"
  | "large";

export type ProductVariantSize = {
  key: ProductVariantSizeKey;

  /*
   * Final price for this size.
   *
   * null means:
   * - no size-specific price is configured
   * - use the color price
   * - or the product basic price
   *
   * A number is the COMPLETE final price.
   * It is NOT an extra/additional price.
   */
  price: number | null;

  /*
   * Optional discount for this specific size price.
   *
   * The discount belongs to the size price itself.
   */
  discount: ProductPriceDiscount | null;
};

export type ProductVariantCustomField = {
  id: string;
  label: string;
};

export type ProductVariantRecord = {
  id: string;
  color: ProductLocalizedText;

  /*
   * Final price for this color.
   *
   * null means:
   * - no color-specific price is configured
   * - use the product basic price
   *
   * A number replaces the product basic price.
   */
  price: number | null;

  /*
   * Optional discount for this specific color price.
   */
  discount: ProductPriceDiscount | null;

  sizes: ProductVariantSize[];

  customFields: ProductVariantCustomField[];

  images: ProductImageRecord[];
  sortOrder: number;
  active: boolean;
  inStock: boolean;
  stock: number | null;
};

export type ProductRecord = {
  id: string;
  slug: string;
  name: ProductLocalizedText;
  description: ProductLocalizedText;

  /*
   * Original/basic/default product price.
   *
   * This value is NEVER replaced by the discounted price.
   */
  price: number;

  /*
   * Optional discount for the basic product price.
   */
  discount: ProductPriceDiscount | null;

  category: string;
  emoji: string;
  masterImage: string | null;
  generalImages: ProductImageRecord[];
  variants: ProductVariantRecord[];
  featured: boolean;
  active: boolean;
  inStock: boolean;
  stock: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductImageInput = {
  id?: string;
  url: string;
};

export type ProductVariantInput = {
  id?: string;
  color: ProductLocalizedText;

  /*
   * Final color price.
   *
   * undefined / null = no color-specific price.
   * number = complete final price for the color.
   */
  price?: number | null;

  /*
   * Optional discount for the color price.
   */
  discount?: ProductPriceDiscount | null;

  sizes?: ProductVariantSize[];

  customFields?: ProductVariantCustomField[];

  images: ProductImageInput[];
  active?: boolean;
  inStock?: boolean;
  stock?: number | null;
};

export type ProductWriteInput = {
  id: string;
  slug: string;
  name: ProductLocalizedText;
  description: ProductLocalizedText;

  /*
   * Basic/default/fallback product price.
   *
   * This remains the original price even when
   * a discount is active.
   */
  price: number;

  /*
   * Optional discount for the basic product price.
   */
  discount?: ProductPriceDiscount | null;

  category: string;
  emoji: string;
  masterImage: string | null;
  generalImages: ProductImageInput[];
  variants: ProductVariantInput[];
  featured: boolean;
  active: boolean;
  inStock: boolean;
  stock?: number | null;
};

type ProductRow = {
  id: string;
  slug: string;
  name_json: string;
  description_json: string;
  price: number;
  discount_json: string | null;
  category: string;
  emoji: string;
  master_image: string | null;
  featured: number;
  active: number;
  in_stock: number;
  stock: number | null;
  created_at: string;
  updated_at: string;
};

type ProductVariantRow = {
  id: string;
  color_json: string;

  /*
   * Nullable by design.
   *
   * NULL = no color override.
   */
  price: number | null;

  discount_json: string | null;

  sizes_json: string | null;
  custom_fields_json: string | null;

  sort_order: number;
  active: number;
  in_stock: number;
  stock: number | null;
};

type ProductImageRow = {
  id: string;
  variant_id: string | null;
  image_url: string;
  sort_order: number;
};

type SQLInputValue =
  | string
  | number
  | bigint
  | null
  | Uint8Array;

const database =
  new DatabaseSync(
    "database.sqlite"
  );

database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = ON;
`);

/*
 * ============================================================
 * Availability migrations
 * ============================================================
 */

try {
  database.exec(`
    ALTER TABLE products
    ADD COLUMN in_stock INTEGER NOT NULL DEFAULT 1
  `);
} catch {
  // Column already exists.
}

try {
  database.exec(`
    ALTER TABLE product_variants
    ADD COLUMN in_stock INTEGER NOT NULL DEFAULT 1
  `);
} catch {
  // Column already exists.
}

try {
  database.exec(`
    ALTER TABLE products
    ADD COLUMN stock INTEGER
  `);
} catch {
  // Column already exists.
}

try {
  database.exec(`
    ALTER TABLE product_variants
    ADD COLUMN stock INTEGER
  `);
} catch {
  // Column already exists.
}

/*
 * ============================================================
 * Variant pricing / options migration
 * ============================================================
 *
 * New pricing model:
 *
 * Basic Price
 *     ↓
 * Color Price replaces Basic Price
 *     ↓
 * Size Price replaces Color/Basic Price
 *
 * Size prices are COMPLETE final prices.
 *
 * Discounts are stored separately from original prices.
 *
 * Original price hierarchy:
 *
 * Basic Price
 *     ↓
 * Color Price, when configured
 *     ↓
 * Size Price, when configured
 *
 * A discount never replaces the stored original price.
 */

try {
  database.exec(`
    ALTER TABLE product_variants
    ADD COLUMN price REAL
  `);
} catch {
  // Column already exists.
}

try {
  database.exec(`
    ALTER TABLE product_variants
    ADD COLUMN sizes_json TEXT NOT NULL DEFAULT '[]'
  `);
} catch {
  // Column already exists.
}

try {
  database.exec(`
    ALTER TABLE product_variants
    ADD COLUMN custom_fields_json TEXT NOT NULL DEFAULT '[]'
  `);
} catch {
  // Column already exists.
}

/*
 * ============================================================
 * Discount migrations
 * ============================================================
 *
 * Product discount:
 *   products.discount_json
 *
 * Color/variant discount:
 *   product_variants.discount_json
 *
 * Size discount:
 *   stored inside the corresponding size object in sizes_json
 *
 * NULL / empty JSON means there is no configured discount.
 */

try {
  database.exec(`
    ALTER TABLE products
    ADD COLUMN discount_json TEXT
  `);
} catch {
  // Column already exists.
}

try {
  database.exec(`
    ALTER TABLE product_variants
    ADD COLUMN discount_json TEXT
  `);
} catch {
  // Column already exists.
}

/*
 * Existing old rows had NULL variant prices.
 *
 * Temporarily use the product price so that we can
 * correctly convert old size extra prices below.
 *
 * After the migration, values equal to the basic
 * product price are converted back to NULL because
 * NULL means "use the basic price".
 */
try {
  database.exec(`
    UPDATE product_variants
    SET price = (
      SELECT products.price
      FROM products
      WHERE products.id = product_variants.product_id
    )
    WHERE price IS NULL
  `);
} catch {
  /*
   * Read paths still safely handle NULL if the
   * database is in a partially migrated state.
   */
}

/*
 * Convert old size pricing:
 *
 * Old:
 *   {
 *     key: "small",
 *     extraPrice: 5
 *   }
 *
 * New:
 *   {
 *     key: "small",
 *     price: 15,
 *     discount: null
 *   }
 *
 * If old extraPrice was 0, there was no size-specific
 * override, so we preserve that as NULL.
 *
 * Also convert old color prices that were exactly equal
 * to the product basic price into NULL.
 *
 * This migration is safe to run again because already
 * migrated size records contain "price" rather than
 * "extraPrice".
 *
 * Existing discount data is preserved only when the
 * corresponding direct price still exists.
 */
try {
  const migrationRows =
    database
      .prepare(`
        SELECT
          product_variants.id,
          product_variants.price,
          product_variants.sizes_json,
          products.price AS product_price
        FROM product_variants
        INNER JOIN products
          ON products.id = product_variants.product_id
      `)
      .all() as unknown as Array<{
      id: string;
      price: number | null;
      sizes_json: string | null;
      product_price: number;
    }>;

  const updateVariant =
    database.prepare(`
      UPDATE product_variants
      SET
        price = ?,
        sizes_json = ?
      WHERE id = ?
    `);

  for (
    const row of migrationRows
  ) {
    const oldVariantPrice =
      row.price === null ||
      row.price === undefined
        ? Number(row.product_price)
        : Number(row.price);

    const basicPrice =
      Number(row.product_price);

    let convertedSizes:
      unknown[] = [];

    if (
      row.sizes_json?.trim()
    ) {
      try {
        const parsed: unknown =
          JSON.parse(
            row.sizes_json
          );

        if (
          Array.isArray(parsed)
        ) {
          convertedSizes =
            parsed
              .filter(
                (item) =>
                  item &&
                  typeof item ===
                    "object"
              )
              .map(
                (item) => {
                  const record =
                    item as Record<
                      string,
                      unknown
                    >;

                  const key =
                    record.key;

                  if (
                    key !== "small" &&
                    key !== "medium" &&
                    key !== "large"
                  ) {
                    return null;
                  }

                  /*
                   * Already migrated.
                   *
                   * Keep direct final prices exactly as
                   * they are. Do not add anything.
                   *
                   * A discount is valid only when this
                   * size has its own direct price.
                   */
                  if (
                    "price" in record
                  ) {
                    const directPrice =
                      record.price;

                    const discount =
                      record.discount;

                    if (
                      directPrice ===
                        null ||
                      directPrice ===
                        undefined ||
                      directPrice === ""
                    ) {
                      return {
                        key,
                        price: null,
                        discount:
                          null,
                      };
                    }

                    const numericPrice =
                      Number(
                        directPrice
                      );

                    if (
                      !Number.isFinite(
                        numericPrice
                      ) ||
                      numericPrice < 0
                    ) {
                      return null;
                    }

                    return {
                      key,
                      price:
                        normalizePrice(
                          numericPrice
                        ),
                      discount:
                        discount ?? null,
                    };
                  }

                  /*
                   * Old format.
                   *
                   * Convert the old additional amount
                   * into the COMPLETE final size price.
                   */
                  const extraPrice =
                    Number(
                      record.extraPrice
                    );

                  if (
                    !Number.isFinite(
                      extraPrice
                    ) ||
                    extraPrice < 0
                  ) {
                    return null;
                  }

                  /*
                   * Old extraPrice = 0 means
                   * no size-specific override.
                   */
                  if (
                    extraPrice === 0
                  ) {
                    return {
                      key,
                      price: null,
                      discount: null,
                    };
                  }

                  return {
                    key,
                    price:
                      normalizePrice(
                        oldVariantPrice +
                          extraPrice
                      ),
                    discount: null,
                  };
                }
              )
              .filter(
                (
                  item
                ): item is NonNullable<
                  typeof item
                > =>
                  item !== null
              );
        }
      } catch {
        convertedSizes = [];
      }
    }

    /*
     * Old variant prices that were equal to the
     * basic price are equivalent to "no color override".
     */
    const nextVariantPrice =
      oldVariantPrice === basicPrice
        ? null
        : normalizePrice(
            oldVariantPrice
          );

    updateVariant.run(
      nextVariantPrice,
      JSON.stringify(
        convertedSizes
      ),
      row.id
    );
  }
} catch {
  /*
   * Do not prevent the application from starting
   * if a legacy database is temporarily inconsistent.
   */
}

function parseLocalizedText(
  value: string
): ProductLocalizedText {
  try {
    const parsed: unknown =
      JSON.parse(value);

    if (
      typeof parsed !== "object" ||
      parsed === null
    ) {
      return {
        en: "",
        de: "",
        ar: "",
      };
    }

    const record =
      parsed as Record<
        string,
        unknown
      >;

    return {
      en:
        typeof record.en ===
        "string"
          ? record.en
          : "",
      de:
        typeof record.de ===
        "string"
          ? record.de
          : "",
      ar:
        typeof record.ar ===
        "string"
          ? record.ar
          : "",
    };
  } catch {
    return {
      en: "",
      de: "",
      ar: "",
    };
  }
}

function normalizeLocalizedText(
  value: ProductLocalizedText
): ProductLocalizedText {
  return {
    en: value.en.trim(),
    de: value.de.trim(),
    ar: value.ar.trim(),
  };
}

function normalizePrice(
  value: number
): number {
  return Math.round(
    value * 100
  ) / 100;
}

function normalizeStock(
  value: number | null | undefined
): number | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      "Stock must be a non-negative integer or null."
    );
  }

  return value;
}

function normalizeVariantPrice(
  value:
    | number
    | null
    | undefined
): number | null {
  /*
   * null / undefined means:
   * no color-specific price.
   */
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      "Variant price must be a valid non-negative number or null."
    );
  }

  return normalizePrice(
    value
  );
}

function normalizeDiscount(
  value:
    | ProductPriceDiscount
    | null
    | undefined
): ProductPriceDiscount | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value !== "object"
  ) {
    throw new Error(
      "Discount must be an object or null."
    );
  }

  const percentage =
    Number(
      value.percentage
    );

  const price =
    Number(
      value.price
    );

  if (
    !Number.isFinite(
      percentage
    ) ||
    percentage < 0 ||
    percentage > 100
  ) {
    throw new Error(
      "Discount percentage must be between 0 and 100."
    );
  }

  if (
    !Number.isFinite(
      price
    ) ||
    price < 0
  ) {
    throw new Error(
      "Discount price must be a valid non-negative number."
    );
  }

  const quantityLimit =
    value.quantityLimit ===
      null ||
    value.quantityLimit ===
      undefined
      ? null
      : Number(
          value.quantityLimit
        );

  if (
    quantityLimit !== null &&
    (
      !Number.isInteger(
        quantityLimit
      ) ||
      quantityLimit < 0
    )
  ) {
    throw new Error(
      "Discount quantity limit must be a non-negative integer or null."
    );
  }

  const quantitySold =
    Number(
      value.quantitySold
    );

  if (
    !Number.isInteger(
      quantitySold
    ) ||
    quantitySold < 0
  ) {
    throw new Error(
      "Discount quantity sold must be a non-negative integer."
    );
  }

  return {
    percentage:
      normalizePrice(
        percentage
      ),

    price:
      normalizePrice(
        price
      ),

    quantityLimit,

    quantitySold,

    startsAt:
      value.startsAt ===
        null ||
      value.startsAt ===
        undefined ||
      value.startsAt === ""
        ? null
        : String(
            value.startsAt
          ).trim(),

    endsAt:
      value.endsAt ===
        null ||
      value.endsAt ===
        undefined ||
      value.endsAt === ""
        ? null
        : String(
            value.endsAt
          ).trim(),
  };
}

function parseDiscount(
  value: string | null | undefined
): ProductPriceDiscount | null {
  if (
    !value?.trim()
  ) {
    return null;
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (
      !parsed ||
      typeof parsed !==
        "object"
    ) {
      return null;
    }

    const record =
      parsed as Record<
        string,
        unknown
      >;

    const normalized =
      normalizeDiscount({
        percentage:
          Number(
            record.percentage
          ),

        price:
          Number(
            record.price
          ),

        quantityLimit:
          record.quantityLimit ===
            null ||
          record.quantityLimit ===
            undefined
            ? null
            : Number(
                record.quantityLimit
              ),

        quantitySold:
          Number(
            record.quantitySold ??
              0
          ),

        startsAt:
          record.startsAt ===
              null ||
          record.startsAt ===
              undefined
            ? null
            : String(
                record.startsAt
              ),

        endsAt:
          record.endsAt ===
              null ||
          record.endsAt ===
              undefined
            ? null
            : String(
                record.endsAt
              ),
      });

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Returns true when a discount is currently usable.
 *
 * The original price is never modified.
 *
 * Expiration is calculated dynamically, so no cron job
 * or background task is required.
 */
export function isDiscountActive(
  discount: ProductPriceDiscount | null | undefined,
  now: Date = new Date()
): boolean {
  if (!discount) {
    return false;
  }

  if (
    discount.quantityLimit !== null &&
    discount.quantitySold >=
      discount.quantityLimit
  ) {
    return false;
  }

  const nowTime =
    now.getTime();

  if (
    discount.startsAt
  ) {
    const startsAt =
      Date.parse(
        discount.startsAt
      );

    if (
      !Number.isNaN(
        startsAt
      ) &&
      nowTime < startsAt
    ) {
      return false;
    }
  }

  if (
    discount.endsAt
  ) {
    const endsAt =
      Date.parse(
        discount.endsAt
      );

    if (
      !Number.isNaN(
        endsAt
      ) &&
      nowTime >= endsAt
    ) {
      return false;
    }
  }

  return true;
}

function normalizeSizeKey(
  value: unknown
): ProductVariantSizeKey {
  if (
    value === "small" ||
    value === "medium" ||
    value === "large"
  ) {
    return value;
  }

  throw new Error(
    "Invalid variant size."
  );
}

function normalizeVariantSizes(
  value:
    | ProductVariantSize[]
    | undefined
): ProductVariantSize[] {
  if (
    value === undefined
  ) {
    return [];
  }

  if (
    !Array.isArray(value)
  ) {
    throw new Error(
      "Variant sizes must be an array."
    );
  }

  const seen =
    new Set<ProductVariantSizeKey>();

  return value.map(
    (size) => {
      if (
        !size ||
        typeof size !==
          "object"
      ) {
        throw new Error(
          "Each variant size must be an object."
        );
      }

      const key =
        normalizeSizeKey(
          size.key
        );

      if (
        seen.has(key)
      ) {
        throw new Error(
          `Duplicate variant size: ${key}.`
        );
      }

      seen.add(key);

      const rawPrice =
        size.price;

      /*
       * null / undefined = no size override.
       *
       * A size without its own direct price cannot
       * have its own direct discount.
       */
      if (
        rawPrice === null ||
        rawPrice === undefined
      ) {
        return {
          key,
          price: null,
          discount: null,
        };
      }

      const price =
        Number(
          rawPrice
        );

      if (
        !Number.isFinite(
          price
        ) ||
        price < 0
      ) {
        throw new Error(
          "Size price must be a valid non-negative number or null."
        );
      }

      return {
        key,
        price:
          normalizePrice(
            price
          ),
        discount:
          normalizeDiscount(
            size.discount
          ),
      };
    }
  );
}

function normalizeVariantCustomFields(
  value:
    | ProductVariantCustomField[]
    | undefined
): ProductVariantCustomField[] {
  if (
    value === undefined
  ) {
    return [];
  }

  if (
    !Array.isArray(value)
  ) {
    throw new Error(
      "Variant custom fields must be an array."
    );
  }

  return value.map(
    (field) => {
      if (
        !field ||
        typeof field !==
          "object"
      ) {
        throw new Error(
          "Each custom field must be an object."
        );
      }

      const label =
        typeof field.label ===
        "string"
          ? field.label.trim()
          : "";

      if (!label) {
        throw new Error(
          "Custom field label is required."
        );
      }

      const id =
        typeof field.id ===
          "string" &&
        field.id.trim()
          ? field.id.trim()
          : randomUUID();

      return {
        id,
        label,
      };
    }
  );
}

function parseVariantSizes(
  value: string | null | undefined
): ProductVariantSize[] {
  if (
    !value?.trim()
  ) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    const result: ProductVariantSize[] =
      [];

    const seen =
      new Set<ProductVariantSizeKey>();

    for (
      const item of parsed
    ) {
      if (
        !item ||
        typeof item !==
          "object"
      ) {
        continue;
      }

      const record =
        item as Record<
          string,
          unknown
        >;

      const key =
        record.key;

      if (
        key !== "small" &&
        key !== "medium" &&
        key !== "large"
      ) {
        continue;
      }

      if (
        seen.has(key)
      ) {
        continue;
      }

      /*
       * New format:
       *
       * {
       *   key: "small",
       *   price: 15,
       *   discount: {...}
       * }
       *
       * The price is already the COMPLETE final
       * original price for the size.
       */
      if (
        "price" in record
      ) {
        const rawPrice =
          record.price;

        if (
          rawPrice === null ||
          rawPrice === undefined ||
          rawPrice === ""
        ) {
          seen.add(key);

          result.push({
            key,
            price: null,
            discount: null,
          });

          continue;
        }

        const price =
          Number(
            rawPrice
          );

        if (
          !Number.isFinite(
            price
          ) ||
          price < 0
        ) {
          continue;
        }

        const discount =
          normalizeDiscount(
            record.discount as
              | ProductPriceDiscount
              | null
              | undefined
          );

        seen.add(key);

        result.push({
          key,
          price:
            normalizePrice(
              price
            ),
          discount,
        });

        continue;
      }

      /*
       * Legacy format should normally already have
       * been converted by the database migration above.
       *
       * Do NOT treat extraPrice as a direct final price.
       *
       * There is no reliable parent color/basic price
       * available in this parser, so returning NULL is
       * safer than introducing an incorrect price.
       *
       * The startup migration is responsible for converting
       * legacy extraPrice values before normal reads.
       */
      if (
        "extraPrice" in record
      ) {
        seen.add(key);

        result.push({
          key,
          price: null,
          discount: null,
        });
      }
    }

    return result;
  } catch {
    return [];
  }
}

function parseVariantCustomFields(
  value: string | null | undefined
): ProductVariantCustomField[] {
  if (
    !value?.trim()
  ) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(value);

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    const result: ProductVariantCustomField[] =
      [];

    for (
      const item of parsed
    ) {
      if (
        !item ||
        typeof item !==
          "object"
      ) {
        continue;
      }

      const record =
        item as Record<
          string,
          unknown
        >;

      const label =
        typeof record.label ===
        "string"
          ? record.label.trim()
          : "";

      if (!label) {
        continue;
      }

      const id =
        typeof record.id ===
          "string" &&
        record.id.trim()
          ? record.id.trim()
          : randomUUID();

      result.push({
        id,
        label,
      });
    }

    return result;
  } catch {
    return [];
  }
}

/**
 * Base product availability.
 */
export function isProductBaseAvailable(
  product: Pick<
    ProductRecord,
    "active" | "inStock" | "stock"
  >
): boolean {
  return (
    product.active &&
    product.inStock &&
    (
      product.stock === null ||
      product.stock > 0
    )
  );
}

/**
 * Variant availability.
 */
export function isVariantAvailable(
  variant: Pick<
    ProductVariantRecord,
    | "active"
    | "inStock"
    | "stock"
  >
): boolean {
  return (
    variant.active &&
    variant.inStock &&
    (
      variant.stock === null ||
      variant.stock > 0
    )
  );
}

/**
 * Complete product purchase availability.
 */
export function isProductPurchasable(
  product: ProductRecord
): boolean {
  if (
    !isProductBaseAvailable(
      product
    )
  ) {
    return false;
  }

  if (
    product.variants.length === 0
  ) {
    return true;
  }

  return product.variants.some(
    isVariantAvailable
  );
}

function rowToProduct(
  row: ProductRow
): ProductRecord {
  const productId =
    String(row.id);

  const variantRows =
    database
      .prepare(`
      SELECT
        id,
        color_json,
        price,
        discount_json,
        sizes_json,
        custom_fields_json,
        sort_order,
        active,
        in_stock,
        stock
      FROM product_variants
      WHERE product_id = ?
      ORDER BY sort_order ASC, id ASC
    `)
      .all(
        productId
      ) as unknown as ProductVariantRow[];

  const imageRows =
    database
      .prepare(`
      SELECT
        id,
        variant_id,
        image_url,
        sort_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY sort_order ASC, id ASC
    `)
      .all(
        productId
      ) as unknown as ProductImageRow[];

  const imagesByVariant =
    new Map<
      string,
      ProductImageRecord[]
    >();

  const generalImages: ProductImageRecord[] =
    [];

  for (
    const image of imageRows
  ) {
    const record: ProductImageRecord =
      {
        id: String(image.id),
        url: String(
          image.image_url
        ),
        sortOrder: Number(
          image.sort_order
        ),
      };

    if (
      image.variant_id
    ) {
      const variantId =
        String(
          image.variant_id
        );

      const existing =
        imagesByVariant.get(
          variantId
        ) ?? [];

      existing.push(record);

      imagesByVariant.set(
        variantId,
        existing
      );
    } else {
      generalImages.push(
        record
      );
    }
  }

  const productPrice =
    Number(row.price);

  const variants: ProductVariantRecord[] =
    variantRows.map(
      (variant) => {
        const variantPrice =
          variant.price === null ||
          variant.price ===
            undefined
            ? null
            : normalizePrice(
                Number(
                  variant.price
                )
              );

        return {
          id: String(
            variant.id
          ),

          color:
            parseLocalizedText(
              String(
                variant.color_json
              )
            ),

          price:
            variantPrice,

          /*
           * A color discount is meaningful only when
           * the color has its own direct price.
           */
          discount:
            variantPrice === null
              ? null
              : parseDiscount(
                  variant.discount_json
                ),

          sizes:
            parseVariantSizes(
              variant.sizes_json
            ),

          customFields:
            parseVariantCustomFields(
              variant.custom_fields_json
            ),

          images:
            imagesByVariant.get(
              String(
                variant.id
              )
            ) ?? [],

          sortOrder: Number(
            variant.sort_order
          ),

          active:
            Number(
              variant.active
            ) === 1,

          inStock:
            Number(
              variant.in_stock
            ) === 1,

          stock:
            variant.stock === null ||
            variant.stock ===
              undefined
              ? null
              : Number(
                  variant.stock
                ),
        };
      }
    );

  return {
    id: productId,

    slug: String(
      row.slug
    ),

    name:
      parseLocalizedText(
        String(
          row.name_json
        )
      ),

    description:
      parseLocalizedText(
        String(
          row.description_json
        )
      ),

    price: productPrice,

    discount:
      parseDiscount(
        row.discount_json
      ),

    category: String(
      row.category
    ),

    emoji: String(
      row.emoji
    ),

    masterImage:
      row.master_image ===
        null ||
      row.master_image ===
        undefined
        ? null
        : String(
            row.master_image
          ),

    generalImages,

    variants,

    featured:
      Number(
        row.featured
      ) === 1,

    active:
      Number(
        row.active
      ) === 1,

    inStock:
      Number(
        row.in_stock
      ) === 1,

    stock:
      row.stock === null ||
      row.stock ===
        undefined
        ? null
        : Number(row.stock),

    createdAt: String(
      row.created_at
    ),

    updatedAt: String(
      row.updated_at
    ),
  };
}

function getProductRowById(
  id: string
): ProductRow | undefined {
  return database
    .prepare(`
      SELECT
        id,
        slug,
        name_json,
        description_json,
        price,
        discount_json,
        category,
        emoji,
        master_image,
        featured,
        active,
        in_stock,
        stock,
        created_at,
        updated_at
      FROM products
      WHERE id = ?
      LIMIT 1
    `)
    .get(id) as
    | ProductRow
    | undefined;
}

function getProductRowBySlug(
  slug: string
): ProductRow | undefined {
  return database
    .prepare(`
      SELECT
        id,
        slug,
        name_json,
        description_json,
        price,
        discount_json,
        category,
        emoji,
        master_image,
        featured,
        active,
        in_stock,
        stock,
        created_at,
        updated_at
      FROM products
      WHERE slug = ?
      LIMIT 1
    `)
    .get(slug) as
    | ProductRow
    | undefined;
}

/**
 * Inserts all variants and images belonging to a product.
 */
function insertProductChildren(
  product: ProductWriteInput,
  createdAt: string,
  updatedAt: string
): void {
  const insertVariant =
    database.prepare(`
    INSERT INTO product_variants (
      id,
      product_id,
      color_json,
      price,
      discount_json,
      sizes_json,
      custom_fields_json,
      sort_order,
      active,
      in_stock,
      stock,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertImage =
    database.prepare(`
    INSERT INTO product_images (
      id,
      product_id,
      variant_id,
      image_url,
      sort_order,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (
    let variantIndex = 0;
    variantIndex <
    product.variants.length;
    variantIndex += 1
  ) {
    const variant =
      product.variants[
        variantIndex
      ];

    const variantId =
      variant.id?.trim() ||
      randomUUID();

    const variantStock =
      normalizeStock(
        variant.stock
      );

    const variantInStock =
      variantStock === 0
        ? false
        : variant.inStock !==
            false;

    const variantPrice =
      normalizeVariantPrice(
        variant.price
      );

    /*
     * A color discount belongs only to a direct
     * color price. If the color falls back to the
     * basic price, it must not have its own discount.
     */
    const variantDiscount =
      variantPrice === null
        ? null
        : normalizeDiscount(
            variant.discount
          );

    const sizes =
      normalizeVariantSizes(
        variant.sizes
      );

    const customFields =
      normalizeVariantCustomFields(
        variant.customFields
      );

    insertVariant.run(
      variantId,

      product.id,

      JSON.stringify(
        normalizeLocalizedText(
          variant.color
        )
      ),

      variantPrice,

      variantDiscount === null
        ? null
        : JSON.stringify(
            variantDiscount
          ),

      JSON.stringify(
        sizes
      ),

      JSON.stringify(
        customFields
      ),

      variantIndex,

      variant.active ===
        false
        ? 0
        : 1,

      variantInStock
        ? 1
        : 0,

      variantStock,

      createdAt,

      updatedAt
    );

    for (
      let imageIndex = 0;
      imageIndex <
      variant.images.length;
      imageIndex += 1
    ) {
      const image =
        variant.images[
          imageIndex
        ];

      const imageId =
        image.id?.trim() ||
        randomUUID();

      insertImage.run(
        imageId,

        product.id,

        variantId,

        image.url.trim(),

        imageIndex,

        createdAt,

        updatedAt
      );
    }
  }

  for (
    let imageIndex = 0;
    imageIndex <
    product.generalImages
      .length;
    imageIndex += 1
  ) {
    const image =
      product.generalImages[
        imageIndex
      ];

    const imageId =
      image.id?.trim() ||
      randomUUID();

    insertImage.run(
      imageId,

      product.id,

      null,

      image.url.trim(),

      imageIndex,

      createdAt,

      updatedAt
    );
  }
}

function insertProductRow(
  product: ProductWriteInput,
  createdAt: string,
  updatedAt: string
): void {
  const productStock =
    normalizeStock(
      product.stock
    );

  const productInStock =
    productStock === 0
      ? false
      : product.inStock;

  const productDiscount =
    normalizeDiscount(
      product.discount
    );

  database
    .prepare(`
      INSERT INTO products (
        id,
        slug,
        name_json,
        description_json,
        price,
        discount_json,
        category,
        emoji,
        master_image,
        featured,
        active,
        in_stock,
        stock,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      product.id,

      product.slug,

      JSON.stringify(
        normalizeLocalizedText(
          product.name
        )
      ),

      JSON.stringify(
        normalizeLocalizedText(
          product.description
        )
      ),

      normalizePrice(
        product.price
      ),

      productDiscount === null
        ? null
        : JSON.stringify(
            productDiscount
          ),

      product.category,

      product.emoji,

      product.masterImage,

      product.featured
        ? 1
        : 0,

      product.active
        ? 1
        : 0,

      productInStock
        ? 1
        : 0,

      productStock,

      createdAt,

      updatedAt
    );
}

function deleteProductChildren(
  productId: string
): void {
  database
    .prepare(`
      DELETE FROM product_images
      WHERE product_id = ?
    `)
    .run(productId);

  database
    .prepare(`
      DELETE FROM product_variants
      WHERE product_id = ?
    `)
    .run(productId);
}

export function getProductById(
  id: string,
  options?: {
    includeInactive?: boolean;
  }
): ProductRecord | null {
  const includeInactive =
    options?.includeInactive ?? false;

  const row =
    database
      .prepare(`
      SELECT
        id,
        slug,
        name_json,
        description_json,
        price,
        discount_json,
        category,
        emoji,
        master_image,
        featured,
        active,
        in_stock,
        stock,
        created_at,
        updated_at
      FROM products
      WHERE id = ?
      ${
        includeInactive
          ? ""
          : "AND active = 1"
      }
      LIMIT 1
    `)
      .get(id) as
    | ProductRow
    | undefined;

  if (!row) {
    return null;
  }

  return rowToProduct(row);
}

export function getProductBySlug(
  slug: string,
  options?: {
    includeInactive?: boolean;
  }
): ProductRecord | null {
  const includeInactive =
    options?.includeInactive ?? false;

  const row =
    database
      .prepare(`
      SELECT
        id,
        slug,
        name_json,
        description_json,
        price,
        discount_json,
        category,
        emoji,
        master_image,
        featured,
        active,
        in_stock,
        stock,
        created_at,
        updated_at
      FROM products
      WHERE slug = ?
      ${
        includeInactive
          ? ""
          : "AND active = 1"
      }
      LIMIT 1
    `)
      .get(slug) as
    | ProductRow
    | undefined;

  if (!row) {
    return null;
  }

  return rowToProduct(row);
}

export function getProducts(
  options?: {
    includeInactive?: boolean;
    category?: string;
    featured?: boolean;
  }
): ProductRecord[] {
  const includeInactive =
    options?.includeInactive ?? false;

  const conditions: string[] =
    [];

  const params: SQLInputValue[] =
    [];

  if (!includeInactive) {
    conditions.push(
      "active = 1"
    );
  }

  if (options?.category) {
    conditions.push(
      "category = ?"
    );

    params.push(
      options.category
    );
  }

  if (
    options?.featured !==
    undefined
  ) {
    conditions.push(
      "featured = ?"
    );

    params.push(
      options.featured
        ? 1
        : 0
    );
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(
          " AND "
        )}`
      : "";

  const rows =
    database
      .prepare(`
      SELECT
        id,
        slug,
        name_json,
        description_json,
        price,
        discount_json,
        category,
        emoji,
        master_image,
        featured,
        active,
        in_stock,
        stock,
        created_at,
        updated_at
      FROM products
      ${whereClause}
      ORDER BY created_at DESC, id ASC
    `)
      .all(
        ...params
      ) as unknown as ProductRow[];

  return rows.map(
    rowToProduct
  );
}

export function searchProducts(
  options?: {
    search?: string;
    category?: string;
    active?: boolean;
    featured?: boolean;
  }
): ProductRecord[] {
  const conditions: string[] =
    [];

  const params: SQLInputValue[] =
    [];

  if (
    options?.search?.trim()
  ) {
    const search =
      `%${options.search
        .trim()
        .toLowerCase()}%`;

    conditions.push(`
      (
        LOWER(id) LIKE ?
        OR LOWER(slug) LIKE ?
        OR LOWER(name_json) LIKE ?
        OR LOWER(description_json) LIKE ?
      )
    `);

    params.push(
      search,
      search,
      search,
      search
    );
  }

  if (options?.category) {
    conditions.push(
      "category = ?"
    );

    params.push(
      options.category
    );
  }

  if (
    options?.active !==
    undefined
  ) {
    conditions.push(
      "active = ?"
    );

    params.push(
      options.active
        ? 1
        : 0
    );
  }

  if (
    options?.featured !==
    undefined
  ) {
    conditions.push(
      "featured = ?"
    );

    params.push(
      options.featured
        ? 1
        : 0
    );
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(
          " AND "
        )}`
      : "";

  const rows =
    database
      .prepare(`
      SELECT
        id,
        slug,
        name_json,
        description_json,
        price,
        discount_json,
        category,
        emoji,
        master_image,
        featured,
        active,
        in_stock,
        stock,
        created_at,
        updated_at
      FROM products
      ${whereClause}
      ORDER BY updated_at DESC, id ASC
    `)
      .all(
        ...params
      ) as unknown as ProductRow[];

  return rows.map(
    rowToProduct
  );
}

export function getProductCategories(): string[] {
  const rows =
    database
      .prepare(`
      SELECT DISTINCT category
      FROM products
      WHERE category IS NOT NULL
        AND TRIM(category) <> ''
      ORDER BY category ASC
    `)
      .all() as unknown as Array<{
      category: string;
    }>;

  return rows.map(
    (row) =>
      String(row.category)
  );
}

export function createProduct(
  product: ProductWriteInput
): ProductRecord {
  const now =
    new Date().toISOString();

  const existingId =
    getProductRowById(
      product.id
    );

  if (existingId) {
    throw new Error(
      "A product with this ID already exists."
    );
  }

  const existingSlug =
    getProductRowBySlug(
      product.slug
    );

  if (existingSlug) {
    throw new Error(
      "A product with this slug already exists."
    );
  }

  database.exec("BEGIN");

  try {
    insertProductRow(
      product,
      now,
      now
    );

    insertProductChildren(
      product,
      now,
      now
    );

    database.exec("COMMIT");
  } catch (error) {
    database.exec(
      "ROLLBACK"
    );

    throw error;
  }

  const created =
    getProductById(
      product.id,
      {
        includeInactive:
          true,
      }
    );

  if (!created) {
    throw new Error(
      "Product was created but could not be loaded."
    );
  }

  return created;
}

export function setProductActive(
  id: string,
  active: boolean
): ProductRecord | null {
  const existing =
    getProductRowById(id);

  if (!existing) {
    return null;
  }

  const now =
    new Date().toISOString();

  database
    .prepare(`
      UPDATE products
      SET
        active = ?,
        updated_at = ?
      WHERE id = ?
    `)
    .run(
      active ? 1 : 0,
      now,
      id
    );

  return getProductById(
    id,
    {
      includeInactive:
        true,
    }
  );
}

export function setProductStock(
  id: string,
  inStock: boolean
): ProductRecord | null {
  const existing =
    getProductRowById(id);

  if (!existing) {
    return null;
  }

  const now =
    new Date().toISOString();

  let nextStock =
    existing.stock;

  if (
    inStock &&
    nextStock === 0
  ) {
    nextStock = 1;
  }

  database
    .prepare(`
      UPDATE products
      SET
        in_stock = ?,
        stock = ?,
        updated_at = ?
      WHERE id = ?
    `)
    .run(
      inStock ? 1 : 0,
      nextStock,
      now,
      id
    );

  return getProductById(
    id,
    {
      includeInactive:
        true,
    }
  );
}

export function setProductVariantStock(
  productId: string,
  variantId: string,
  inStock: boolean
): ProductRecord | null {
  const existing =
    getProductRowById(
      productId
    );

  if (!existing) {
    return null;
  }

  const variant =
    database
      .prepare(`
        SELECT
          id,
          stock
        FROM product_variants
        WHERE id = ?
          AND product_id = ?
        LIMIT 1
      `)
      .get(
        variantId,
        productId
      ) as
      | {
          id: string;
          stock: number | null;
        }
      | undefined;

  if (!variant) {
    throw new Error(
      "Product variant not found."
    );
  }

  const now =
    new Date().toISOString();

  let nextStock =
    variant.stock;

  if (
    inStock &&
    nextStock === 0
  ) {
    nextStock = 1;
  }

  database
    .prepare(`
      UPDATE product_variants
      SET
        in_stock = ?,
        stock = ?,
        updated_at = ?
      WHERE id = ?
        AND product_id = ?
    `)
    .run(
      inStock ? 1 : 0,
      nextStock,
      now,
      variantId,
      productId
    );

  return getProductById(
    productId,
    {
      includeInactive:
        true,
    }
  );
}

export function updateProduct(
  currentId: string,
  product: ProductWriteInput
): ProductRecord {
  const existing =
    getProductRowById(
      currentId
    );

  if (!existing) {
    throw new Error(
      "Product not found."
    );
  }

  const idChanged =
    currentId !== product.id;

  if (idChanged) {
    const existingTargetId =
      getProductRowById(
        product.id
      );

    if (existingTargetId) {
      throw new Error(
        "A product with the new ID already exists."
      );
    }
  }

  const existingSlug =
    getProductRowBySlug(
      product.slug
    );

  if (
    existingSlug &&
    String(existingSlug.id) !==
      currentId
  ) {
    throw new Error(
      "A product with this slug already exists."
    );
  }

  const now =
    new Date().toISOString();

  const productStock =
    normalizeStock(
      product.stock
    );

  const productInStock =
    productStock === 0
      ? false
      : product.inStock;

  const productDiscount =
    normalizeDiscount(
      product.discount
    );

  /*
   * Because updateProduct replaces all children, preserve
   * already-sold discount quantities from the current
   * database when the incoming admin payload does not
   * explicitly contain them.
   *
   * This prevents a normal product edit from accidentally
   * resetting discount usage back to zero.
   */
  const existingProductDiscount =
    parseDiscount(
      existing.discount_json
    );

  const resolvedProductDiscount =
    productDiscount === null
      ? null
      : {
          ...productDiscount,

          /*
           * Discount usage is runtime/order data, not editor
           * data. If this discount already exists in the
           * database, always preserve its sold quantity so a
           * normal admin edit cannot reset it to a stale value
           * from the form.
           */
          quantitySold:
            existingProductDiscount !==
              null
              ? existingProductDiscount.quantitySold
              : productDiscount.quantitySold,
        };

  /*
   * updateProduct replaces all variant rows. Preserve the
   * already-sold quantity for every existing color/size
   * discount before those rows are deleted.
   *
   * Variant IDs and size keys identify the corresponding
   * discount level. A newly created color/size keeps the
   * quantitySold supplied by the incoming payload (normally 0).
   */
  const existingVariantDiscounts =
    database
      .prepare(`
        SELECT
          id,
          discount_json,
          sizes_json
        FROM product_variants
        WHERE product_id = ?
      `)
      .all(currentId) as unknown as Array<{
      id: string;
      discount_json: string | null;
      sizes_json: string | null;
    }>;

  const existingVariantDiscountMap =
    new Map<
      string,
      ProductPriceDiscount | null
    >();

  const existingVariantSizesDiscountMap =
    new Map<
      string,
      Map<
        ProductVariantSizeKey,
        ProductPriceDiscount | null
      >
    >();

  for (
    const row of existingVariantDiscounts
  ) {
    existingVariantDiscountMap.set(
      String(row.id),
      parseDiscount(
        row.discount_json
      )
    );

    const sizeDiscounts =
      new Map<
        ProductVariantSizeKey,
        ProductPriceDiscount | null
      >();

    for (
      const size of parseVariantSizes(
        row.sizes_json
      )
    ) {
      sizeDiscounts.set(
        size.key,
        size.discount
      );
    }

    existingVariantSizesDiscountMap.set(
      String(row.id),
      sizeDiscounts
    );
  }

  const resolvedVariants =
    product.variants.map(
      (variant) => {
        const normalizedVariantPrice =
          normalizeVariantPrice(
            variant.price
          );

        const normalizedVariantDiscount =
          normalizedVariantPrice === null
            ? null
            : normalizeDiscount(
                variant.discount
              );

        const existingVariantDiscount =
          variant.id?.trim()
            ? existingVariantDiscountMap.get(
                variant.id.trim()
              ) ?? null
            : null;

        const resolvedVariantDiscount =
          normalizedVariantDiscount === null
            ? null
            : {
                ...normalizedVariantDiscount,

                quantitySold:
                  existingVariantDiscount !==
                    null
                    ? existingVariantDiscount.quantitySold
                    : normalizedVariantDiscount.quantitySold,
              };

        const existingSizeDiscounts =
          variant.id?.trim()
            ? existingVariantSizesDiscountMap.get(
                variant.id.trim()
              ) ?? new Map()
            : new Map<
                ProductVariantSizeKey,
                ProductPriceDiscount | null
              >();

        const resolvedSizes =
          variant.sizes?.map(
            (size) => {
              if (
                size.price === null ||
                size.price ===
                  undefined
              ) {
                return {
                  ...size,
                  price: null,
                  discount: null,
                };
              }

              const normalizedSizePrice =
                normalizePrice(
                  Number(size.price)
                );

              const normalizedSizeDiscount =
                normalizeDiscount(
                  size.discount
                );

              const existingSizeDiscount =
                existingSizeDiscounts.get(
                  size.key
                ) ?? null;

              return {
                ...size,
                price:
                  normalizedSizePrice,
                discount:
                  normalizedSizeDiscount ===
                    null
                    ? null
                    : {
                        ...normalizedSizeDiscount,

                        quantitySold:
                          existingSizeDiscount !==
                            null
                            ? existingSizeDiscount.quantitySold
                            : normalizedSizeDiscount.quantitySold,
                      },
              };
            }
          ) ?? [];

        return {
          ...variant,
          price:
            normalizedVariantPrice,
          discount:
            resolvedVariantDiscount,
          sizes:
            resolvedSizes,
        };
      }
    );

  const productForWrite:
    ProductWriteInput = {
      ...product,

      discount:
        resolvedProductDiscount,

      variants:
        resolvedVariants,
    };

  database.exec("BEGIN");

  try {
    deleteProductChildren(
      currentId
    );

    if (idChanged) {
      database
        .prepare(`
          UPDATE products
          SET
            id = ?,
            slug = ?,
            name_json = ?,
            description_json = ?,
            price = ?,
            discount_json = ?,
            category = ?,
            emoji = ?,
            master_image = ?,
            featured = ?,
            active = ?,
            in_stock = ?,
            stock = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .run(
          productForWrite.id,
          productForWrite.slug,
          JSON.stringify(
            normalizeLocalizedText(
              productForWrite.name
            )
          ),
          JSON.stringify(
            normalizeLocalizedText(
              productForWrite.description
            )
          ),
          normalizePrice(
            productForWrite.price
          ),
          productForWrite.discount ===
            null ||
          productForWrite.discount ===
            undefined
            ? null
            : JSON.stringify(
                productForWrite.discount
              ),
          productForWrite.category,
          productForWrite.emoji,
          productForWrite.masterImage,
          productForWrite.featured
            ? 1
            : 0,
          productForWrite.active
            ? 1
            : 0,
          productInStock
            ? 1
            : 0,
          productStock,
          now,
          currentId
        );
    } else {
      database
        .prepare(`
          UPDATE products
          SET
            slug = ?,
            name_json = ?,
            description_json = ?,
            price = ?,
            discount_json = ?,
            category = ?,
            emoji = ?,
            master_image = ?,
            featured = ?,
            active = ?,
            in_stock = ?,
            stock = ?,
            updated_at = ?
          WHERE id = ?
        `)
        .run(
          productForWrite.slug,
          JSON.stringify(
            normalizeLocalizedText(
              productForWrite.name
            )
          ),
          JSON.stringify(
            normalizeLocalizedText(
              productForWrite.description
            )
          ),
          normalizePrice(
            productForWrite.price
          ),
          productForWrite.discount ===
            null ||
          productForWrite.discount ===
            undefined
            ? null
            : JSON.stringify(
                productForWrite.discount
              ),
          productForWrite.category,
          productForWrite.emoji,
          productForWrite.masterImage,
          productForWrite.featured
            ? 1
            : 0,
          productForWrite.active
            ? 1
            : 0,
          productInStock
            ? 1
            : 0,
          productStock,
          now,
          currentId
        );
    }

    insertProductChildren(
      productForWrite,
      now,
      now
    );

    database.exec("COMMIT");
  } catch (error) {
    database.exec(
      "ROLLBACK"
    );

    throw error;
  }

  const updated =
    getProductById(
      productForWrite.id,
      {
        includeInactive:
          true,
      }
    );

  if (!updated) {
    throw new Error(
      "Product was updated but could not be loaded."
    );
  }

  return updated;
}

export function deleteProduct(
  id: string
): boolean {
  const existing =
    getProductRowById(id);

  if (!existing) {
    return false;
  }

  database.exec("BEGIN");

  try {
    deleteProductChildren(
      id
    );

    database
      .prepare(`
        DELETE FROM products
        WHERE id = ?
      `)
      .run(id);

    database.exec("COMMIT");
  } catch (error) {
    database.exec(
      "ROLLBACK"
    );

    throw error;
  }

  return true;
}

export function closeProductDatabase(): void {
  database.close();
}