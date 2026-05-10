import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DBProduct } from '../types';
import { useCartStore, SugarLevel, IceLevel, SizeOptions } from '../store/useCartStore';

export default function MenuPage() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<DBProduct | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'products'), where('isActive', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DBProduct));
      setProducts(prodList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const categories = Array.from(new Set(products.map(p => p.category)));

  if (loading) return <div className="p-8 text-center text-neutral-500">載入菜單中...</div>;

  return (
    <div className="space-y-8">
      {categories.length === 0 ? (
        <div className="text-center p-12 text-[#424231] opacity-60 bg-white rounded-[32px] shadow-sm border border-[#e2e2d8]">
          目前沒有可選的飲品
        </div>
      ) : (
        categories.map(category => (
          <div key={category} className="space-y-4">
            <h2 className="text-3xl font-serif text-[#424231] border-b border-[#e2e2d8] pb-2 flex items-center gap-2">
              <span className="bg-[#5A5A40] w-2 h-6 rounded-full inline-block"></span>
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.filter(p => p.category === category).map(product => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-[32px] p-6 shadow-sm border border-transparent hover:border-[#5A5A40] cursor-pointer transition-all flex flex-col justify-between group"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-serif">{product.name}</h3>
                      {product.isRecommended && <span className="text-[#5A5A40] text-sm">★</span>}
                      {product.isNew && <span className="bg-[#5A5A40] text-white text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-widest">New</span>}
                      {product.hasFixSugar && <span className="text-[10px] text-orange-800 border border-orange-200 px-1 rounded-sm bg-orange-100 uppercase tracking-widest">Fixed</span>}
                      {product.isHotOption && <span className="text-[10px] text-orange-800 border border-orange-200 px-1 rounded-sm bg-orange-100 uppercase tracking-widest">Hot</span>}
                    </div>
                    {product.englishName && <p className="text-xs opacity-60 italic">{product.englishName}</p>}
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="flex flex-col items-start text-sm">
                      <span className="font-serif text-lg text-[#5A5A40]">L ${product.priceL}{product.priceBottle && ` / 瓶 ${product.priceBottle}`}</span>
                    </div>
                    <button className="px-4 py-2 bg-[#5A5A40] text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      Add to Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}

function ProductModal({ product, onClose }: { product: DBProduct, onClose: () => void }) {
  const [size, setSize] = useState<SizeOptions>('L');
  const [sugar, setSugar] = useState<SugarLevel>(product.hasFixSugar ? '固定甜度' : '常規');
  const [ice, setIce] = useState<IceLevel>(product.hasFixSugar ? '常規' : '常規');
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(s => s.addItem);

  const price = size === 'L' ? product.priceL : (product.priceBottle || product.priceL);

  const handleAdd = () => {
    addItem({
      id: crypto.randomUUID(),
      productId: product.id,
      name: product.name,
      size,
      sugar,
      ice,
      price,
      quantity,
      toppings: [] // Can add toppings options if needed
    });
    onClose();
  };

  const sugarOptions: SugarLevel[] = ['常規', '少糖', '半糖', '微糖', '無糖'];
  const iceOptions: IceLevel[] = ['常規', '少冰', '微冰', '去冰', '完全去冰', '熱飲'];

  return (
    <div className="fixed inset-0 bg-[#424231]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#fcfcfb] rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-[#e2e2d8]">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-3xl font-serif text-[#424231]">{product.name}</h3>
              {product.englishName && <p className="text-[#424231] opacity-60 text-sm mt-1 italic">{product.englishName}</p>}
            </div>
            <button onClick={onClose} className="text-[#424231] opacity-40 hover:opacity-100 text-3xl leading-none">&times;</button>
          </div>

          <div className="space-y-6">
            {/* Size Selection */}
            {product.priceBottle && (
              <div className="space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#424231] opacity-60">容量</label>
                <div className="flex gap-2">
                  <OptionBtn selected={size === 'L'} onClick={() => setSize('L')}>L杯</OptionBtn>
                  <OptionBtn selected={size === 'Bottle'} onClick={() => setSize('Bottle')}>瓶裝 (+${product.priceBottle - product.priceL})</OptionBtn>
                </div>
              </div>
            )}

            {/* Sugar Selection */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#424231] opacity-60">
                甜度 {product.hasFixSugar && <span className="text-orange-800 normal-case font-normal ml-1">(糖冰限定)</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {product.hasFixSugar ? (
                  <OptionBtn selected={true} onClick={() => {}}>固定甜度</OptionBtn>
                ) : (
                  sugarOptions.map(s => <OptionBtn key={s} selected={sugar === s} onClick={() => setSugar(s)}>{s}</OptionBtn>)
                )}
              </div>
            </div>

            {/* Ice Selection */}
            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#424231] opacity-60">
                冰塊 {product.hasFixSugar && <span className="text-orange-800 normal-case font-normal ml-1">(糖冰限定)</span>}
              </label>
              <div className="flex flex-wrap gap-2">
                {product.hasFixSugar ? (
                 <OptionBtn selected={true} onClick={() => {}}>固定冰塊</OptionBtn>
                ) : (
                  iceOptions.map(i => {
                    if (i === '熱飲' && !product.isHotOption) return null;
                    return <OptionBtn key={i} selected={ice === i} onClick={() => setIce(i)}>{i}</OptionBtn>;
                  })
                )}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-3 pt-2 border-t border-[#e2e2d8]">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#424231] opacity-60 mt-4">數量</label>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-white border border-[#e2e2d8] flex items-center justify-center font-bold font-serif text-[#424231] hover:bg-[#f5f5f0]">-</button>
                <span className="w-8 text-center text-lg font-serif text-[#424231]">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-full bg-white border border-[#e2e2d8] flex items-center justify-center font-bold font-serif text-[#424231] hover:bg-[#f5f5f0]">+</button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-[#e2e2d8] flex items-center justify-between">
          <span className="text-2xl font-serif font-bold text-[#5A5A40]">
            ${price * quantity}
          </span>
          <button 
            onClick={handleAdd}
            className="px-8 py-3 bg-[#5A5A40] text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md hover:opacity-90 transition-opacity active:scale-95"
          >
            Add to order
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionBtn({ selected, onClick, children }: { selected: boolean, onClick: () => void, children: React.ReactNode, key?: React.Key }) {
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-bold transition-colors border ${
        selected 
          ? 'bg-[#5A5A40] border-[#5A5A40] text-white' 
          : 'bg-white border-[#e2e2d8] text-[#424231] hover:border-[#5A5A40]'
      }`}
    >
      {children}
    </button>
  );
}
