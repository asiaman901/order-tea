import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { DBOrder } from '../types';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<DBOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let myOrderIds: string[] = [];
    try {
      myOrderIds = JSON.parse(localStorage.getItem('tea_my_orders') || '[]');
    } catch {
      // ignore
    }

    if (myOrderIds.length === 0) {
      setLoading(false);
      return;
    }

    const unsubscribes: any[] = [];
    let loadedCount = 0;
    const currentOrders: Record<string, DBOrder> = {};

    myOrderIds.forEach(id => {
      const unsub = onSnapshot(doc(db, 'orders', id), (docSnap) => {
        if (docSnap.exists()) {
          currentOrders[id] = { id: docSnap.id, ...docSnap.data() } as DBOrder;
        }
        
        const orderList = Object.values(currentOrders);
        orderList.sort((a,b) => {
          const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : (a.createdAt as any).toMillis();
          const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : (b.createdAt as any).toMillis();
          return dateB - dateA;
        });
        setOrders([...orderList]);
        
        loadedCount++;
        if (loadedCount >= myOrderIds.length) {
          setLoading(false);
        }
      }, () => {
        loadedCount++;
        if (loadedCount >= myOrderIds.length) {
          setLoading(false);
        }
      });
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach(u => u());
  }, []);


  if (loading) return <div className="p-8 text-center text-[#424231] opacity-60">載入訂單中...</div>;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      <h1 className="text-3xl font-serif text-[#424231] border-b border-[#e2e2d8] pb-2">我的訂單</h1>
      
      {orders.length === 0 ? (
        <div className="text-center p-12 text-[#424231] opacity-60 bg-white rounded-[32px] shadow-sm border border-[#e2e2d8]">
          您還沒有任何訂單記錄
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-[32px] shadow-sm border border-[#e2e2d8] overflow-hidden">
              <div className="bg-[#fcfcfb] px-6 py-4 border-b border-[#e2e2d8] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-sm font-medium text-[#424231]">
                  訂單編號: <span className="font-mono">{order.id.slice(0,8)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest font-bold ${getStatusStyles(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                  <span className="font-serif font-bold text-lg text-[#5A5A40]">${order.totalPrice}</span>
                </div>
              </div>
              <div className="p-6 bg-white">
                <ul className="space-y-4">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm border-b border-[#e2e2d8] pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded bg-[#f5f5f0] flex items-center justify-center font-bold text-[#424231]">
                          {item.quantity}
                        </span>
                        <div>
                          <p className="font-serif font-bold text-[#424231]">{item.name}</p>
                          <p className="text-[#424231] opacity-60 text-xs italic mt-0.5">
                            ({item.size}) {item.sugar} • {item.ice}
                          </p>
                        </div>
                      </div>
                      <span className="text-[#5A5A40] font-serif font-bold">${item.price * item.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStatusText(status: string) {
  switch(status) {
    case 'pending': return '待處理';
    case 'processing': return '製作中';
    case 'completed': return '已完成';
    case 'cancelled': return '已取消';
    default: return status;
  }
}

function getStatusStyles(status: string) {
  switch(status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'processing': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800 opacity-60';
    default: return 'bg-[#f5f5f0] text-[#424231]';
  }
}
