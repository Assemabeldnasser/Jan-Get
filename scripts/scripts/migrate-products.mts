import { DatabaseSync } from "node:sqlite";

import { products } from "../data/products.ts";

const database = new DatabaseSync("database.sqlite");

database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  PRAGMA foreign_keys = ON;
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name_json TEXT NOT NULL,
    description_json TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    emoji TEXT NOT NULL,
    master_image TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    color_json TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (product_id)
      REFERENCES products (id)
      ON DELETE CASCADE
  )
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS product_images (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    variant_id TEXT,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,

    FOREIGN KEY (product_id)
      REFERENCES products (id)
      ON DELETE CASCADE,

    FOREIGN KEY (variant_id)
      REFERENCES product_variants (id)
      ON DELETE CASCADE
  )
`);

database.exec(`
  CREATE INDEX IF NOT EXISTS idx_product_variants_product_id
  ON product_variants (product_id)
`);

database.exec(`
  CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON product_images (product_id)
`);

database.exec(`
  CREATE INDEX IF NOT EXISTS idx_product_images_variant_id
  ON product_images (variant_id)
`);

const now = new Date().toISOString();

const insertProduct = database.prepare(`
  INSERT INTO products (
    id,
    slug,
    name_json,
    description_json,
    price,
    category,
    emoji,
    master_image,
    featured,
    active,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertVariant = database.prepare(`
  INSERT INTO product_variants (
    id,
    product_id,
    color_json,
    sort_order,
    active,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const insertImage = database.prepare(`
  INSERT INTO product_images (
    id,
    product_id,
    variant_id,
    image_url,
    sort_order,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const productExists = database.prepare(`
  SELECT id
  FROM products
  WHERE id = ?
`);

let productsCreated = 0;
let variantsCreated = 0;
let imagesCreated = 0;

try {
  database.exec("BEGIN");

  for (const product of products) {
    const existing = productExists.get(product.id);

    if (existing) {
      continue;
    }

    /*
     * Existing products.ts does not yet have an explicit
     * master image.
     *
     * For the initial migration we use the first image
     * of the first variant as the master image.
     *
     * This preserves the current visual appearance until
     * the Admin Product Management UI allows the master
     * image to be changed independently.
     */
    const masterImage =
      product.variants[0]?.images[0] ?? null;

    insertProduct.run(
      product.id,
      product.slug,
      JSON.stringify(product.name),
      JSON.stringify(product.description),
      product.price,
      product.category,
      product.emoji,
      masterImage,
      product.featured ? 1 : 0,
      1,
      now,
      now
    );

    productsCreated += 1;

    product.variants.forEach((variant, variantIndex) => {
      const variantId =
        `${product.id}-variant-${variantIndex + 1}`;

      insertVariant.run(
        variantId,
        product.id,
        JSON.stringify(variant.color),
        variantIndex,
        1,
        now,
        now
      );

      variantsCreated += 1;

      variant.images.forEach((image, imageIndex) => {
        const imageId =
          `${variantId}-image-${imageIndex + 1}`;

        insertImage.run(
          imageId,
          product.id,
          variantId,
          image,
          imageIndex,
          now,
          now
        );

        imagesCreated += 1;
      });
    });
  }

  database.exec("COMMIT");

  console.log("");
  console.log("Product migration completed.");
  console.log("--------------------------------");
  console.log(`Products created: ${productsCreated}`);
  console.log(`Variants created: ${variantsCreated}`);
  console.log(`Images created:   ${imagesCreated}`);
  console.log("");
} catch (error) {
  try {
    database.exec("ROLLBACK");
  } catch {
    // Ignore rollback errors.
  }

  console.error("");
  console.error("Product migration failed.");
  console.error("--------------------------------");
  console.error(error);
  console.error("");

  process.exitCode = 1;
} finally {
  database.close();
}