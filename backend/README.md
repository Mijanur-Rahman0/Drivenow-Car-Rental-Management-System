# DriveNow — Backend (Django REST API)

শুধু API। কোনো HTML template নেই — frontend আলাদা project (`../frontend`)।
Auth: **Token** (`Authorization: Token <key>`), format: JSON, error: `{"detail": "..."}`

## Run
```bash
python -m venv venv
venv\Scripts\activate          # Windows   (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
python manage.py migrate       # token table যোগ হবে (existing data থাকবে)
python manage.py runserver     # http://127.0.0.1:8000
```
Admin বানাতে: `python manage.py createsuperuser`
Django built-in admin: `/database/` · Tests: `python manage.py test backend`

## Endpoints (`/api/...`)
| Method | URL | Auth | কাজ |
|---|---|---|---|
| POST | `auth/register/` | – | `{name,email,password,password2}` |
| POST | `auth/login/` | – | `{email,password}` → `{token,user}` |
| POST | `auth/admin-login/` | – | superuser only |
| POST | `auth/logout/`, GET `auth/me/` | user | |
| GET | `cars/`, `cars/<id>/`, `routes/` | – | routes এ `car_count` আছে |
| GET/POST | `bookings/` | user | POST `{car_id,duration,custom_route?}` |
| GET | `bookings/<id>/` | user | নিজের booking + payment |
| POST | `payments/process/` | user | `{booking_id, action: "success" / "fail"}` |
| GET | `admin/stats/`, `admin/users/`, `admin/bookings/`, `admin/payments/` | admin | |
| GET/POST | `admin/cars/` | admin | POST = multipart, image field `image_path` |
| PATCH/DELETE | `admin/cars/<id>/` | admin | route বদলাতে PATCH `{route}` |
| POST | `admin/cars/<id>/toggle/` | admin | |
| POST | `admin/bookings/<id>/<approve/cancel/complete>/` | admin | |
| POST | `admin/users/<id>/toggle/` | admin | |

CORS চালু (`settings.py`). Deploy করলে `CORS_ALLOWED_ORIGINS` এ frontend URL দিন।
Database: MongoDB চললে djongo, না হলে SQLite (আগের মতোই)।
