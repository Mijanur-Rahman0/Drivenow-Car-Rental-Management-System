# DriveNow — Car Rental (Django REST API + React)

একটাই project, ভেতরে দুইটা আলাদা অংশ:

```
drivenow/
├── backend/    Django REST API  (database, auth, booking, payment, admin)
├── frontend/   React + Tailwind (সব পেজ, admin panel)
├── run-backend.bat / run-frontend.bat   (Windows এ double-click করে চালানোর জন্য)
└── README.md
```

## প্রথমবার setup

**Backend** (প্রথম terminal)
```bash
cd backend
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver       # http://127.0.0.1:8000
```

**Frontend** (দ্বিতীয় terminal)
```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

তারপর browser এ http://localhost:5173 খুলুন। দুইটা server একসাথে চালু থাকতে হবে।

## পরে চালাতে
Windows: `run-backend.bat` আর `run-frontend.bat` দুইটা double-click (আগে একবার উপরের setup করা থাকতে হবে)।

## Admin
`cd backend && python manage.py createsuperuser`, তারপর http://localhost:5173/admin/login

## ঠিকানা বদলাতে হলে
- Frontend যে backend কে call করবে: `frontend/.env` → `VITE_API_BASE`
- Backend কোন frontend কে allow করবে: `backend/car_rental_project/settings.py` → `CORS_ALLOW_ALL_ORIGINS` / `CORS_ALLOWED_ORIGINS`

বিস্তারিত: `backend/README.md` (API list) আর `frontend/README.md` (React structure)।
