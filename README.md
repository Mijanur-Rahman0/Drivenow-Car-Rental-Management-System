# 🚗 DriveNow — Car Rental Management System

DriveNow is a full-stack, enterprise-grade Car Rental Management System developed for Bangladesh's inter-district and intra-city transportation ecosystem. The platform seamlessly handles vehicle discovery, customer reservations, route management, simulated payment gateways, and comprehensive administrative oversight.

---

## 📑 Table of Contents
- [✨ Key Features](#-key-features)
  - [Customer Portal](#customer-portal)
  - [Administrative Dashboard](#administrative-dashboard)
- [🛠️ Tech Stack & Architecture](#️-tech-stack--architecture)
- [📂 Project Directory Structure](#-project-directory-structure)
- [⚙️ Getting Started & Installation](#️-getting-started--installation)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup (Django REST Framework)](#1-backend-setup-django-rest-framework)
  - [2. Database Seeding](#2-database-seeding)
  - [3. Frontend Setup (React + Vite)](#3-frontend-setup-react--vite)
- [🚀 Default Credentials](#-default-credentials)
- [🔗 API Endpoints Overview](#-api-endpoints-overview)
- [👥 Development Team](#-development-team)
- [📄 License](#-license)

---

## ✨ Key Features

### 👤 Customer Portal
- **Fleet Discovery:** Browse real-time fleet inventory with interactive filtering, responsive car cards, specs, and pricing per day.
- **Route Selection & Custom Routes:** Select fixed highway routes (e.g., *Dhaka → Chittagong*, *Dhaka → Sylhet*, *Dhaka → Cox's Bazar*, *Dhaka → Khulna*, *Dhaka → Rajshahi*, *Dhaka → Barisal*) or provide a custom route if enabled by admin.
- **Interactive Booking:** Live cost calculator based on duration (days) and daily rental tariffs.
- **Simulated Payment Gateway:** Multi-channel simulated payment flow supporting Credit/Debit Cards, bKash, and Bank Transfers with real-time countdown timer.
- **Personalized User Dashboard:**
  - View Active Bookings with instant Pay Now triggers for pending transactions.
  - Comprehensive Rental History archive with booking & payment statuses.
  - Member profile management and account status inspection.
- **Secure Authentication:** Token-based authorization, form validation, and show/hide password toggles.

### 🛡️ Administrative Dashboard
- **Centralized Metrics:** Overview statistics covering total vehicles, active bookings, registered users, and processed transactions.
- **Car Inventory Management:**
  - Add new vehicles with image uploads, model details, pricing, routes, and custom route permissions.
  - Edit existing car details through a dedicated `/admin/cars/:id/edit` management interface.
  - Real-time car availability toggle (Available / Booked).
  - Vehicle deletion with cascading booking management.
- **Booking Lifecycle Control:** Approve, Cancel, or Mark Bookings as Complete.
- **Route Management:** Dynamically inspect and assign fleet vehicles to routes.
- **User Moderation:** View registered users and toggle account statuses (Active / Inactive).
- **Payment Audits:** Review transaction logs and associated booking references.

---

## 🛠️ Tech Stack & Architecture

### Backend
- **Framework:** Python 3.12 / Django 5.x & Django REST Framework (DRF)
- **Database:** MongoDB (via Djongo / PyMongo) with automatic fallback to SQLite3
- **Authentication:** Token Authentication (`rest_framework.authtoken`) & Custom User Model (`UserProfile`)
- **File Handling:** Multipart/form-data parser for car images stored in media directories

### Frontend
- **Framework:** React 18 (SPA) powered by Vite build tool
- **Routing:** React Router v6
- **Styling:** Tailwind CSS (Custom color schemes: *sage*, *cream*, *dark*, *warm*)
- **Icons & UI:** Lucide React icons for a modern, emoji-free interface
- **Animations:** Reveal scroll triggers & interactive transition states

---

## 📂 Project Directory Structure

```plaintext
Drivenow-Car-Rental-Management-System/
├── backend/
│   ├── backend/
│   │   ├── admin.py               # Django Admin definitions
│   │   ├── models.py              # UserProfile, Car, Booking, Payment models
│   │   ├── serializers.py         # DRF Serializers for validation & serialization
│   │   ├── views.py               # Authentication, booking, payment & admin views
│   │   ├── urls.py                # REST API route mappings
│   │   └── tests.py               # Unit & integration test suites
│   ├── car_rental_project/
│   │   ├── settings.py            # MongoDB / SQLite configuration & CORS settings
│   │   ├── urls.py                # Root URL dispatcher
│   │   └── wsgi.py
│   ├── media/cars/                # Uploaded car image assets
│   ├── seed_mongo.py              # Database seeder script
│   ├── requirements.txt           # Python dependencies
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── api/                   # Fetch client and endpoint mappings
│   │   ├── components/            # Reusable UI (Navbar, Footer, CarCard, Modals, etc.)
│   │   ├── context/               # AuthContext & Toast notification provider
│   │   ├── pages/                 # Home, Booking, Payment, Dashboard, Login, Register
│   │   │   └── admin/             # Admin layout, dashboard, car edit, booking tables
│   │   ├── utils/                 # Formatters, async hooks & helpers
│   │   ├── App.jsx                # Route declarations
│   │   └── main.jsx
│   ├── public/images/             # Static car image assets
│   ├── package.json               # Node.js dependencies
│   ├── tailwind.config.js         # Theme & color configuration
│   └── vite.config.js
├── run-backend.bat                # Windows one-click backend launcher
├── run-frontend.bat               # Windows one-click frontend launcher
└── README.md
```

---

## ⚙️ Getting Started & Installation

### Prerequisites
- **Python:** 3.10+ installed
- **Node.js:** v18+ & npm installed
- **MongoDB:** (Optional) Local MongoDB service running on `mongodb://localhost:27017` (auto-falls back to SQLite if MongoDB is absent)

### 1. Backend Setup (Django REST Framework)
Open a terminal in the root directory:
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate       # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python3 manage.py migrate

# Start backend server
python3 manage.py runserver
```
The backend API will start at `http://127.0.0.1:8000/`.

### 2. Database Seeding (Optional but Recommended)
To seed initial vehicles, routes, and admin users into the database:
```bash
python3 seed_mongo.py
```

### 3. Frontend Setup (React + Vite)
Open a second terminal in the root directory:
```bash
cd frontend

# Install packages
npm install

# Run Vite dev server
npm run dev
```
The client app will launch at `http://localhost:5173/`.

---

## 🚀 Default Credentials

### Administrator Account
- **URL:** `http://localhost:5173/admin/login`
- **Email:** `admin@drivenow.com`
- **Password:** `adminpassword123`

### Alternative Admin (Team Member)
- **Email:** `nafisa@gmail.com`
- **Password:** `nafisapassword123`

*(Regular users can register new accounts directly from the `/register` page).*

---

## 🔗 API Endpoints Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register/` | Register new user account | Public |
| `POST` | `/api/auth/login/` | User token login | Public |
| `POST` | `/api/auth/admin-login/`| Superuser token login | Public |
| `GET` | `/api/auth/me/` | Current user profile | Authenticated |
| `GET` | `/api/cars/` | List all available vehicles | Public |
| `GET` | `/api/cars/<id>/` | Detailed car specification | Public |
| `GET` | `/api/routes/` | Active routes & car counts | Public |
| `GET` / `POST` | `/api/bookings/` | Get user bookings / Create booking | Authenticated |
| `POST` | `/api/payments/process/`| Process booking payment | Authenticated |
| `GET` | `/api/admin/stats/` | Dashboard metrics | Admin Only |
| `GET` / `POST` | `/api/admin/cars/` | View / Add fleet vehicle | Admin Only |
| `PATCH` / `DELETE`| `/api/admin/cars/<id>/`| Edit vehicle details / Delete | Admin Only |
| `POST` | `/api/admin/cars/<id>/toggle/`| Toggle availability | Admin Only |
| `POST` | `/api/admin/bookings/<id>/<action>/`| Approve, cancel, complete booking | Admin Only |
| `POST` | `/api/admin/users/<id>/toggle/` | Activate or deactivate user | Admin Only |

---

## 👥 Development Team

- **Estiak Ahmmed Sami** (ID: 20245103039) — *Frontend Development*
- **Sayma Rahman** (ID: 20245103060) — *Frontend Development*
- **Mijanur Rahman** (ID: 20245103053) — *Backend Development & Database Architecture*
- **Nafisa Akter** (ID: 20245103042) — *Database Architecture & Management*

---

## 📄 License
This project is developed for educational and academic assessment purposes as part of the 7th Semester Software Engineering Curriculum.
