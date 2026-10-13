# 🍽️ SmartServe – QR-Based Restaurant Ordering & Management System

SmartServe is a production-ready, full-stack MERN application that transforms the dining experience. Customers scan a table-specific QR code to browse an interactive digital menu, customize orders with special instructions, place orders with server-side price snapshots, and pay online through **Razorpay** or at the counter. Restaurant staff monitor incoming orders in real time via **Socket.IO** with audio alerts, manage menus, print QR table stands, and track sales analytics.

---

## 🌟 Key Features

### 📱 Customer Mobile Experience
- **Instant Table Detection:** Direct URL route `/table/:tableNumber` with automatic table session binding.
- **Interactive Gourmet Menu:** Fast search, category filters (*Starters, Mains, Chef's Specials, Beverages, Desserts*), and strict vegetarian/non-vegetarian dietary badges.
- **Cart & Special Instructions:** Add/remove items with quantity steppers, per-dish cooking instructions (e.g., *"less spicy"*, *"no onions"*), and general chef requests.
- **Secure Server-Calculated Pricing:** Client prices are snapshots verified directly against the database to prevent cart tampering, plus automatic 5% GST computation.
- **Razorpay Online Payments & Counter Pay:** Full integration with Razorpay Checkout (UPI, Cards, NetBanking, Wallets) or Pay-at-Counter after dining.
- **Real-Time Order Tracking:** Visual live timeline stepper (*Order Received ➔ Accepted ➔ Cooking ➔ Ready to Serve ➔ Served*) updating instantaneously via WebSockets without page reload.
- **On-Table Online Payment:** Unpaid counter orders can be paid online at any time right from the tracking screen.

### 👨‍🍳 Kitchen & Restaurant Admin Dashboard
- **Live Kitchen Display:** Audio chime alerts and visual flash banners when new orders arrive.
- **1-Click Status Progression:** Quickly advance orders through preparation stages (*Accept ➔ Start Cooking ➔ Mark Ready ➔ Mark Served*).
- **Counter Payment Reconciliation:** Easily mark cash/card counter payments as "Paid".
- **Digital Menu CRUD:** Add dishes, edit prices, descriptions, images, and toggle immediate stock availability (*In Stock* vs *Sold Out*).
- **Table & QR Code Center:** View dining tables and capacities, download high-res QR code PNGs, and print formatted tabletop tent card stands.
- **Sales Analytics:** Real-time revenue insights (*Today's Sales, Cumulative Revenue, Average Order Value*), top-selling dishes breakdown, and payment method distribution.
- **Order History Archive:** Searchable database of past receipts with table and date filters.

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** React 18, Vite, Socket.IO Client, Lucide Icons, Canvas Confetti, HTML5 QR Canvas.
- **Backend:** Node.js, Express.js, MongoDB Atlas (Mongoose ODM), Socket.IO Server, Razorpay SDK, JWT, Bcrypt.js, CORS, Morgan.
- **Payments:** Razorpay Orders API, standard checkout popup, cryptographic HMAC-SHA256 signature verification, and verified webhook handler.
- **Deployment Ready:** Vercel (Frontend with SPA rewrite), Render (Backend with `/api/health` monitoring), MongoDB Atlas (Database).

```
piyush doc/
├── backend/
│   ├── src/
│   │   ├── config/          # db.js (MongoDB Atlas), razorpay.js
│   │   ├── controllers/     # auth, menu, table, order, payment, analytics
│   │   ├── middleware/      # auth.js (JWT), errorHandler.js
│   │   ├── models/          # User, Table, MenuItem, Order, Payment
│   │   ├── routes/          # Express REST API routes
│   │   ├── sockets/         # socketHandler.js (bi-directional rooms)
│   │   ├── utils/           # seedData.js (tables, dishes, demo accounts)
│   │   └── server.js        # Server entry with Socket.IO & health-check
│   ├── .env.example         # Environment template
│   ├── render.yaml          # Render deployment blueprint
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client with token interceptor
│   │   ├── components/      # CustomerHeader, CartDrawer, etc.
│   │   ├── context/         # AuthContext, CartContext, SocketContext
│   │   ├── pages/
│   │   │   ├── customer/    # TableMenuPage, OrderTrackingPage
│   │   │   └── admin/       # LiveOrders, MenuManager, TablesManager, Analytics, History
│   │   ├── styles/          # index.css (rich design system, glassmorphism)
│   │   └── App.jsx          # Route dispatcher
│   ├── vercel.json          # Vercel SPA rewrite configuration
│   └── package.json
└── package.json             # Root runner scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ and npm installed
- MongoDB Atlas account (free cluster)

---

### Step 1: MongoDB Atlas Setup
1. Log in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free M0 cluster (e.g., `Cluster0`).
3. Under **Database Access**, create a user (e.g., `smartadmin` with a secure password).
4. Under **Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere) so Render and your local machine can connect.
5. Click **Connect** ➔ **Drivers** ➔ Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smartserve?retryWrites=true&w=majority
   ```

---

### Step 2: Configure Backend Environment
Create/edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/smartserve?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_2026
FRONTEND_URL=http://localhost:5173

# Razorpay Test Credentials (from https://dashboard.razorpay.com/)
# Leave blank to run in safe simulated test mode!
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxx
```

---

### Step 3: Seed Database
Populate the restaurant with 8 dining tables (with QR codes), 14 gourmet dishes across 5 categories, sample admin credentials, and demo active orders:

```bash
cd backend
npm run seed
```

Default credentials created:
- **Admin Manager:** `admin@smartserve.com` / `admin123456`
- **Kitchen Staff:** `staff@smartserve.com` / `staff123456`

---

### Step 4: Run Application Locally

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
# Server will start on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# Frontend will start on http://localhost:5173
```

---

## 🧪 Testing the Complete Flow

1. **Launch SmartServe Home:** Open `http://localhost:5173` in your browser.
2. **Customer Flow (QR Simulation):**
   - Click **"Simulate Customer QR Scan"** or visit `http://localhost:5173/table/1`.
   - Filter by categories (*Mains, Starters*) or toggle the **Veg** filter.
   - Click **ADD** on any dish, adjust quantities, and click the floating bottom cart bar.
   - Add special requests (e.g., *"less spicy"*).
   - Select **Razorpay** or **Pay at Counter** and click **Place Order**.
   - Watch the order transition immediately to the live tracking page (`/order/<id>`).
3. **Admin Flow (Live Synchronization):**
   - In a second browser window/tab, visit `http://localhost:5173/admin`.
   - Log in using the 1-click demo button (**Admin Demo**).
   - Notice the audible chime ring and the new order pop up in real-time under **Live Orders**.
   - Click **Accept Order** ➔ **Start Cooking** ➔ **Mark Ready** ➔ **Mark Served**.
   - Watch the customer's tracking screen update simultaneously without any page refresh!
4. **Table QR Codes & Printing:**
   - In Admin, navigate to **Tables & QR Codes**.
   - Click **Download** to save high-resolution QR PNGs.
   - Click **Print Stand** to view and print tabletop tent cards with table numbering.

---

## 💳 Razorpay Payments & Webhooks

### Online Checkout Verification
When a customer pays via Razorpay, the order is finalized through strict cryptographic signature verification on the server:
$$\text{Expected Signature} = \text{HMAC-SHA256}(\text{razorpay\_order\_id} + "|" + \text{razorpay\_payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
The backend only marks the order as `Paid` when the generated hash matches the client's `razorpay_signature`.

### Webhook Endpoint (`POST /api/payments/webhook`)
Configured to handle asynchronous payment captures and dropped user sessions:
- Verifies `x-razorpay-signature` header against raw body.
- Listens for `payment.captured` and `order.paid` events.
- Emits real-time WebSocket events `payment_success` and updates order database records.
- Prevents duplicate processing if an order is already marked `Paid`.

---

## 🌐 Production Deployment

### 1. Deploying Backend on Render
1. Create a new **Web Service** connected to your repository.
2. Set Root Directory to `backend`.
3. Set Build Command to `npm install`.
4. Set Start Command to `node src/server.js`.
5. Under **Health Check Path**, enter `/api/health`.
6. Add environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas URI.
   - `JWT_SECRET`: Random 32+ character string.
   - `FRONTEND_URL`: URL of your deployed frontend (e.g., `https://smartserve.vercel.app`).
   - `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`.

### 2. Deploying Frontend on Vercel
1. Import repository on [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Build Command: `vite build` (Output Directory: `dist`).
4. Add environment variables:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://smartserve-api.onrender.com`).
   - `VITE_SOCKET_URL`: Your Render backend URL.
5. Vercel automatically honors `frontend/vercel.json` for client-side routing rewrites.

---

## 📋 REST API Reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | System health & MongoDB connection status |
| `POST` | `/api/auth/login` | Public | Admin/Staff login & JWT token generation |
| `GET` | `/api/auth/me` | Protected | Current user profile |
| `GET` | `/api/menu` | Public | List menu items (filters: category, search, veg) |
| `POST` | `/api/menu` | Admin | Create new menu item |
| `PUT` | `/api/menu/:id` | Admin | Update dish details |
| `PATCH` | `/api/menu/:id/availability` | Staff/Admin | Toggle instant stock availability |
| `DELETE` | `/api/menu/:id` | Admin | Delete dish |
| `GET` | `/api/tables` | Public | List all dining tables with QR data |
| `GET` | `/api/tables/:tableNumber` | Public | Fetch table details & auto-generate QR |
| `POST` | `/api/tables` | Admin | Create table with QR code |
| `PATCH` | `/api/tables/:tableNumber/status` | Staff/Admin | Update table occupancy status |
| `POST` | `/api/orders` | Public | Create order with server-side price calculation |
| `GET` | `/api/orders` | Staff/Admin | Get all orders with status/date filters |
| `GET` | `/api/orders/:id` | Public | Get single order status for customer tracking |
| `PATCH` | `/api/orders/:id/status` | Staff/Admin | Update workflow status (*Pending ➔ Served*) |
| `PATCH` | `/api/orders/:id/payment-status`| Staff/Admin | Mark payment status (e.g. Counter Cash) |
| `POST` | `/api/payments/create-order` | Public | Generate Razorpay order |
| `POST` | `/api/payments/verify` | Public | Cryptographic HMAC signature verification |
| `POST` | `/api/payments/webhook` | Public | Asynchronous Razorpay webhook receiver |
| `GET` | `/api/analytics` | Admin | Sales revenue, popular dishes, metrics |

---

## 📜 License
MIT License. Built with ❤️ for modern dining establishments.
