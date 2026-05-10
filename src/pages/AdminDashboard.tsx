import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, onSnapshot, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { DBOrder, DBProduct } from '../types';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if user is admin
    if (auth.currentUser?.email === 'go.asiaman@gmail.com') {
      setIsAdmin(true);
    }
  }, []);

  if (!isAdmin) {
    return <div className="p-8 text-center text-rose-500 font-bold">無權限訪問</div>;
  }

  const activeTab = location.pathname.includes('/admin/products') ? 'products' : 'orders';

  return (
    <div className="flex gap-6 items-start h-full pb-10">
      <div className="w-48 shrink-0 bg-white shadow-sm border border-[#e2e2d8] rounded-[32px] overflow-hidden flex flex-col pb-4">
        <div className="bg-[#5A5A40] text-white p-6 font-serif text-center font-bold text-lg">
          商家控制台
        </div>
        <div className="p-4 flex flex-col gap-2">
          <Link 
            to="/admin" 
            className={`px-4 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'orders' ? 'bg-[#5A5A40] text-white' : 'text-[#424231] hover:bg-[#f5f5f0]'}`}
          >
            訂單管理
          </Link>
          <Link 
            to="/admin/products" 
            className={`px-4 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'products' ? 'bg-[#5A5A40] text-white' : 'text-[#424231] hover:bg-[#f5f5f0]'}`}
          >
            菜單管理
          </Link>
        </div>
      </div>
      
      <div className="flex-1 bg-white p-8 rounded-[32px] shadow-sm border border-[#e2e2d8] min-h-[500px]">
        <Routes>
          <Route path="/" element={<AdminOrders />} />
          <Route path="/products" element={<AdminProducts />} />
        </Routes>
      </div>
    </div>
  );
}

function AdminOrders() {
  const [orders, setOrders] = useState<DBOrder[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DBOrder));
      orderList.sort((a,b) => {
        const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any).toMillis();
        const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any).toMillis();
        return dateB - dateA;
      });
      setOrders(orderList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'orders'));
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { 
        status, 
        updatedAt: serverTimestamp() 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-serif text-[#424231] border-b border-[#e2e2d8] pb-2">當前訂單列表</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#f5f5f0] text-[#424231] uppercase text-[10px] tracking-widest font-bold">
            <tr>
              <th className="px-4 py-3 border-b border-[#e2e2d8]">訂單編號</th>
              <th className="px-4 py-3 border-b border-[#e2e2d8]">時間</th>
              <th className="px-4 py-3 border-b border-[#e2e2d8]">顧客名稱</th>
              <th className="px-4 py-3 border-b border-[#e2e2d8]">項目數</th>
              <th className="px-4 py-3 border-b border-[#e2e2d8]">總額</th>
              <th className="px-4 py-3 border-b border-[#e2e2d8]">狀態</th>
              <th className="px-4 py-3 border-b border-[#e2e2d8]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e2d8]">
            {orders.map(order => (
               <tr key={order.id} className="hover:bg-[#fcfcfb] group">
                <td className="px-4 py-4 font-mono text-xs text-[#5A5A40] opacity-80">{order.id.slice(0,6)}</td>
                <td className="px-4 py-4 text-xs font-medium text-[#424231]">
                  {new Date(typeof order.createdAt === 'string' ? order.createdAt : (order.createdAt as any).toMillis()).toLocaleTimeString()}
                </td>
                <td className="px-4 py-4 font-serif">{order.customerName}</td>
                <td className="px-4 py-4">
                  <span className="bg-[#f5f5f0] text-[#424231] px-2 py-1 rounded text-xs font-bold font-serif">{order.items.reduce((s, i) => s + i.quantity, 0)} 杯</span>
                </td>
                <td className="px-4 py-4 font-bold font-serif text-[#5A5A40]">${order.totalPrice}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800 opacity-60'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-4 space-x-2">
                  {order.status === 'pending' && <button onClick={() => updateStatus(order.id, 'processing')} className="text-[10px] uppercase tracking-widest font-bold bg-[#424231] text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">接單</button>}
                  {order.status === 'processing' && <button onClick={() => updateStatus(order.id, 'completed')} className="text-[10px] uppercase tracking-widest font-bold bg-[#5A5A40] text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">完成</button>}
                  {order.status !== 'cancelled' && order.status !== 'completed' && <button onClick={() => updateStatus(order.id, 'cancelled')} className="text-[10px] uppercase tracking-widest font-bold bg-white border border-[#e2e2d8] text-[#424231] opacity-60 hover:opacity-100 px-3 py-1.5 rounded-full transition-opacity">取消</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminProducts() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DBProduct));
      setProducts(prodList);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'products'));
    return () => unsubscribe();
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'products', id), { 
        isActive: !current, 
        updatedAt: serverTimestamp() 
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `products/${id}`);
    }
  };

  const seedMenuData = async () => {
    if (products.length > 0) {
      if (!confirm("已經有產品存在，確定要加入預設菜單嗎？可能會產生重複項目。")) return;
    }
    setIsSeeding(true);
    
    const menuData = [
      // 茶香系列
      { category: '茶香系列', name: '古早味紅茶', englishName: 'Black tea (The Old-Time Delights of Taiwan)', priceL: 30, priceBottle: 50, isRecommended: true, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '炭焙麥茶', englishName: 'Roasted wheat tea', priceL: 30, priceBottle: 50, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '阿里山香片', englishName: 'Alishan green tea', priceL: 35, priceBottle: 55, isRecommended: true, isHotOption: false, hasFixSugar: true, isNew: false },
      { category: '茶香系列', name: '伯爵紅茶', englishName: 'Earl Grey tea', priceL: 35, priceBottle: 55, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '高纖綠茶', englishName: 'Fresh green tea', priceL: 35, priceBottle: 55, isRecommended: true, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '文山青茶', englishName: 'Wenshan green tea', priceL: 35, priceBottle: 55, isRecommended: true, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '烏龍青茶', englishName: 'Oolong green tea', priceL: 35, priceBottle: 55, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '鐵觀音烏龍茶', englishName: 'Tie Kuan Yin oolong tea', priceL: 35, priceBottle: 55, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '冬瓜青茶', englishName: 'White gourd green tea', priceL: 35, priceBottle: 55, isRecommended: true, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '古早味冬瓜', englishName: 'White gourd tea', priceL: 35, priceBottle: 55, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '仙草干茶', englishName: 'Herbal tea', priceL: 35, priceBottle: 55, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '洛神花茶', englishName: 'Roselle herbal tea', priceL: 40, priceBottle: 60, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '山楂烏龍', englishName: 'Hawthorn Oolong', priceL: 45, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '文山青雙Q', englishName: 'Bubble with coconut jelly Green tea', priceL: 45, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '冬瓜仙草凍', englishName: 'Herbal jelly with white gourd tea', priceL: 45, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '冬瓜愛玉/愛玉冰茶', englishName: 'White gourd tea/ice tea with Jelly fig', priceL: 50, isRecommended: true, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '珍波椰文山青', englishName: 'Mix Bubble with coconut jelly Green tea', priceL: 50, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '茶香系列', name: '紅茶三兄弟', englishName: 'Black tea three brothers', priceL: 65, isRecommended: true, isHotOption: false, hasFixSugar: false, isNew: false },
      
      // 奶香系列
      { category: '奶香系列', name: '奶茶/奶綠/烏龍奶茶', englishName: 'Black / green milk tea / Oolong milk tea', priceL: 40, priceBottle: 70, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '古早味奶茶', englishName: 'Retro milk tea', priceL: 40, priceBottle: 70, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: true },
      { category: '奶香系列', name: '芋香奶茶', englishName: 'Taro milk tea', priceL: 45, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '黑糖奶茶', englishName: 'Brown sugar milk tea', priceL: 50, priceBottle: 80, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '巧克力可可/阿華田', englishName: 'Chocolate cocoa / Ovaltine', priceL: 50, priceBottle: 80, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '焦糖奶茶', englishName: 'Caramel milk tea', priceL: 50, priceBottle: 80, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '波霸奶茶/奶綠', englishName: 'Bubble black/green milk tea', priceL: 50, priceBottle: 80, isRecommended: true, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '小珍珠奶茶/奶綠', englishName: 'Little bubble black/green milk tea', priceL: 50, priceBottle: 80, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '波霸小珍珠奶茶', englishName: 'Mix bubble black/green milk tea', priceL: 50, priceBottle: 80, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '雙Q奶茶', englishName: 'Coconut jelly milk tea with bubble', priceL: 50, priceBottle: 80, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '椰果奶茶/咖啡凍奶茶', englishName: 'Coconut jelly milk tea/Coffee jelly milk tea', priceL: 50, priceBottle: 80, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '仙草凍奶茶', englishName: 'Herbal jelly milk tea', priceL: 50, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '冰淇淋紅茶', englishName: 'Black tea with ice cream', priceL: 55, isRecommended: true, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '金牌冰咖啡', englishName: 'Ice coffee', priceL: 55, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '布丁奶茶', englishName: 'Pudding milk tea', priceL: 55, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '珍波椰奶茶', englishName: 'Mix Bubble with coconut jelly Milk tea', priceL: 55, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '波霸阿華田', englishName: 'Bubble Ovaltine', priceL: 60, isRecommended: false, isHotOption: true, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '奶茶三兄弟', englishName: 'Milk tea three brothers', priceL: 65, isRecommended: true, isHotOption: false, hasFixSugar: false, isNew: false },
      { category: '奶香系列', name: '焦糖布蕾珍奶', englishName: 'Caramel milk tea with bubble & pudding', priceL: 70, isRecommended: false, isHotOption: false, hasFixSugar: false, isNew: false },
    ];

    try {
      // Execute in sequence to ensure they add safely
      for (const item of menuData) {
        const id = crypto.randomUUID();
        const productRef = doc(db, 'products', id);
        const payload: Partial<DBProduct> = {
          ...item,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(productRef, payload);
      }
      alert('菜單匯入完成！');
    } catch (err) {
      console.error(err);
      alert('菜單匯入失敗');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-[#e2e2d8] pb-4">
        <h2 className="text-3xl font-serif text-[#424231]">菜單品項管理</h2>
        <div className="flex gap-2">
          <button 
            onClick={seedMenuData}
            disabled={isSeeding}
            className="bg-white border text-[#5A5A40] border-[#5A5A40] px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm hover:bg-[#f5f5f0] transition-colors disabled:opacity-50"
          >
            {isSeeding ? '匯入中...' : '匯入預設菜單'}
          </button>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="bg-[#5A5A40] text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition-opacity"
          >
            {showAdd ? '取消新增' : '新增飲品'}
          </button>
        </div>
      </div>

      {showAdd && <AddProductForm onClose={() => setShowAdd(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map(product => (
          <div key={product.id} className={`p-6 border rounded-[24px] shadow-sm flex flex-col justify-between transition-opacity ${product.isActive ? 'bg-white border-[#e2e2d8]' : 'bg-[#fcfcfb] opacity-60 border-transparent'}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[#5A5A40] font-bold mb-1 opacity-80">{product.category}</div>
                <h3 className="font-serif text-lg text-[#424231]">{product.name}</h3>
                <div className="text-sm text-[#424231] mt-1 opacity-60 italic">L: ${product.priceL} {product.priceBottle ? `| 瓶: $${product.priceBottle}` : ''}</div>
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => toggleActive(product.id, product.isActive)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-opacity ${
                  product.isActive ? 'bg-white border border-[#e2e2d8] text-[#424231] hover:opacity-60' : 'bg-[#5A5A40] text-white hover:opacity-90'
                }`}
              >
                {product.isActive ? '下架' : '上架'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddProductForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    category: '茶香系列',
    name: '',
    englishName: '',
    priceL: '',
    priceBottle: '',
    isHotOption: false,
    hasFixSugar: false,
    isRecommended: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const id = crypto.randomUUID();
      const productRef = doc(db, 'products', id);
      
      const payload: Partial<DBProduct> = {
        category: formData.category,
        name: formData.name,
        priceL: Number(formData.priceL),
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      if (formData.englishName) payload.englishName = formData.englishName;
      if (formData.priceBottle) payload.priceBottle = Number(formData.priceBottle);
      if (formData.isHotOption) payload.isHotOption = true;
      if (formData.hasFixSugar) payload.hasFixSugar = true;
      if (formData.isRecommended) payload.isRecommended = true;

      await setDoc(productRef, payload);
      alert('新增成功');
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
      alert('新增失敗');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#fcfcfb] p-6 border border-[#e2e2d8] rounded-[32px] space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <label className="space-y-2">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[#424231] opacity-60">分類</span>
          <select 
            value={formData.category} 
            onChange={e => setFormData({...formData, category: e.target.value})}
            className="w-full p-3 bg-white border border-[#e2e2d8] rounded-2xl focus:border-[#5A5A40] outline-none transition-colors"
            required
          >
            <option value="茶香系列">茶香系列</option>
            <option value="奶香系列">奶香系列</option>
            <option value="特調系列">特調系列</option>
            <option value="鮮果系列">鮮果系列</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[#424231] opacity-60">產品名稱</span>
          <input 
            type="text" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full p-3 bg-white border border-[#e2e2d8] rounded-2xl focus:border-[#5A5A40] outline-none transition-colors"
            required 
          />
        </label>
        <label className="space-y-2">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-[#424231] opacity-60">英文名稱 (選填)</span>
          <input 
            type="text" 
            value={formData.englishName} 
            onChange={e => setFormData({...formData, englishName: e.target.value})}
            className="w-full p-3 bg-white border border-[#e2e2d8] rounded-2xl focus:border-[#5A5A40] outline-none transition-colors"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-[#424231] opacity-60">L杯價格</span>
            <input 
              type="number" 
              value={formData.priceL} 
              onChange={e => setFormData({...formData, priceL: e.target.value})}
              className="w-full p-3 bg-white border border-[#e2e2d8] rounded-2xl focus:border-[#5A5A40] outline-none transition-colors"
              required 
            />
          </label>
          <label className="space-y-2">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-[#424231] opacity-60">瓶裝價格 (選填)</span>
            <input 
              type="number" 
              value={formData.priceBottle} 
              onChange={e => setFormData({...formData, priceBottle: e.target.value})}
              className="w-full p-3 bg-white border border-[#e2e2d8] rounded-2xl focus:border-[#5A5A40] outline-none transition-colors"
            />
          </label>
        </div>
      </div>
      <div className="flex flex-wrap gap-6 pt-4 border-t border-[#e2e2d8]">
        <label className="flex items-center gap-2 cursor-pointer text-[12px] uppercase tracking-widest font-bold text-[#424231]">
          <input type="checkbox" checked={formData.isHotOption} onChange={e => setFormData({...formData, isHotOption: e.target.checked})} className="w-4 h-4 accent-[#5A5A40]" />
          提供熱飲
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-[12px] uppercase tracking-widest font-bold text-[#424231]">
          <input type="checkbox" checked={formData.hasFixSugar} onChange={e => setFormData({...formData, hasFixSugar: e.target.checked})} className="w-4 h-4 accent-[#5A5A40]" />
          糖冰限定
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-[12px] uppercase tracking-widest font-bold text-[#424231]">
          <input type="checkbox" checked={formData.isRecommended} onChange={e => setFormData({...formData, isRecommended: e.target.checked})} className="w-4 h-4 accent-[#5A5A40]" />
          推薦標籤 ★
        </label>
      </div>
      <div className="flex justify-end gap-3 pt-6 border-t border-[#e2e2d8]">
        <button type="button" onClick={onClose} className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#424231] opacity-60 hover:opacity-100 transition-opacity">取消</button>
        <button type="submit" className="px-6 py-2.5 bg-[#424231] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow hover:opacity-90 transition-opacity">儲存產品</button>
      </div>
    </form>
  );
}
