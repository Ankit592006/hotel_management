const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('smartserve_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/api/auth/me'),

  // Menu
  getMenuItems: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/menu${query ? `?${query}` : ''}`);
  },
  getCategories: () => request('/api/menu/categories'),
  getMenuItem: (id) => request(`/api/menu/${id}`),
  createMenuItem: (itemData) => request('/api/menu', { method: 'POST', body: JSON.stringify(itemData) }),
  updateMenuItem: (id, itemData) => request(`/api/menu/${id}`, { method: 'PUT', body: JSON.stringify(itemData) }),
  toggleItemAvailability: (id) => request(`/api/menu/${id}/availability`, { method: 'PATCH' }),
  deleteMenuItem: (id) => request(`/api/menu/${id}`, { method: 'DELETE' }),

  // Tables
  getTables: () => request('/api/tables'),
  getTable: (tableNumber) => request(`/api/tables/${tableNumber}`),
  createTable: (tableData) => request('/api/tables', { method: 'POST', body: JSON.stringify(tableData) }),
  updateTableStatus: (tableNumber, status) => request(`/api/tables/${tableNumber}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  regenerateTableQR: (tableNumber, customBaseUrl) => request(`/api/tables/${tableNumber}/regenerate-qr`, {
    method: 'POST',
    body: JSON.stringify({ customBaseUrl })
  }),
  deleteTable: (tableNumber) => request(`/api/tables/${tableNumber}`, { method: 'DELETE' }),

  // Orders
  createOrder: (orderData) => request('/api/orders', { method: 'POST', body: JSON.stringify(orderData) }),
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/orders${query ? `?${query}` : ''}`);
  },
  getOrder: (id) => request(`/api/orders/${id}`),
  updateOrderStatus: (id, status) => request(`/api/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),
  updatePaymentStatus: (id, paymentStatus) => request(`/api/orders/${id}/payment-status`, {
    method: 'PATCH',
    body: JSON.stringify({ paymentStatus })
  }),

  // Payments (Razorpay)
  createPaymentOrder: (orderId) => request('/api/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ orderId })
  }),
  verifyPayment: (paymentDetails) => request('/api/payments/verify', {
    method: 'POST',
    body: JSON.stringify(paymentDetails)
  }),

  // Analytics
  getAnalytics: () => request('/api/analytics')
};
