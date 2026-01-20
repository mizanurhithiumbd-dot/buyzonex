import { useMemo, useState } from 'react';
import { Link, useFetcher } from 'react-router';
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw } from 'lucide-react';
import { Header } from '~/components/header/header';
import { Footer } from '~/components/footer/footer';
import { Button } from '~/components/ui/button/button';
import { Badge } from '~/components/ui/badge/badge';
import { ProductCard } from '~/components/product-card/product-card';
import { createSupabaseServerClient } from '~/lib/supabase.server';
import type { Route } from './+types/product-detail';
import styles from './product-detail.module.css';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `${params.slug} - Manaf Zone` },
    { name: 'description', content: `View product details for ${params.slug} on Manaf Zone` },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const { supabase } = createSupabaseServerClient(request);

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      description,
      short_description,
      category_id,
      base_price,
      compare_at_price,
      is_featured,
      product_images(url, is_primary),
      inventory(available_quantity)
    `
    )
    .eq('slug', params.slug)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (error || !product) {
    throw new Response('Product Not Found', { status: 404 });
  }

  const image_url =
    (product as any).product_images?.find((img: any) => img.is_primary)?.url ||
    (product as any).product_images?.[0]?.url ||
    null;

  const in_stock = (((product as any).inventory?.[0]?.available_quantity || 0) as number) > 0;

  const mappedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDescription: product.short_description || undefined,
    description: product.description || undefined,
    price: Number(product.base_price) || 0,
    compare_at_price: product.compare_at_price,
    image_url,
    rating_average: 0,
    rating_count: 0,
    in_stock,
    is_featured: !!product.is_featured,
    _images: (product as any).product_images || [],
    _category_id: product.category_id,
  };

  // Related products: same category when possible
  let related: any[] = [];
  if (product.category_id) {
    const { data: relatedProducts } = await supabase
      .from('products')
      .select(
        `
        id,
        name,
        slug,
        base_price,
        compare_at_price,
        is_featured,
        product_images(url, is_primary),
        inventory(available_quantity)
      `
      )
      .eq('is_active', true)
      .is('deleted_at', null)
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .limit(4);

    related = (relatedProducts || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.base_price) || 0,
      compare_at_price: p.compare_at_price,
      image_url: p.product_images?.find((img: any) => img.is_primary)?.url || p.product_images?.[0]?.url || null,
      rating_average: 0,
      rating_count: 0,
      in_stock: (p.inventory?.[0]?.available_quantity || 0) > 0,
      is_featured: !!p.is_featured,
    }));
  }

  return { product: mappedProduct, relatedProducts: related };
}

export default function ProductDetail({ loaderData }: Route.ComponentProps) {
  const { product, relatedProducts } = loaderData as any;
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const cartFetcher = useFetcher();
  const wishlistFetcher = useFetcher();

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const images = useMemo(() => {
    const fromDb = (product as any)._images as Array<{ url: string }>;
    const urls = (fromDb || []).map((i) => i.url).filter(Boolean);
    if (urls.length > 0) return urls;
    return [product.image_url || '/placeholder.jpg'];
  }, [product]);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb}>
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/products">Products</Link>
            <span>/</span>
            <span>{product.name}</span>
          </nav>

          {/* Product Details */}
          <div className={styles.productLayout}>
            {/* Images */}
            <div className={styles.imageSection}>
              <div className={styles.mainImage}>
                <img src={images[selectedImage]} alt={product.name} />
                {discount > 0 && <Badge className={styles.discountBadge}>-{discount}%</Badge>}
              </div>
              <div className={styles.thumbnails}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    className={`${styles.thumbnail} ${selectedImage === idx ? styles.thumbnailActive : ''}`}
                    onClick={() => setSelectedImage(idx)}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className={styles.detailsSection}>
              <h1 className={styles.productName}>{product.name}</h1>

              {/* Rating */}
              <div className={styles.rating}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill={i < product.rating_average ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <span className={styles.ratingText}>
                  {product.rating_average} ({product.rating_count} reviews)
                </span>
              </div>

              {/* Price */}
              <div className={styles.pricing}>
                <p className={styles.price}>৳{product.price.toFixed(2)}</p>
                {product.compare_at_price && (
                  <p className={styles.comparePrice}>৳{product.compare_at_price.toFixed(2)}</p>
                )}
              </div>

              {/* Stock Status */}
              <div className={styles.stock}>
                {product.in_stock ? (
                  <Badge>In Stock</Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>

              {/* Description */}
              <div className={styles.description}>
                <p>{product.shortDescription || 'High-quality product with excellent features and durability. Perfect for your needs.'}</p>
              </div>

              {/* Quantity */}
              <div className={styles.quantitySection}>
                <label className={styles.quantityLabel}>Quantity:</label>
                <div className={styles.quantityControl}>
                  <button
                    className={styles.quantityButton}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={!product.in_stock}
                  >
                    -
                  </button>
                  <span className={styles.quantityValue}>{quantity}</span>
                  <button
                    className={styles.quantityButton}
                    onClick={() => setQuantity((q) => q + 1)}
                    disabled={!product.in_stock}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actions}>
                <Button
                  size="lg"
                  className={styles.addToCartButton}
                  disabled={!product.in_stock || cartFetcher.state === 'submitting'}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set('intent', 'add');
                    fd.set('product_id', product.id);
                    fd.set('quantity', String(quantity));
                    cartFetcher.submit(fd, { method: 'post', action: '/cart' });
                  }}
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className={styles.wishlistButton}
                  disabled={wishlistFetcher.state === 'submitting'}
                  onClick={() => {
                    const fd = new FormData();
                    fd.set('intent', 'toggle');
                    fd.set('product_id', product.id);
                    wishlistFetcher.submit(fd, { method: 'post', action: '/wishlist' });
                  }}
                >
                  <Heart size={20} />
                  Wishlist
                </Button>
              </div>

              {/* Features */}
              <div className={styles.features}>
                <div className={styles.feature}>
                  <Truck size={20} />
                  <span>Free shipping on orders over ৳2,000</span>
                </div>
                <div className={styles.feature}>
                  <Shield size={20} />
                  <span>Secure payment & data protection</span>
                </div>
                <div className={styles.feature}>
                  <RotateCcw size={20} />
                  <span>7-day easy return policy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className={styles.relatedSection}>
              <h2 className={styles.relatedTitle}>You May Also Like</h2>
              <div className={styles.relatedGrid}>
                {relatedProducts.map((p: any) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
