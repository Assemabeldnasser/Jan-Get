import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin";
import {
  deleteProduct,
  getProductById,
  getProductBySlug,
  setProductActive,
  setProductStock,
  updateProduct,
} from "@/lib/product-db";
import { validateProductInput } from "@/lib/product-validation";

export const dynamic =
  "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

/*
 * The physical Next.js route is still
 * /api/admin/products/[id].
 *
 * The value inside [id] can now be either:
 *
 * - the database product ID
 * - the product slug
 *
 * This allows the Admin UI to use:
 *
 * /admin/products/my-product-slug
 *
 * while the database continues to work
 * with the real product ID internally.
 */
function findProductByRouteKey(
  routeKey: string
) {
  return (
    getProductById(routeKey, {
      includeInactive: true,
    }) ??
    getProductBySlug(routeKey, {
      includeInactive: true,
    })
  );
}

export async function GET(
  request: Request,
  context: RouteContext
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

    const { id: routeKey } =
      await context.params;

    if (!routeKey) {
      return NextResponse.json(
        {
          error:
            "Product ID or slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    const product =
      findProductByRouteKey(
        routeKey
      );

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

    return NextResponse.json({
      product,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/products/[id] failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load admin product.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
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

    const { id: routeKey } =
      await context.params;

    if (!routeKey) {
      return NextResponse.json(
        {
          error:
            "Product ID or slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Resolve the route key first.
     *
     * The frontend may send a slug, while all
     * database mutations must use the real ID.
     */
    const existingProduct =
      findProductByRouteKey(
        routeKey
      );

    if (!existingProduct) {
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

    const currentId =
      existingProduct.id;

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

    /*
     * Active-only or stock-only update.
     *
     * These updates intentionally avoid
     * validating or rewriting the complete
     * product.
     */
    if (
      typeof body === "object" &&
      body !== null &&
      !Array.isArray(body)
    ) {
      const record =
        body as Record<
          string,
          unknown
        >;

      const keys =
        Object.keys(record);

      if (
        keys.length === 1 &&
        keys[0] === "active" &&
        typeof record.active ===
          "boolean"
      ) {
        const updated =
          setProductActive(
            currentId,
            record.active
          );

        if (!updated) {
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

        return NextResponse.json({
          product: updated,
        });
      }

      if (
        keys.length === 1 &&
        keys[0] === "inStock" &&
        typeof record.inStock ===
          "boolean"
      ) {
        const updated =
          setProductStock(
            currentId,
            record.inStock
          );

        if (!updated) {
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

        return NextResponse.json({
          product: updated,
        });
      }
    }

    /*
     * Full product update.
     *
     * Used by the product editor.
     */
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

    const updated =
      updateProduct(
        currentId,
        validation.product
      );

    return NextResponse.json({
      product: updated,
    });
  } catch (error) {
    const message =
      getErrorMessage(error);

    console.error(
      "PUT /api/admin/products/[id] failed:",
      error
    );

    if (
      message.includes(
        "Product not found."
      )
    ) {
      return NextResponse.json(
        {
          error: message,
        },
        {
          status: 404,
        }
      );
    }

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
          "Failed to update product.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
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

    const { id: routeKey } =
      await context.params;

    if (!routeKey) {
      return NextResponse.json(
        {
          error:
            "Product ID or slug is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * The delete button may now send either
     * a product ID or a slug.
     *
     * Resolve it to the real database ID
     * before deleting.
     */
    const product =
      findProductByRouteKey(
        routeKey
      );

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

    const deleted =
      deleteProduct(
        product.id
      );

    if (!deleted) {
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

    return NextResponse.json({
      success: true,
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/products/[id] failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete product.",
      },
      {
        status: 500,
      }
    );
  }
}