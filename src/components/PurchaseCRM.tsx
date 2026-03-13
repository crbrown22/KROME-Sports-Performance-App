import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShoppingBag } from 'lucide-react';

export default function PurchaseCRM() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch('/api/purchases');
        if (response.ok) {
          const data = await response.json();
          setPurchases(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch purchases", err);
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-6">
      <h2 className="text-2xl font-black uppercase italic text-gold mb-6 flex items-center gap-2">
        <ShoppingBag className="w-6 h-6" /> Purchase CRM
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-white">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4">User ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Username</th>
              <th className="p-4">Email</th>
              <th className="p-4">Item</th>
              <th className="p-4">Price</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b border-white/5">
                <td className="p-4">{p.userId}</td>
                <td className="p-4">{p.name || 'N/A'}</td>
                <td className="p-4">{p.username || 'N/A'}</td>
                <td className="p-4">{p.email || 'N/A'}</td>
                <td className="p-4">{p.itemName}</td>
                <td className="p-4">${p.price.toFixed(2)}</td>
                <td className="p-4">{new Date(p.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
