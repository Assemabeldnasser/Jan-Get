import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin";
import {
  createProduct,
  getProductCategories,
  searchProducts,
} from "@/lib/product-db";
import { validateProductInput } from "@/lib/product-validation";

export const dynamic =
  "force-dynamic";

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export async function GET(
  request: Request
) {
  try {
    const session =
      await getAdminSession(request);

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const url =
      new URL(request.url);

    const search =
      url.searchParams
        .get("search")
        ?.trim() || "";

    const category =
      url.searchParams
        .get("category")
        ?.trim() || "";

    const activeParam =
      url.searchParams.get(
        "active"
      );

    const featuredParam =
      url.searchParams.get(
        "featured"
      );

    const active =
      activeParam === null
        ? undefined
        : activeParam === "true";

    const featured =
      featuredParam === null
        ? undefined
        : featuredParam === "true";

    const products =
      search ||
      category ||
      active !== undefined ||
      featured !== undefined
        ? searchProducts({
            search:
              search || undefined,
            category:
              category || undefined,
            active,
            featured,
          })
        : searchProducts();

    return NextResponse.json({
      products,
      categories:
        getProductCategories(),
    });
  } catch (error) {
    console.error(
      "GET /api/admin/products failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load admin products.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const session =
      await getAdminSession(request);

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Request body must contain valid JSON.",
        },
        {
          status: 400,
        }
      );
    }

    const validation =
      validateProductInput(body);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error:
            validation.message,
        },
        {
          status: 400,
        }
      );
    }

    const product =
      createProduct(
        validation.product
      );

    return NextResponse.json(
      {
        product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error(
      "POST /api/admin/products failed:",
      error
    );

    if (
      message.includes(
        "already exists"
      )
    ) {
      return NextResponse.json(
        {
          error: message,
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to create product.",
      },
      {
        status: 500,
      }
    );
  }
}