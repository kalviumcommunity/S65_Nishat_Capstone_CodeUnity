# OAuth 2.0 Setup Guide - CodeUnity

This guide walks you through setting up Google and GitHub OAuth for CodeUnity.

## Table of Contents
1. [Google OAuth Setup](#google-oauth-setup)
2. [GitHub OAuth Setup](#github-oauth-setup)
3. [Environment Variables](#environment-variables)
4. [Testing OAuth Flow](#testing-oauth-flow)

---

## Google OAuth Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: `CodeUnity`
5. Click "CREATE"

### Step 2: Enable Google+ API
1. In the search bar, search for "Google+ API"
2. Click on "Google+ API"
3. Click "ENABLE"

### Step 3: Create OAuth 2.0 Credentials
1. Go to "Credentials" (left sidebar)
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - Fill required fields (App name: `CodeUnity`, User support email, Developer contact)
   - Scopes: Add `email` and `profile`
   - Save and continue
4. Back to credentials, select "Web application"
5. Add authorized redirect URIs:
   - **Development**: `http://localhost:8080/api/auth/google/callback`
   - **Production**: `https://your-server-domain.com/api/auth/google/callback`
   - **Vercel (if using)**: `https://your-render-or-deployed-url.com/api/auth/google/callback`

6. Click "CREATE"
7. Copy the **Client ID** and **Client Secret**

---

## GitHub OAuth Setup

### Step 1: Register OAuth Application
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in the form:
   - **Application name**: `CodeUnity`
   - **Homepage URL**: `http://localhost:5173` (dev) or `https://your-frontend-domain.com` (prod)
   - **Authorization callback URL**:
     - **Development**: `http://localhost:8080/api/auth/github/callback`
     - **Production**: `https://your-server-domain.com/api/auth/github/callback`

4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret** (click "Generate a new client secret")

---

## Environment Variables

### Development (.env file in `/server`)

Create a `.env` file in the server directory with the following:

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Authentication
JWT_SECRET=your_secure_random_jwt_secret_key_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:8080/api/auth/github/callback

# Frontend URL (for redirects after OAuth)
CLIENT_URL=http://localhost:5173

# Email Service Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=8080
NODE_ENV=development
```

### Production (.env.production file in `/server`)

```bash
# Database Configuration
MONGODB_URI=your_production_mongodb_uri

# JWT Authentication
JWT_SECRET=your_production_jwt_secret

# Google OAuth - Production URLs
GOOGLE_CLIENT_ID=your_production_google_client_id
GOOGLE_CLIENT_SECRET=your_production_google_client_secret
GOOGLE_CALLBACK_URL=https://your-server-domain.com/api/auth/google/callback

# GitHub OAuth - Production URLs
GITHUB_CLIENT_ID=your_production_github_client_id
GITHUB_CLIENT_SECRET=your_production_github_client_secret
GITHUB_CALLBACK_URL=https://your-server-domain.com/api/auth/github/callback

# Frontend URL (production)
CLIENT_URL=https://your-frontend-domain.com

# Email Service Configuration
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=8080
NODE_ENV=production
```

### Environment Variable Setup Steps

1. **Copy the credentials from Google and GitHub into your `.env` file**
2. **Keep `.env` secure** - Never commit to git (already in `.gitignore`)
3. **For Render/Vercel hosting**:
   - Go to your deployment settings
   - Add the environment variables in the dashboard
   - Use the production URLs for callback URIs

---

## Production-Ready Callback URLs

### Current Implementation
The OAuth callback routes use `process.env.CLIENT_URL` for redirects:

```javascript
const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth-callback?token=${token}&...`;
```

**This ensures:**
- ✅ Development: Uses `http://localhost:5173`
- ✅ Production: Uses your actual domain from `.env`
- ✅ Fallback: If not set, uses localhost (safe default)

### For Render.com Deployment
1. Set environment variables in Render dashboard
2. Use callback URLs like: `https://your-app.onrender.com/api/auth/google/callback`
3. Set `CLIENT_URL=https://your-frontend-domain.com`

### For Vercel Frontend Deployment
1. Update your Google/GitHub OAuth apps to accept:
   - `https://your-vercel-domain.vercel.app` as homepage
   - Use server callback URL: `https://your-server-domain.com/api/auth/{provider}/callback`

---

## Testing OAuth Flow

### Local Development (http://localhost:5173)

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start the frontend:**
   ```bash
   cd client
   npm run dev
   ```

3. **Test OAuth:**
   - Open `http://localhost:5173`
   - Click on "Google Sign In" or "GitHub Sign In" button
   - You should be redirected to the provider's login page
   - After authentication, you'll be redirected to `/auth-callback`
   - You should be logged in and redirected to home

4. **Verify localStorage:**
   - Open browser DevTools (F12)
   - Go to Application → Local Storage
   - Check for `codeunity_token` and `codeunity_user`

---

## Troubleshooting

### "Redirect URI mismatch" Error
- Ensure callback URL in OAuth app settings **exactly matches** the one in your backend
- Include the full path: `/api/auth/google/callback`

### "Invalid Client ID" Error
- Double-check the credentials were copied correctly
- Ensure no extra spaces or quotes

### Token Not Being Generated
- Check MongoDB connection is working
- Verify `JWT_SECRET` is set in `.env`
- Check server logs for errors

### User Not Being Created
- Verify the User model is correctly importing OAuth fields
- Check MongoDB permissions

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` files to git
- Use strong, random `JWT_SECRET` (at least 32 characters)
- Rotate credentials if they're ever exposed
- Use HTTPS only in production
- Set secure cookie flags if using cookies

---

## Next Steps

After setup:
1. Test OAuth locally with your credentials
2. Deploy to production with updated environment variables
3. Monitor OAuth logs for any issues
4. Consider adding rate limiting to OAuth endpoints

