# Town Portal - Portal Comunitario P'urhépecha

A unified community portal for P'urhépecha towns, integrating language learning (Curicaueri) with shared authentication and community services.

## Features

- **App Launcher** - Central hub for community applications
- **Authentication** - Shared auth with Supabase (works across Curicaueri and other apps)
- **News & Announcements** - Community news feed
- **Events Calendar** - Local events and celebrations
- **Business Directory** - Local businesses and services
- **User Profiles** - Manage your community profile

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Supabase (Auth + Database)
- shadcn/ui components

## Getting Started

1. Set environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `NEXT_PUBLIC_CURICAUERI_URL` - URL to Curicaueri app (for app launcher)
