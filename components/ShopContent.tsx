"use client";

import Link from "next/link";

import ProductCard from "@/components/ProductCard";

import {
  useLanguage,
} from "@/components/LanguageProvider";

import type {
  PublicProduct,
} from "@/lib/product-public";

type ShopContentProps = {
  products: PublicProduct[];
  selectedCategory?: string;
};

export default function ShopContent({
  products,
  selectedCategory,
}: ShopContentProps) {
  const { language } =
    useLanguage();

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

  const categoryLabel =
    selectedCategory
      ? categoryTranslations[
          language
        ][
          selectedCategory as keyof typeof categoryTranslations.en
        ] ??
        selectedCategory
      : null;

  const pageTranslations = {
    en: {
      back: "← Back to home",
      label: "Shop",
      title: "All Products",
      description:
        "Explore our collection of unique 3D printed creations.",
      categoryDescription:
        "Explore our creations in this category.",
      product: "product",
      products: "products",
      empty:
        "No products in this category yet.",
      viewAll:
        "View all products",
    },

    de: {
      back: "← Zurück zur Startseite",
      label: "Shop",
      title: "Alle Produkte",
      description:
        "Entdecke unsere Kollektion einzigartiger 3D-Druck-Kreationen.",
      categoryDescription:
        "Entdecke unsere Kreationen in dieser Kategorie.",
      product: "Produkt",
      products: "Produkte",
      empty:
        "In dieser Kategorie gibt es noch keine Produkte.",
      viewAll:
        "Alle Produkte ansehen",
    },

    ar: {
      back: "→ العودة إلى الرئيسية",
      label: "المتجر",
      title: "جميع المنتجات",
      description:
        "اكتشف مجموعتنا من الإبداعات الفريدة بالطباعة ثلاثية الأبعاد.",
      categoryDescription:
        "اكتشف إبداعاتنا في هذا التصنيف.",
      product: "منتج",
      products: "منتجات",
      empty:
        "لا توجد منتجات في هذا التصنيف حتى الآن.",
      viewAll:
        "عرض جميع المنتجات",
    },
  };

  const pageT =
    pageTranslations[language];

  const pageTitle =
    categoryLabel ??
    pageT.title;

  const pageDescription =
    categoryLabel
      ? pageT.categoryDescription
      : pageT.description;

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex cursor-pointer items-center rounded-full border border-[var(--brand-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--brand-soft)]"
        >
          {pageT.back}
        </Link>

        <div className="mt-10 max-w-3xl sm:mt-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
            {pageT.label}
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            {pageTitle}
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base sm:leading-8">
            {pageDescription}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-primary)]">
              {products.length}
            </span>{" "}
            {products.length ===
            1
              ? pageT.product
              : pageT.products}
          </p>

          {selectedCategory && (
            <Link
              href="/shop"
              className="cursor-pointer text-sm font-semibold text-[var(--brand-strong)] transition hover:underline"
            >
              {pageT.viewAll}
            </Link>
          )}
        </div>

        {products.length >
        0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4">
            {products.map(
              (product) => (
                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="mt-8 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center shadow-sm sm:mt-10 sm:px-10">
            <div className="text-5xl">
              🛍️
            </div>

            <p className="mt-5 text-lg font-bold text-[var(--text-primary)]">
              {pageT.empty}
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex cursor-pointer rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:opacity-90"
            >
              {pageT.viewAll}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}