import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Toast from './components/Toast.jsx';
import { useAuth } from './context/AuthContext.jsx';
import Landing from './pages/Landing.jsx';
import Market from './pages/Market.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Orders from './pages/Orders.jsx';
import FarmerDashboard from './pages/FarmerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Profile from './pages/Profile.jsx';
import Wallet from './pages/Wallet.jsx';
import Farms from './pages/Farms.jsx';
import FarmStore from './pages/FarmStore.jsx';
import FarmerHome from './pages/FarmerHome.jsx';
import BuyerHome from './pages/BuyerHome.jsx';

function Guard({ roles, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-loader"><span className="sprout">🌱</span></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Home depends on who is logged in: farmers → analytics, buyers → product ads, everyone else → landing page
function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-loader"><span className="sprout">🌱</span></div>;
  if (user?.role === 'farmer') return <FarmerHome />;
  if (user?.role === 'buyer') return <BuyerHome />;
  return <Landing />;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <main key={pathname} className="route-fade">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/market" element={<Market />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/farms" element={<Farms />} />
          <Route path="/farm/:id" element={<FarmStore />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders" element={<Guard><Orders /></Guard>} />
          <Route path="/profile" element={<Guard><Profile /></Guard>} />
          <Route path="/wallet" element={<Guard roles={['buyer', 'farmer']}><Wallet /></Guard>} />
          <Route path="/farmer" element={<Guard roles={['farmer']}><FarmerDashboard /></Guard>} />
          <Route path="/admin" element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
    </>
  );
}
