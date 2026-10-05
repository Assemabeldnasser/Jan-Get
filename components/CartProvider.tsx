"use client";

import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type {
  ProductSizeKey,
  PublicProduct,
  PublicProductPriceDiscount,
} from "@/lib/product-public";

export type CartCustomFieldValue = {
  id: string;
  label: string;
  value: string;
};

export type CartItem = {
  product: PublicProduct;

  /*
   * Selected variant/color.
   *
   * For products without variants this is an empty string.
   */
  colorKey: string;

  /*
   * Selected size.
   *
   * Empty string means no size was selected / no size exists.
   */
  sizeKey: ProductSizeKey | "";

  /*
   * Values entered by the customer for the
   * custom fields defined by the selected variant.
   */
  customFields: CartCustomFieldValue[];

  /*
   * Final price for ONE item.
   *
   * Price priority:
   * 1. Selected size direct price
   * 2. Selected color direct price
   * 3. Product basic price
   *
   * If the selected price level has an applicable
   * discount for the current quantity, the discounted
   * price is stored here.
   *
   * Prices are never added together.
   */
  unitPrice: number;

  quantity: number;

  /*
   * Stable unique identifier for this cart line.
   *
   * This prevents different selections from being
   * merged into the same cart item.
   */
  cartItemId: string;
};

type CartContextType = {
  items: CartItem[];

  addToCart: (
    product: PublicProduct,
    colorKey: string,
    sizeKey?: ProductSizeKey | "",
    customFields?: CartCustomFieldValue[],
    quantity?: number
  ) => boolean;

  removeFromCart: (
    cartItemId: string
  ) => void;

  updateQuantity: (
    cartItemId: string,
    quantity: number
  ) => void;

  clearCart: () => void;

  isItemAvailable: (
    item: CartItem
  ) => boolean;

  hasUnavailableItems: boolean;

  totalItems: number;
  totalPrice: number;
};

const MAX_CART_QUANTITY = 10;

const CartContext =
  createContext<
    CartContextType | undefined
  >(undefined);

const EMPTY_CART: CartItem[] = [];

let cartItems: CartItem[] = EMPTY_CART;

let cartInitialized = false;

const listeners =
  new Set<() => void>();

function subscribe(
  listener: () => void
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getCartSnapshot() {
  return cartItems;
}

function getServerCartSnapshot() {
  return EMPTY_CART;
}

function notifyCartChange() {
  listeners.forEach(
    (listener) => {
      listener();
    }
  );
}

function saveCart(
  items: CartItem[]
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  localStorage.setItem(
    "cart",
    JSON.stringify(items)
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

function normalizeCustomFields(
  value: unknown
): CartCustomFieldValue[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (field) =>
        field &&
        typeof field === "object" &&
        typeof field.id === "string" &&
        typeof field.label === "string" &&
        typeof field.value === "string"
    )
    .map((field) => ({
      id: field.id,
      label: field.label,
      value: field.value,
    }));
}

function normalizeSizeKey(
  value: unknown
): ProductSizeKey | "" {
  return isValidSizeKey(value)
    ? value
    : "";
}

function getVariant(
  item: CartItem
) {
  if (
    item.product.variants.length ===
    0
  ) {
    return undefined;
  }

  return item.product.variants.find(
    (variant) =>
      variant.id ===
      item.colorKey
  );
}

/*
 * Returns the explicitly configured final
 * price for the selected color.
 *
 * null means:
 * no color-specific price was configured,
 * so the product basic price remains the fallback.
 */
function getVariantColorPrice(
  item: CartItem
): number | null {
  const variant =
    getVariant(item);

  if (!variant) {
    return null;
  }

  if (
    typeof variant.price !==
      "number" ||
    !Number.isFinite(
      variant.price
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    variant.price
  );
}

/*
 * Returns the explicitly configured final
 * price for the selected size.
 *
 * null means:
 * no size-specific price was configured,
 * so the color price/basic price remains the fallback.
 */
function getSelectedSizePrice(
  item: CartItem
): number | null {
  if (!item.sizeKey) {
    return null;
  }

  const variant =
    getVariant(item);

  if (!variant) {
    return null;
  }

  const selectedSize =
    variant.sizes?.find(
      (size) =>
        size.key ===
        item.sizeKey
    );

  if (
    !selectedSize ||
    typeof selectedSize.price !==
      "number" ||
    !Number.isFinite(
      selectedSize.price
    )
  ) {
    return null;
  }

  return Math.max(
    0,
    selectedSize.price
  );
}

/*
 * Checks whether a discount is currently usable
 * for the COMPLETE quantity of this cart line.
 *
 * This intentionally mirrors the checkout rule:
 *
 * quantitySold + requested quantity <= quantityLimit
 *
 * A quantity-limited discount is therefore either
 * applied to the complete cart line or not applied
 * at all.
 */
function isDiscountUsableForQuantity(
  discount:
    | PublicProductPriceDiscount
    | null
    | undefined,
  quantity: number,
  now: Date = new Date()
): boolean {
  if (!discount) {
    return false;
  }

  if (
    !Number.isFinite(
      discount.percentage
    ) ||
    discount.percentage <= 0 ||
    discount.percentage >= 100
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      discount.price
    ) ||
    discount.price < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      discount.quantitySold
    ) ||
    discount.quantitySold < 0
  ) {
    return false;
  }

  if (
    discount.quantityLimit !==
      null &&
    (
      !Number.isFinite(
        discount.quantityLimit
      ) ||
      discount.quantityLimit < 0
    )
  ) {
    return false;
  }

  if (
    discount.quantityLimit !==
      null &&
    discount.quantitySold +
        quantity >
      discount.quantityLimit
  ) {
    return false;
  }

  const nowTime =
    now.getTime();

  if (discount.startsAt) {
    const startsAt =
      Date.parse(
        discount.startsAt
      );

    if (
      !Number.isNaN(startsAt) &&
      nowTime < startsAt
    ) {
      return false;
    }
  }

  if (discount.endsAt) {
    const endsAt =
      Date.parse(
        discount.endsAt
      );

    if (
      !Number.isNaN(endsAt) &&
      nowTime >= endsAt
    ) {
      return false;
    }
  }

  return true;
}

/*
 * Resolves the COMPLETE final unit price.
 *
 * Priority:
 *
 * 1. Size direct price
 *    -> Size discount, if applicable
 *
 * 2. Color direct price
 *    -> Color discount, if applicable
 *
 * 3. Basic product price
 *    -> Basic discount, if applicable
 *
 * A more-specific direct price always wins.
 *
 * If that direct price has no usable discount,
 * the function DOES NOT fall back to a less-specific
 * discount.
 *
 * Prices are replacements, never additions.
 */
function calculateUnitPrice(
  item: CartItem,
  now: Date = new Date()
): number {
  const sizePrice =
    getSelectedSizePrice(
      item
    );

  if (
    sizePrice !== null
  ) {
    const variant =
      getVariant(item);

    const selectedSize =
      variant?.sizes?.find(
        (size) =>
          size.key ===
          item.sizeKey
      );

    if (
      selectedSize &&
      isDiscountUsableForQuantity(
        selectedSize.discount,
        item.quantity,
        now
      )
    ) {
      return Math.max(
        0,
        selectedSize.discount!.price
      );
    }

    return sizePrice;
  }

  const colorPrice =
    getVariantColorPrice(
      item
    );

  if (
    colorPrice !== null
  ) {
    const variant =
      getVariant(item);

    if (
      variant &&
      isDiscountUsableForQuantity(
        variant.discount,
        item.quantity,
        now
      )
    ) {
      return Math.max(
        0,
        variant.discount!.price
      );
    }

    return colorPrice;
  }

  const basicPrice =
    Math.max(
      0,
      item.product.price
    );

  if (
    isDiscountUsableForQuantity(
      item.product.discount,
      item.quantity,
      now
    )
  ) {
    return Math.max(
      0,
      item.product.discount!.price
    );
  }

  return basicPrice;
}

function createCartItemId(
  productId: string,
  colorKey: string,
  sizeKey: ProductSizeKey | "",
  customFields: CartCustomFieldValue[]
): string {
  const normalizedFields =
    [...customFields]
      .sort((a, b) =>
        a.id.localeCompare(b.id)
      )
      .map(
        (field) =>
          `${field.id}=${field.value}`
      )
      .join("|");

  return [
    productId,
    colorKey,
    sizeKey,
    normalizedFields,
  ].join("::");
}

function normalizeCartItem(
  rawItem: unknown
): CartItem | null {
  if (
    !rawItem ||
    typeof rawItem !==
      "object"
  ) {
    return null;
  }

  const item =
    rawItem as Partial<CartItem> & {
      product?: PublicProduct;
    };

  if (
    !item.product ||
    typeof item.product.id !==
      "string"
  ) {
    return null;
  }

  const colorKey =
    typeof item.colorKey ===
    "string"
      ? item.colorKey
      : "";

  const sizeKey =
    normalizeSizeKey(
      item.sizeKey
    );

  const customFields =
    normalizeCustomFields(
      item.customFields
    );

  const quantity =
    typeof item.quantity ===
      "number" &&
    Number.isInteger(
      item.quantity
    ) &&
    item.quantity > 0
      ? Math.min(
          MAX_CART_QUANTITY,
          item.quantity
        )
      : 1;

  const temporaryItem: CartItem =
    {
      product: item.product,
      colorKey,
      sizeKey,
      customFields,
      unitPrice:
        typeof item.unitPrice ===
          "number" &&
        Number.isFinite(
          item.unitPrice
        )
          ? item.unitPrice
          : item.product.price,
      quantity,
      cartItemId:
        typeof item.cartItemId ===
        "string"
          ? item.cartItemId
          : "",
    };

  /*
   * Always regenerate the ID.
   *
   * This also upgrades old cart entries which
   * did not have cartItemId.
   */
  temporaryItem.cartItemId =
    createCartItemId(
      temporaryItem.product.id,
      temporaryItem.colorKey,
      temporaryItem.sizeKey,
      temporaryItem.customFields
    );

  /*
   * Always recalculate the final price from
   * the current product data.
   *
   * This upgrades old cart entries from the
   * previous additive pricing model and also
   * applies the current discount rules.
   */
  temporaryItem.unitPrice =
    calculateUnitPrice(
      temporaryItem
    );

  return temporaryItem;
}

function getItemStock(
  item: CartItem
): number | null {
  const product =
    item.product;

  if (
    product.variants.length ===
    0
  ) {
    return product.stock;
  }

  const variant =
    product.variants.find(
      (candidate) =>
        candidate.id ===
        item.colorKey
    );

  if (!variant) {
    return 0;
  }

  return variant.stock;
}

function getMaximumQuantity(
  item: CartItem
): number {
  const stock =
    getItemStock(item);

  if (
    stock === null
  ) {
    return MAX_CART_QUANTITY;
  }

  return Math.min(
    MAX_CART_QUANTITY,
    Math.max(0, stock)
  );
}

function isCartItemAvailable(
  item: CartItem
): boolean {
  const product =
    item.product;

  if (
    !product.active ||
    !product.inStock
  ) {
    return false;
  }

  /*
   * Products without variants/colors.
   */
  if (
    product.variants.length ===
    0
  ) {
    return (
      product.stock === null ||
      product.stock > 0
    );
  }

  /*
   * Products with variants require
   * a valid selected variant.
   */
  const variant =
    product.variants.find(
      (candidate) =>
        candidate.id ===
        item.colorKey
    );

  if (!variant) {
    return false;
  }

  if (
    !variant.active ||
    !variant.inStock ||
    (
      variant.stock !== null &&
      variant.stock <= 0
    )
  ) {
    return false;
  }

  /*
   * If the selected variant defines sizes,
   * the cart item must contain one valid size.
   */
  if (
    variant.sizes &&
    variant.sizes.length > 0
  ) {
    if (!item.sizeKey) {
      return false;
    }

    const selectedSize =
      variant.sizes.find(
        (size) =>
          size.key ===
          item.sizeKey
      );

    if (!selectedSize) {
      return false;
    }
  }

  /*
   * All custom fields defined by the
   * variant are mandatory.
   */
  if (
    variant.customFields &&
    variant.customFields.length > 0
  ) {
    for (
      const field of
        variant.customFields
    ) {
      const selectedField =
        item.customFields.find(
          (value) =>
            value.id ===
            field.id
        );

      if (
        !selectedField ||
        !selectedField.value.trim()
      ) {
        return false;
      }
    }
  }

  return true;
}

async function refreshCartFromDatabase() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  if (
    cartItems.length ===
    0
  ) {
    return;
  }

  try {
    const response =
      await fetch(
        "/api/products",
        {
          method: "GET",
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return;
    }

    const data =
      await response.json();

    const products =
      Array.isArray(
        data?.products
      )
        ? (data.products as PublicProduct[])
        : [];

    const productsById =
      new Map(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      );

    /*
     * Refresh product information while
     * preserving the customer's selections.
     *
     * Out-of-stock products/variants are
     * intentionally kept in the cart.
     */
    const refreshedItems =
      cartItems
        .map((item) => {
          const product =
            productsById.get(
              item.product.id
            );

          if (!product) {
            return null;
          }

          /*
           * Product without variants.
           */
          if (
            product.variants.length ===
            0
          ) {
            const refreshedItem: CartItem =
              {
                ...item,
                product,
                colorKey: "",
                sizeKey: "",
                customFields: [],
                cartItemId:
                  createCartItemId(
                    product.id,
                    "",
                    "",
                    []
                  ),
                unitPrice: 0,
              };

            refreshedItem.unitPrice =
              calculateUnitPrice(
                refreshedItem
              );

            return refreshedItem;
          }

          /*
           * Product with variants.
           */
          const variant =
            product.variants.find(
              (candidate) =>
                candidate.id ===
                item.colorKey
            );

          if (!variant) {
            return null;
          }

          /*
           * Preserve selected size only
           * when it still exists.
           */
          const refreshedSize =
            variant.sizes?.some(
              (size) =>
                size.key ===
                item.sizeKey
            )
              ? item.sizeKey
              : "";

          /*
           * Preserve only custom fields
           * that still exist on the variant.
           *
           * Their values are preserved.
           */
          const refreshedCustomFields =
            (
              variant.customFields ??
              []
            ).map(
              (field) => {
                const previousValue =
                  item.customFields.find(
                    (value) =>
                      value.id ===
                      field.id
                  );

                return {
                  id: field.id,
                  label: field.label,
                  value:
                    previousValue?.value ??
                    "",
                };
              }
            );

          const refreshedItem: CartItem =
            {
              ...item,
              product,
              sizeKey:
                refreshedSize,
              customFields:
                refreshedCustomFields,
              cartItemId:
                createCartItemId(
                  product.id,
                  item.colorKey,
                  refreshedSize,
                  refreshedCustomFields
                ),
              unitPrice: 0,
            };

          /*
           * Recalculate using:
           *
           * Size → Color → Basic
           *
           * including the currently applicable
           * discount for the complete cart quantity.
           */
          refreshedItem.unitPrice =
            calculateUnitPrice(
              refreshedItem
            );

          return refreshedItem;
        })
        .filter(
          (
            item
          ): item is CartItem =>
            item !== null
        );

    cartItems =
      refreshedItems;

    saveCart(
      refreshedItems
    );

    notifyCartChange();
  } catch (error) {
    console.error(
      "Refresh cart error:",
      error
    );
  }
}

function initializeCart() {
  if (
    cartInitialized ||
    typeof window ===
      "undefined"
  ) {
    return;
  }

  cartInitialized = true;

  const savedCart =
    localStorage.getItem(
      "cart"
    );

  if (!savedCart) {
    cartItems =
      EMPTY_CART;

    notifyCartChange();
    return;
  }

  try {
    const parsedCart =
      JSON.parse(savedCart);

    if (
      Array.isArray(
        parsedCart
      )
    ) {
      cartItems =
        parsedCart
          .map(
            normalizeCartItem
          )
          .filter(
            (
              item
            ): item is CartItem =>
              item !== null
          );

      saveCart(
        cartItems
      );
    } else {
      cartItems =
        EMPTY_CART;
    }
  } catch {
    localStorage.removeItem(
      "cart"
    );

    cartItems =
      EMPTY_CART;
  }

  notifyCartChange();

  void refreshCartFromDatabase();
}

function updateCart(
  nextItems: CartItem[]
) {
  cartItems =
    nextItems;

  saveCart(
    nextItems
  );

  notifyCartChange();
}

function ensureCartInitialized() {
  if (!cartInitialized) {
    initializeCart();
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const items =
    useSyncExternalStore(
      subscribe,
      getCartSnapshot,
      getServerCartSnapshot
    );

  useEffect(() => {
    initializeCart();
  }, []);

  useEffect(() => {
    const handleStorageChange =
      (
        event: StorageEvent
      ) => {
        if (
          event.key !==
          "cart"
        ) {
          return;
        }

        const savedCart =
          event.newValue;

        if (!savedCart) {
          cartItems =
            EMPTY_CART;

          notifyCartChange();
          return;
        }

        try {
          const parsedCart =
            JSON.parse(
              savedCart
            );

          cartItems =
            Array.isArray(
              parsedCart
            )
              ? parsedCart
                  .map(
                    normalizeCartItem
                  )
                  .filter(
                    (
                      item
                    ): item is CartItem =>
                      item !== null
                  )
              : EMPTY_CART;

          notifyCartChange();
        } catch {
          cartItems =
            EMPTY_CART;

          notifyCartChange();
        }
      };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  const addToCart = (
    product: PublicProduct,
    colorKey: string,
    sizeKey: ProductSizeKey | "" = "",
    customFields: CartCustomFieldValue[] = [],
    quantity = 1
  ): boolean => {
    ensureCartInitialized();

    /*
     * Backward compatibility:
     *
     * If a caller still uses the old signature:
     *
     * addToCart(product, colorKey, quantity)
     *
     * interpret the third argument as quantity.
     */
    if (
      typeof sizeKey ===
        "number"
    ) {
      quantity =
        sizeKey;
      sizeKey = "";
      customFields = [];
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity < 1 ||
      quantity >
        MAX_CART_QUANTITY
    ) {
      return false;
    }

    /*
     * Client-side protection.
     *
     * Backend validation remains authoritative.
     */
    if (
      !product.active ||
      !product.inStock
    ) {
      return false;
    }

    /*
     * Product without variants.
     */
    if (
      product.variants.length ===
      0
    ) {
      if (
        product.stock !== null &&
        product.stock <= 0
      ) {
        return false;
      }

      const maximumQuantity =
        product.stock ===
        null
          ? MAX_CART_QUANTITY
          : Math.min(
              MAX_CART_QUANTITY,
              product.stock
            );

      const normalizedCustomFields: CartCustomFieldValue[] =
        [];

      const cartItemId =
        createCartItemId(
          product.id,
          "",
          "",
          normalizedCustomFields
        );

      const existingItem =
        cartItems.find(
          (item) =>
            item.cartItemId ===
            cartItemId
        );

      const nextQuantity =
        existingItem
          ? existingItem.quantity +
            quantity
          : quantity;

      if (
        nextQuantity >
        maximumQuantity
      ) {
        return false;
      }

      const temporaryItem: CartItem =
        {
          product,
          colorKey: "",
          sizeKey: "",
          customFields:
            normalizedCustomFields,
          unitPrice: 0,
          quantity:
            nextQuantity,
          cartItemId,
        };

      /*
       * Recalculate using the complete
       * Basic price/discount rules.
       */
      temporaryItem.unitPrice =
        calculateUnitPrice(
          temporaryItem
        );

      if (existingItem) {
        updateCart(
          cartItems.map(
            (item) =>
              item.cartItemId ===
              cartItemId
                ? temporaryItem
                : item
          )
        );

        return true;
      }

      updateCart([
        ...cartItems,
        temporaryItem,
      ]);

      return true;
    }

    /*
     * Products with variants require
     * a valid selected variant.
     */
    const variant =
      product.variants.find(
        (candidate) =>
          candidate.id ===
          colorKey
      );

    if (
      !variant ||
      !variant.active ||
      !variant.inStock
    ) {
      return false;
    }

    if (
      variant.stock !== null &&
      variant.stock <= 0
    ) {
      return false;
    }

    /*
     * Size validation.
     */
    const availableSizes =
      variant.sizes ?? [];

    if (
      availableSizes.length >
      0
    ) {
      if (!sizeKey) {
        return false;
      }

      const selectedSize =
        availableSizes.find(
          (size) =>
            size.key ===
            sizeKey
        );

      if (!selectedSize) {
        return false;
      }
    } else {
      /*
       * A variant without sizes cannot
       * receive a selected size.
       */
      sizeKey = "";
    }

    /*
     * Custom field validation.
     *
     * Every field configured by the admin
     * must have a non-empty value.
     */
    const configuredFields =
      variant.customFields ?? [];

    const normalizedCustomFields =
      configuredFields.map(
        (field) => {
          const suppliedField =
            customFields.find(
              (value) =>
                value.id ===
                field.id
            );

          return {
            id: field.id,
            label: field.label,
            value:
              suppliedField?.value?.trim() ??
              "",
          };
        }
      );

    if (
      normalizedCustomFields.some(
        (field) =>
          !field.value
      )
    ) {
      return false;
    }

    const maximumQuantity =
      variant.stock ===
      null
        ? MAX_CART_QUANTITY
        : Math.min(
            MAX_CART_QUANTITY,
            variant.stock
          );

    const cartItemId =
      createCartItemId(
        product.id,
        colorKey,
        sizeKey,
        normalizedCustomFields
      );

    const existingItem =
      cartItems.find(
        (item) =>
          item.cartItemId ===
          cartItemId
      );

    const nextQuantity =
      existingItem
        ? existingItem.quantity +
          quantity
        : quantity;

    if (
      nextQuantity >
      maximumQuantity
    ) {
      return false;
    }

    const temporaryItem: CartItem =
      {
        product,
        colorKey,
        sizeKey,
        customFields:
          normalizedCustomFields,
        unitPrice: 0,
        quantity:
          nextQuantity,
        cartItemId,
      };

    /*
     * Calculate the complete final price
     * using:
     *
     * Size → Color → Basic
     *
     * including the applicable discount
     * for the complete resulting quantity.
     */
    temporaryItem.unitPrice =
      calculateUnitPrice(
        temporaryItem
      );

    if (existingItem) {
      updateCart(
        cartItems.map(
          (item) =>
            item.cartItemId ===
            cartItemId
              ? temporaryItem
              : item
        )
      );

      return true;
    }

    updateCart([
      ...cartItems,
      temporaryItem,
    ]);

    return true;
  };

  const removeFromCart = (
    cartItemId: string
  ) => {
    ensureCartInitialized();

    updateCart(
      cartItems.filter(
        (item) =>
          item.cartItemId !==
          cartItemId
      )
    );
  };

  const updateQuantity = (
    cartItemId: string,
    quantity: number
  ) => {
    ensureCartInitialized();

    if (
      quantity <= 0
    ) {
      removeFromCart(
        cartItemId
      );
      return;
    }

    const existingItem =
      cartItems.find(
        (item) =>
          item.cartItemId ===
          cartItemId
      );

    if (!existingItem) {
      return;
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity >
        MAX_CART_QUANTITY
    ) {
      return;
    }

    const maximumQuantity =
      getMaximumQuantity(
        existingItem
      );

    if (
      quantity >
      maximumQuantity
    ) {
      return;
    }

    /*
     * Recalculate the unit price because
     * quantity-limited discounts depend on
     * the COMPLETE cart-line quantity.
     *
     * Example:
     *
     * discount limit = 5
     * already sold = 3
     *
     * quantity 2 -> discount usable
     * quantity 3 -> discount not usable
     */
    const nextItems =
      cartItems.map(
        (item) => {
          if (
            item.cartItemId !==
            cartItemId
          ) {
            return item;
          }

          const nextItem: CartItem =
            {
              ...item,
              quantity,
              unitPrice: 0,
            };

          nextItem.unitPrice =
            calculateUnitPrice(
              nextItem
            );

          return nextItem;
        }
      );

    updateCart(
      nextItems
    );
  };

  const clearCart = () => {
    ensureCartInitialized();

    updateCart([]);
  };

  const isItemAvailable = (
    item: CartItem
  ): boolean => {
    return isCartItemAvailable(
      item
    );
  };

  const hasUnavailableItems =
    items.some(
      (item) =>
        !isCartItemAvailable(
          item
        )
    );

  /*
   * Only available items are included
   * in active cart totals.
   */
  const availableItems =
    items.filter(
      (item) =>
        isCartItemAvailable(
          item
        )
    );

  const totalItems =
    availableItems.reduce(
      (total, item) =>
        total +
        item.quantity,
      0
    );

  const totalPrice =
    availableItems.reduce(
      (total, item) =>
        total +
        item.unitPrice *
          item.quantity,
      0
    );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isItemAvailable,
        hasUnavailableItems,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}