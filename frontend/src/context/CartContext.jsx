import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [tableNumber, setTableNumber] = useState(null);
  const [items, setItems] = useState([]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Track which table has finished hydrating from localStorage to avoid wiping saved cart
  const hydratedTableRef = useRef(null);

  // Load saved cart whenever tableNumber changes
  useEffect(() => {
    if (!tableNumber) return;

    hydratedTableRef.current = null;
    const savedCart = localStorage.getItem(`smartserve_cart_${tableNumber}`);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setItems(Array.isArray(parsed.items) ? parsed.items : []);
        setCustomerNotes(typeof parsed.notes === 'string' ? parsed.notes : '');
      } catch (e) {
        console.error('Failed to parse saved cart');
        setItems([]);
        setCustomerNotes('');
      }
    } else {
      setItems([]);
      setCustomerNotes('');
    }
    hydratedTableRef.current = tableNumber;
  }, [tableNumber]);

  // Persist cart only after the current table's saved cart has hydrated
  useEffect(() => {
    if (!tableNumber || hydratedTableRef.current !== tableNumber) return;

    localStorage.setItem(
      `smartserve_cart_${tableNumber}`,
      JSON.stringify({ items, notes: customerNotes })
    );
  }, [items, customerNotes, tableNumber]);

  const addItem = (item) => {
    setItems((prevItems) => {
      const exists = prevItems.some((i) => i._id === item._id);
      if (exists) {
        return prevItems.map((i) =>
          i._id === item._id
            ? { ...i, quantity: Math.min(50, i.quantity + 1) }
            : i
        );
      }
      return [
        ...prevItems,
        {
          _id: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          isVeg: item.isVeg,
          imageUrl: item.imageUrl,
          specialInstructions: ''
        }
      ];
    });
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((i) => i._id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item._id === itemId) {
            const newQty = Math.min(50, item.quantity + delta);
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const updateInstructions = (itemId, instructions) => {
    setItems((prev) =>
      prev.map((item) =>
        item._id === itemId ? { ...item, specialInstructions: instructions } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setCustomerNotes('');
    if (tableNumber) {
      localStorage.removeItem(`smartserve_cart_${tableNumber}`);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.05); // 5% GST
  const totalAmount = subtotal + taxAmount;

  return (
    <CartContext.Provider
      value={{
        tableNumber,
        setTableNumber,
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateInstructions,
        customerNotes,
        setCustomerNotes,
        clearCart,
        itemCount,
        subtotal,
        taxAmount,
        totalAmount,
        isCartOpen,
        setIsCartOpen
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
