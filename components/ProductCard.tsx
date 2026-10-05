"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useLanguage } from "./LanguageProvider";

import { translations } from "@/data/translations";

import { useCart } from "./CartProvider";

import type {
PublicProduct,
PublicProductVariant,
} from "@/lib/product-public";

type ProductCardProps = {
product: PublicProduct;
};

export default function ProductCard({
product,
}: ProductCardProps) {
const { language } = useLanguage();

const { addToCart } = useCart();

const router = useRouter();

const [added, setAdded] = useState(false);

const [showColorPicker, setShowColorPicker] =
useState(false);

const [selectedColorKey, setSelectedColorKey] =
useState("");

const [currentTime, setCurrentTime] =
useState(() => new Date());

useEffect(() => {
const updateCurrentTime = () => {
setCurrentTime(new Date());
};


updateCurrentTime();

const interval = window.setInterval(
  updateCurrentTime,
  1000
);

return () => {
  window.clearInterval(interval);
};


}, []);

const t = translations[language].products;

const productName = product.name[language];

const productDescription =
product.description[language];

const firstVariant = product.variants[0];

const firstVariantImage =
firstVariant?.images[0]?.url;

const firstImage =
product.masterImage ||
firstVariantImage ||
product.generalImages[0]?.url ||
"";

const firstColorKey =
firstVariant?.id ?? "";

const firstColor =
firstVariant?.color[language] ?? "";

const hasVariants =
product.variants.length > 0;

const hasMultipleVariants =
product.variants.length > 1;

const productBaseAvailable =
product.active &&
product.inStock &&
(
product.stock === null ||
product.stock > 0
);

const isVariantAvailable =
(
variant: PublicProductVariant
) =>
productBaseAvailable &&
variant.active &&
variant.inStock &&
(
variant.stock === null ||
variant.stock > 0
);

const hasAvailableVariant =
product.variants.some(
(variant) =>
isVariantAvailable(variant)
);

const productAvailable =
productBaseAvailable &&
(
!hasVariants ||
hasAvailableVariant
);

const selectedVariant =
product.variants.find(
(variant) =>
variant.id === selectedColorKey
);

const selectedVariantAvailable =
selectedVariant
? isVariantAvailable(
selectedVariant
)
: false;

const variantNeedsOptions =
(
variant: PublicProductVariant
) =>
(variant.sizes?.length ?? 0) > 0 ||
(variant.customFields?.length ?? 0) > 0;

const goToProductPage = () => {
router.push(
`/products/${product.slug}`
);
};

const chooseOptionsLabel =
language === "de"
? "Optionen wählen"
: language === "ar"
? "اختيار الخيارات"
: "Choose options";

const singleVariantNeedsOptions =
hasVariants &&
!hasMultipleVariants &&
firstVariant
? variantNeedsOptions(firstVariant)
: false;

/*

* ProductCard does not select a size.
*
* Therefore:
* * selected color price is used when a color
* has an explicit final price
* * otherwise the basic product price is used
*
* Size-specific prices are handled on the
* product details page after a size is selected.
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

const displayedPrice =
selectedColorPrice !== null
? selectedColorPrice
: product.price;

const isDiscountUsable =
(
discount:
| PublicProduct["discount"]
| PublicProductVariant["discount"]
| null
| undefined,
currentPrice: number
) => {
if (!discount) {
return false;
}


  const percentage =
    Number(discount.percentage);

  const discountPrice =
    Number(discount.price);

  if (
    !Number.isFinite(
      percentage
    ) ||
    percentage <= 0 ||
    percentage >= 100
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      discountPrice
    ) ||
    discountPrice < 0 ||
    discountPrice >= currentPrice
  ) {
    return false;
  }

  const quantityLimit =
    discount.quantityLimit ===
      null ||
    discount.quantityLimit ===
      undefined
      ? null
      : Number(
          discount.quantityLimit
        );

  const quantitySold =
    Number(
      discount.quantitySold ?? 0
    );

  if (
    !Number.isFinite(
      quantitySold
    ) ||
    quantitySold < 0
  ) {
    return false;
  }

  if (
    quantityLimit !== null
  ) {
    if (
      !Number.isFinite(
        quantityLimit
      ) ||
      quantityLimit < 0 ||
      quantitySold >=
        quantityLimit
    ) {
      return false;
    }
  }

  const now =
    currentTime.getTime();

  if (discount.startsAt) {
    const startsAt =
      new Date(
        discount.startsAt
      ).getTime();

    if (
      Number.isFinite(
        startsAt
      ) &&
      now < startsAt
    ) {
      return false;
    }
  }

  if (discount.endsAt) {
    const endsAt =
      new Date(
        discount.endsAt
      ).getTime();

    if (
      Number.isFinite(
        endsAt
      ) &&
      now >= endsAt
    ) {
      return false;
    }
  }

  return true;
};


/*

* The card has no size selection, so its pricing hierarchy is:
*
* 1. Color direct price + that color's own discount
* 2. Basic product price + basic product discount
*
* A color discount is never applied to the Basic price.
  */
  let originalPrice =
  displayedPrice;

let salePrice: number | null =
null;

let activeDiscountPercentage:
number | null =
null;

if (
selectedColorPrice !== null &&
selectedVariant
) {
const variantDiscount =
selectedVariant.discount;


if (
  isDiscountUsable(
    variantDiscount,
    selectedColorPrice
  )
) {
  originalPrice =
    selectedColorPrice;

  salePrice =
    Number(
      variantDiscount!.price
    );

  activeDiscountPercentage =
    Number(
      variantDiscount!.percentage
    );
}


} else {
const basicDiscount =
product.discount;


if (
  isDiscountUsable(
    basicDiscount,
    product.price
  )
) {
  originalPrice =
    product.price;

  salePrice =
    Number(
      basicDiscount!.price
    );

  activeDiscountPercentage =
    Number(
      basicDiscount!.percentage
    );
}


}

const hasActiveSale =
salePrice !== null &&
Number.isFinite(
salePrice
) &&
salePrice >= 0 &&
salePrice < originalPrice;

const handleAddToCart = () => {
if (
!productAvailable ||
added
) {
return;
}


if (hasMultipleVariants) {
  if (!showColorPicker) {
    setShowColorPicker(true);
    return;
  }

  if (
    !selectedColorKey ||
    !selectedVariantAvailable ||
    !selectedVariant
  ) {
    return;
  }

  if (
    variantNeedsOptions(
      selectedVariant
    )
  ) {
    goToProductPage();
    return;
  }

  addToCart(
    product,
    selectedColorKey
  );
} else if (hasVariants) {
  if (
    !firstColorKey ||
    !firstVariant ||
    !isVariantAvailable(
      firstVariant
    )
  ) {
    return;
  }

  if (
    variantNeedsOptions(
      firstVariant
    )
  ) {
    goToProductPage();
    return;
  }

  addToCart(
    product,
    firstColorKey
  );
} else {
  addToCart(
    product,
    ""
  );
}

setAdded(true);
setShowColorPicker(false);
setSelectedColorKey("");

window.setTimeout(() => {
  setAdded(false);
}, 2000);


};

const handleVariantSelect = (
variant: PublicProductVariant
) => {
if (
!isVariantAvailable(variant)
) {
return;
}


setSelectedColorKey(
  variant.id
);


};

const getVariantColorLabel = (
variant: PublicProductVariant
) =>
variant.color[language] ??
variant.color.en ??
"";

return ( <article className="group overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
<Link
href={`/products/${product.slug}`}
className="block"
aria-label={`${t.viewProduct}: ${productName}`}
> <div className="relative aspect-square overflow-hidden bg-[var(--surface-soft)]">
{firstImage ? (
<Image
src={firstImage}
alt={`${productName}${
                firstColor
                  ? ` - ${firstColor}`
                  : ""
              }`}
fill
className="object-cover transition duration-500 group-hover:scale-105"
sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
/>
) : ( <div className="flex h-full items-center justify-center text-6xl">
{product.emoji} </div>
)}


      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
        {product.featured && (
          <span className="rounded-full bg-[var(--surface)]/90 px-3 py-1.5 text-xs font-semibold text-[var(--brand-strong)] shadow-sm backdrop-blur-sm">
            {t.featured}
          </span>
        )}

        {!productAvailable && (
          <span className="rounded-full bg-gray-700/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
            {language === "de"
              ? "Nicht verfügbar"
              : language === "ar"
                ? "غير متوفر"
                : "Out of Stock"}
          </span>
        )}
      </div>
    </div>
  </Link>

  <div className="p-5 sm:p-6">
    <Link
      href={`/products/${product.slug}`}
      className="block"
    >
      <h3 className="min-h-[1.5rem] font-bold leading-6 text-[var(--text-primary)] transition-colors group-hover:text-[var(--brand)]">
        {productName}
      </h3>

      <p className="mt-2 line-clamp-2 min-h-[3rem] text-sm leading-6 text-[var(--text-secondary)]">
        {productDescription}
      </p>
    </Link>

    {showColorPicker &&
      productAvailable &&
      hasMultipleVariants && (
        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
            {language === "de"
              ? "Farbe auswählen"
              : language === "ar"
                ? "اختر اللون"
                : "Choose a color"}
          </p>

          <div className="flex flex-wrap gap-2">
            {product.variants.map(
              (variant) => {
                const available =
                  isVariantAvailable(
                    variant
                  );

                const isSelected =
                  selectedColorKey ===
                  variant.id;

                const colorLabel =
                  getVariantColorLabel(
                    variant
                  );

                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!available}
                    onClick={() =>
                      handleVariantSelect(
                        variant
                      )
                    }
                    aria-label={
                      available
                        ? colorLabel
                        : `${colorLabel} - ${
                            language === "de"
                              ? "Nicht verfügbar"
                              : language === "ar"
                                ? "غير متوفر"
                                : "Out of stock"
                          }`
                    }
                    className={`relative overflow-hidden rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      available
                        ? isSelected
                          ? "border-[var(--brand-strong)] bg-[var(--brand-soft)] text-[var(--brand-strong)] ring-2 ring-[var(--brand)]/20"
                          : "cursor-pointer border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
                        : "cursor-not-allowed border-gray-300 bg-gray-200 text-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {colorLabel}

                    {!available && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[calc(100%+12px)] -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] bg-gray-500"
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>

          {!selectedColorKey && (
            <p className="mt-3 text-xs font-medium text-[var(--text-secondary)]">
              {language === "de"
                ? "Bitte wählen Sie zuerst eine Farbe."
                : language === "ar"
                  ? "اختر لونًا أولًا."
                  : "Please choose a color first."}
            </p>
          )}

          {selectedVariant &&
            selectedVariantAvailable &&
            variantNeedsOptions(
              selectedVariant
            ) && (
              <p className="mt-3 text-xs font-medium text-[var(--brand-strong)]">
                {language === "de"
                  ? "Weitere Optionen müssen auf der Produktseite ausgewählt werden."
                  : language === "ar"
                    ? "يجب اختيار باقي الخيارات من صفحة المنتج."
                    : "Additional options must be selected on the product page."}
              </p>
            )}

          {selectedVariant &&
            !selectedVariantAvailable && (
              <p className="mt-3 text-xs font-medium text-gray-500">
                {language === "de"
                  ? "Diese Farbe ist derzeit nicht verfügbar."
                  : language === "ar"
                    ? "هذا اللون غير متوفر حاليًا."
                    : "This color is currently unavailable."}
              </p>
            )}
        </div>
      )}

    <div className="mt-5">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            {hasActiveSale ? (
              <>
                <span
                  className="shrink-0 text-sm font-medium text-[var(--text-secondary)] sm:text-base"
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
                </span>

                <span className="shrink-0 text-xl font-bold text-[var(--brand-strong)] sm:text-2xl">
                  €{salePrice!.toFixed(2)}
                </span>

                {activeDiscountPercentage !==
                  null && (
                  <span className="rounded-lg border border-[var(--brand-soft)] bg-[var(--brand-soft)] px-2.5 py-1.5 text-xs font-extrabold tracking-tight text-[var(--brand-strong)] sm:text-sm">
                    −
                    {Math.round(
                      activeDiscountPercentage
                    )}
                    %
                  </span>
                )}
              </>
            ) : (
              <span className="shrink-0 text-lg font-bold text-[var(--brand-strong)]">
                €{displayedPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={
          singleVariantNeedsOptions
            ? goToProductPage
            : handleAddToCart
        }
        disabled={
          !productAvailable ||
          added
        }
        aria-live="polite"
        className={`mt-4 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200 sm:px-5 sm:text-sm ${
          !productAvailable
            ? "cursor-not-allowed bg-gray-500 opacity-80"
            : added
              ? "bg-[var(--brand-strong)]"
              : "cursor-pointer bg-[var(--brand)] hover:-translate-y-0.5 hover:opacity-90"
        }`}
      >
        {!productAvailable
          ? language === "de"
            ? "Nicht verfügbar"
            : language === "ar"
              ? "غير متوفر"
              : "Out of stock"
          : added
            ? t.addedToCart
            : singleVariantNeedsOptions
              ? chooseOptionsLabel
              : t.addToCart}
      </button>
    </div>

    <Link
      href={`/products/${product.slug}`}
      className="mt-4 flex cursor-pointer items-center justify-center rounded-full border border-[var(--brand-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-strong)] transition-all duration-200 hover:bg-[var(--brand-soft)]"
    >
      {t.viewProduct}
      <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  </div>
</article>
);
}
