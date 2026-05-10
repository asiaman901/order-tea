import { useCartStore } from '../store/useCartStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth, loginWithGoogle } from '../lib/firebase';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getCartTotal, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    const customerName = prompt("請輸入您的姓名：") || "訪客";

    setIsSubmitting(true);
    try {
      const orderId = crypto.randomUUID();
      const orderRef = doc(collection(db, 'orders'), orderId);
      
      let guestId = localStorage.getItem('tea_guest_id');
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem('tea_guest_id', guestId);
      }
      
      const orderData = {
        userId: auth.currentUser ? auth.currentUser.uid : guestId,
        customerName: auth.currentUser?.displayName || customerName,
        customerPhone: auth.currentUser?.phoneNumber || '',
        status: 'pending',
        totalPrice: getCartTotal(),
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          size: i.size,
          sugar: i.sugar,
          ice: i.ice,
          price: i.price,
          quantity: i.quantity,
          toppings: i.toppings
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(orderRef, orderData);
      
      const myOrders = JSON.parse(localStorage.getItem('tea_my_orders') || '[]');
      myOrders.push(orderId);
      localStorage.setItem('tea_my_orders', JSON.stringify(myOrders));
      
      clearCart();
      alert("訂單已送出！");
      navigate('/orders');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'orders');
      alert("送出訂單失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-6">
        <div className="text-6xl text-[#e2e2d8]">🛒</div>
        <h2 className="text-2xl font-serif text-[#424231] opacity-60">購物車是空的</h2>
        <button 
          onClick={() => navigate('/')}
          className="bg-[#5A5A40] text-white px-6 py-2 rounded-full font-semibold hover:opacity-90 transition-opacity"
        >
          去看看菜單
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      <h1 className="text-3xl font-serif text-[#424231] border-b border-[#e2e2d8] pb-2">購物車結帳</h1>
      
      <div className="bg-white rounded-[32px] shadow-sm border border-[#e2e2d8] overflow-hidden">
        <div className="divide-y divide-[#e2e2d8]">
          {items.map(item => (
            <div key={item.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-serif text-[#424231]">{item.name} <span className="text-sm font-sans italic opacity-60">({item.size})</span></h3>
                <p className="text-sm text-[#424231] opacity-60 space-x-2">
                  <span>{item.sugar}</span>
                  <span>•</span>
                  <span>{item.ice}</span>
                  {item.toppings.length > 0 && (
                    <>
                      <span>•</span>
                      <span>+ {item.toppings.join(', ')}</span>
                    </>
                  )}
                </p>
                <div className="text-[#5A5A40] font-serif mt-1">${item.price} x {item.quantity} = ${item.price * item.quantity}</div>
              </div>
              
              <div className="flex items-center gap-4 border border-[#e2e2d8] rounded-full bg-[#f5f5f0] p-1">
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-[#e9e9e2] text-[#424231]"
                >-</button>
                <span className="w-4 text-center text-sm font-bold text-[#424231]">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-[#e9e9e2] text-[#424231]"
                >+</button>
              </div>
              
              <button 
                onClick={() => removeItem(item.id)}
                className="text-[#424231] opacity-40 hover:opacity-100 p-2 text-xl"
                title="刪除"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-6 bg-[#fcfcfb] border-t border-[#e2e2d8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-lg text-[#424231]">
            訂單總金額：<span className="text-3xl font-serif ml-2">${getCartTotal()}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-[#5A5A40] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-md hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? '處理中...' : '確認結帳'}
          </button>
        </div>
      </div>
    </div>
  );
}
