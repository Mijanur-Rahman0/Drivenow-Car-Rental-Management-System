# DriveNow — Frontend (React + Tailwind CSS + JavaScript)

Backend (`../backend`, Django REST API) এর React frontend।
Stack: React 18 · React Router 6 · Tailwind CSS 3 · Vite · plain JavaScript (JSX) — কোনো extra library নেই।

## Run
1. Backend চালু করুন (`../backend` এ): python manage.py runserver  →  http://127.0.0.1:8000
2. এই folder এ:
   ```bash
   npm install
   npm run dev          # http://localhost:5173
   ```
3. Backend অন্য address এ থাকলে `.env` ফাইলে VITE_API_BASE বদলান (.env.example দেখুন)।

Production build: `npm run build` → dist/ (SPA, তাই hosting এ সব route index.html এ fallback করাতে হবে)।

## Folder structure
```
src/
  main.jsx, App.jsx           routes
  index.css                   Tailwind + .btn / .input / .card helper classes
  api/client.js               fetch wrapper (token, error, 401 handling)
  api/index.js                প্রতিটা backend endpoint একটা function
  context/AuthContext.jsx     login state (token + user, localStorage এ)
  context/ToastContext.jsx    সব popup message
  utils/                      format helpers, useAsync hook
  components/                 Navbar, Footer, Layout, CarCard, Badge, ProtectedRoute, AdminRoute ...
  pages/                      Home, Login, Register, Dashboard, Booking, Payment
  pages/admin/                AdminLogin, AdminLayout, Dashboard, Cars, Bookings, Users, Payments, Routes
tailwind.config.js            আগের রং (dark/sage/warm/cream) + font (Playfair Display, DM Sans)
```

## Routes
/  /login  /register  /dashboard  /booking/:carId  /payment/:bookingId
Admin: /admin/login  /admin  /admin/cars  /admin/bookings  /admin/users  /admin/payments  /admin/routes
