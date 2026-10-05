import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateVoucherForUser } from "@/lib/voucher-db";

export const dynamic = "force-dynamic";

type ValidateVoucherRequest = {
  code?: string;
  subtotal?: number;
  email?: string;
};

function roundMoney(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100
    ) / 100
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    const body =
      (await request.json()) as ValidateVoucherRequest;

    const code =
      typeof body.code === "string"
        ? body.code.trim().toUpperCase()
        : "";

    const subtotal =
      typeof body.subtotal === "number" &&
      Number.isFinite(body.subtotal)
        ? roundMoney(body.subtotal)
        : NaN;

    if (!code) {
      return NextResponse.json(
        {
          valid: false,
          code: "",
          message:
            "Please enter a voucher code.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(subtotal) ||
      subtotal < 0
    ) {
      return NextResponse.json(
        {
          valid: false,
          code,
          message:
            "Invalid order subtotal.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * --------------------------------------------------
     * AUTHENTICATION
     * --------------------------------------------------
     *
     * Resolve the voucher identity exactly the same
     * way as the checkout API:
     *
     * Logged-in user:
     *   user:<userId>
     *
     * Guest user:
     *   email:<normalized checkout email>
     *
     * The voucher is only validated here.
     * Usage is NOT consumed until successful payment
     * in the Stripe webhook.
     */

    const session =
      await auth.api.getSession({
        headers: request.headers,
      });

    const userId =
      session?.user?.id ??
      null;

    const voucherUserEmail =
      session?.user?.email?.trim() ||
      (
        typeof body.email === "string"
          ? body.email.trim()
          : ""
      );

    const result =
      validateVoucherForUser(
        code,
        subtotal,
        userId,
        voucherUserEmail
      );

    const discountAmount =
      roundMoney(
        Math.max(
          0,
          Math.min(
            result.discountAmount,
            subtotal
          )
        )
      );

    /*
     * --------------------------------------------------
     * SHIPPING
     * --------------------------------------------------
     *
     * Normal shipping is based on the product
     * subtotal AFTER product-level discounts and
     * BEFORE voucher discount.
     *
     * Example:
     *
     * Original product price = €55
     * Product discount = €45
     *
     * subtotal = €45
     * => shipping = €3
     *
     * If the discounted product subtotal is
     * €50 or more:
     *
     * => shipping = €0
     *
     * A free-delivery voucher can additionally
     * make shipping free.
     */

    const normalShipping =
      subtotal >= 50
        ? 0
        : 3;

    const shipping =
      result.freeDelivery
        ? 0
        : normalShipping;

    /*
     * --------------------------------------------------
     * FINAL PREVIEW TOTAL
     * --------------------------------------------------
     */

    const discountedSubtotal =
      roundMoney(
        Math.max(
          0,
          subtotal -
            discountAmount
        )
      );

    const total =
      roundMoney(
        discountedSubtotal +
          shipping
      );

    return NextResponse.json({
      valid: true,

      code:
        result.voucher.code,

      type:
        result.voucher.type,

      discountAmount,

      freeDelivery:
        result.freeDelivery,

      subtotal,

      shipping,

      discountedSubtotal,

      total,

      message:
        result.freeDelivery
          ? "Free delivery applied."
          : "Voucher applied successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to validate the voucher.";

    console.error(
      "Voucher validation error:",
      error
    );

    return NextResponse.json(
      {
        valid: false,
        message,
      },
      {
        status: 400,
      }
    );
  }
}