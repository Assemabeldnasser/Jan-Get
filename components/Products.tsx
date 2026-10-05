"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ProductCard from "./ProductCard";

import {
  useLanguage,
} from "./LanguageProvider";

import {
  translations,
} from "@/data/translations";

import type {
  PublicProduct,
} from "@/lib/product-public";

export default function Products() {
  const { language } =
    useLanguage();

  const t =
    translations[language]
      .products;

  const [
    featuredProducts,
    setFeaturedProducts,
  ] = useState<
    PublicProduct[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);

        const response =
          await fetch(
            "/api/products?featured=true",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        if (!response.ok) {
          throw new Error(
            "Unable to load products."
          );
        }

        const data =
          await response.json();

        if (!cancelled) {
          setFeaturedProducts(
            Array.isArray(
              data?.products
            )
              ? data.products
              : []
          );
        }
      } catch (error) {
        console.error(
          "Load featured products error:",
          error
        );

        if (!cancelled) {
          setFeaturedProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="shop"
      className="bg-[var(--surface)] px-4 py-14 sm:px-6 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
              {t.featured}
            </p>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
              {t.title}
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base sm:leading-7">
              {t.subtitle}
            </p>
          </div>

          <Link
            href="/shop"
            className="hidden shrink-0 cursor-pointer rounded-full bg-[var(--brand-soft)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-strong)] transition hover:-translate-y-0.5 hover:opacity-80 md:inline-flex"
          >
            {t.viewAll} →
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from(
              { length: 4 }
            ).map(
              (_, index) => (
                <div
                  key={index}
                  className="aspect-[0.82] animate-pulse rounded-[1.75rem] bg-[var(--surface-soft)]"
                />
              )
            )}
          </div>
        ) : featuredProducts.length >
          0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map(
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
          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-soft)] px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
            {t.viewAll}
          </div>
        )}

        <div className="mt-8 flex justify-center md:hidden">
          <Link
            href="/shop"
            className="inline-flex cursor-pointer rounded-full bg-[var(--brand-soft)] px-6 py-3 text-sm font-semibold text-[var(--brand-strong)] transition hover:opacity-80"
          >
            {t.viewAll} →
          </Link>
        </div>
      </div>
    </section>
  );
}