# Codempress Production Deployment Blueprint

This guide details the exact production deployment workflow for **Vercel**, **Render**, and **Supabase**.

---

## 1. Supabase Database Deployment

### Step A: Initialize Project & Apply Migration
1. Log in to [Supabase Console](https://database.new).
2. Create a new project named `codempress-db`.
3. Open the **SQL Editor** in the Supabase Dashboard.
4. Copy and execute the contents of [supabase/schema.sql](file:///c:/Users/durga/OneDrive/Desktop/app/supabase/schema.sql).
5. Copy your **Project URL** (`https://<project-ref>.supabase.co`) and **anon / service_role API keys** from `Project Settings -> API`.

### Step B: Environment Variables
Set the following environment variables in your backend hosting service (Render):
```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 2. Render Backend Deployment

The backend service is configured via [render.yaml](file:///c:/Users/durga/OneDrive/Desktop/app/render.yaml).

### Step A: Connect Repository
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\rightarrow$ **Blueprint**.
3. Connect `https://github.com/Hrudaideepak/codempress.git`.
4. Render automatically parses `render.yaml` and provisions `codempress-backend`.

### Step B: Configure Secrets in Render Dashboard
Set the following environment variables on `codempress-backend`:
- `GITHUB_TOKEN`: GitHub Personal Access Token (with `models: read` permission).
- `JWT_SECRET`: Random 64-character secret key.
- `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.

---

## 3. Vercel Frontend Deployment

The frontend configuration is defined in [frontend/vercel.json](file:///c:/Users/durga/OneDrive/Desktop/app/frontend/vercel.json).

### Step A: Deploy via Vercel CLI or Web Console
```bash
# Option 1: Deploy using Vercel CLI
cd frontend
npx vercel --prod
```

Or connect the GitHub repository in the [Vercel Dashboard](https://vercel.com/new):
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step B: Configure Frontend Environment Variables
Set the following in Vercel Project Settings:
- `VITE_API_URL`: `https://codempress-backend.onrender.com/api`
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.

---

## 4. Post-Deployment Production Verification

Run the automated health check endpoints:
```bash
# Verify Backend Health
curl https://codempress-backend.onrender.com/health

# Verify AI Model Fallback Pipeline Health
curl https://codempress-backend.onrender.com/api/ai/status
```
