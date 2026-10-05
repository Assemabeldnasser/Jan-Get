import type {
  ProductPriceDiscount,
  ProductRecord,
} from "@/lib/product-db";

export type PublicLocalizedText = {
  en: string;
  de: string;
  ar: string;
};

export type ProductSizeKey =
  | "small"
  | "medium"
  | "large";

export type PublicProductPriceDiscount =
  ProductPriceDiscount;

export type PublicProductSize = {
  key: ProductSizeKey;

  /*
   * Complete final original price for this size.
   *
   * null = no size-specific price,
   * therefore use color price or basic price.
   */
  price: number | null;

  /*
   * Discount for this size-specific direct price.
   *
   * This is null when the size does not have
   * its own direct price.
   */
  discount: PublicProductPriceDiscount | null;
};

export type PublicProductCustomField = {
  id: string;
  label: string;
};

export type PublicProductImage = {
  id: string;
  url: string;
  sortOrder: number;
};

export type PublicProductVariant = {
  id: string;

  color: PublicLocalizedText;

  /*
   * Complete final original price for this color.
   *
   * null = use product basic price.
   */
  price: number | null;

  /*
   * Discount for this color-specific direct price.
   *
   * This is null when the color does not have
   * its own direct price.
   */
  discount: PublicProductPriceDiscount | null;

  sizes: PublicProductSize[];

  customFields: PublicProductCustomField[];

  images: PublicProductImage[];

  sortOrder: number;

  active: boolean;

  inStock: boolean;

  stock: number | null;
};

export type PublicProduct = {
  id: string;

  slug: string;

  name: PublicLocalizedText;

  description: PublicLocalizedText;

  /*
   * Basic/default/fallback original product price.
   */
  price: number;

  /*
   * Discount for the basic product price.
   */
  discount: PublicProductPriceDiscount | null;

  category: string;

  emoji: string;

  masterImage: string | null;

  generalImages: PublicProductImage[];

  variants: PublicProductVariant[];

  featured: boolean;

  active: boolean;

  inStock: boolean;

  stock: number | null;
};

function mapImage(
  image: {
    id: string;
    url: string;
    sortOrder: number;
  }
): PublicProductImage {
  return {
    id: image.id,

    url: image.url,

    sortOrder:
      image.sortOrder,
  };
}

export function toPublicProduct(
  product: ProductRecord
): PublicProduct {
  return {
    id: product.id,

    slug: product.slug,

    name: {
      en: product.name.en,
      de: product.name.de,
      ar: product.name.ar,
    },

    description: {
      en: product.description.en,
      de: product.description.de,
      ar: product.description.ar,
    },

    price: product.price,

    /*
     * Basic discount belongs to the basic price.
     *
     * It remains available as the final fallback
     * when no more specific direct price exists.
     */
    discount:
      product.discount,

    category: product.category,

    emoji: product.emoji,

    masterImage:
      product.masterImage?.trim()
        ? product.masterImage
        : null,

    generalImages:
      product.generalImages
        .map(mapImage)
        .sort(
          (a, b) =>
            a.sortOrder -
            b.sortOrder
        ),

    variants:
      product.variants
        .filter(
          (variant) =>
            variant.active
        )
        .sort(
          (a, b) =>
            a.sortOrder -
            b.sortOrder
        )
        .map(
          (variant) => ({
            id: variant.id,

            color: {
              en:
                variant.color.en,

              de:
                variant.color.de,

              ar:
                variant.color.ar,
            },

            /*
             * null is intentionally preserved.
             *
             * ProductDetails uses:
             *
             * Size direct price
             * → Color direct price
             * → Basic price
             */
            price:
              variant.price ===
                null ||
              !Number.isFinite(
                variant.price
              )
                ? null
                : variant.price,

            /*
             * A color discount is meaningful only
             * when the color has its own direct price.
             *
             * product-db already enforces this rule,
             * so no fallback to the basic discount occurs here.
             */
            discount:
              variant.price ===
                null ||
              !Number.isFinite(
                variant.price
              )
                ? null
                : variant.discount,

            sizes:
              variant.sizes.map(
                (size) => ({
                  key: size.key,

                  price:
                    size.price ===
                      null ||
                    !Number.isFinite(
                      size.price
                    )
                      ? null
                      : size.price,

                  /*
                   * A size discount belongs only to
                   * that size's own direct price.
                   *
                   * product-db normalizes the discount
                   * to null when the size price is null.
                   */
                  discount:
                    size.price ===
                      null ||
                    !Number.isFinite(
                      size.price
                    )
                      ? null
                      : size.discount,
                })
              ),

            customFields:
              variant.customFields.map(
                (field) => ({
                  id: field.id,

                  label:
                    field.label,
                })
              ),

            images:
              variant.images
                .map(mapImage)
                .sort(
                  (a, b) =>
                    a.sortOrder -
                    b.sortOrder
                ),

            sortOrder:
              variant.sortOrder,

            active:
              variant.active,

            inStock:
              variant.inStock,

            stock:
              variant.stock,
          })
        ),

    featured:
      product.featured,

    active:
      product.active,

    inStock:
      product.inStock,

    stock:
      product.stock,
  };
}

export function toPublicProducts(
  products: ProductRecord[]
): PublicProduct[] {
  return products.map(
    toPublicProduct
  );
}