# 🎓 LearnHub LMS — Complete Setup Guide

## Stack
- **Frontend**: Next.js 14 + Tailwind CSS + Zustand
- **Backend**: Node.js + Express + TypeScript
- **Database**: MySQL (local or Aiven)
- **Auth**: JWT (access 15min + refresh 30days in HttpOnly cookie)
- **Payments**: Stripe Checkout
- **Video**: YouTube IFrame API (free, no storage costs)

---

## ⚡ QUICKSTART (Do this in order)

### STEP 1 — MySQL Database

**Option A: Local MySQL**
```bash
mysql -u root -p
CREATE DATABASE lmsdb;
EXIT;
```

**Option B: Free Aiven MySQL**
- Go to https://aiven.io → Create free MySQL service
- Copy the connection string

---

### STEP 2 — Backend Setup

```bash
cd lms-backend

# Install dependencies
npm install

# Copy env file
cp .env.example .env
```

Now edit `.env`:
```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/lmsdb"
JWT_ACCESS_SECRET="change-this-to-random-string-abc123"
JWT_REFRESH_SECRET="change-this-to-another-random-string-xyz789"
CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
PORT=4000

# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."   # set after step below
```

```bash
# Push schema to database
npx prisma db push

# Seed with demo data (2 courses, 24 videos, 3 users)
npx ts-node prisma/seed.ts

# Start backend
npm run dev
```

✅ Backend running at http://localhost:4000
✅ Test: http://localhost:4000/api/health → {"status":"ok"}

---

### STEP 3 — Frontend Setup

```bash
cd lms-frontend

# Install dependencies
npm install

# Copy env file
cp .env.local.example .env.local
```

`.env.local` should contain:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

```bash
# Start frontend
npm run dev
```

✅ Frontend running at http://localhost:3000

---

### STEP 4 — Stripe Webhooks (for payment)

In a new terminal:
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:4000/api/payments/webhook
```

Copy the webhook secret it shows → paste into backend `.env` as `STRIPE_WEBHOOK_SECRET`

**Test card**: `4242 4242 4242 4242` | any future date | any CVV

---

## 👤 Demo Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Student | student@lms.com | student123 |
| Instructor | instructor@lms.com | instructor123 |
| Admin | admin@lms.com | admin123 |

---

## 🗺️ All Pages

| URL | Description |
|-----|-------------|
| `/` | Course listing with search |
| `/auth/login` | Login page |
| `/auth/register` | Register page |
| `/subjects/:id` | Course detail + enroll |
| `/subjects/:id/video/:videoId` | Video player with sidebar |
| `/profile` | My learning progress |
| `/dashboard` | Instructor dashboard |
| `/payment/success` | Post-payment success |
| `/payment/cancel` | Payment cancelled |

---

## 🌐 All API Endpoints

### Auth
```
POST /api/auth/register     { email, password, name }
POST /api/auth/login        { email, password }
POST /api/auth/refresh      (uses cookie)
POST /api/auth/logout       (uses cookie)
```

### Courses
```
GET  /api/subjects                    List published courses
GET  /api/subjects/:id                Course detail
GET  /api/subjects/:id/tree           Full tree with lock status (auth)
GET  /api/subjects/:id/first-video    First unlocked video (auth)
POST /api/subjects                    Create course (instructor/admin)
PATCH /api/subjects/:id/publish       Toggle publish (instructor/admin)
POST /api/subjects/:id/sections       Add section
POST /api/subjects/:id/sections/:sectionId/videos  Add video
```

### Videos
```
GET /api/videos/:videoId    Video with lock status (auth)
```

### Progress
```
GET  /api/progress/subjects/:subjectId   Subject progress summary
GET  /api/progress/videos/:videoId       Single video progress
POST /api/progress/videos/:videoId       Update progress { lastPositionSeconds, isCompleted? }
```

### Payments
```
POST /api/payments/checkout/:subjectId    Create Stripe checkout session (auth)
POST /api/payments/enroll-free/:subjectId Enroll in free course (auth)
POST /api/payments/webhook                Stripe webhook
```

---

## 🚀 Deploy to Production

### Backend → Render
1. Push `lms-backend` to GitHub
2. New Web Service on https://render.com
3. Build: `npm install && npx prisma generate && npm run build`
4. Start: `node dist/server.js`
5. Add all env variables from `.env`

### Frontend → Vercel
1. Push `lms-frontend` to GitHub
2. Import on https://vercel.com
3. Add env: `NEXT_PUBLIC_API_BASE_URL=https://your-app.onrender.com`

### Database → Aiven
1. https://aiven.io → Free MySQL
2. Copy connection string to `DATABASE_URL`
3. Run `npx prisma db push && npx ts-node prisma/seed.ts`

---

## ✅ Final Checklist

- [ ] Register a new account
- [ ] Login with demo credentials
- [ ] Browse course listing page
- [ ] Search for a course
- [ ] View course detail page
- [ ] Enroll in free course
- [ ] Watch video — progress saves automatically
- [ ] Locked video shows lock screen
- [ ] Complete video — auto advances to next
- [ ] Progress bar updates in sidebar
- [ ] Payment with Stripe test card
- [ ] Profile shows enrolled courses + progress
- [ ] Instructor dashboard — create course + add videos
- [ ] Publish/unpublish course

---

## 🗄️ Database Schema Summary

```
users          → id, email, passwordHash, name, role
subjects       → id, title, slug, description, thumbnail, price, isPublished, instructorId
sections       → id, subjectId, title, orderIndex
videos         → id, sectionId, title, youtubeUrl, orderIndex, durationSeconds, isFree
enrollments    → id, userId, subjectId
video_progress → id, userId, videoId, lastPositionSeconds, isCompleted, completedAt
refresh_tokens → id, userId, tokenHash, expiresAt, revokedAt
payments       → id, userId, subjectId, stripePaymentId, amount, status
```
