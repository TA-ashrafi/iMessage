# Realtime Chat Application

A full-stack real-time chat application built with Vite (React), Express (Node.js), Socket.IO, Clerk Auth, ImageKit, and MongoDB.

---

## Deploying on Render.com

Follow these steps to deploy this application as a single Web Service on Render:

### 1. Create a New Web Service
1. Sign in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository containing this code.

### 2. Configure Service Settings
- **Name**: `my-chat-app` (or any name you prefer)
- **Environment**: `Node`
- **Region**: Choose any region close to your database
- **Branch**: `main` (or your default branch)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 3. Set Environment Variables
In the Render dashboard under **Environment**, add the following environment variables:

| Key | Example Value / Description |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | `3001` (or leave default, Render sets process.env.PORT automatically) |
| `MONGO_URI` | Your MongoDB connection string (`mongodb+srv://...`) |
| `CLERK_PUBLISHABLE_KEY` | Your Clerk Publishable Key (`pk_test_...`) |
| `CLERK_SECRET_KEY` | Your Clerk Secret Key (`sk_test_...`) |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Your Clerk Webhook secret (`whsec_...`) |
| `IMAGEKIT_PRIVATE_KEY` | Your ImageKit Private Key |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same as `CLERK_PUBLISHABLE_KEY` (embedded during build) |

### 4. Deploy
Click **Create Web Service**. Render will automatically run `npm run build` to build the frontend and backend assets, and then start the Express server with `npm start`.
