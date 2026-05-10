/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './lib/firebase';
import { Coffee, LogOut, ShieldCheck, ShoppingCart } from 'lucide-react';

import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import AdminDashboard from './pages/AdminDashboard';
import MyOrdersPage from './pages/MyOrdersPage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f5f5f0] text-[#424231] font-sans flex flex-col select-none">
        <header className="bg-[#f5f5f0] border-b border-[#e2e2d8] text-[#424231] sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#5A5A40] rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <h1 className="text-xl font-serif italic font-bold tracking-tight">茶香四溢 Tea Time</h1>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/cart" className="flex items-center gap-1 hover:text-[#5A5A40] transition-colors text-xs font-medium uppercase tracking-widest opacity-80">
                <ShoppingCart className="w-4 h-4" />
                <span>購物車</span>
              </Link>
              <Link to="/orders" className="hover:text-[#5A5A40] transition-colors text-xs font-medium uppercase tracking-widest opacity-80">我的訂單</Link>
              {user ? (
                <>
                  {user.email === 'go.asiaman@gmail.com' && (
                    <Link to="/admin" className="flex items-center gap-1 hover:opacity-80 transition-colors text-xs font-bold uppercase tracking-widest text-[#5A5A40]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>後台管理</span>
                    </Link>
                  )}
                  <button onClick={logout} className="flex items-center gap-1 hover:text-[#5A5A40] transition-colors text-xs font-medium uppercase tracking-widest opacity-80">
                    <LogOut className="w-4 h-4" />
                    <span>登出</span>
                  </button>
                </>
              ) : (
                <button onClick={() => loginWithGoogle().catch(e => alert('登入失敗: ' + (e instanceof Error ? e.message : String(e)) + '\n請確保瀏覽器沒有阻擋彈出視窗，並確認 Firebase 後台已啟用 Google 登入。'))} className="text-[#424231] opacity-60 hover:opacity-100 hover:text-[#5A5A40] px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-opacity">
                  商家登入
                </button>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col pt-8">
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<MyOrdersPage />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Routes>
        </main>

        <footer className="h-12 bg-[#5A5A40] text-white text-[10px] flex items-center justify-center px-8 uppercase tracking-widest mt-auto">
          <span>&copy; {new Date().getFullYear()} Tea Time Ordering System. All rights reserved.</span>
        </footer>
      </div>
    </BrowserRouter>
  );
}
