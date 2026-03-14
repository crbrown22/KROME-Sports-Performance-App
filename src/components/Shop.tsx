import { safeStorage } from '../utils/storage';
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ShopProps {
  onBack: () => void;
  userId: string;
  onRedirectToLogin: () => void;
  key?: string;
  initialCategory?: 'all' | 'programs' | 'apparel';
}

const Shop = (props: ShopProps) => {
  const { onBack, userId, onRedirectToLogin, initialCategory = 'all' } = props;
  const [category, setCategory] = useState(initialCategory);

  const programs = [
    { title: '52 Week Online Training Program', price: '$6000.00', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop' },
    { title: '16 Week Online Training Program', price: '$3000.00', img: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop' },
    { title: '8 Week Online Training Program', price: '$1500.00', img: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=800&auto=format&fit=crop' },
  ];

  const personalTraining = [
    { title: '12 Sessions (In Person or Zoom)', price: '$800.00', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop' },
    { title: '8 Sessions (In Person or Zoom)', price: '$600.00', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=800&auto=format&fit=crop' },
    { title: '4 Sessions (In Person or Zoom)', price: '$300.00', img: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=800&auto=format&fit=crop' },
  ];

  const mobility = [
    { title: '52 Week Flexibility & Mobility Online Program', price: '$299.00', img: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=800&auto=format&fit=crop' },
    { title: '16 Week Flexibility & Mobility Online Program', price: '$2500.00', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop' },
    { title: '8 Week Flexibility & Mobility Online Program', price: '$1500.00', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop' },
  ];

  const nutrition = [
    { title: '52 Week Nutrition Plan', price: '$6000.00', img: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop' },
    { title: '16 Week Nutrition Plan', price: '$2500.00', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop' },
    { title: '8 Week Nutrition Plan', price: '$1200.00', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop' },
  ];

  const products = [
    { title: 'KROME Fitness T-shirt', price: '$25.00', img: 'media/16week.jpg' },
    { title: 'KROME Water Bottle', price: '$15.00', img: 'media/16week.jpg' },
    { title: 'KROME Hoodie', price: '$40.00', img: 'media/16week.jpg' },
    { title: 'KROME Hat', price: '$20.00', img: 'media/16week.jpg' },
    { title: 'Resistance Bands', price: '$10.00', img: 'media/16week.jpg' },
    { title: 'Gym Bag', price: '$30.00', img: 'media/16week.jpg' },
  ];

  const handlePurchaseClick = async (item: any) => {
    if (!userId) {
      onRedirectToLogin();
      return;
    }

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          itemName: item.title,
          price: item.price ? parseFloat(item.price.replace('$', '')) : 0,
        })
      });
      
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        console.error('Failed to create checkout session:', data);
        alert(`Checkout failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(`Checkout error: ${err.message}`);
    }
  };

  const ShopSection = ({ title, items }: { title: string, items: any[] }) => (
    <div className="mb-20">
      <h2 className="text-2xl font-light tracking-widest uppercase text-zinc-400 mb-12 text-center">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {items.map((item, idx) => (
          <div key={idx} className="bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex flex-col hover:border-zinc-600 transition-colors krome-outline">
            <img src={item.img} alt={item.title} className="w-full h-56 object-cover opacity-90" referrerPolicy="no-referrer" />
            <div className="p-8 flex flex-col flex-1">
              <h5 className="text-lg font-medium text-zinc-100 mb-3 flex-1">{item.title}</h5>
              <p className="text-zinc-400 font-light text-sm mb-6">{item.price}</p>
              <button onClick={() => handlePurchaseClick(item)} className="border border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white px-6 py-2 text-sm uppercase tracking-wider transition-all w-full">Select</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-24 bg-black text-white relative"
    >
      <div className="absolute inset-0 z-0 opacity-40">
        <img 
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop" 
          className="w-full h-full object-cover"
          alt="Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <button onClick={onBack} className="text-zinc-400 mb-12 hover:text-zinc-100 transition-colors tracking-widest uppercase text-xs">← Back</button>
        <h1 className="text-4xl font-light uppercase tracking-widest text-zinc-100 text-center mb-20">KROME <span className="text-accent">Shop</span></h1>
        
        {(category === 'all' || category === 'programs') && (
          <>
            <ShopSection title="Online Training Programs" items={programs} />
            <ShopSection title="Personal Training Sessions" items={personalTraining} />
            <ShopSection title="Flexibility & Mobility Programs" items={mobility} />
            <ShopSection title="Nutrition Programs" items={nutrition} />
          </>
        )}
        
        {(category === 'all' || category === 'apparel') && (
          <div className="text-center mt-24">
            <h2 className="text-2xl font-light tracking-widest uppercase text-zinc-300 mb-12">KROME Fitness Products & Apparel</h2>
            <h3 className="text-sm text-accent font-medium mb-12 tracking-widest uppercase">Coming Soon</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {products.map((product, idx) => (
                <div key={idx} className="bg-zinc-950/80 backdrop-blur-sm rounded-lg overflow-hidden border border-zinc-800 p-8">
                  <img src={product.img} alt={product.title} className="w-full h-56 object-cover mb-6 opacity-80" referrerPolicy="no-referrer" />
                  <h5 className="text-lg font-medium text-zinc-100 mb-2">{product.title}</h5>
                  <p className="text-zinc-500 font-light text-sm mb-6">{product.price}</p>
                  <button className="border border-zinc-800 text-zinc-600 px-6 py-2 text-sm uppercase tracking-wider w-full" disabled>Coming Soon</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Shop;
