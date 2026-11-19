# Maison Aurum — Salon Management & Appointment Booking System

A production-ready MERN stack Salon Management & Online Appointment Booking System built with **React (Vite + Tailwind CSS)**, **Node.js + Express**, and **MongoDB Atlas**, using **INR (`₹`)** currency formatting and **`Asia/Kolkata` (IST)** timezone.

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Axios, Lucide React, Recharts (Deployed on **Vercel**)
- **Backend:** Node.js, Express.js, Mongoose, JWT, bcryptjs, Helmet, Express Rate Limit (Deployed on **Render**)
- **Database:** MongoDB Atlas

---

## Local Development Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit backend/.env with your MongoDB URI, JWT_SECRET, and INITIAL_OWNER_* variables
npm run create-owner
npm run dev
```

### 2. Optional Testing Dataset (6-Month Seed)
> **Note:** Never seed test records into your live production database. Use a separate testing database URI in `backend/.env` when seeding.

```bash
cd backend
npm run seed        # Inserts 20 customers, 10 INR services, 4 staff, ~66 bookings (6 months), payments & expenses (tagged isSeeded: true)
npm run seed:clean  # Safely removes ONLY seeded records (isSeeded: true) without touching genuine data
```

### 3. Frontend
```bash
cd frontend
npm install
# Ensure frontend/.env has VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## Production Deployment Guide

### Step 1: MongoDB Atlas
1. Create a free/shared cluster on **MongoDB Atlas**.
2. Create a database user with read/write permissions.
3. Under **Network Access**, allow Render's outbound IPs (or `0.0.0.0/0` for initial setup).
4. Copy the connection string and set your database name (e.g. `maison_aurum_salon`).

### Step 2: Backend on Render
1. Create a **New Web Service** on Render pointing to this repository.
2. Set **Root Directory** to `backend`.
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. Add **Environment Variables** in Render:
   - `NODE_ENV=production`
   - `PORT=5000` (Render sets `PORT` automatically; `server.js` reads `process.env.PORT`)
   - `MONGODB_URI=mongodb+srv://...`
   - `JWT_SECRET=<strong-random-secret>`
   - `JWT_EXPIRES_IN=7d`
   - `CLIENT_URL=https://your-vercel-app.vercel.app`
   - `INITIAL_OWNER_NAME`, `INITIAL_OWNER_EMAIL`, `INITIAL_OWNER_PHONE`, `INITIAL_OWNER_PASSWORD` (for initial owner creation)
6. After first deploy, open Render **Shell** and run:
   ```bash
   npm run create-owner
   ```
   Verify health at `https://your-backend.onrender.com/api/health`.

### Step 3: Frontend on Vercel
1. Import this repository in **Vercel**.
2. Set **Root Directory** to `frontend`.
3. **Framework Preset:** Vite (`npm run build`, output directory `dist`).
4. Add **Environment Variable** in Vercel:
   - `VITE_API_URL=https://your-backend.onrender.com/api`
5. Deploy! `frontend/vercel.json` handles SPA client-side routing automatically.
