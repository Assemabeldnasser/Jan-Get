import { notFound } from "next/navigation";

import ProductDetails from "@/components/ProductDetails";

import {
  getProductBySlug,
} from "@/lib/product-db";

import {
  toPublicProduct,
} from "@/lib/product-public";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } =
    await params;

  const product =
    getProductBySlug(slug, {
      includeInactive: false,
    });

  if (!product) {
    notFound();
  }

  return (
    <ProductDetails
      product={toPublicProduct(product)}
    />
  );
}