import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AdminLayout } from "./layouts/AdminLayout";
import { PublicLayout } from "./layouts/PublicLayout";
import { About } from "./pages/About";
import { AdminCategories, AdminCustomers, AdminDashboard, AdminInventory, AdminOrderDetail, AdminOrders, AdminProducts, AdminReports, AdminSettings, ProductForm } from "./pages/AdminPages";
import { AdminLogin } from "./pages/AdminLogin";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Contact } from "./pages/Contact";
import { Home } from "./pages/Home";
import { OrderSuccess } from "./pages/OrderSuccess";
import { ProductPage } from "./pages/ProductPage";
import { Shop } from "./pages/Shop";
import { TrackOrder } from "./pages/TrackOrder";

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success/:orderNumber" element={<OrderSuccess />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

function ProtectedAdminRoute() {
  if (typeof window === "undefined") return <Navigate to="/admin/login" replace />;

  const token = window.localStorage.getItem("wa-admin-token");
  return token ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
