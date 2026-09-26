import { ProductsView } from "../../../src/components/products/products-view";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ stock?: string; category?: string }> }) {
  const { stock, category } = await searchParams;
  return <ProductsView initialStockFilter={stock === "low" ? "low" : "all"} initialCategory={category} />;
}
