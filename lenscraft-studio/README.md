# Lenscraft Studio — React + Vite

## Run

```bash
npm install
npm run dev
```

Build: `npm run build`; preview: `npm run preview`.

Routes: `/`, `/about`, `/contact`, `/login`, and a 404 page.

## Important production notes

- Contact inquiry form validates locally only. No data is sent or saved. Connect a backend API before enabling real bookings.
- Login validates locally only. No real authentication, account creation or password reset is provided. Connect Django REST Framework JWT APIs over HTTPS. Never persist raw passwords.
- Studio metrics, testimonials, team profiles, timeline, and contact details are **illustrative demo content** and must be replaced with verified information.
- Photos are loaded remotely from Unsplash and need internet access; check image usage rights and replace with licensed studio images before launch.
- Social links are general platform homepages until studio profile URLs are supplied.
- For deployment, configure the host to rewrite unknown routes to `index.html` for React Router.
