"use client";

import Image from "next/image";
import {
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  Language,
} from "./LanguageProvider";

import {
  useLanguage,
} from "./LanguageProvider";

import type {
  PublicProductImage,
  PublicProductVariant,
} from "@/lib/product-public";

type GalleryImage = {
  id: string;
  url: string;
  color: string;
  colorKey: string;
  colorKeys: string[];
  type:
    | "master"
    | "general"
    | "variant";
};

type ProductGalleryProps = {
  masterImage:
    | string
    | null;

  generalImages:
    PublicProductImage[];

  variants:
    PublicProductVariant[];

  productName: string;

  fallbackEmoji: string;

  selectedColorId?: string;

  onColorChange?: (
    colorKey: string
  ) => void;

  productAvailable?: boolean;
};

export default function ProductGallery({
  masterImage,
  generalImages,
  variants,
  productName,
  fallbackEmoji,
  selectedColorId,
  onColorChange,
  productAvailable = true,
}: ProductGalleryProps) {
  const { language } =
    useLanguage();

  const safeVariants =
    useMemo(
      () => variants ?? [],
      [variants]
    );

  /*
   * Do not automatically select the first
   * variant.
   *
   * An empty color means that the customer
   * has not selected a color yet.
   */
  const [
    internalColorId,
    setInternalColorId,
  ] = useState(
    selectedColorId ?? ""
  );

  const activeColorId =
    selectedColorId ||
    internalColorId;

  const selectedVariant =
    safeVariants.find(
      (variant) =>
        variant.id ===
        activeColorId
    );

  const effectiveColorId =
    selectedVariant?.id ??
    "";

  const galleryTranslations = {
    en: {
      previous:
        "Previous image",
      next:
        "Next image",
      view:
        "View image",
      availableColors:
        "Available colors",
      image:
        "image",
      gallery:
        "Product gallery",
    },

    de: {
      previous:
        "Vorheriges Bild",
      next:
        "Nächstes Bild",
      view:
        "Bild ansehen",
      availableColors:
        "Verfügbare Farben",
      image:
        "Bild",
      gallery:
        "Produktgalerie",
    },

    ar: {
      previous:
        "الصورة السابقة",
      next:
        "Nächstes Bild",
      view:
        "عرض الصورة",
      availableColors:
        "الألوان المتاحة",
      image:
        "صورة",
      gallery:
        "معرض صور المنتج",
    },
  } satisfies Record<
    Language,
    Record<string, string>
  >;

  const t =
    galleryTranslations[
      language
    ];

  /*
   * Build the complete gallery.
   *
   * Important:
   *
   * Every URL is shown only ONCE.
   *
   * If the master image is also used by a
   * variant, the existing master image is
   * reused and the variant ID is attached
   * to that gallery item internally.
   *
   * This means:
   *
   * master image
   *     +
   * variant image with same URL
   *
   * becomes ONE thumbnail.
   *
   * The color can still navigate to that
   * same image.
   */
  const allImages =
    useMemo<GalleryImage[]>(
      () => {
        const result: GalleryImage[] =
          [];

        /*
         * Add a gallery image while avoiding
         * duplicate URLs.
         *
         * Existing items can collect multiple
         * variant IDs so color selection still
         * knows which image belongs to which
         * variant.
         */
        const addImage = (
          image: GalleryImage
        ) => {
          const normalizedUrl =
            image.url.trim();

          if (!normalizedUrl) {
            return;
          }

          const existingIndex =
            result.findIndex(
              (item) =>
                item.url.trim() ===
                normalizedUrl
            );

          if (
            existingIndex ===
            -1
          ) {
            result.push({
              ...image,
              colorKeys:
                image.colorKeys ?? [],
            });

            return;
          }

          const existing =
            result[
              existingIndex
            ];

          /*
           * If this URL already exists,
           * merge its variant/color
           * associations instead of creating
           * another thumbnail.
           */
          if (
            image.type ===
              "variant" &&
            image.colorKey
          ) {
            if (
              !existing.colorKeys.includes(
                image.colorKey
              )
            ) {
              existing.colorKeys.push(
                image.colorKey
              );
            }

            /*
             * Keep the first meaningful color
             * information for accessibility.
             */
            if (
              !existing.color &&
              image.color
            ) {
              existing.color =
                image.color;
            }

            /*
             * Keep a colorKey for backward
             * compatibility with the gallery
             * item structure.
             */
            if (
              !existing.colorKey
            ) {
              existing.colorKey =
                image.colorKey;
            }
          }
        };

        /*
         * 1. Master image
         */
        if (
          masterImage?.trim()
        ) {
          addImage({
            id:
              "master-image",
            url:
              masterImage,
            color: "",
            colorKey: "",
            colorKeys: [],
            type:
              "master",
          });
        }

        /*
         * 2. General images
         */
        for (
          const image of
            generalImages ?? []
        ) {
          if (
            !image.url?.trim()
          ) {
            continue;
          }

          addImage({
            id:
              image.id,
            url:
              image.url,
            color: "",
            colorKey: "",
            colorKeys: [],
            type:
              "general",
          });
        }

        /*
         * 3. Images from ALL variants.
         *
         * We intentionally include inactive
         * and out-of-stock variants so their
         * images can still be viewed.
         */
        for (
          const variant of
            safeVariants
        ) {
          const variantColor =
            variant.color[
              language
            ]?.trim() ?? "";

          for (
            const image of
              variant.images ?? []
          ) {
            if (
              !image.url?.trim()
            ) {
              continue;
            }

            addImage({
              id:
                `${variant.id}-${image.id}`,
              url:
                image.url,
              color:
                variantColor,
              colorKey:
                variant.id,
              colorKeys: [
                variant.id,
              ],
              type:
                "variant",
            });
          }
        }

        return result;
      },
      [
        masterImage,
        generalImages,
        safeVariants,
        language,
      ]
    );

  /*
   * Current hero image.
   */
  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  /*
   * Thumbnail DOM references.
   */
  const thumbnailRefs =
    useRef<
      Record<
        string,
        HTMLButtonElement | null
      >
    >({});

  /*
   * Mobile swipe state.
   */
  const touchStartX =
    useRef<number | null>(
      null
    );

  const touchStartY =
    useRef<number | null>(
      null
    );

  const safeCurrentIndex =
    allImages.length === 0
      ? 0
      : Math.min(
          currentIndex,
          allImages.length - 1
        );

  const currentImage =
    allImages[
      safeCurrentIndex
    ];

  /*
   * Find the first gallery image
   * belonging to a specific variant.
   *
   * Important:
   *
   * Do NOT use:
   *
   *     image.type === "variant"
   *
   * as an OR condition here.
   *
   * That would always return the first
   * variant image regardless of the selected
   * color.
   *
   * Instead, use colorKeys, which contains
   * all variant IDs associated with this URL.
   *
   * This also works when a variant image is
   * the same URL as the master/general image.
   */
  const getFirstVariantImageIndex =
    (
      colorKey: string
    ) => {
      if (!colorKey) {
        return -1;
      }

      return allImages.findIndex(
        (image) =>
          image.colorKeys.includes(
            colorKey
          )
      );
    };

  /*
   * Scroll the active thumbnail into view.
   */
  const scrollThumbnailIntoView =
    (
      index: number
    ) => {
      const image =
        allImages[index];

      if (!image) {
        return;
      }

      const element =
        thumbnailRefs.current[
          image.id
        ];

      if (!element) {
        return;
      }

      element.scrollIntoView({
        behavior:
          "smooth",
        block:
          "nearest",
        inline:
          "center",
      });
    };

  /*
   * Select a gallery image.
   *
   * Selecting an image does NOT automatically
   * select its color.
   */
  const selectImage = (
    index: number
  ) => {
    if (
      index < 0 ||
      index >= allImages.length
    ) {
      return;
    }

    setCurrentIndex(
      index
    );

    scrollThumbnailIntoView(
      index
    );
  };

  /*
   * Previous image.
   */
  const goToPrevious = () => {
    if (
      allImages.length <= 1
    ) {
      return;
    }

    const nextIndex =
      (
        safeCurrentIndex -
        1 +
        allImages.length
      ) %
      allImages.length;

    selectImage(
      nextIndex
    );
  };

  /*
   * Next image.
   */
  const goToNext = () => {
    if (
      allImages.length <= 1
    ) {
      return;
    }

    const nextIndex =
      (
        safeCurrentIndex +
        1
      ) %
      allImages.length;

    selectImage(
      nextIndex
    );
  };

  /*
   * Mobile swipe start.
   */
  const handleTouchStart = (
    event: React.TouchEvent
  ) => {
    const touch =
      event.touches[0];

    if (!touch) {
      return;
    }

    touchStartX.current =
      touch.clientX;

    touchStartY.current =
      touch.clientY;
  };

  /*
   * Mobile swipe end.
   */
  const handleTouchEnd = (
    event: React.TouchEvent
  ) => {
    if (
      touchStartX.current ===
        null ||
      touchStartY.current ===
        null
    ) {
      return;
    }

    const touch =
      event.changedTouches[0];

    if (!touch) {
      return;
    }

    const deltaX =
      touch.clientX -
      touchStartX.current;

    const deltaY =
      touch.clientY -
      touchStartY.current;

    touchStartX.current =
      null;

    touchStartY.current =
      null;

    /*
     * Ignore vertical scrolling gestures.
     */
    if (
      Math.abs(deltaX) <
        50 ||
      Math.abs(deltaX) <=
        Math.abs(deltaY)
    ) {
      return;
    }

    if (
      deltaX > 0
    ) {
      goToPrevious();
    } else {
      goToNext();
    }
  };

  /*
   * Explicit color selection.
   *
   * Available AND out-of-stock colors
   * can be selected so their images can
   * be viewed.
   *
   * Selecting a color also immediately moves
   * the hero image and thumbnail strip to the
   * first image associated with that variant.
   */
  const changeColor = (
    colorKey: string
  ) => {
    const variantExists =
      safeVariants.some(
        (variant) =>
          variant.id ===
          colorKey
      );

    if (!variantExists) {
      return;
    }

    setInternalColorId(
      colorKey
    );

    onColorChange?.(
      colorKey
    );

    /*
     * Move to the first image belonging
     * specifically to the selected color.
     */
    const variantIndex =
      getFirstVariantImageIndex(
        colorKey
      );

    if (
      variantIndex >= 0
    ) {
      selectImage(
        variantIndex
      );
    }
  };

  if (!currentImage) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-3xl bg-[var(--surface-soft)] text-7xl">
        {fallbackEmoji}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      {/* Hero image */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-3xl bg-[var(--surface-soft)]"
        onTouchStart={
          handleTouchStart
        }
        onTouchEnd={
          handleTouchEnd
        }
      >
        <Image
          src={
            currentImage.url
          }
          alt={
            currentImage.color
              ? `${productName} - ${currentImage.color}`
              : productName
          }
          fill
          priority
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 50vw"
        />

        {allImages.length >
          1 && (
          <>
            <button
              type="button"
              onClick={
                goToPrevious
              }
              aria-label={
                t.previous
              }
              className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-3xl font-bold leading-none text-[var(--text-primary)] shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)] sm:h-11 sm:w-11"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={
                goToNext
              }
              aria-label={
                t.next
              }
              className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-3xl font-bold leading-none text-[var(--text-primary)] shadow-md backdrop-blur-sm transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)] sm:h-11 sm:w-11"
            >
              ›
            </button>
          </>
        )}

        {allImages.length >
          1 && (
          <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {safeCurrentIndex +
              1}{" "}
            /{" "}
            {
              allImages.length
            }
          </div>
        )}
      </div>

      {/* Responsive thumbnail strip */}
      {allImages.length >
        1 && (
        <div
          className="mt-3 w-full min-w-0 overflow-x-auto overflow-y-hidden pb-2 [scrollbar-width:thin]"
          aria-label={
            t.gallery
          }
        >
          <div className="flex w-max min-w-full gap-2 sm:gap-3">
            {allImages.map(
              (
                item,
                index
              ) => {
                const isSelected =
                  index ===
                  safeCurrentIndex;

                return (
                  <button
                    key={
                      item.id
                    }
                    ref={(
                      element
                    ) => {
                      thumbnailRefs.current[
                        item.id
                      ] =
                        element;
                    }}
                    type="button"
                    onClick={() =>
                      selectImage(
                        index
                      )
                    }
                    aria-label={`${t.view} ${t.image} ${
                      index + 1
                    }`}
                    aria-current={
                      isSelected
                        ? "true"
                        : undefined
                    }
                    className={`relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-[var(--surface-soft)] transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-[var(--brand)] sm:h-20 sm:w-20 sm:rounded-2xl ${
                      isSelected
                        ? "scale-100 border-[var(--brand)] opacity-100 shadow-md"
                        : "scale-[0.96] border-transparent opacity-50 hover:scale-100 hover:border-[var(--border)] hover:opacity-80"
                    }`}
                  >
                    <Image
                      src={
                        item.url
                      }
                      alt={
                        item.color
                          ? `${productName} - ${item.color}`
                          : productName
                      }
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Color selection */}
      {safeVariants.length >=
        1 && (
        <div className="mt-6">
          <p className="mb-3 font-semibold text-[var(--text-primary)]">
            {
              t.availableColors
            }
          </p>

          <div className="flex flex-wrap gap-3">
            {safeVariants.map(
              (variant) => {
                const translatedColor =
                  variant.color[
                    language
                  ];

                const isSelected =
                  variant.id ===
                  effectiveColorId;

                const variantAvailable =
                  productAvailable &&
                  variant.active &&
                  variant.inStock &&
                  (
                    variant.stock ===
                      null ||
                    variant.stock >
                      0
                  );

                return (
                  <button
                    key={
                      variant.id
                    }
                    type="button"
                    onClick={() =>
                      changeColor(
                        variant.id
                      )
                    }
                    aria-pressed={
                      isSelected
                    }
                    aria-label={
                      translatedColor
                    }
                    className={`relative overflow-hidden rounded-full border px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--brand)] ${
                      variantAvailable
                        ? isSelected
                          ? "cursor-pointer border-[var(--brand)] bg-[var(--brand)] text-white"
                          : "cursor-pointer border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)]"
                        : isSelected
                          ? "cursor-pointer border-[var(--text-secondary)] bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                          : "cursor-pointer border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {
                      translatedColor
                    }

                    {!variantAvailable && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute left-1/2 top-1/2 h-px w-[125%] -translate-x-1/2 -translate-y-1/2 rotate-[-25deg] bg-[var(--text-secondary)]"
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
}