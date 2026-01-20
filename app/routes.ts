import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Home
  index("routes/home.tsx"),
  
  // Products
  route("products", "routes/products.tsx"),
  route("products/:slug", "routes/product-detail.tsx"),
  
  // Categories
  route("categories", "routes/categories.tsx"),
  
  // Cart & Checkout
  route("cart", "routes/cart.tsx"),
  
  // Auth
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("forgot-password", "routes/forgot-password.tsx"),
  
  // Admin
  route("admin/dashboard", "routes/admin/dashboard.tsx"),
  route("admin/products", "routes/admin/products.tsx"),
  route("admin/categories", "routes/admin/categories.tsx"),
  route("admin/orders", "routes/admin/orders.tsx"),
  route("admin/refunds", "routes/admin/refunds.tsx"),
  route("admin/customers", "routes/admin/customers.tsx"),
  route("admin/settings", "routes/admin/settings.tsx"),
  
  // Customer pages
  route("deals", "routes/deals.tsx"),
  route("new-arrivals", "routes/new-arrivals.tsx"),
  route("wishlist", "routes/wishlist.tsx"),
  route("contact", "routes/contact.tsx"),
  route("faq", "routes/faq.tsx"),
  route("track-order", "routes/track-order.tsx"),
  route("about", "routes/about.tsx"),
  
  // Legal/Info pages
  route("privacy", "routes/privacy.tsx"),
  route("terms", "routes/terms.tsx"),
  route("shipping", "routes/shipping.tsx"),
  route("returns", "routes/returns.tsx"),
  route("careers", "routes/careers.tsx"),

  // API
  route("api/session", "routes/api/session.ts"),
  
  // 404 - Must be last
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
