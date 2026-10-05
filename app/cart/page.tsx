"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/CartProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { translations } from "@/data/translations";
import type {
  PublicProductPriceDiscount,
  ProductSizeKey,
} from "@/lib/product-public";
import {
  FREE_SHIPPING_THRESHOLD,
  getRemainingForFreeShipping,
  getShippingCost,
} from "@/lib/shipping";

const MAX_CART_QUANTITY = 10;

function isDiscountUsableForQuantity(
  discount: PublicProductPriceDiscount | null | undefined,
  quantity: number,
  now: Date
): boolean {
  if (!discount) return false;

  if (
    !Number.isFinite(discount.percentage) ||
    discount.percentage <= 0 ||
    discount.percentage >= 100
  ) {
    return false;
  }

  if (!Number.isFinite(discount.price) || discount.price < 0) {
    return false;
  }

  if (
    !Number.isFinite(discount.quantitySold) ||
    discount.quantitySold < 0
  ) {
    return false;
  }

  if (
    discount.quantityLimit !== null &&
    (!Number.isFinite(discount.quantityLimit) ||
      discount.quantityLimit < 0)
  ) {
    return false;
  }

  if (
    discount.quantityLimit !== null &&
    discount.quantitySold + quantity > discount.quantityLimit
  ) {
    return false;
  }

  const nowTime = now.getTime();

  if (discount.startsAt) {
    const startsAt = Date.parse(discount.startsAt);

    if (!Number.isNaN(startsAt) && nowTime < startsAt) {
      return false;
    }
  }

  if (discount.endsAt) {
    const endsAt = Date.parse(discount.endsAt);

    if (!Number.isNaN(endsAt) && nowTime >= endsAt) {
      return false;
    }
  }

  return true;
}

function sameMoney(a: number, b: number): boolean {
  return Math.round(a * 100) === Math.round(b * 100);
}

function getOriginalPriceAndDiscount(
  item: ReturnType<typeof useCart>["items"][number],
  now: Date
): {
  originalPrice: number;
  discount: PublicProductPriceDiscount | null;
} {
  const variant = item.product.variants.find(
    (itemVariant) => itemVariant.id === item.colorKey
  );

  if (variant && item.sizeKey) {
    const size = variant.sizes.find(
      (itemSize) => itemSize.key === item.sizeKey
    );

    if (size && size.price !== null) {
      const discount = isDiscountUsableForQuantity(
        size.discount,
        item.quantity,
        now
      )
        ? size.discount
        : null;

      return {
        originalPrice: size.price,
        discount,
      };
    }
  }

  if (variant && variant.price !== null) {
    const discount = isDiscountUsableForQuantity(
      variant.discount,
      item.quantity,
      now
    )
      ? variant.discount
      : null;

    return {
      originalPrice: variant.price,
      discount,
    };
  }

  const discount = isDiscountUsableForQuantity(
    item.product.discount,
    item.quantity,
    now
  )
    ? item.product.discount
    : null;

  return {
    originalPrice: item.product.price,
    discount,
  };
}

export default function CartPage() {
  const { language } = useLanguage();

  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    isItemAvailable,
    hasUnavailableItems,
    totalItems,
    totalPrice,
  } = useCart();

  const t = translations[language].cart;

  const stockTranslations = {
    en: {
      unavailable: "Unavailable",
      checkoutBlocked:
        "Some items in your cart are no longer available in the requested quantity. Please adjust or remove them before checkout.",
      maxQuantity: "Maximum quantity is 10.",
      onlyAvailable: "Only",
      available: "available",
      size: "Size",
      customInformation: "Information",
      save: "Save",
    },

    de: {
      unavailable: "Nicht verfügbar",
      checkoutBlocked:
        "Einige Artikel in Ihrem Warenkorb sind in der gewünschten Menge nicht mehr verfügbar. Bitte passen Sie die Menge an oder entfernen Sie sie vor dem Checkout.",
      maxQuantity: "Die maximale Menge beträgt 10.",
      onlyAvailable: "Nur",
      available: "verfügbar",
      size: "Größe",
      customInformation: "Informationen",
      save: "Ersparnis",
    },

    ar: {
      unavailable: "غير متوفر",
      checkoutBlocked:
        "بعض المنتجات في سلتك لم تعد متوفرة بالكمية المطلوبة. يرجى تعديل الكمية أو حذفها قبل إتمام الطلب.",
      maxQuantity: "الحد الأقصى للكمية هو 10.",
      onlyAvailable: "المتاح فقط",
      available: "قطعة",
      size: "المقاس",
      customInformation: "المعلومات",
      save: "خصم",
    },
  };

  const stockT = stockTranslations[language];

  const shippingCost = getShippingCost(totalPrice);
  const finalTotal = totalPrice + shippingCost;

  const remainingForFreeShipping =
    getRemainingForFreeShipping(totalPrice);

  const handleClearCart = () => {
    if (window.confirm(t.clearConfirm)) {
      clearCart();
    }
  };

  const shippingText = {
    en: shippingCost === 0 ? "Free shipping" : "€3.00",
    de: shippingCost === 0 ? "Kostenloser Versand" : "3,00 €",
    ar: shippingCost === 0 ? "شحن مجاني" : "3.00 €",
  }[language];

  const freeShippingMessage = {
    en: `Free shipping from €${FREE_SHIPPING_THRESHOLD}.`,
    de: `Kostenloser Versand ab ${FREE_SHIPPING_THRESHOLD} €.`,
    ar: `الشحن مجاني للطلبات بقيمة ${FREE_SHIPPING_THRESHOLD} € أو أكثر.`,
  }[language];

  const remainingMessage = {
    en: `€${remainingForFreeShipping.toFixed(2)} more for free shipping`,
    de: `Noch ${remainingForFreeShipping.toFixed(2)} € bis zum kostenlosen Versand`,
    ar: `أضف ${remainingForFreeShipping.toFixed(2)} € للحصول على شحن مجاني`,
  }[language];

  const sizeLabels: Record<
    ProductSizeKey,
    Record<"en" | "de" | "ar", string>
  > = {
    small: {
      en: "Small",
      de: "Klein",
      ar: "صغير",
    },
    medium: {
      en: "Medium",
      de: "Mittel",
      ar: "متوسط",
    },
    large: {
      en: "Large",
      de: "Groß",
      ar: "كبير",
    },
  };

  const now = new Date();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-12 text-[var(--text-primary)] sm:px-6 sm:py-16">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/shop"
            className="cursor-pointer text-sm font-semibold text-[var(--brand-strong)] transition hover:underline"
          >
            {t.back}
          </Link>

          <div className="mt-16 rounded-3xl border bg-[var(--surface)] p-10 text-center shadow-sm sm:p-16">
            <div className="text-6xl">🛍️</div>

            <h1 className="mt-6 text-3xl font-bold">
              {t.empty}
            </h1>

            <p className="mx-auto mt-3 max-w-md leading-7 text-[var(--text-secondary)]">
              {t.emptyDescription}
            </p>

            <Link
              href="/shop"
              className="mt-7 inline-flex cursor-pointer rounded-full bg-[var(--brand)] px-7 py-3 font-semibold text-white transition hover:opacity-90"
            >
              {t.browse}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/shop"
          className="cursor-pointer text-sm font-semibold text-[var(--brand-strong)] transition hover:underline"
        >
          {t.back}
        </Link>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {t.title}
            </h1>

            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {totalItems}{" "}
              {totalItems === 1 ? t.item : t.items}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearCart}
            className="w-fit cursor-pointer text-sm font-semibold text-[var(--text-secondary)] transition hover:text-red-500"
          >
            {t.clear}
          </button>
        </div>

        {hasUnavailableItems && (
          <div
            role="alert"
            className="mt-6 rounded-3xl border border-red-300 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
          >
            {stockT.checkoutBlocked}
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-[var(--brand-soft)] bg-[var(--brand-soft)]/50 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-[var(--brand-strong)]">
              {shippingCost === 0
                ? freeShippingMessage
                : remainingMessage}
            </p>

            <p className="text-sm font-bold text-[var(--brand-strong)]">
              {shippingCost === 0 ? shippingText : "€3.00"}
            </p>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full bg-[var(--brand)] transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (totalPrice / FREE_SHIPPING_THRESHOLD) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            {items.map((item) => {
              const productName = item.product.name[language];

              const itemAvailable = isItemAvailable(item);

              const variant = item.product.variants.find(
                (itemVariant) => itemVariant.id === item.colorKey
              );

              const color = variant?.color[language] ?? "";

              const image =
                variant?.images?.[0] ??
                (item.product.masterImage
                  ? {
                      url: item.product.masterImage,
                    }
                  : null) ??
                item.product.generalImages?.[0] ??
                item.product.variants?.[0]?.images?.[0];

              const stock =
                item.product.variants.length === 0
                  ? item.product.stock
                  : variant?.stock ?? null;

              const maximumQuantity =
                stock === null
                  ? MAX_CART_QUANTITY
                  : Math.min(
                      MAX_CART_QUANTITY,
                      Math.max(0, stock)
                    );

              const canDecrease = item.quantity > 1;

              const canIncrease =
                itemAvailable &&
                item.quantity < maximumQuantity;

              const {
                originalPrice,
                discount,
              } = getOriginalPriceAndDiscount(item, now);

              const hasActiveDiscount =
                discount !== null &&
                !sameMoney(originalPrice, item.unitPrice);

              const discountPercentage =
                hasActiveDiscount && discount
                  ? discount.percentage
                  : 0;

              const selectedSize =
                item.sizeKey
                  ? sizeLabels[item.sizeKey]?.[language]
                  : "";

              return (
                <div
                  key={item.cartItemId}
                  className={`relative rounded-3xl border bg-[var(--surface)] p-4 shadow-sm sm:p-5 ${
                    !itemAvailable
                      ? "border-red-300 dark:border-red-900/60"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(item.cartItemId)
                    }
                    aria-label={`${t.remove}: ${productName}`}
                    className={`absolute right-4 top-4 z-20 cursor-pointer rounded-full px-3 py-1.5 text-sm font-bold shadow-sm ring-1 transition ${
                      !itemAvailable
                        ? "bg-red-100 text-red-700 ring-red-200 hover:bg-red-200 hover:text-red-800 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900/60 dark:hover:bg-red-950/70 dark:hover:text-red-200"
                        : "bg-[var(--surface)] text-[var(--text-primary)] ring-[var(--border)] hover:bg-red-50 hover:text-red-500 hover:ring-red-200 dark:hover:bg-red-950/40 dark:hover:ring-red-900/60"
                    }`}
                  >
                    {t.remove}
                  </button>

                  <div
                    className={
                      !itemAvailable
                        ? "opacity-50"
                        : ""
                    }
                  >
                    <div className="flex gap-4 pr-20 sm:gap-5">
                      <Link
                        href={`/products/${item.product.slug}`}
                        aria-label={productName}
                        className="relative h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-[var(--surface-soft)] sm:h-32 sm:w-32"
                      >
                        {image ? (
                          <Image
                            src={image.url}
                            alt={productName}
                            fill
                            className="object-cover"
                            sizes="128px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-4xl">
                            {item.product.emoji}
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              href={`/products/${item.product.slug}`}
                              className="cursor-pointer font-bold hover:text-[var(--brand)]"
                            >
                              {productName}
                            </Link>

                            {color && (
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                {color}
                              </p>
                            )}

                            {selectedSize && (
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                <span className="font-semibold">
                                  {stockT.size}:
                                </span>{" "}
                                {selectedSize}
                              </p>
                            )}

                            {item.customFields?.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {item.customFields.map((field) => (
                                  <p
                                    key={field.id}
                                    className="text-sm text-[var(--text-secondary)]"
                                  >
                                    <span className="font-semibold">
                                      {field.label}:
                                    </span>{" "}
                                    {field.value}
                                  </p>
                                ))}
                              </div>
                            )}

                            {!itemAvailable && (
                              <span className="mt-2 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                                {stockT.unavailable}
                              </span>
                            )}

                            {itemAvailable &&
                              stock !== null &&
                              item.quantity < stock && (
                                <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                                  {stockT.onlyAvailable} {stock}{" "}
                                  {stockT.available}
                                </p>
                              )}

                            {itemAvailable &&
                              item.quantity === maximumQuantity &&
                              maximumQuantity === MAX_CART_QUANTITY && (
                                <p className="mt-2 text-xs font-medium text-[var(--text-secondary)]">
                                  {stockT.maxQuantity}
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                          <div
                            className="flex items-center rounded-full border bg-[var(--surface-soft)]"
                            aria-label={t.quantity}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity - 1
                                )
                              }
                              disabled={!canDecrease}
                              aria-label={`${t.quantity} -`}
                              className="flex h-9 w-9 items-center justify-center rounded-full font-bold transition hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              −
                            </button>

                            <span className="min-w-8 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.cartItemId,
                                  item.quantity + 1
                                )
                              }
                              disabled={!canIncrease}
                              aria-label={`${t.quantity} +`}
                              className="flex h-9 w-9 items-center justify-center rounded-full font-bold transition hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right">
                            {hasActiveDiscount && (
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-sm font-medium text-[var(--text-secondary)] line-through">
                                  €{originalPrice.toFixed(2)}
                                </span>

                                <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-bold text-[var(--brand-strong)]">
                                  -{discountPercentage}%
                                </span>
                              </div>
                            )}

                            <p className="font-bold text-[var(--brand-strong)]">
                              €{item.unitPrice.toFixed(2)}
                            </p>

                            {hasActiveDiscount &&
                              item.quantity > 1 && (
                                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                                  €{item.unitPrice.toFixed(2)} ×{" "}
                                  {item.quantity}
                                </p>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="h-fit rounded-3xl border bg-[var(--surface)] p-6 shadow-sm lg:sticky lg:top-28">
            <h2 className="text-xl font-bold">{t.total}</h2>

            <div className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">
                  {t.subtotal}
                </span>

                <span className="font-semibold">
                  €{totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-secondary)]">
                  {t.shipping}
                </span>

                <span className="font-semibold text-[var(--brand-strong)]">
                  {shippingText}
                </span>
              </div>

              <p className="text-xs leading-5 text-[var(--text-muted)]">
                {freeShippingMessage}
              </p>
            </div>

            <div className="my-6 border-t" />

            <div className="flex items-center justify-between gap-4">
              <span className="text-lg font-bold">{t.total}</span>

              <span className="text-2xl font-bold text-[var(--brand-strong)]">
                €{finalTotal.toFixed(2)}
              </span>
            </div>

            {hasUnavailableItems ? (
              <button
                type="button"
                disabled
                className="mt-6 block w-full cursor-not-allowed rounded-full bg-[var(--text-secondary)] px-6 py-3.5 text-center font-semibold text-white opacity-60"
              >
                {t.checkout}
              </button>
            ) : (
              <Link
                href="/checkout"
                className="mt-6 block cursor-pointer rounded-full bg-[var(--brand)] px-6 py-3.5 text-center font-semibold text-white transition hover:opacity-90"
              >
                {t.checkout}
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}