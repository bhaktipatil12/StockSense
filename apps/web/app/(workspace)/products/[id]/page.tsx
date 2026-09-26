import { ProductDetailView } from "../../../../src/components/products/product-detail-view";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetailView id={id} />;
}
