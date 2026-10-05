import { NextResponse } from "next/server";

import {
  getProductBySlug,
} from "@/lib/product-db";

import {
  toPublicProduct,
} from "@/lib/product-public";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      slug: string;
    }>;
  }
) {
  try {
    const { slug } = await params;

    const product =
      getProductBySlug(slug, {
        includeInactive: false,
      });

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        product:
          toPublicProduct(product),
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
      "Get public product error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load product.",
      },
      {
        status: 500,
      }
    );
  }
}