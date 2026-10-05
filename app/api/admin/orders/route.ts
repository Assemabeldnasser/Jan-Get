import { NextResponse } from "next/server";
import { DatabaseSync } from "node:sqlite";

import { getAdminSession } from "@/lib/admin";

const database = new DatabaseSync("database.sqlite");

database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
`);

/*
 * Add tracking_number to existing databases.
 *
 * The column is intentionally added with a safe migration because
 * the orders table already exists in existing installations.
 */
try {
  database.exec(`
    ALTER TABLE orders
    ADD COLUMN tracking_number TEXT
  `);
} catch {
  // Column already exists.
}

type OrderRow = {
  id: string;
  user_id: string | null;
  status: string;
  payment_status: string;
  items_json: string;
  shipping_json: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  created_at: string;
  tracking_number: string | null;
};

export async function GET(request: Request) {
  try {
    const session = await getAdminSession(request);

    if (!session) {
      return NextResponse.json(
        {
          error: "Admin access required.",
        },
        { status: 403 }
      );
    }

    const rows = database
      .prepare(
        `
          SELECT
            id,
            user_id,
            status,
            payment_status,
            items_json,
            shipping_json,
            subtotal,
            shipping_cost,
            total,
            created_at,
            tracking_number
          FROM orders
          ORDER BY created_at DESC
        `
      )
      .all() as OrderRow[];

    const orders = rows.map((order) => ({
      id: order.id,
      userId: order.user_id,
      status: order.status,
      paymentStatus: order.payment_status,
      items: JSON.parse(order.items_json),
      shipping: JSON.parse(order.shipping_json),
      subtotal: order.subtotal,
      shippingCost: order.shipping_cost,
      total: order.total,
      createdAt: order.created_at,
      trackingNumber:
        order.tracking_number ?? null,
    }));

    return NextResponse.json({
      orders,
    });
  } catch (error) {
    console.error(
      "Admin get orders error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load orders.",
      },
      { status: 500 }
    );
  }
}