import ProductEditor from "@/components/admin/products/ProductEditor";

type ProductEditPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function ProductEditPage({
    params,
}: ProductEditPageProps) {
    const { id } = await params;

    return (
        <ProductEditor
            mode="edit"
            productId={id}
        />
    );
}