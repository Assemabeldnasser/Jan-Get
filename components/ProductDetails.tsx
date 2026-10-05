"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProductGallery from "@/components/ProductGallery";
import { useLanguage } from "@/components/LanguageProvider";
import { useCart } from "@/components/CartProvider";

import type {
  ProductSizeKey,
  PublicProduct,
  PublicProductPriceDiscount,
} from "@/lib/product-public";

type ProductDetailsProps = {
  product: PublicProduct;
};

const MAX_PRODUCT_QUANTITY = 10;

function isDiscountUsableForQuantity(
  discount:
    | PublicProductPriceDiscount
    | null
    | undefined,
  quantity: number,
  now: Date
): boolean {
  if (!discount) {
    return false;
  }

  if (
    !Number.isFinite(discount.percentage) ||
    discount.percentage <= 0 ||
    discount.percentage >= 100
  ) {
    return false;
  }

  if (
    !Number.isFinite(discount.price) ||
    discount.price < 0
  ) {
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
    discount.quantityLimit !== null &&
    discount.quantitySold + quantity >
      discount.quantityLimit
  ) {
    return false;
  }

  const nowTime = now.getTime();

  if (discount.startsAt) {
    const startsAt = Date.parse(
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
    const endsAt = Date.parse(
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

function isDiscountCurrentlyActive(
  discount:
    | PublicProductPriceDiscount
    | null
    | undefined,
  now: Date
): boolean {
  if (!discount) {
    return false;
  }

  if (
    !Number.isFinite(discount.percentage) ||
    discount.percentage <= 0 ||
    discount.percentage >= 100
  ) {
    return false;
  }

  if (
    !Number.isFinite(discount.price) ||
    discount.price < 0
  ) {
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
    discount.quantityLimit !== null &&
    discount.quantitySold >=
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

function formatRemainingTime(
  endsAt: string,
  now: Date,
  language: "en" | "de" | "ar"
): string | null {
  const endTime =
    Date.parse(endsAt);

  if (
    !Number.isFinite(endTime)
  ) {
    return null;
  }

  const remainingMs =
    endTime - now.getTime();

  if (remainingMs <= 0) {
    return null;
  }

  const totalSeconds =
    Math.floor(
      remainingMs / 1000
    );

  const days =
    Math.floor(
      totalSeconds / 86400
    );

  const hours =
    Math.floor(
      (totalSeconds % 86400) /
        3600
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) /
        60
    );

  const seconds =
    totalSeconds % 60;

  if (language === "de") {
    const parts: string[] = [];

    if (days > 0) {
      parts.push(
        `${days} ${
          days === 1
            ? "Tag"
            : "Tage"
        }`
      );
    }

    if (
      hours > 0 ||
      days > 0
    ) {
      parts.push(
        `${hours} ${
          hours === 1
            ? "Stunde"
            : "Stunden"
        }`
      );
    }

    if (
      minutes > 0 ||
      hours > 0 ||
      days > 0
    ) {
      parts.push(
        `${minutes} ${
          minutes === 1
            ? "Minute"
            : "Minuten"
        }`
      );
    }

    parts.push(
      `${seconds} ${
        seconds === 1
          ? "Sekunde"
          : "Sekunden"
      }`
    );

    return `Angebot endet in ${parts.join(
      " "
    )}`;
  }

  if (language === "ar") {
    const parts: string[] = [];

    if (days > 0) {
      parts.push(
        `${days} ${
          days === 1
            ? "يوم"
            : "أيام"
        }`
      );
    }

    if (
      hours > 0 ||
      days > 0
    ) {
      parts.push(
        `${hours} ${
          hours === 1
            ? "ساعة"
            : "ساعات"
        }`
      );
    }

    if (
      minutes > 0 ||
      hours > 0 ||
      days > 0
    ) {
      parts.push(
        `${minutes} ${
          minutes === 1
            ? "دقيقة"
            : "دقائق"
        }`
      );
    }

    parts.push(
      `${seconds} ${
        seconds === 1
          ? "ثانية"
          : "ثوانٍ"
      }`
    );

    return `ينتهي العرض خلال ${parts.join(
      " "
    )}`;
  }

  const parts: string[] = [];

  if (days > 0) {
    parts.push(
      `${days} ${
        days === 1
          ? "day"
          : "days"
      }`
    );
  }

  if (
    hours > 0 ||
    days > 0
  ) {
    parts.push(
      `${hours} ${
        hours === 1
          ? "hour"
          : "hours"
      }`
    );
  }

  if (
    minutes > 0 ||
    hours > 0 ||
    days > 0
  ) {
    parts.push(
      `${minutes} ${
        minutes === 1
          ? "minute"
          : "minutes"
      }`
    );
  }

  parts.push(
    `${seconds} ${
      seconds === 1
        ? "second"
        : "seconds"
    }`
  );

  return `Sale ends in ${parts.join(
    " "
  )}`;
}

export default function ProductDetails({
  product,
}: ProductDetailsProps) {
  const { language } =
    useLanguage();

  const { addToCart } =
    useCart();

  const [
    selectedColor,
    setSelectedColor,
  ] = useState(
    product.variants.length ===
      1
      ? product.variants[0]?.id ??
          ""
      : ""
  );

  const [
    selectedSize,
    setSelectedSize,
  ] = useState<
    ProductSizeKey | ""
  >("");

  const [
    customFieldValues,
    setCustomFieldValues,
  ] = useState<
    Record<string, string>
  >({});

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    added,
    setAdded,
  ] = useState(false);

  const [
    selectionError,
    setSelectionError,
  ] = useState(false);

  const [
    quantityError,
    setQuantityError,
  ] = useState(false);

  const [
    customFieldError,
    setCustomFieldError,
  ] = useState(false);

  const [
    currentTime,
    setCurrentTime,
  ] = useState(() =>
    new Date()
  );

  const productName =
    product.name[language];

  const productDescription =
    product.description[
      language
    ];

  const categoryTranslations = {
    en: {
      "Kids & Play":
        "Kids & Play",
      "Home & Living":
        "Home & Living",
      Decor: "Decor",
      Gifts: "Gifts",
      "Desk & Office":
        "Desk & Office",
      Accessories:
        "Accessories",
      Collectibles:
        "Collectibles",
      Personalized:
        "Personalized",
    },

    de: {
      "Kids & Play":
        "Kinder & Spielen",
      "Home & Living":
        "Haus & Wohnen",
      Decor: "Dekoration",
      Gifts: "Geschenke",
      "Desk & Office":
        "Schreibtisch & Büro",
      Accessories:
        "Accessoires",
      Collectibles:
        "Sammlerstücke",
      Personalized:
        "Personalisiert",
    },

    ar: {
      "Kids & Play":
        "الأطفال واللعب",
      "Home & Living":
        "المنزل والمعيشة",
      Decor: "الديكور",
      Gifts: "الهدايا",
      "Desk & Office":
        "المكتب والعمل",
      Accessories:
        "الإكسسوارات",
      Collectibles:
        "المقتنيات",
      Personalized:
        "منتجات مخصصة",
    },
  };

  const pageTranslations = {
    en: {
      back: "← Back to shop",
      addToCart:
        "Add to cart",
      addedToCart:
        "Added to cart ✓",
      madeWithCare:
        "Made with care",
      outOfStock:
        "Out of stock",
      variantOutOfStock:
        "This color is out of stock",
      selectColor:
        "Please select a color first.",
      selectSize:
        "Please select a size.",
      fillRequiredFields:
        "Please fill in all required fields.",
      onlyLeft: "Only",
      leftSuffix: "left",
      quantity: "Quantity",
      maxQuantity:
        "Maximum quantity is 10.",
      quantityUnavailable:
        "The selected quantity is not available.",
      size: "Size",
      small: "Small",
      medium: "Medium",
      large: "Large",
      required: "Required",
    },

    de: {
      back: "← Zurück zum Shop",
      addToCart:
        "In den Warenkorb",
      addedToCart:
        "Zum Warenkorb hinzugefügt ✓",
      madeWithCare:
        "Mit Liebe gemacht",
      outOfStock:
        "Nicht auf Lager",
      variantOutOfStock:
        "Diese Farbe ist nicht auf Lager",
      selectColor:
        "Bitte wählen Sie zuerst eine Farbe.",
      selectSize:
        "Bitte wählen Sie eine Größe.",
      fillRequiredFields:
        "Bitte füllen Sie alle Pflichtfelder aus.",
      onlyLeft: "Nur noch",
      leftSuffix:
        "verfügbar",
      quantity: "Menge",
      maxQuantity:
        "Die maximale Menge beträgt 10.",
      quantityUnavailable:
        "Die ausgewählte Menge ist nicht verfügbar.",
      size: "Größe",
      small: "Klein",
      medium: "Mittel",
      large: "Groß",
      required:
        "Pflichtfeld",
    },

    ar: {
      back: "→ العودة إلى المتجر",
      addToCart:
        "أضف إلى السلة",
      addedToCart:
        "تمت الإضافة إلى السلة ✓",
      madeWithCare:
        "مصنوع بعناية",
      outOfStock:
        "غير متوفر",
      variantOutOfStock:
        "هذا اللون غير متوفر حاليًا",
      selectColor:
        "يرجى اختيار اللون أولًا.",
      selectSize:
        "يرجى اختيار المقاس.",
      fillRequiredFields:
        "يرجى ملء جميع الحقول المطلوبة.",
      onlyLeft: "متبقي",
      leftSuffix: "فقط",
      quantity: "الكمية",
      maxQuantity:
        "الحد الأقصى للكمية هو 10.",
      quantityUnavailable:
        "الكمية المختارة غير متوفرة.",
      size: "المقاس",
      small: "صغير",
      medium: "متوسط",
      large: "كبير",
      required: "مطلوب",
    },
  };

  const categoryLabel =
    categoryTranslations[
      language
    ][
      product.category as keyof typeof categoryTranslations.en
    ] ??
    product.category;

  const pageT =
    pageTranslations[language];

  const hasVariants =
    product.variants.length >
    0;

  const hasMultipleVariants =
    product.variants.length >
    1;

  const hasAvailableVariant =
    product.variants.some(
      (variant) =>
        variant.active &&
        variant.inStock &&
        (
          variant.stock ===
            null ||
          variant.stock > 0
        )
    );

  const productCanBePurchased =
    product.active &&
    product.inStock &&
    (
      !hasVariants ||
      hasAvailableVariant
    );

  const selectedVariant =
    product.variants.find(
      (variant) =>
        variant.id ===
        selectedColor
    );

  const selectedColorIsRequired =
    hasMultipleVariants &&
    !selectedColor;

  const selectedVariantCanBePurchased =
    productCanBePurchased &&
    (
      !hasVariants
        ? true
        : selectedVariant
          ? selectedVariant.active &&
            selectedVariant.inStock &&
            (
              selectedVariant.stock ===
                null ||
              selectedVariant.stock >
                0
            )
          : !selectedColorIsRequired
    );

  const selectedUnavailable =
    hasVariants &&
    !!selectedColor &&
    !selectedVariantCanBePurchased;

  const availableSizes =
    selectedVariant?.sizes ??
    [];

  const hasSizes =
    availableSizes.length >
    0;

  const customFields =
    selectedVariant?.customFields ??
    [];

  const hasCustomFields =
    customFields.length >
    0;

  const areCustomFieldsValid =
    customFields.every(
      (field) =>
        (
          customFieldValues[
            field.id
          ] ?? ""
        ).trim().length >
        0
    );

  /*
   * Selected color price.
   *
   * null means there is no color-specific
   * price, so the product basic price is used.
   */
  const selectedColorPrice =
    selectedVariant &&
    typeof selectedVariant.price ===
      "number" &&
    Number.isFinite(
      selectedVariant.price
    )
      ? Math.max(
          0,
          selectedVariant.price
        )
      : null;

  /*
   * Selected size price.
   *
   * This is already the COMPLETE final price.
   *
   * It does NOT get added to the color price.
   */
  const selectedSizePrice =
    selectedVariant &&
    selectedSize
      ? (
          selectedVariant.sizes ??
          []
        ).find(
          (size) =>
            size.key ===
            selectedSize
        )?.price ?? null
      : null;

  /*
   * Direct-price priority:
   *
   * 1. Size direct price
   * 2. Color direct price
   * 3. Basic product price
   *
   * A more specific direct price always wins.
   * Its discount is considered independently.
   *
   * If that specific discount is inactive or
   * unavailable for the selected quantity, we
   * keep its original direct price and DO NOT
   * fall back to a less-specific discount.
   */
  let originalPrice =
    Math.max(
      0,
      product.price
    );

  let applicableDiscount:
    | PublicProductPriceDiscount
    | null =
    null;

  if (
    selectedSizePrice !== null &&
    typeof selectedSizePrice ===
      "number" &&
    Number.isFinite(
      selectedSizePrice
    )
  ) {
    originalPrice =
      Math.max(
        0,
        selectedSizePrice
      );

    const selectedSizeOption =
      selectedVariant?.sizes.find(
        (size) =>
          size.key ===
          selectedSize
      );

    if (
      selectedSizeOption &&
      isDiscountUsableForQuantity(
        selectedSizeOption.discount,
        quantity,
        currentTime
      )
    ) {
      applicableDiscount =
        selectedSizeOption.discount;
    }
  } else if (
    selectedColorPrice !== null
  ) {
    originalPrice =
      selectedColorPrice;

    if (
      selectedVariant &&
      isDiscountUsableForQuantity(
        selectedVariant.discount,
        quantity,
        currentTime
      )
    ) {
      applicableDiscount =
        selectedVariant.discount;
    }
  } else if (
    isDiscountUsableForQuantity(
      product.discount,
      quantity,
      currentTime
    )
  ) {
    applicableDiscount =
      product.discount;
  }

  /*
   * The sale information displayed below the price
   * follows the same direct-price hierarchy.
   *
   * It is intentionally independent from the
   * selected quantity so the customer can see
   * how many sale units remain even when they
   * currently selected more than the remaining
   * sale quantity.
   */
  let saleDisplayDiscount:
    | PublicProductPriceDiscount
    | null =
    null;

  if (
    selectedSizePrice !== null &&
    typeof selectedSizePrice ===
      "number" &&
    Number.isFinite(
      selectedSizePrice
    )
  ) {
    const selectedSizeOption =
      selectedVariant?.sizes.find(
        (size) =>
          size.key ===
          selectedSize
      );

    if (
      selectedSizeOption &&
      isDiscountCurrentlyActive(
        selectedSizeOption.discount,
        currentTime
      )
    ) {
      saleDisplayDiscount =
        selectedSizeOption.discount;
    }
  } else if (
    selectedColorPrice !== null
  ) {
    if (
      selectedVariant &&
      isDiscountCurrentlyActive(
        selectedVariant.discount,
        currentTime
      )
    ) {
      saleDisplayDiscount =
        selectedVariant.discount;
    }
  } else if (
    isDiscountCurrentlyActive(
      product.discount,
      currentTime
    )
  ) {
    saleDisplayDiscount =
      product.discount;
  }

  const finalPrice =
    applicableDiscount
      ? Math.max(
          0,
          applicableDiscount.price
        )
      : originalPrice;

  const hasActiveDiscount =
    applicableDiscount !== null &&
    finalPrice <
      originalPrice;

  const saleRemainingItems =
    saleDisplayDiscount &&
    saleDisplayDiscount.quantityLimit !==
      null
      ? Math.max(
          0,
          saleDisplayDiscount.quantityLimit -
            saleDisplayDiscount.quantitySold
        )
      : null;

  const saleRemainingTime =
    saleDisplayDiscount &&
    saleDisplayDiscount.endsAt
      ? formatRemainingTime(
          saleDisplayDiscount.endsAt,
          currentTime,
          language
        )
      : null;

  const addButtonDisabled =
    !productCanBePurchased ||
    selectedUnavailable;

  const displayedStock =
    hasVariants
      ? selectedVariant?.stock ??
        null
      : product.stock;

  const maximumQuantity =
    displayedStock === null
      ? MAX_PRODUCT_QUANTITY
      : Math.min(
          MAX_PRODUCT_QUANTITY,
          Math.max(
            0,
            displayedStock
          )
        );

  const canDecrease =
    quantity > 1;

  const canIncrease =
    selectedVariantCanBePurchased &&
    quantity <
      maximumQuantity;

  const getSizeLabel = (
    sizeKey: ProductSizeKey
  ) => {
    switch (sizeKey) {
      case "small":
        return pageT.small;

      case "medium":
        return pageT.medium;

      case "large":
        return pageT.large;

      default:
        return sizeKey;
    }
  };

  const handleColorChange = (
    colorKey: string
  ) => {
    const nextVariant =
      product.variants.find(
        (variant) =>
          variant.id ===
          colorKey
      );

    if (!nextVariant) {
      return;
    }

    setSelectedColor(
      colorKey
    );

    setSelectedSize("");

    setCustomFieldValues(
      {}
    );

    setSelectionError(
      false
    );

    setCustomFieldError(
      false
    );

    setQuantityError(
      false
    );

    setAdded(false);

    const nextMaximumQuantity =
      nextVariant.stock ===
        null
        ? MAX_PRODUCT_QUANTITY
        : Math.min(
            MAX_PRODUCT_QUANTITY,
            Math.max(
              0,
              nextVariant.stock
            )
          );

    setQuantity(
      (currentQuantity) =>
        Math.min(
          currentQuantity,
          Math.max(
            1,
            nextMaximumQuantity
          )
        )
    );
  };

  const handleSizeChange = (
    sizeKey: ProductSizeKey
  ) => {
    setSelectedSize(
      sizeKey
    );

    setSelectionError(
      false
    );

    setQuantityError(
      false
    );

    setAdded(false);
  };

  const handleCustomFieldChange = (
    fieldId: string,
    value: string
  ) => {
    setCustomFieldValues(
      (current) => ({
        ...current,
        [fieldId]: value,
      })
    );

    setCustomFieldError(
      false
    );

    setSelectionError(
      false
    );

    setAdded(false);
  };

  const handleDecreaseQuantity =
    () => {
      setQuantityError(
        false
      );

      setQuantity(
        (currentQuantity) =>
          Math.max(
            1,
            currentQuantity -
              1
          )
      );
    };

  const handleIncreaseQuantity =
    () => {
      if (
        quantity >=
        maximumQuantity
      ) {
        return;
      }

      setQuantityError(
        false
      );

      setQuantity(
        (currentQuantity) =>
          Math.min(
            maximumQuantity,
            currentQuantity +
              1
          )
      );
    };

  const handleAddToCart = () => {
    if (
      hasMultipleVariants &&
      !selectedColor
    ) {
      setSelectionError(
        true
      );

      return;
    }

    if (
      !productCanBePurchased
    ) {
      return;
    }

    if (
      hasVariants &&
      !selectedVariant
    ) {
      setSelectionError(
        true
      );

      return;
    }

    if (
      !selectedVariantCanBePurchased
    ) {
      return;
    }

    if (
      hasSizes &&
      !selectedSize
    ) {
      setSelectionError(
        true
      );

      return;
    }

    if (
      hasCustomFields &&
      !areCustomFieldsValid
    ) {
      setCustomFieldError(
        true
      );

      return;
    }

    if (
      quantity < 1 ||
      quantity >
        maximumQuantity
    ) {
      setQuantityError(
        true
      );

      return;
    }

    const selectedCustomFields =
      customFields.map(
        (field) => ({
          id: field.id,
          label: field.label,
          value:
            (
              customFieldValues[
                field.id
              ] ?? ""
            ).trim(),
        })
      );

    const wasAdded =
      addToCart(
        product,
        hasVariants
          ? selectedColor
          : "",
        hasVariants
          ? selectedSize
          : "",
        selectedCustomFields,
        quantity
      );

    if (wasAdded) {
      setAdded(true);

      setSelectionError(
        false
      );

      setCustomFieldError(
        false
      );

      setQuantityError(
        false
      );
    } else {
      setQuantityError(
        true
      );
    }
  };

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setCurrentTime(
            new Date()
          );
        },
        1_000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, []);

  useEffect(() => {
    if (!added) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setAdded(false);
        },
        2000
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [added]);

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/shop"
          className="inline-flex cursor-pointer items-center rounded-full border border-[var(--brand-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--brand-soft)]"
        >
          {pageT.back}
        </Link>

        <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          <div>
            <ProductGallery
              masterImage={
                product.masterImage
              }
              generalImages={
                product.generalImages
              }
              variants={
                product.variants
              }
              productName={
                productName
              }
              fallbackEmoji={
                product.emoji
              }
              selectedColorId={
                selectedColor
              }
              onColorChange={
                handleColorChange
              }
              productAvailable={
                productCanBePurchased
              }
            />
          </div>

          <div className="flex flex-col justify-center lg:py-8">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
                {categoryLabel}
              </p>

              {!productCanBePurchased && (
                <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                  {pageT.outOfStock}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
              {productName}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg sm:leading-8">
              {productDescription}
            </p>

            <div className="mt-7 border-y border-[var(--border)] py-6">
              {hasActiveDiscount ? (
                <div className="flex flex-wrap items-center gap-3">
                  <p
                    className="text-lg font-bold text-[var(--text-secondary)] sm:text-xl"
                    style={{
                      textDecorationLine:
                        "line-through",
                      textDecorationThickness:
                        "2px",
                      textDecorationSkipInk:
                        "none",
                    }}
                  >
                    €{originalPrice.toFixed(2)}
                  </p>

                  <p className="text-3xl font-black text-[var(--brand-strong)] sm:text-4xl">
                    €{finalPrice.toFixed(2)}
                  </p>

                  <span className="rounded-lg border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-2.5 py-1.5 text-xs font-extrabold tracking-tight text-[var(--brand-strong)] sm:text-sm">
                    −
                    {Math.round(
                      applicableDiscount!.percentage
                    )}
                    %
                  </span>
                </div>
              ) : (
                <p className="text-3xl font-black text-[var(--brand-strong)] sm:text-4xl">
                  €{finalPrice.toFixed(2)}
                </p>
              )}

              {saleDisplayDiscount &&
                saleRemainingItems !== null && (
                  <p className="mt-3 text-sm font-bold text-[var(--brand-strong)]">
                    {pageT.onlyLeft}{" "}
                    {saleRemainingItems}{" "}
                    {pageT.leftSuffix}
                  </p>
                )}

              {saleRemainingTime && (
                <p className="mt-1 text-sm font-bold text-[var(--brand-strong)]">
                  {saleRemainingTime}
                </p>
              )}

              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {pageT.madeWithCare}
              </p>
            </div>

            {selectedVariant &&
              !(
                selectedVariant.active &&
                selectedVariant.inStock &&
                (
                  selectedVariant.stock ===
                    null ||
                  selectedVariant.stock >
                    0
                )
              ) && (
                <p className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]">
                  {
                    pageT.variantOutOfStock
                  }
                </p>
              )}

            {selectionError && (
              <p
                role="alert"
                className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--brand-strong)]"
              >
                {!selectedColor &&
                hasMultipleVariants
                  ? pageT.selectColor
                  : hasSizes &&
                      !selectedSize
                    ? pageT.selectSize
                    : pageT.fillRequiredFields}
              </p>
            )}

            {customFieldError && (
              <p
                role="alert"
                className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--brand-strong)]"
              >
                {
                  pageT.fillRequiredFields
                }
              </p>
            )}

            {quantityError && (
              <p
                role="alert"
                className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--brand-strong)]"
              >
                {maximumQuantity ===
                MAX_PRODUCT_QUANTITY
                  ? pageT.maxQuantity
                  : pageT.quantityUnavailable}
              </p>
            )}

            {hasSizes &&
              selectedVariantCanBePurchased && (
                <div className="mt-7">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">
                      {pageT.size}
                    </p>

                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      {pageT.required}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {availableSizes.map(
                      (size) => {
                        const isSelected =
                          selectedSize ===
                          size.key;

                        return (
                          <button
                            key={
                              size.key
                            }
                            type="button"
                            onClick={() =>
                              handleSizeChange(
                                size.key
                              )
                            }
                            className={`min-w-24 cursor-pointer rounded-full border px-5 py-3 text-sm font-bold transition ${
                              isSelected
                                ? "border-[var(--brand)] bg-[var(--brand)] text-white shadow-sm"
                                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
                            }`}
                          >
                            {
                              getSizeLabel(
                                size.key
                              )
                            }
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {hasCustomFields &&
              selectedVariantCanBePurchased && (
                <div className="mt-7">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-[var(--text-secondary)]">
                      {pageT.required}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {customFields.map(
                      (field) => (
                        <div
                          key={
                            field.id
                          }
                        >
                          <label
                            htmlFor={`custom-field-${field.id}`}
                            className="mb-2 block text-sm font-semibold text-[var(--text-primary)]"
                          >
                            {
                              field.label
                            }{" "}
                            <span className="text-[var(--brand-strong)]">
                              *
                            </span>
                          </label>

                          <input
                            id={`custom-field-${field.id}`}
                            type="text"
                            value={
                              customFieldValues[
                                field.id
                              ] ??
                              ""
                            }
                            onChange={(
                              event
                            ) =>
                              handleCustomFieldChange(
                                field.id,
                                event
                                  .target
                                  .value
                              )
                            }
                            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {selectedVariantCanBePurchased && (
              <div className="mt-7">
                <p className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
                  {pageT.quantity}
                </p>

                <div className="flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)]">
                  <button
                    type="button"
                    onClick={
                      handleDecreaseQuantity
                    }
                    disabled={
                      !canDecrease
                    }
                    aria-label={`${pageT.quantity} -`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-lg font-bold transition hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>

                  <span
                    aria-live="polite"
                    className="min-w-12 text-center text-sm font-bold"
                  >
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={
                      handleIncreaseQuantity
                    }
                    disabled={
                      !canIncrease
                    }
                    aria-label={`${pageT.quantity} +`}
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-lg font-bold transition hover:bg-[var(--brand-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="mt-7">
              <button
                type="button"
                onClick={
                  handleAddToCart
                }
                disabled={
                  addButtonDisabled
                }
                aria-live="polite"
                className={`w-full rounded-full px-8 py-4 text-sm font-bold text-white shadow-sm transition-all duration-200 sm:w-auto sm:min-w-56 sm:text-base ${
                  added
                    ? "bg-[var(--brand-strong)]"
                    : addButtonDisabled
                      ? "cursor-not-allowed bg-[var(--text-secondary)] opacity-60"
                      : "cursor-pointer bg-[var(--brand)] hover:-translate-y-0.5 hover:opacity-90"
                }`}
              >
                {added
                  ? pageT.addedToCart
                  : !productCanBePurchased ||
                      selectedUnavailable
                    ? pageT.outOfStock
                    : pageT.addToCart}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}