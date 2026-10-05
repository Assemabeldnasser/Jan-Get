import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";

const database = new DatabaseSync("database.sqlite");

database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    value REAL,
    minimum_subtotal REAL,
    max_discount REAL,
    active INTEGER NOT NULL DEFAULT 1,
    valid_from TEXT,
    valid_until TEXT,
    usage_limit INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

try {
  database.exec(
    `ALTER TABLE vouchers ADD COLUMN minimum_subtotal REAL`,
  );
} catch {}

try {
  database.exec(
    `ALTER TABLE vouchers ADD COLUMN max_discount REAL`,
  );
} catch {}

try {
  database.exec(
    `ALTER TABLE vouchers ADD COLUMN valid_from TEXT`,
  );
} catch {}

try {
  database.exec(
    `ALTER TABLE vouchers ADD COLUMN valid_until TEXT`,
  );
} catch {}

try {
  database.exec(
    `ALTER TABLE vouchers ADD COLUMN usage_limit INTEGER`,
  );
} catch {}

try {
  database.exec(
    `ALTER TABLE vouchers ADD COLUMN used_count INTEGER NOT NULL DEFAULT 0`,
  );
} catch {}

/*
 * New voucher usage model:
 *
 * usage_limit_per_user
 *   Maximum number of times one user/guest identity can use the voucher.
 *   Default = 1.
 *
 * total_usage_limit
 *   Maximum number of uses across all users.
 *   NULL = unlimited.
 *
 * usage_limit
 *   Legacy column kept for backward compatibility.
 *   Existing values are migrated to total_usage_limit and then cleared.
 */
try {
  database.exec(
    `
      ALTER TABLE vouchers
      ADD COLUMN usage_limit_per_user INTEGER NOT NULL DEFAULT 1
    `,
  );
} catch {}

try {
  database.exec(
    `
      ALTER TABLE vouchers
      ADD COLUMN total_usage_limit INTEGER
    `,
  );
} catch {}

/*
 * Migrate the old usage_limit meaning.
 *
 * Before this change:
 *   usage_limit = global usage limit.
 *
 * After this change:
 *   total_usage_limit = global usage limit.
 *   usage_limit_per_user = 1.
 *
 * We only migrate rows that still have the legacy value and have not
 * already received a total_usage_limit value.
 */
try {
  database.exec(
    `
      UPDATE vouchers
      SET
        total_usage_limit = usage_limit,
        updated_at = updated_at
      WHERE
        usage_limit IS NOT NULL
        AND total_usage_limit IS NULL
    `,
  );
} catch {}

/*
 * The legacy usage_limit column is no longer used by the new logic.
 * Clear it after migration so that a later initialization cannot
 * accidentally migrate the same value again.
 */
try {
  database.exec(
    `
      UPDATE vouchers
      SET usage_limit = NULL
      WHERE usage_limit IS NOT NULL
    `,
  );
} catch {}

/*
 * Per-user / per-guest voucher usage records.
 *
 * user_key:
 *   Logged-in user  -> user:<userId>
 *   Guest checkout  -> email:<normalizedEmail>
 *
 * order_id is unique so the same order can never consume the voucher
 * more than once, even if Stripe sends the webhook more than once.
 */
database.exec(`
  CREATE TABLE IF NOT EXISTS voucher_usages (
    id TEXT PRIMARY KEY,
    voucher_id TEXT NOT NULL,
    user_key TEXT NOT NULL,
    order_id TEXT NOT NULL UNIQUE,
    used_at TEXT NOT NULL,
    FOREIGN KEY (voucher_id)
      REFERENCES vouchers(id)
  );

  CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher_id
    ON voucher_usages(voucher_id);

  CREATE INDEX IF NOT EXISTS idx_voucher_usages_user_key
    ON voucher_usages(user_key);

  CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher_user
    ON voucher_usages(voucher_id, user_key);
`);

export type VoucherType =
  | "fixed"
  | "percentage"
  | "free_delivery";

export type VoucherRecord = {
  id: string;
  code: string;
  type: VoucherType;
  value: number | null;
  minimumSubtotal: number | null;
  maxDiscount: number | null;
  active: boolean;
  validFrom: string | null;
  validUntil: string | null;

  /**
   * Maximum number of times one user/guest identity
   * can use this voucher.
   *
   * Default: 1
   */
  usageLimitPerUser: number;

  /**
   * Maximum total uses across all users.
   *
   * null = unlimited.
   */
  totalUsageLimit: number | null;

  /**
   * Total successful voucher uses across all users.
   */
  usedCount: number;

  createdAt: string;
  updatedAt: string;
};

export type CreateVoucherInput = {
  code: string;
  type: VoucherType;
  value?: number | null;
  minimumSubtotal?: number | null;
  maxDiscount?: number | null;
  active?: boolean;
  validFrom?: string | null;
  validUntil?: string | null;

  /**
   * Maximum uses per user.
   * Defaults to 1.
   */
  usageLimitPerUser?: number | null;

  /**
   * Maximum total uses across all users.
   * null = unlimited.
   */
  totalUsageLimit?: number | null;

  /**
   * Legacy input kept temporarily so existing callers do not break.
   *
   * It is treated as totalUsageLimit.
   */
  usageLimit?: number | null;
};

export type UpdateVoucherInput = Partial<
  CreateVoucherInput
>;

export type VoucherCalculation = {
  voucher: VoucherRecord;
  discountAmount: number;
  freeDelivery: boolean;
};

type VoucherRow = {
  id: string;
  code: string;
  type: string;
  value: number | null;
  minimum_subtotal: number | null;
  max_discount: number | null;
  active: number;
  valid_from: string | null;
  valid_until: string | null;

  /*
   * Legacy column.
   */
  usage_limit: number | null;

  /*
   * New columns.
   */
  usage_limit_per_user: number | null;
  total_usage_limit: number | null;

  used_count: number;
  created_at: string;
  updated_at: string;
};

function roundMoney(value: number) {
  return (
    Math.round(
      (value + Number.EPSILON) * 100,
    ) / 100
  );
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

/**
 * Creates the stable identity used for per-user voucher limits.
 *
 * Logged-in users:
 *   user:<userId>
 *
 * Guests:
 *   email:<normalizedEmail>
 *
 * userId has priority if available.
 */
export function getVoucherUserKey(
  userId?: string | null,
  email?: string | null,
): string {
  const normalizedUserId =
    typeof userId === "string"
      ? userId.trim()
      : "";

  if (normalizedUserId) {
    return `user:${normalizedUserId}`;
  }

  const normalizedEmail =
    typeof email === "string"
      ? email.trim().toLowerCase()
      : "";

  if (!normalizedEmail) {
    throw new Error(
      "A user ID or checkout email is required for voucher usage.",
    );
  }

  return `email:${normalizedEmail}`;
}

function rowToVoucher(
  row: VoucherRow,
): VoucherRecord {
  /*
   * For old rows that somehow still have the legacy usage_limit
   * populated, treat it as totalUsageLimit as a safety fallback.
   */
  const legacyUsageLimit =
    row.usage_limit === null ||
    row.usage_limit === undefined
      ? null
      : Number(row.usage_limit);

  const totalUsageLimit =
    row.total_usage_limit !== null &&
    row.total_usage_limit !== undefined
      ? Number(row.total_usage_limit)
      : legacyUsageLimit;

  const usageLimitPerUser =
    row.usage_limit_per_user === null ||
    row.usage_limit_per_user === undefined
      ? 1
      : Number(row.usage_limit_per_user);

  return {
    id: String(row.id),
    code: String(row.code),
    type: row.type as VoucherType,
    value:
      row.value === null ||
      row.value === undefined
        ? null
        : Number(row.value),
    minimumSubtotal:
      row.minimum_subtotal === null ||
      row.minimum_subtotal === undefined
        ? null
        : Number(row.minimum_subtotal),
    maxDiscount:
      row.max_discount === null ||
      row.max_discount === undefined
        ? null
        : Number(row.max_discount),
    active: Number(row.active) === 1,
    validFrom:
      row.valid_from ?? null,
    validUntil:
      row.valid_until ?? null,

    usageLimitPerUser:
      Number.isFinite(usageLimitPerUser) &&
      usageLimitPerUser > 0
        ? Math.floor(usageLimitPerUser)
        : 1,

    totalUsageLimit:
      totalUsageLimit === null ||
      totalUsageLimit === undefined
        ? null
        : Number(totalUsageLimit),

    usedCount:
      Number(row.used_count ?? 0),

    createdAt: String(
      row.created_at,
    ),
    updatedAt: String(
      row.updated_at,
    ),
  };
}

function validatePositiveInteger(
  value: unknown,
  message: string,
) {
  if (
    !Number.isInteger(
      Number(value),
    ) ||
    Number(value) <= 0
  ) {
    throw new Error(message);
  }
}

function validateVoucherInput(
  input:
    | CreateVoucherInput
    | UpdateVoucherInput,
  partial = false,
) {
  if (
    !partial ||
    input.code !== undefined
  ) {
    if (
      typeof input.code !== "string" ||
      !input.code.trim()
    ) {
      throw new Error(
        "Voucher code is required.",
      );
    }
  }

  if (
    !partial ||
    input.type !== undefined
  ) {
    if (
      input.type !== "fixed" &&
      input.type !== "percentage" &&
      input.type !== "free_delivery"
    ) {
      throw new Error(
        "Invalid voucher type.",
      );
    }
  }

  if (
    input.type === "fixed" ||
    input.type === "percentage"
  ) {
    if (
      input.value === null ||
      input.value === undefined ||
      !Number.isFinite(
        Number(input.value),
      ) ||
      Number(input.value) <= 0
    ) {
      throw new Error(
        "Voucher value must be greater than zero.",
      );
    }
  }

  if (input.type === "percentage") {
    const value = Number(
      input.value,
    );

    if (value > 100) {
      throw new Error(
        "Percentage voucher cannot exceed 100%.",
      );
    }
  }

  if (input.type === "free_delivery") {
    if (
      input.value !== undefined &&
      input.value !== null
    ) {
      throw new Error(
        "Free delivery vouchers do not use a value.",
      );
    }
  }

  if (
    input.minimumSubtotal !==
      undefined &&
    input.minimumSubtotal !== null &&
    (
      !Number.isFinite(
        Number(
          input.minimumSubtotal,
        ),
      ) ||
      Number(input.minimumSubtotal) < 0
    )
  ) {
    throw new Error(
      "Minimum subtotal must be zero or greater.",
    );
  }

  if (
    input.maxDiscount !==
      undefined &&
    input.maxDiscount !== null &&
    (
      !Number.isFinite(
        Number(input.maxDiscount),
      ) ||
      Number(input.maxDiscount) <= 0
    )
  ) {
    throw new Error(
      "Maximum discount must be greater than zero.",
    );
  }

  /*
   * New per-user limit.
   *
   * null is not allowed for this field because every voucher
   * must have a per-user limit. If omitted, it becomes 1.
   */
  if (
    input.usageLimitPerUser !==
      undefined &&
    input.usageLimitPerUser !== null
  ) {
    validatePositiveInteger(
      input.usageLimitPerUser,
      "Usage limit per user must be a positive whole number.",
    );
  }

  /*
   * New total/global limit.
   *
   * null = unlimited.
   */
  if (
    input.totalUsageLimit !==
      undefined &&
    input.totalUsageLimit !== null
  ) {
    validatePositiveInteger(
      input.totalUsageLimit,
      "Total usage limit must be a positive whole number.",
    );
  }

  /*
   * Legacy usageLimit is treated as totalUsageLimit.
   */
  if (
    input.usageLimit !==
      undefined &&
    input.usageLimit !== null
  ) {
    validatePositiveInteger(
      input.usageLimit,
      "Total usage limit must be a positive whole number.",
    );
  }
}

export function getVoucherById(
  id: string,
): VoucherRecord | null {
  const row =
    database
      .prepare(
        `
          SELECT *
          FROM vouchers
          WHERE id = ?
          LIMIT 1
        `,
      )
      .get(id) as
      | VoucherRow
      | undefined;

  return row
    ? rowToVoucher(row)
    : null;
}

export function getVoucherByCode(
  code: string,
): VoucherRecord | null {
  const normalizedCode =
    normalizeCode(code);

  if (!normalizedCode) {
    return null;
  }

  const row =
    database
      .prepare(
        `
          SELECT *
          FROM vouchers
          WHERE code = ?
          LIMIT 1
        `,
      )
      .get(normalizedCode) as
      | VoucherRow
      | undefined;

  return row
    ? rowToVoucher(row)
    : null;
}

export function getVouchers(): VoucherRecord[] {
  const rows =
    database
      .prepare(
        `
          SELECT *
          FROM vouchers
          ORDER BY created_at DESC
        `,
      )
      .all() as VoucherRow[];

  return rows.map(rowToVoucher);
}

export function createVoucher(
  input: CreateVoucherInput,
): VoucherRecord {
  validateVoucherInput(input);

  const code = normalizeCode(
    input.code,
  );

  if (
    !/^[A-Z0-9_-]{3,50}$/.test(code)
  ) {
    throw new Error(
      "Voucher code must contain only letters, numbers, hyphens, or underscores.",
    );
  }

  if (getVoucherByCode(code)) {
    throw new Error(
      "A voucher with this code already exists.",
    );
  }

  const now =
    new Date().toISOString();

  const id = randomUUID();

  const type = input.type;

  const value =
    type === "free_delivery"
      ? null
      : Number(input.value);

  const minimumSubtotal =
    input.minimumSubtotal ===
      undefined ||
    input.minimumSubtotal === null
      ? null
      : roundMoney(
          Number(
            input.minimumSubtotal,
          ),
        );

  const maxDiscount =
    input.maxDiscount ===
      undefined ||
    input.maxDiscount === null
      ? null
      : roundMoney(
          Number(input.maxDiscount),
        );

  /*
   * New default:
   * one use per user.
   */
  const usageLimitPerUser =
    input.usageLimitPerUser ===
      undefined ||
    input.usageLimitPerUser === null
      ? 1
      : Number(
          input.usageLimitPerUser,
        );

  /*
   * totalUsageLimit is the new global limit.
   *
   * usageLimit is accepted for backward compatibility
   * and treated as totalUsageLimit.
   */
  const totalUsageLimit =
    input.totalUsageLimit !==
    undefined
      ? input.totalUsageLimit === null
        ? null
        : Number(
            input.totalUsageLimit,
          )
      : input.usageLimit ===
            undefined ||
          input.usageLimit === null
        ? null
        : Number(input.usageLimit);

  database
    .prepare(
      `
        INSERT INTO vouchers (
          id,
          code,
          type,
          value,
          minimum_subtotal,
          max_discount,
          active,
          valid_from,
          valid_until,
          usage_limit,
          usage_limit_per_user,
          total_usage_limit,
          used_count,
          created_at,
          updated_at
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          NULL,
          ?,
          ?,
          0,
          ?,
          ?
        )
      `,
    )
    .run(
      id,
      code,
      type,
      value,
      minimumSubtotal,
      maxDiscount,
      input.active === false
        ? 0
        : 1,
      input.validFrom ?? null,
      input.validUntil ?? null,
      usageLimitPerUser,
      totalUsageLimit,
      now,
      now,
    );

  return getVoucherById(id)!;
}

export function updateVoucher(
  id: string,
  input: UpdateVoucherInput,
): VoucherRecord {
  const existing =
    getVoucherById(id);

  if (!existing) {
    throw new Error(
      "Voucher not found.",
    );
  }

  const merged: CreateVoucherInput =
    {
      code:
        input.code !== undefined
          ? input.code
          : existing.code,

      type:
        input.type !== undefined
          ? input.type
          : existing.type,

      value:
        input.value !== undefined
          ? input.value
          : existing.value,

      minimumSubtotal:
        input.minimumSubtotal !==
        undefined
          ? input.minimumSubtotal
          : existing.minimumSubtotal,

      maxDiscount:
        input.maxDiscount !==
        undefined
          ? input.maxDiscount
          : existing.maxDiscount,

      active:
        input.active !== undefined
          ? input.active
          : existing.active,

      validFrom:
        input.validFrom !== undefined
          ? input.validFrom
          : existing.validFrom,

      validUntil:
        input.validUntil !== undefined
          ? input.validUntil
          : existing.validUntil,

      usageLimitPerUser:
        input.usageLimitPerUser !==
        undefined
          ? input.usageLimitPerUser
          : existing.usageLimitPerUser,

      totalUsageLimit:
        input.totalUsageLimit !==
        undefined
          ? input.totalUsageLimit
          : existing.totalUsageLimit,
    };

  validateVoucherInput(
    merged,
  );

  const code =
    normalizeCode(merged.code);

  if (
    !/^[A-Z0-9_-]{3,50}$/.test(code)
  ) {
    throw new Error(
      "Voucher code must contain only letters, numbers, hyphens, or underscores.",
    );
  }

  const sameCode =
    getVoucherByCode(code);

  if (
    sameCode &&
    sameCode.id !== id
  ) {
    throw new Error(
      "A voucher with this code already exists.",
    );
  }

  /*
   * A total usage limit cannot be reduced below
   * the number of uses already recorded.
   */
  if (
    merged.totalUsageLimit !==
      null &&
    merged.totalUsageLimit !==
      undefined &&
    Number(
      merged.totalUsageLimit,
    ) < existing.usedCount
  ) {
    throw new Error(
      "Total usage limit cannot be lower than the number of uses already recorded.",
    );
  }

  const value =
    merged.type === "free_delivery"
      ? null
      : Number(merged.value);

  const minimumSubtotal =
    merged.minimumSubtotal ===
      undefined ||
    merged.minimumSubtotal === null
      ? null
      : roundMoney(
          Number(
            merged.minimumSubtotal,
          ),
        );

  const maxDiscount =
    merged.maxDiscount ===
      undefined ||
    merged.maxDiscount === null
      ? null
      : roundMoney(
          Number(merged.maxDiscount),
        );

  const usageLimitPerUser =
    merged.usageLimitPerUser ===
      undefined ||
    merged.usageLimitPerUser === null
      ? 1
      : Number(
          merged.usageLimitPerUser,
        );

  const totalUsageLimit =
    merged.totalUsageLimit ===
      undefined ||
    merged.totalUsageLimit === null
      ? null
      : Number(
          merged.totalUsageLimit,
        );

  const now =
    new Date().toISOString();

  database
    .prepare(
      `
        UPDATE vouchers
        SET
          code = ?,
          type = ?,
          value = ?,
          minimum_subtotal = ?,
          max_discount = ?,
          active = ?,
          valid_from = ?,
          valid_until = ?,
          usage_limit = NULL,
          usage_limit_per_user = ?,
          total_usage_limit = ?,
          updated_at = ?
        WHERE id = ?
      `,
    )
    .run(
      code,
      merged.type,
      value,
      minimumSubtotal,
      maxDiscount,
      merged.active === false
        ? 0
        : 1,
      merged.validFrom ?? null,
      merged.validUntil ?? null,
      usageLimitPerUser,
      totalUsageLimit,
      now,
      id,
    );

  return getVoucherById(id)!;
}

export function deleteVoucher(
  id: string,
) {
  const existing =
    getVoucherById(id);

  if (!existing) {
    throw new Error(
      "Voucher not found.",
    );
  }

  /*
   * Delete usage records first because voucher_usages
   * references the voucher.
   */
  database
    .prepare(
      `
        DELETE FROM voucher_usages
        WHERE voucher_id = ?
      `,
    )
    .run(id);

  database
    .prepare(
      `
        DELETE FROM vouchers
        WHERE id = ?
      `,
    )
    .run(id);
}

function isWithinValidityPeriod(
  voucher: VoucherRecord,
  now = new Date(),
) {
  if (!voucher.active) {
    return false;
  }

  if (voucher.validFrom) {
    const validFrom =
      new Date(
        voucher.validFrom,
      );

    if (
      !Number.isNaN(
        validFrom.getTime(),
      ) &&
      now < validFrom
    ) {
      return false;
    }
  }

  if (voucher.validUntil) {
    const validUntil =
      new Date(
        voucher.validUntil,
      );

    if (
      !Number.isNaN(
        validUntil.getTime(),
      ) &&
      now > validUntil
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Checks the global voucher state and calculates
 * the discount.
 *
 * This function intentionally does not check the per-user
 * limit because no user identity is supplied.
 *
 * Use validateVoucherForUser() when the user/guest identity
 * is available.
 */
export function validateVoucher(
  code: string,
  subtotal: number,
  now = new Date(),
): VoucherCalculation {
  const voucher =
    getVoucherByCode(code);

  if (!voucher) {
    throw new Error(
      "Invalid voucher code.",
    );
  }

  if (
    !isWithinValidityPeriod(
      voucher,
      now,
    )
  ) {
    throw new Error(
      "This voucher is not currently active.",
    );
  }

  if (
    voucher.totalUsageLimit !== null &&
    voucher.usedCount >=
      voucher.totalUsageLimit
  ) {
    throw new Error(
      "This voucher has reached its total usage limit.",
    );
  }

  const normalizedSubtotal =
    roundMoney(subtotal);

  if (
    voucher.minimumSubtotal !==
      null &&
    normalizedSubtotal <
      voucher.minimumSubtotal
  ) {
    throw new Error(
      `Minimum order subtotal is €${voucher.minimumSubtotal.toFixed(
        2,
      )}.`,
    );
  }

  let discountAmount = 0;
  let freeDelivery = false;

  switch (voucher.type) {
    case "fixed":
      discountAmount = Number(
        voucher.value ?? 0,
      );
      break;

    case "percentage":
      discountAmount =
        normalizedSubtotal *
        (Number(
          voucher.value ?? 0,
        ) /
          100);

      if (
        voucher.maxDiscount !==
        null
      ) {
        discountAmount =
          Math.min(
            discountAmount,
            voucher.maxDiscount,
          );
      }

      break;

    case "free_delivery":
      freeDelivery = true;
      discountAmount = 0;
      break;
  }

  discountAmount = roundMoney(
    Math.min(
      Math.max(
        discountAmount,
        0,
      ),
      normalizedSubtotal,
    ),
  );

  return {
    voucher,
    discountAmount,
    freeDelivery,
  };
}

/**
 * Validates the voucher including the per-user limit.
 *
 * The identity can be:
 *   - logged-in userId
 *   - guest checkout email
 */
export function validateVoucherForUser(
  code: string,
  subtotal: number,
  userId?: string | null,
  email?: string | null,
  now = new Date(),
): VoucherCalculation {
  const calculation =
    validateVoucher(
      code,
      subtotal,
      now,
    );

  const userKey =
    getVoucherUserKey(
      userId,
      email,
    );

  const usageCount = getVoucherUsageCount(
    calculation.voucher.id,
    userKey,
  );

  if (
    usageCount >=
    calculation.voucher
      .usageLimitPerUser
  ) {
    throw new Error(
      "You have reached the usage limit for this voucher.",
    );
  }

  return calculation;
}

/**
 * Returns how many successful uses a voucher has
 * for one specific user/guest identity.
 */
export function getVoucherUsageCount(
  voucherId: string,
  userKey: string,
): number {
  const row =
    database
      .prepare(
        `
          SELECT COUNT(*) AS count
          FROM voucher_usages
          WHERE
            voucher_id = ?
            AND user_key = ?
        `,
      )
      .get(
        voucherId,
        userKey,
      ) as
      | {
          count: number;
        }
      | undefined;

  return Number(
    row?.count ?? 0,
  );
}

/**
 * Checks whether the voucher can be used by the
 * supplied user/guest identity.
 *
 * This performs the checks against the current database state.
 */
export function canUseVoucherForUser(
  voucherId: string,
  userId?: string | null,
  email?: string | null,
): boolean {
  const voucher =
    getVoucherById(voucherId);

  if (!voucher || !voucher.active) {
    return false;
  }

  if (
    voucher.totalUsageLimit !== null &&
    voucher.usedCount >=
      voucher.totalUsageLimit
  ) {
    return false;
  }

  const userKey =
    getVoucherUserKey(
      userId,
      email,
    );

  const usageCount =
    getVoucherUsageCount(
      voucherId,
      userKey,
    );

  return (
    usageCount <
    voucher.usageLimitPerUser
  );
}

/**
 * Records one successful voucher usage.
 *
 * This function is intended to be called from inside
 * the same database transaction that marks the order as paid.
 *
 * It:
 *   1. checks the global total limit
 *   2. checks the per-user limit
 *   3. prevents duplicate order usage
 *   4. increments used_count
 *   5. inserts voucher_usages
 *
 * Returns true only when the usage was successfully recorded.
 */
export function recordVoucherUsage(
  voucherId: string,
  userId: string | null | undefined,
  email: string | null | undefined,
  orderId: string,
): boolean {
  const userKey =
    getVoucherUserKey(
      userId,
      email,
    );

  const now =
    new Date().toISOString();

  const existingOrderUsage =
    database
      .prepare(
        `
          SELECT id
          FROM voucher_usages
          WHERE order_id = ?
          LIMIT 1
        `,
      )
      .get(orderId) as
      | {
          id: string;
        }
      | undefined;

  if (existingOrderUsage) {
    return true;
  }

  const voucher =
    getVoucherById(voucherId);

  if (!voucher || !voucher.active) {
    return false;
  }

  if (
    voucher.totalUsageLimit !== null &&
    voucher.usedCount >=
      voucher.totalUsageLimit
  ) {
    return false;
  }

  const userUsageCount =
    getVoucherUsageCount(
      voucherId,
      userKey,
    );

  if (
    userUsageCount >=
    voucher.usageLimitPerUser
  ) {
    return false;
  }

  const result =
    database
      .prepare(
        `
          UPDATE vouchers
          SET
            used_count =
              used_count + 1,
            updated_at = ?
          WHERE
            id = ?
            AND active = 1
            AND (
              total_usage_limit IS NULL
              OR used_count < total_usage_limit
            )
        `,
      )
      .run(
        now,
        voucherId,
      );

  if (
    Number(result.changes) !== 1
  ) {
    return false;
  }

  try {
    database
      .prepare(
        `
          INSERT INTO voucher_usages (
            id,
            voucher_id,
            user_key,
            order_id,
            used_at
          )
          VALUES (?, ?, ?, ?, ?)
        `,
      )
      .run(
        randomUUID(),
        voucherId,
        userKey,
        orderId,
        now,
      );

    return true;
  } catch (error) {
    /*
     * If the usage record could not be inserted,
     * roll back the increment so the voucher count
     * stays consistent.
     */
    database
      .prepare(
        `
          UPDATE vouchers
          SET
            used_count =
              CASE
                WHEN used_count > 0
                THEN used_count - 1
                ELSE 0
              END,
            updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        new Date().toISOString(),
        voucherId,
      );

    /*
     * If the error was caused by an already-recorded
     * order usage, treat it as idempotent success.
     */
    const duplicateOrderUsage =
      database
        .prepare(
          `
            SELECT id
            FROM voucher_usages
            WHERE order_id = ?
            LIMIT 1
          `,
        )
        .get(orderId) as
        | {
            id: string;
          }
        | undefined;

    if (duplicateOrderUsage) {
      return true;
    }

    throw error;
  }
}

/**
 * Removes one voucher usage record for an order.
 *
 * This is useful for refund/cancellation rollback.
 */
export function removeVoucherUsage(
  voucherId: string,
  orderId: string,
): boolean {
  const usage =
    database
      .prepare(
        `
          SELECT id
          FROM voucher_usages
          WHERE
            voucher_id = ?
            AND order_id = ?
          LIMIT 1
        `,
      )
      .get(
        voucherId,
        orderId,
      ) as
      | {
          id: string;
        }
      | undefined;

  if (!usage) {
    return false;
  }

  database
    .prepare(
      `
        DELETE FROM voucher_usages
        WHERE id = ?
      `,
    )
    .run(usage.id);

  database
    .prepare(
      `
        UPDATE vouchers
        SET
          used_count =
            CASE
              WHEN used_count > 0
              THEN used_count - 1
              ELSE 0
            END,
          updated_at = ?
        WHERE id = ?
      `,
    )
    .run(
      new Date().toISOString(),
      voucherId,
    );

  return true;
}

/**
 * Legacy-compatible usage increment.
 *
 * Existing callers can continue to use this function.
 *
 * It now applies the total/global usage limit only.
 * New per-user enforcement should use recordVoucherUsage().
 */
export function incrementVoucherUsage(
  voucherId: string,
): boolean {
  const result =
    database
      .prepare(
        `
          UPDATE vouchers
          SET
            used_count =
              used_count + 1,
            updated_at = ?
          WHERE id = ?
            AND active = 1
            AND (
              total_usage_limit IS NULL
              OR used_count < total_usage_limit
            )
        `,
      )
      .run(
        new Date().toISOString(),
        voucherId,
      );

  return (
    Number(result.changes) === 1
  );
}

/**
 * Legacy-compatible usage decrement.
 *
 * The new order-aware rollback should use
 * removeVoucherUsage().
 */
export function decrementVoucherUsage(
  voucherId: string,
): void {
  database
    .prepare(
      `
        UPDATE vouchers
        SET
          used_count =
            CASE
              WHEN used_count > 0
              THEN used_count - 1
              ELSE 0
            END,
          updated_at = ?
        WHERE id = ?
      `,
    )
    .run(
      new Date().toISOString(),
      voucherId,
    );
}