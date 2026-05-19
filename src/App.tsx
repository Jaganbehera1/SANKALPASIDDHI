import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import Home from './pages/Home';
import MockTest from './pages/MockTest';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <Toast />
      <Navbar isAdminLoggedIn={isAdminLoggedIn} onAdminLogout={() => setIsAdminLoggedIn(false)} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mock-test" element={<MockTest />} />
        <Route
          path="/admin-dashboard"
          element={
            <AdminDashboard
              onLoginSuccess={() => setIsAdminLoggedIn(true)}
              isLoggedIn={isAdminLoggedIn}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
