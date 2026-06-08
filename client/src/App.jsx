import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/Layout.jsx';
import { PublicLayout } from './components/PublicLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { About } from './pages/About.jsx';
import { Cart } from './pages/Cart.jsx';
import { Checkout } from './pages/Checkout.jsx';
import { Contact } from './pages/Contact.jsx';
import { Login } from './pages/Login.jsx';
import { ProductDetail } from './pages/ProductDetail.jsx';
import { Products } from './pages/Products.jsx';
import { PublicHome } from './pages/PublicHome.jsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminEmail } from './pages/admin/AdminEmail.jsx';
import { AdminExactScreen } from './pages/admin/AdminExactScreen.jsx';
import { AdminLedgerMaster } from './pages/admin/AdminLedgerMaster.jsx';
import { AdminMasterForm, AdminMasterScreen, AdminProfile } from './pages/admin/AdminMasterScreen.jsx';
import { AdminModuleWorkspace } from './pages/admin/AdminModuleWorkspace.jsx';
import { AdminProductStock } from './pages/admin/AdminProductStock.jsx';
import { AdminSettings } from './pages/admin/AdminSettings.jsx';
import { SuperDashboard } from './pages/super-admin/SuperDashboard.jsx';
import { SuperModule } from './pages/super-admin/SuperModule.jsx';
import { ThemeSettings } from './pages/super-admin/ThemeSettings.jsx';
import { adminModules, superModules } from './config/navigation.js';

function Protected({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={role === 'super-admin' ? '/super-admin/login' : '/admin/login'} replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PublicHome />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/contact" element={<Contact />} />
      </Route>
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/admin/login" element={<Login type="admin" />} />
      <Route path="/super-admin/login" element={<Login type="super-admin" />} />
      <Route path="/admin" element={<Protected role="admin"><AppLayout title="Vendor ERP" modules={adminModules} type="admin" /></Protected>}>
        <Route index element={<AdminDashboard />} />
        <Route path="email" element={<AdminEmail />} />
        <Route path="clients" element={<AdminMasterScreen resource="clients" />} />
        <Route path="clients/form" element={<AdminMasterForm resource="clients" />} />
        <Route path="clients/profile/:id" element={<AdminProfile type="clients" />} />
        <Route path="suppliers" element={<AdminMasterScreen resource="suppliers" />} />
        <Route path="suppliers/form" element={<AdminMasterForm resource="suppliers" />} />
        <Route path="suppliers/profile/:id" element={<AdminProfile type="suppliers" />} />
        <Route path="categories" element={<AdminMasterScreen resource="categories" />} />
        <Route path="categories/form" element={<AdminMasterForm resource="categories" />} />
        <Route path="products" element={<AdminMasterScreen resource="products" />} />
        <Route path="products/form" element={<AdminMasterForm resource="products" />} />
        <Route path="products/stock/:id" element={<AdminProductStock />} />
        <Route path="units" element={<AdminModuleWorkspace moduleKey="units" />} />
        <Route path="brands" element={<AdminModuleWorkspace moduleKey="brands" />} />
        <Route path="gst-rates" element={<AdminModuleWorkspace moduleKey="gst-rates" />} />
        <Route path="ledger-master" element={<AdminLedgerMaster />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="enquiries" element={<AdminExactScreen screen="enquiries" />} />
        <Route path="stock" element={<AdminExactScreen screen="stock" />} />
        <Route path="purchases" element={<AdminExactScreen screen="purchases" />} />
        <Route path="sales" element={<AdminExactScreen screen="sales" />} />
        <Route path="orders" element={<AdminExactScreen screen="orders" />} />
        <Route path="payments" element={<AdminExactScreen screen="payments" />} />
        <Route path="payment-client" element={<AdminExactScreen screen="payment-client" />} />
        <Route path="payment-supplier" element={<AdminExactScreen screen="payment-supplier" />} />
        <Route path="ledgers" element={<AdminExactScreen screen="ledgers" />} />
        <Route path="vouchers" element={<AdminExactScreen screen="vouchers" />} />
        <Route path="cash-book" element={<AdminExactScreen screen="cash-book" />} />
        <Route path="bank-book" element={<AdminExactScreen screen="bank-book" />} />
        <Route path="journal-entries" element={<AdminExactScreen screen="journal-entries" />} />
        <Route path="expenses" element={<AdminExactScreen screen="expenses" />} />
        <Route path="earnings" element={<AdminExactScreen screen="earnings" />} />
        <Route path="gst" element={<AdminExactScreen screen="gst" />} />
        <Route path="invoices" element={<AdminExactScreen screen="invoices" />} />
        <Route path="users" element={<AdminExactScreen screen="users" />} />
        <Route path=":resource" element={<AdminModuleWorkspace />} />
      </Route>
      <Route path="/super-admin" element={<Protected role="super-admin"><AppLayout title="Super Admin" modules={superModules} type="super-admin" /></Protected>}>
        <Route index element={<SuperDashboard />} />
        <Route path="email" element={<AdminEmail scope="super-admin" />} />
        <Route path="themes" element={<ThemeSettings />} />
        <Route path="modules/:module" element={<SuperModule />} />
      </Route>
    </Routes>
  );
}
