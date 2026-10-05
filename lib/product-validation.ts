import {
  randomUUID,
} from "node:crypto";

import type {
  ProductLanguage,
  ProductLocalizedText,
  ProductPriceDiscount,
  ProductVariantInput,
  ProductVariantSize,
  ProductVariantCustomField,
  ProductVariantSizeKey,
  ProductWriteInput,
} from "@/lib/product-db";

const SUPPORTED_LANGUAGES: ProductLanguage[] =
  ["en", "de", "ar"];

const SUPPORTED_SIZE_KEYS: ProductVariantSizeKey[] =
  [
    "small",
    "medium",
    "large",
  ];

export type ProductValidationResult =
  | {
      valid: true;
      product: ProductWriteInput;
    }
  | {
      valid: false;
      message: string;
    };

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateLocalizedText(
  value: unknown,
  fieldName: string
): ProductLocalizedText {
  if (!isRecord(value)) {
    throw new Error(
      `${fieldName} must be an object.`
    );
  }

  const result =
    {} as ProductLocalizedText;

  for (
    const language of SUPPORTED_LANGUAGES
  ) {
    const languageValue =
      value[language];

    if (
      typeof languageValue !==
      "string"
    ) {
      throw new Error(
        `${fieldName}.${language} must be a string.`
      );
    }

    result[language] =
      languageValue.trim();
  }

  return result;
}

function validateImage(
  value: unknown,
  fieldName: string
): {
  id?: string;
  url: string;
} {
  if (!isRecord(value)) {
    throw new Error(
      `${fieldName} must be an object.`
    );
  }

  const url = value.url;

  if (
    typeof url !== "string" ||
    !url.trim()
  ) {
    throw new Error(
      `${fieldName}.url is required.`
    );
  }

  if (
    value.id !== undefined &&
    typeof value.id !== "string"
  ) {
    throw new Error(
      `${fieldName}.id must be a string.`
    );
  }

  return {
    ...(typeof value.id ===
    "string"
      ? {
          id: value.id.trim(),
        }
      : {}),

    url: url.trim(),
  };
}

function validateStock(
  value: unknown,
  fieldName: string
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must be a non-negative integer or null.`
    );
  }

  return value;
}

function roundPrice(
  value: number
): number {
  return (
    Math.round(
      value * 100
    ) / 100
  );
}

function roundPercentage(
  value: number
): number {
  return (
    Math.round(
      value * 100
    ) / 100
  );
}

function validateDateTime(
  value: unknown,
  fieldName: string
): string | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `${fieldName} must be a valid ISO date string or null.`
    );
  }

  const normalized =
    value.trim();

  const timestamp =
    Date.parse(normalized);

  if (
    !Number.isFinite(timestamp)
  ) {
    throw new Error(
      `${fieldName} must be a valid ISO date string or null.`
    );
  }

  return normalized;
}

function validatePriceDiscount(
  value: unknown,
  originalPrice: number,
  fieldName: string
): ProductPriceDiscount | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (!isRecord(value)) {
    throw new Error(
      `${fieldName} must be an object or null.`
    );
  }

  if (
    !Number.isFinite(originalPrice) ||
    originalPrice < 0
  ) {
    throw new Error(
      `${fieldName} cannot be configured for an invalid original price.`
    );
  }

  const hasPercentage =
    value.percentage !==
      undefined &&
    value.percentage !==
      null &&
    value.percentage !== "";

  const hasDiscountPrice =
    value.price !==
      undefined &&
    value.price !==
      null &&
    value.price !== "";

  if (
    !hasPercentage &&
    !hasDiscountPrice
  ) {
    throw new Error(
      `${fieldName} requires either percentage or price.`
    );
  }

  let percentage:
    | number
    | null =
    null;

  let discountPrice:
    | number
    | null =
    null;

  if (hasPercentage) {
    if (
      typeof value.percentage !==
        "number" ||
      !Number.isFinite(
        value.percentage
      ) ||
      value.percentage < 0 ||
      value.percentage > 100
    ) {
      throw new Error(
        `${fieldName}.percentage must be a number between 0 and 100.`
      );
    }

    percentage =
      roundPercentage(
        value.percentage
      );
  }

  if (hasDiscountPrice) {
    if (
      typeof value.price !==
        "number" ||
      !Number.isFinite(
        value.price
      ) ||
      value.price < 0
    ) {
      throw new Error(
        `${fieldName}.price must be a valid non-negative number.`
      );
    }

    discountPrice =
      roundPrice(
        value.price
      );
  }

  /*
   * If both values are supplied, the discounted price is treated
   * as the concrete final value and the percentage is recalculated
   * from the original price.
   *
   * This keeps the stored percentage and discounted price consistent
   * even when rounding to two decimal places is necessary.
   */
  if (
    discountPrice !== null
  ) {
    if (
      discountPrice >
      originalPrice
    ) {
      throw new Error(
        `${fieldName}.price cannot be greater than the original price.`
      );
    }

    if (
      originalPrice === 0
    ) {
      percentage = 0;
    } else {
      percentage =
        roundPercentage(
          (
            (
              originalPrice -
              discountPrice
            ) /
            originalPrice
          ) *
            100
        );
    }
  } else if (
    percentage !== null
  ) {
    discountPrice =
      roundPrice(
        originalPrice *
          (
            1 -
            percentage /
              100
          )
      );
  }

  if (
    discountPrice === null ||
    percentage === null
  ) {
    throw new Error(
      `${fieldName} could not be calculated.`
    );
  }

  let quantityLimit:
    | number
    | null =
    null;

  if (
    value.quantityLimit !==
      undefined &&
    value.quantityLimit !==
      null &&
    value.quantityLimit !== ""
  ) {
    if (
      typeof value.quantityLimit !==
        "number" ||
      !Number.isFinite(
        value.quantityLimit
      ) ||
      !Number.isInteger(
        value.quantityLimit
      ) ||
      value.quantityLimit < 0
    ) {
      throw new Error(
        `${fieldName}.quantityLimit must be a non-negative integer or null.`
      );
    }

    quantityLimit =
      value.quantityLimit;
  }

  let quantitySold = 0;

  if (
    value.quantitySold !==
      undefined &&
    value.quantitySold !==
      null &&
    value.quantitySold !== ""
  ) {
    if (
      typeof value.quantitySold !==
        "number" ||
      !Number.isFinite(
        value.quantitySold
      ) ||
      !Number.isInteger(
        value.quantitySold
      ) ||
      value.quantitySold < 0
    ) {
      throw new Error(
        `${fieldName}.quantitySold must be a non-negative integer.`
      );
    }

    quantitySold =
      value.quantitySold;
  }

  if (
    quantityLimit !== null &&
    quantitySold >
      quantityLimit
  ) {
    throw new Error(
      `${fieldName}.quantitySold cannot be greater than quantityLimit.`
    );
  }

  const startsAt =
    validateDateTime(
      value.startsAt,
      `${fieldName}.startsAt`
    );

  const endsAt =
    validateDateTime(
      value.endsAt,
      `${fieldName}.endsAt`
    );

  if (
    startsAt !== null &&
    endsAt !== null &&
    Date.parse(startsAt) >=
      Date.parse(endsAt)
  ) {
    throw new Error(
      `${fieldName}.endsAt must be later than startsAt.`
    );
  }

  return {
    percentage,
    price: discountPrice,
    quantityLimit,
    quantitySold,
    startsAt,
    endsAt,
  };
}

function validateVariantPrice(
  value: unknown,
  fieldName: string
): number | null {
  /*
   * null / undefined means:
   * no color-specific price.
   *
   * number means:
   * complete final price for this color.
   */
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    throw new Error(
      `${fieldName} must be a valid non-negative number or null.`
    );
  }

  return roundPrice(
    value
  );
}

function validateVariantSizes(
  value: unknown,
  fieldName: string
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
      `${fieldName} must be an array.`
    );
  }

  const seen =
    new Set<ProductVariantSizeKey>();

  return value.map(
    (item, index) => {
      const itemField =
        `${fieldName}[${index}]`;

      if (
        !isRecord(item)
      ) {
        throw new Error(
          `${itemField} must be an object.`
        );
      }

      const key =
        item.key;

      if (
        typeof key !==
        "string"
      ) {
        throw new Error(
          `${itemField}.key is required.`
        );
      }

      if (
        !SUPPORTED_SIZE_KEYS.includes(
          key as ProductVariantSizeKey
        )
      ) {
        throw new Error(
          `${itemField}.key must be small, medium or large.`
        );
      }

      const sizeKey =
        key as ProductVariantSizeKey;

      if (
        seen.has(sizeKey)
      ) {
        throw new Error(
          `${itemField}.key is duplicated.`
        );
      }

      seen.add(sizeKey);

      const rawPrice =
        item.price;

      /*
       * null / undefined / empty =
       * no size-specific price.
       */
      if (
        rawPrice === undefined ||
        rawPrice === null ||
        rawPrice === ""
      ) {
        if (
          item.discount !==
            undefined &&
          item.discount !==
            null &&
          item.discount !== ""
        ) {
          throw new Error(
            `${itemField}.discount cannot be configured when the size has no size-specific price.`
          );
        }

        return {
          key: sizeKey,
          price: null,
          discount: null,
        };
      }

      if (
        typeof rawPrice !==
          "number" ||
        !Number.isFinite(
          rawPrice
        ) ||
        rawPrice < 0
      ) {
        throw new Error(
          `${itemField}.price must be a valid non-negative number or null.`
        );
      }

      const price =
        roundPrice(
          rawPrice
        );

      const discount =
        validatePriceDiscount(
          item.discount,
          price,
          `${itemField}.discount`
        );

      return {
        key: sizeKey,

        price,

        discount,
      };
    }
  );
}

function validateVariantCustomFields(
  value: unknown,
  fieldName: string
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
      `${fieldName} must be an array.`
    );
  }

  const seenIds =
    new Set<string>();

  return value.map(
    (item, index) => {
      const itemField =
        `${fieldName}[${index}]`;

      if (
        !isRecord(item)
      ) {
        throw new Error(
          `${itemField} must be an object.`
        );
      }

      const label =
        item.label;

      if (
        typeof label !==
          "string" ||
        !label.trim()
      ) {
        throw new Error(
          `${itemField}.label is required.`
        );
      }

      let id =
        typeof item.id ===
        "string"
          ? item.id.trim()
          : "";

      if (!id) {
        id = randomUUID();
      }

      if (
        seenIds.has(id)
      ) {
        throw new Error(
          `${itemField}.id is duplicated.`
        );
      }

      seenIds.add(id);

      return {
        id,

        label:
          label.trim(),
      };
    }
  );
}

function validateVariant(
  value: unknown,
  index: number
): ProductVariantInput {
  const fieldName =
    `variants[${index}]`;

  if (!isRecord(value)) {
    throw new Error(
      `${fieldName} must be an object.`
    );
  }

  const color =
    validateLocalizedText(
      value.color,
      `${fieldName}.color`
    );

  if (
    !Array.isArray(
      value.images
    )
  ) {
    throw new Error(
      `${fieldName}.images must be an array.`
    );
  }

  const images =
    value.images.map(
      (image, imageIndex) =>
        validateImage(
          image,
          `${fieldName}.images[${imageIndex}]`
        )
    );

  if (
    value.id !== undefined &&
    typeof value.id !== "string"
  ) {
    throw new Error(
      `${fieldName}.id must be a string.`
    );
  }

  if (
    value.active !== undefined &&
    typeof value.active !==
      "boolean"
  ) {
    throw new Error(
      `${fieldName}.active must be a boolean.`
    );
  }

  if (
    value.inStock !== undefined &&
    typeof value.inStock !==
      "boolean"
  ) {
    throw new Error(
      `${fieldName}.inStock must be a boolean.`
    );
  }

  const price =
    validateVariantPrice(
      value.price,
      `${fieldName}.price`
    );

  const discount =
    validatePriceDiscount(
      value.discount,
      price === null
        ? 0
        : price,
      `${fieldName}.discount`
    );

  if (
    price === null &&
    discount !== null
  ) {
    throw new Error(
      `${fieldName}.discount cannot be configured when there is no color-specific price.`
    );
  }

  const sizes =
    validateVariantSizes(
      value.sizes,
      `${fieldName}.sizes`
    );

  const customFields =
    validateVariantCustomFields(
      value.customFields,
      `${fieldName}.customFields`
    );

  const stock =
    validateStock(
      value.stock,
      `${fieldName}.stock`
    );

  const inStock =
    stock === 0
      ? false
      : value.inStock !== false;

  return {
    ...(typeof value.id ===
    "string"
      ? {
          id: value.id.trim(),
        }
      : {}),

    color,

    /*
     * null = no color-specific price.
     */
    price,

    discount,

    sizes,

    customFields,

    images,

    active:
      value.active !== false,

    inStock,

    stock,
  };
}

function parseProductInput(
  value: unknown
): ProductWriteInput {
  if (!isRecord(value)) {
    throw new Error(
      "Product must be an object."
    );
  }

  if (
    typeof value.id !==
      "string" ||
    !value.id.trim()
  ) {
    throw new Error(
      "Product ID is required."
    );
  }

  if (
    typeof value.slug !==
      "string" ||
    !value.slug.trim()
  ) {
    throw new Error(
      "Product slug is required."
    );
  }

  if (
    typeof value.price !==
      "number" ||
    !Number.isFinite(
      value.price
    ) ||
    value.price < 0
  ) {
    throw new Error(
      "Product price must be a valid non-negative number."
    );
  }

  const price =
    roundPrice(
      value.price
    );

  const discount =
    validatePriceDiscount(
      value.discount,
      price,
      "Product discount"
    );

  if (
    typeof value.category !==
      "string" ||
    !value.category.trim()
  ) {
    throw new Error(
      "Product category is required."
    );
  }

  if (
    typeof value.emoji !==
      "string"
  ) {
    throw new Error(
      "Product emoji must be a string."
    );
  }

  if (
    value.masterImage !== null &&
    typeof value.masterImage !==
      "string"
  ) {
    throw new Error(
      "Product master image must be a string or null."
    );
  }

  if (
    !Array.isArray(
      value.generalImages
    )
  ) {
    throw new Error(
      "Product generalImages must be an array."
    );
  }

  if (
    !Array.isArray(
      value.variants
    )
  ) {
    throw new Error(
      "Product variants must be an array."
    );
  }

  if (
    typeof value.featured !==
      "boolean"
  ) {
    throw new Error(
      "Product featured must be a boolean."
    );
  }

  if (
    typeof value.active !==
      "boolean"
  ) {
    throw new Error(
      "Product active must be a boolean."
    );
  }

  if (
    value.inStock !== undefined &&
    typeof value.inStock !==
      "boolean"
  ) {
    throw new Error(
      "Product inStock must be a boolean."
    );
  }

  const stock =
    validateStock(
      value.stock,
      "Product stock"
    );

  const name =
    validateLocalizedText(
      value.name,
      "name"
    );

  const description =
    validateLocalizedText(
      value.description,
      "description"
    );

  const generalImages =
    value.generalImages.map(
      (image, index) =>
        validateImage(
          image,
          `generalImages[${index}]`
        )
    );

  const variants =
    value.variants.map(
      (variant, index) =>
        validateVariant(
          variant,
          index
        )
    );

  const inStock =
    stock === 0
      ? false
      : value.inStock !== false;

  return {
    id:
      value.id.trim(),

    slug:
      value.slug.trim(),

    name,

    description,

    price,

    discount,

    category:
      value.category.trim(),

    emoji:
      value.emoji.trim(),

    masterImage:
      typeof value.masterImage ===
      "string"
        ? value.masterImage.trim() ||
          null
        : null,

    generalImages,

    variants,

    featured:
      value.featured,

    active:
      value.active,

    inStock,

    stock,
  };
}

export function validateProductInput(
  value: unknown
): ProductValidationResult {
  try {
    const product =
      parseProductInput(value);

    return {
      valid: true,
      product,
    };
  } catch (error) {
    return {
      valid: false,

      message:
        error instanceof Error
          ? error.message
          : "Invalid product data.",
    };
  }
}