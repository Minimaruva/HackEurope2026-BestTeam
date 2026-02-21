import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Product } from "@/types/contractops";
import { getProducts } from "@/api/client";

const ProductCard = ({ product, onClick }: { product: Product; onClick: () => void }) => (
  <Card
    className="cursor-pointer transition-all hover:border-primary/30 hover:shadow-md group"
    onClick={onClick}
  >
    <CardContent className="p-5">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground text-sm">{product.name}</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{product.id}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  const raw = products.filter((p) => p.type === "raw");
  const finished = products.filter((p) => p.type === "finished");

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your company's product catalog. Select a product to manage contracts, recipes, and fulfillment.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-20">Loading products…</p>
      ) : (
        <div className="space-y-10">
          {/* Raw Materials */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Raw Materials
              </h2>
              <span className="text-xs text-muted-foreground">— Buy contracts</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {raw.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => navigate(`/products/${p.id}`)} />
              ))}
            </div>
          </section>

          {/* Finished Products */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                Our Products
              </h2>
              <span className="text-xs text-muted-foreground">— Sell contracts</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {finished.map((p) => (
                <ProductCard key={p.id} product={p} onClick={() => navigate(`/products/${p.id}`)} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
