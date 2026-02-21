import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@/types/contractops";
import { getProducts } from "@/api/client";
import ContractsPage from "./ContractsPage";
import RecipesPage from "./RecipesPage";
import FlavoursPage from "./FlavoursPage";
import HITLPage from "./HITLPage";
import CostsPage from "./CostsPage";

const ProductDetailPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts().then((products) => {
      setProduct(products.find((p) => p.id === productId) || null);
      setLoading(false);
    });
  }, [productId]);

  if (loading) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl mx-auto">
        <p className="text-sm text-muted-foreground py-20 text-center">Loading…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 lg:p-10 max-w-6xl mx-auto text-center py-20">
        <p className="text-sm text-muted-foreground">Product not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
          Back to Products
        </Button>
      </div>
    );
  }

  const direction = product.type === "raw" ? "IN" : "OUT";

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground -ml-2 mb-2"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Products
        </Button>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{product.name}</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">{product.id}</p>
      </div>

      <Tabs defaultValue="contracts">
        <TabsList className="mb-6">
          <TabsTrigger value="contracts">
            {product.type === "raw" ? "Buy Contracts" : "Sell Contracts"}
          </TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="flavours">Flavours</TabsTrigger>
          <TabsTrigger value="hitl">HITL</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts">
          <ContractsPage productId={productId!} direction={direction} />
        </TabsContent>
        <TabsContent value="recipes">
          <RecipesPage />
        </TabsContent>
        <TabsContent value="flavours">
          <FlavoursPage />
        </TabsContent>
        <TabsContent value="hitl">
          <HITLPage productId={productId!} />
        </TabsContent>
        <TabsContent value="costs">
          <CostsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetailPage;
