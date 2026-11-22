import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '../components/Toast.jsx';

const CartContext = createContext(null);

function load() {
  try { return JSON.parse(localStorage.getItem('ah_cart')) || []; } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    localStorage.setItem('ah_cart', JSON.stringify(items));
  }, [items]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === product.id);
      if (found) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: Math.min(i.quantity + qty, product.stock) } : i));
      }
      const { id, name, price, unit, emoji, image, stock, farm_name } = product;
      return [...prev, { id, name, price: Number(price), unit, emoji, image, stock, farm_name, quantity: Math.min(qty, stock) }];
    });
    toast(`${product.emoji || '🧺'} ${product.name} added to your basket`);
  };

  const setQty = (id, quantity) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) } : i)));
  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
