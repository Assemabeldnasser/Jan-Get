import { NextResponse } from "next/server";

import {
    createVoucher,
    getVouchers,
    type CreateVoucherInput,
    type VoucherType,
} from "@/lib/voucher-db";
import { getAdminSession } from "@/lib/admin";

export const dynamic = "force-dynamic";

function isVoucherType(
    value: unknown
): value is VoucherType {
    return (
        value === "fixed" ||
        value === "percentage" ||
        value === "free_delivery"
    );
}

function parseNullableNumber(
    value: unknown
): number | null | undefined {
    if (
        value === undefined
    ) {
        return undefined;
    }

    if (
        value === null ||
        value === ""
    ) {
        return null;
    }

    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        return NaN;
    }

    return numberValue;
}

function parseNullableString(
    value: unknown
): string | null | undefined {
    if (
        value === undefined
    ) {
        return undefined;
    }

    if (
        value === null ||
        value === ""
    ) {
        return null;
    }

    if (
        typeof value !== "string"
    ) {
        return undefined;
    }

    return value.trim() || null;
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
                    error:
                        "Admin access required.",
                },
                {
                    status: 403,
                }
            );
        }

        return NextResponse.json({
            vouchers: getVouchers(),
        });
    } catch (error) {
        console.error(
            "Admin get vouchers error:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Unable to load vouchers.",
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
                    error:
                        "Admin access required.",
                },
                {
                    status: 403,
                }
            );
        }

        const body =
            (await request.json()) as Record<
                string,
                unknown
            >;

        const code =
            typeof body.code === "string"
                ? body.code.trim()
                : "";

        const type =
            body.type;

        if (!code) {
            return NextResponse.json(
                {
                    error:
                        "Voucher code is required.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!isVoucherType(type)) {
            return NextResponse.json(
                {
                    error:
                        "Invalid voucher type.",
                },
                {
                    status: 400,
                }
            );
        }

        const value =
            type === "free_delivery"
                ? null
                : parseNullableNumber(
                      body.value
                  );

        const minimumSubtotal =
            parseNullableNumber(
                body.minimumSubtotal
            );

        const maxDiscount =
            parseNullableNumber(
                body.maxDiscount
            );

        /*
         * Per-user usage limit.
         *
         * Default = 1.
         */
        const usageLimitPerUser =
            parseNullableNumber(
                body.usageLimitPerUser
            ) ?? 1;

        /*
         * Total/global usage limit.
         *
         * null = unlimited.
         */
        const totalUsageLimit =
            parseNullableNumber(
                body.totalUsageLimit
            );

        if (
            Number.isNaN(value) ||
            Number.isNaN(
                minimumSubtotal
            ) ||
            Number.isNaN(maxDiscount) ||
            Number.isNaN(
                usageLimitPerUser
            ) ||
            Number.isNaN(
                totalUsageLimit
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "One or more numeric values are invalid.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            usageLimitPerUser === null ||
            usageLimitPerUser === undefined ||
            !Number.isInteger(
                usageLimitPerUser
            ) ||
            usageLimitPerUser <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Usage limit per user must be a positive whole number.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            totalUsageLimit !== null &&
            totalUsageLimit !== undefined &&
            (
                !Number.isInteger(
                    totalUsageLimit
                ) ||
                totalUsageLimit <= 0
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "Total usage limit must be a positive whole number.",
                },
                {
                    status: 400,
                }
            );
        }

        const input: CreateVoucherInput =
            {
                code,
                type,
                value,
                minimumSubtotal,
                maxDiscount,
                active:
                    body.active === false
                        ? false
                        : true,
                validFrom:
                    parseNullableString(
                        body.validFrom
                    ),
                validUntil:
                    parseNullableString(
                        body.validUntil
                    ),
                usageLimitPerUser,
                totalUsageLimit,
            };

        const voucher =
            createVoucher(input);

        return NextResponse.json(
            {
                voucher,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "Admin create voucher error:",
            error
        );

        const message =
            error instanceof Error
                ? error.message
                : "Unable to create voucher.";

        return NextResponse.json(
            {
                error: message,
            },
            {
                status: 400,
            }
        );
    }
}