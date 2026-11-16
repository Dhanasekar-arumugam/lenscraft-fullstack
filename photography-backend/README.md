# Lenscraft Django REST + MySQL backend

## Setup (Windows PowerShell)

```powershell
cd photography-backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` with your own MySQL credentials and a strong Django secret key. Do not commit `.env`.

Create the database using MySQL:

```sql
CREATE DATABASE photography_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'photography_user'@'localhost' IDENTIFIED BY 'your-own-strong-password';
GRANT ALL PRIVILEGES ON photography_db.* TO 'photography_user'@'localhost';
```

Then run:

```powershell
python manage.py makemigrations accounts contacts bookings portfolio services
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver localhost:8000
```

Use `localhost` consistently for frontend and backend. The React `.env` should use `VITE_API_BASE_URL=http://localhost:8000/api`; run React on `http://localhost:5173`. This is important for SameSite cookies. In production use HTTPS, `DJANGO_DEBUG=False`, proper host/origin settings, and secure cookies.

## Frontend

```powershell
cd ../lenscraft-studio
Copy-Item .env.example .env
npm install
npm run dev
```

## API routes

- POST `/api/auth/register/` `{ "email": "test@example.com", "password": "a-strong-password" }`
- GET `/api/auth/csrf/` before login; POST `/api/auth/login/` `{ "email": "test@example.com", "password": "a-strong-password" }`
- POST `/api/auth/refresh/`, POST `/api/auth/logout/`, GET/PUT `/api/auth/profile/`
- POST `/api/contacts/` `{ "name":"Jane", "email":"jane@example.com", "phone":"9876543210", "service":"Wedding Photography", "preferred_date":"2026-12-01", "location":"Chennai", "message":"Please share packages" }`
- GET `/api/services/`, `/api/portfolio/?category=Weddings`, `/api/testimonials/`, `/api/photographers/`, `/api/studio/`
- POST `/api/bookings/` (authenticated), GET `/api/bookings/my-bookings/`, staff-only GET `/api/bookings/` and PATCH `/api/bookings/{id}/`
- Admin at `/admin/`

The frontend keeps its original visual design. Services/gallery/team/testimonials fall back to demo data until records are entered in Django Admin. Sample text and imagery should be replaced before publication. Login is connected, but a registration screen and account session provider are future UI work; register via the API for now. Booking requests can be created via API; a separate booking form is not yet wired to the UI. Refresh cookies are HttpOnly; access tokens are memory-only and do not persist after reload. For production, add a durable CSRF-aware session bootstrap, tests, captcha or other spam defense, production file storage, and stronger concurrency guarantees for studio booking slots.
