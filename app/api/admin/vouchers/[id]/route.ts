import { NextResponse } from "next/server";

import {
    deleteVoucher,
    updateVoucher,
    type UpdateVoucherInput,
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

export async function PATCH(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
        }>;
    }
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

        const { id } =
            await params;

        if (
            !id ||
            id.trim().length === 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Voucher ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        const body =
            (await request.json()) as Record<
                string,
                unknown
            >;

        const input: UpdateVoucherInput =
            {};

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "code"
            )
        ) {
            input.code =
                typeof body.code ===
                "string"
                    ? body.code.trim()
                    : "";
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "type"
            )
        ) {
            if (
                !isVoucherType(
                    body.type
                )
            ) {
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

            input.type =
                body.type;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "value"
            )
        ) {
            const value =
                parseNullableNumber(
                    body.value
                );

            if (
                Number.isNaN(value)
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Voucher value is invalid.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            input.value =
                value;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "minimumSubtotal"
            )
        ) {
            const value =
                parseNullableNumber(
                    body.minimumSubtotal
                );

            if (
                Number.isNaN(value)
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Minimum subtotal is invalid.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            input.minimumSubtotal =
                value;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "maxDiscount"
            )
        ) {
            const value =
                parseNullableNumber(
                    body.maxDiscount
                );

            if (
                Number.isNaN(value)
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Maximum discount is invalid.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            input.maxDiscount =
                value;
        }

        /*
         * New per-user usage limit.
         *
         * Unlike the old usageLimit, this value
         * cannot be unlimited. Default behavior is 1
         * when creating a voucher.
         */
        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "usageLimitPerUser"
            )
        ) {
            const value =
                parseNullableNumber(
                    body.usageLimitPerUser
                );

            if (
                Number.isNaN(value)
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Usage limit per user is invalid.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (
                value === null ||
                value === undefined ||
                !Number.isInteger(
                    value
                ) ||
                value <= 0
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

            input.usageLimitPerUser =
                value;
        }

        /*
         * New total/global usage limit.
         *
         * Empty/null = unlimited.
         */
        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "totalUsageLimit"
            )
        ) {
            const value =
                parseNullableNumber(
                    body.totalUsageLimit
                );

            if (
                Number.isNaN(value)
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Total usage limit is invalid.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (
                value !== null &&
                value !== undefined &&
                (
                    !Number.isInteger(
                        value
                    ) ||
                    value <= 0
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

            input.totalUsageLimit =
                value;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "active"
            )
        ) {
            input.active =
                body.active === true;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "validFrom"
            )
        ) {
            input.validFrom =
                parseNullableString(
                    body.validFrom
                );
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "validUntil"
            )
        ) {
            input.validUntil =
                parseNullableString(
                    body.validUntil
                );
        }

        const voucher =
            updateVoucher(
                id,
                input
            );

        return NextResponse.json({
            voucher,
        });
    } catch (error) {
        console.error(
            "Admin update voucher error:",
            error
        );

        const message =
            error instanceof Error
                ? error.message
                : "Unable to update voucher.";

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

export async function DELETE(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
        }>;
    }
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

        const { id } =
            await params;

        if (
            !id ||
            id.trim().length === 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Voucher ID is required.",
                },
                {
                    status: 400,
                }
            );
        }

        deleteVoucher(id);

        return NextResponse.json({
            success: true,
            voucherId: id,
        });
    } catch (error) {
        console.error(
            "Admin delete voucher error:",
            error
        );

        const message =
            error instanceof Error
                ? error.message
                : "Unable to delete voucher.";

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