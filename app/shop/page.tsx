import ShopContent from "@/components/ShopContent";

import {
  getProducts,
} from "@/lib/product-db";

import {
  toPublicProducts,
} from "@/lib/product-public";

type ShopPageProps = {
  searchParams: Promise<{
    category?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default function ShopPage({
  searchParams,
}: ShopPageProps) {
  return (
    <ShopPageContent
      searchParams={searchParams}
    />
  );
}

async function ShopPageContent({
  searchParams,
}: ShopPageProps) {
  const params =
    await searchParams;

  const selectedCategory =
    params.category;

  const dbProducts =
    getProducts({
      includeInactive: false,
    });

  const publicProducts =
    toPublicProducts(dbProducts);

  const filteredProducts =
    selectedCategory
      ? publicProducts.filter(
          (product) =>
            product.category ===
            selectedCategory
        )
      : publicProducts;

  return (
    <ShopContent
      products={filteredProducts}
      selectedCategory={
        selectedCategory
      }
    />
  );
}