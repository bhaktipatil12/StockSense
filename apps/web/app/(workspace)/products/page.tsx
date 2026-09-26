import { ProductsView } from "../../../src/components/products/products-view";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ stock?: string }> }) {
  const { stock } = await searchParams;
  return <ProductsView initialStockFilter={stock === "low" ? "low" : "all"} />;
}
