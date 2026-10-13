import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [tableNumber, setTableNumber] = useState(null);
  const [items, setItems] = useState([]);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart for table
  useEffect(() => {
    if (tableNumber) {
      const savedCart = localStorage.getItem(`smartserve_cart_${tableNumber}`);
      if (savedCart) {
        try {
          const parsed = JSON.parse(savedCart);
          setItems(parsed.items || []);
          setCustomerNotes(parsed.notes || '');
        } catch (e) {
          console.error('Failed to parse saved cart');
        }
      } else {
        setItems([]);
        setCustomerNotes('');
      }
    }
  }, [tableNumber]);

  // Persist cart
  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem(
        `smartserve_cart_${tableNumber}`,
        JSON.stringify({ items, notes: customerNotes })
      );
    }
  }, [items, customerNotes, tableNumber]);

  const addItem = (item) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i._id === item._id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += 1;
        return updated;
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
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item._id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
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
