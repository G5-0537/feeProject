import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext(null);

const STORAGE_KEY = 'queless_service_cart_v1';

/**
 * Service Cart / Booking Basket Context
 * Fulfills syllabus requirement: "Mini project: shopping cart or dashboard".
 * Demonstrates:
 * - Global Cart State via Context API
 * - LocalStorage persistence for cart items
 * - Subtotal, total item count, and duration calculations
 * - Cart drawer visibility state
 */
export function CartProvider({ children }) {
  const toast = useToast();
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  const persist = (newItems) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn('Failed to persist cart:', e);
    }
  };

  const addToCart = useCallback((service, business) => {
    if (!service || !service.service_id) return;
    
    setItems((prev) => {
      // Check if service already in cart
      const exists = prev.some((item) => item.service_id === service.service_id);
      if (exists) {
        toast.info(`"${service.name}" is already in your booking basket.`);
        return prev;
      }

      // Check if from different business
      if (prev.length > 0 && prev[0].business_id !== business?.business_id) {
        toast.warning('Your basket had services from another branch. Starting fresh.');
        const updated = [{
          service_id: service.service_id,
          name: service.name,
          duration: service.duration || 15,
          price: service.price || 0,
          business_id: business?.business_id,
          business_name: business?.name || 'Clinic'
        }];
        persist(updated);
        return updated;
      }

      const updated = [
        ...prev,
        {
          service_id: service.service_id,
          name: service.name,
          duration: service.duration || 15,
          price: service.price || 0,
          business_id: business?.business_id,
          business_name: business?.name || 'Clinic'
        }
      ];
      persist(updated);
      toast.success(`Added "${service.name}" to Booking Basket!`);
      return updated;
    });
  }, [toast]);

  const removeFromCart = useCallback((serviceId) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.service_id !== serviceId);
      persist(updated);
      toast.info('Item removed from basket.');
      return updated;
    });
  }, [toast]);

  const clearCart = useCallback(() => {
    persist([]);
  }, []);

  const totalDuration = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.duration) || 0), 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  }, [items]);

  const value = useMemo(() => ({
    items,
    addToCart,
    removeFromCart,
    clearCart,
    totalDuration,
    totalPrice,
    count: items.length,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    toggleCart: () => setIsOpen((prev) => !prev)
  }), [items, addToCart, removeFromCart, clearCart, totalDuration, totalPrice, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
