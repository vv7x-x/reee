# 🌌 Cosmic Living Library

Full-stack Arabic RTL web application: an immersive cosmic digital library with cinematic UI and Supabase backend.

## Features

- **Public library**: Hero section, floating 3D book cards, category filter, book detail page (read/download, view count)
- **Admin panel**: Secure login, dashboard stats, add/edit/delete books, upload cover image & PDF, category and paid/free toggle
- **Backend**: Supabase (PostgreSQL, Auth, Storage), RLS, role-based access (ADMIN / READER)

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the contents of `supabase/schema.sql` to create tables and RLS.
3. In **Storage**, create two buckets:
   - `covers` (public): for book cover images  
   - `pdfs` (public or private): for PDF files  
   Add policy: allow **authenticated** upload; allow **public** read if you want direct PDF links.
4. In **Authentication → Providers**, enable Email (or others as needed).
5. Create an admin user: sign up via your app or Supabase Auth UI, then in **Table Editor → profiles** set that user’s `role` to `ADMIN`.

### 2. Frontend config

In `js/config.js`, set your Supabase URL and anon key:

```js
const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

### 3. Run locally

Serve the project over HTTP (e.g. with a local server). For example:

```bash
npx serve .
# or: python -m http.server 8080
```

Open `http://localhost:3000` (or your port). Admin: `http://localhost:3000/admin/`.

## Project structure

```
├── index.html          # Library home (hero + books grid)
├── book.html           # Book detail page
├── admin/
│   ├── index.html      # Admin login + dashboard
│   ├── admin.css       # Admin panel styles
│   └── admin.js        # Admin logic (auth, CRUD, upload)
├── css/
│   ├── cosmic.css      # Base theme, 3D, glass, animations
│   ├── main.css        # Main layout & components
│   └── book.css        # Book detail page
├── js/
│   ├── config.js       # Supabase URL & anon key
│   ├── api.js          # Supabase client & API layer
│   ├── cosmic.js       # Starfield, particles, tilt
│   ├── main.js         # Library page logic
│   └── book.js         # Book page logic
├── supabase/
│   └── schema.sql      # Tables, RLS, triggers
└── README.md
```

## Tech

- **Frontend**: HTML5, CSS3 (3D transforms, perspective, glassmorphism), vanilla JS (modules)
- **Backend**: Supabase (Database, Auth, Storage)
- **UI**: Arabic RTL, Noto Kufi Arabic / Amiri, cosmic gradient and glow

Without Supabase configured, the library still runs with mock data so you can preview the UI.
