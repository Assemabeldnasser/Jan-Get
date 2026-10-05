import { NextResponse } from "next/server";

import {
  getProductCategories,
  getProducts,
  searchProducts,
} from "@/lib/product-db";

import {
  toPublicProducts,
} from "@/lib/product-public";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request
) {
  try {
    const url = new URL(request.url);

    const search =
      url.searchParams.get("search") ??
      "";

    const category =
      url.searchParams.get("category") ??
      "";

    const featuredParam =
      url.searchParams.get("featured");

    const featured =
      featuredParam === "true"
        ? true
        : featuredParam === "false"
          ? false
          : undefined;

    const hasFilters =
      Boolean(search) ||
      Boolean(category) ||
      featured !== undefined;

    const products = hasFilters
      ? searchProducts({
          search: search || undefined,
          category:
            category || undefined,
          featured,
          active: true,
        })
      : getProducts({
          includeInactive: false,
        });

    return NextResponse.json(
      {
        products:
          toPublicProducts(products),

        categories:
          getProductCategories(),
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Get public products error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load products.",
      },
      {
        status: 500,
      }
    );
  }
}