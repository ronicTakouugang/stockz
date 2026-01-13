# Application Deployment Guide

This guide provides step-by-step instructions for deploying the full-stack stock analysis application. The project consists of two main parts:

1.  **Next.js Frontend:** The user-facing web application.
2.  **Python (FastAPI) Backend:** The service for machine learning, data processing, and analysis.

We will deploy the frontend on **Vercel** and the backend on **Render**. Both platforms offer generous free tiers.

---If i want to 

## 1. Backend Deployment (Render)

First, we will deploy the Python backend, as the frontend will need its URL.

### A. Initial Setup on Render

1.  **Create an Account:** Sign up for a free account on [Render](https://render.com/).
2.  **Connect GitHub:** Connect your GitHub account to Render to give it access to your repository.
3.  **New Web Service:** From the Render dashboard, click **New +** and select **Web Service**.
4.  **Select Repository:** Choose the GitHub repository for this project.

### B. Service Configuration

Render will ask for details on how to build and run the service. Configure it as follows:

-   **Name:** Give your service a name (e.g., `stock-app-backend`).
-   **Root Directory:** `backend` (This is crucial, as it tells Render to look inside the `/backend` folder).
-   **Environment:** `Python 3`
-   **Region:** Choose a region closest to you.
-   **Branch:** `prediction` (or the branch you want to deploy).
-   **Build Command:** `pip install --no-cache-dir -r requirements.txt`
-   **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
-   **Instance Type:** `Free`

### C. Add Environment Variables

Before creating the service, click on **Advanced Settings** to add your environment variables. You must add all the variables from your `backend/.env` file.

1.  Click **Add Environment Variable** for each secret.
2.  Add the key (e.g., `MONGODB_URL`) and the corresponding secret value.
3.  Ensure you add all required variables, including `MONGODB_URL`, `GEMINI_API_KEY`, etc.

### D. Deploy

1.  Click **Create Web Service**.
2.  Render will now start building and deploying your backend. You can view the logs to monitor the process.
3.  Once the deployment is successful, Render will provide a public URL for your backend (e.g., `https://stock-app-backend.onrender.com`). **Copy this URL.**

---

## 2. Frontend Deployment (Vercel)

Now, let's deploy the Next.js frontend.

### A. Initial Setup on Vercel

1.  **Create an Account:** Sign up for a free account on [Vercel](https://vercel.com/).
2.  **Connect GitHub:** Connect your GitHub account to Vercel.
3.  **New Project:** From the Vercel dashboard, click **Add New...** and select **Project**.
4.  **Import Repository:** Choose the GitHub repository for this project and click **Import**.

### B. Project Configuration

Vercel automatically detects Next.js projects, so the default settings are usually correct.

-   **Framework Preset:** Should be automatically set to `Next.js`.
-   **Root Directory:** Should be the root of your project.

### C. Add Environment Variables

This is the most important step.

1.  Expand the **Environment Variables** section.
2.  Add all the variables from your root `.env` file (`MONGODB_URL`, `BETTER_AUTH_SECRET`, etc.).
3.  **Add the Backend URL:** Create a new environment variable:
    -   **Name:** `NEXT_PUBLIC_BACKEND_URL`
    -   **Value:** Paste the URL of your deployed Render backend that you copied in the previous step (e.g., `https://stock-app-backend.onrender.com`).

### D. Deploy

1.  Click **Deploy**.
2.  Vercel will build and deploy your frontend application.
3.  Once complete, Vercel will provide you with a public URL for your live application.

---

## 3. Final Steps

Your application is now deployed! The Vercel frontend will make API calls to your live Render backend.

**Important:** If you update your backend URL or any other environment variables in Vercel, you must trigger a new deployment for the changes to take effect. You can do this from the "Deployments" tab in your Vercel project dashboard.
