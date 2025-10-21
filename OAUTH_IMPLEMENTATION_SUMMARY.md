# OAuth 2.0 Implementation - CodeUnity

## Implementation Summary

This document outlines the complete OAuth 2.0 implementation for Google and GitHub authentication in CodeUnity.

### Date: October 21, 2025
### Branch: `implement-oauth`

---

## What Was Implemented

### ✅ Backend (Server)

#### 1. **Passport.js Integration** (`server/routes/auth.js`)
   - Installed: `passport`, `passport-google-oauth20`, `passport-github2`, `passport-local`
   - Configured Google OAuth 2.0 strategy
   - Configured GitHub OAuth strategy
   - Added serialization/deserialization for Passport

#### 2. **OAuth Callback Routes** (`server/routes/auth.js`)
   - `GET /api/auth/google` - Initiates Google OAuth flow
   - `GET /api/auth/google/callback` - Handles Google OAuth callback
   - `GET /api/auth/github` - Initiates GitHub OAuth flow
   - `GET /api/auth/github/callback` - Handles GitHub OAuth callback

#### 3. **User Creation/Linking Logic**
   - Automatically creates new users from OAuth providers
   - Automatically links OAuth accounts to existing email addresses
   - Stores provider profile data (email, name, picture/avatar)
   - Generates JWT tokens after OAuth authentication

#### 4. **Passport Initialization** (`server/index.js`)
   - Added `passport.initialize()` middleware
   - Added `const passport = require('passport')`

#### 5. **Environment Configuration**
   - Updated `.env.example` with OAuth credentials and callback URLs
   - Added `CLIENT_URL` variable for production-ready redirects
   - Configuration supports both development and production URLs

---

### ✅ Frontend (Client)

#### 1. **OAuth Buttons** (Already existed in `client/src/components/AuthModal.jsx`)
   - Google Sign In button
   - GitHub Sign In button
   - Click handlers that redirect to backend OAuth routes

#### 2. **Auth Callback Handler** (`client/src/pages/AuthCallback.jsx`)
   - Created new component to handle OAuth redirects
   - Processes token and user data from query parameters
   - Stores auth data in localStorage
   - Redirects to home page after authentication

#### 3. **Route Configuration** (`client/src/App.jsx`)
   - Added `/auth-callback` route
   - Imported and registered AuthCallback component

---

## Files Modified/Created

### Backend
```
✅ server/routes/auth.js - Added OAuth strategies and callback routes
✅ server/index.js - Added Passport initialization
✅ server/.env.example - Added OAuth credentials template
✅ server/package.json - Dependencies auto-installed:
   - passport@0.7.0
   - passport-google-oauth20@2.0.0
   - passport-github2@0.1.12
   - passport-local@1.0.0
```

### Frontend
```
✅ client/src/pages/AuthCallback.jsx - Created OAuth callback handler
✅ client/src/App.jsx - Added /auth-callback route
```

### Documentation
```
✅ OAUTH_SETUP_GUIDE.md - Complete setup and credential instructions
✅ IMPLEMENTATION_SUMMARY.md - This file
```

---

## Production-Ready Features

### ✅ Environment-Based URLs
```javascript
// Callback URLs use environment variables
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback'
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:8080/api/auth/github/callback'

// Frontend redirects use CLIENT_URL
const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth-callback?token=${token}&...`
```

**This ensures:**
- ✅ Works locally with `localhost` URLs
- ✅ Works in production with actual domain names
- ✅ Works with Render.com, Vercel, or any deployment platform
- ✅ Fallback to sensible defaults if env vars not set

### ✅ JWT Token Generation
- OAuth users receive same JWT tokens as email/password users
- Tokens expire in 30 days
- Stored in localStorage for session persistence

### ✅ User Auto-Creation
- New OAuth users automatically create accounts
- Existing email users can link OAuth providers
- Provider profile data preserved (avatars, names, emails)

### ✅ Security
- Passport serialization/deserialization configured
- No session data stored (stateless JWT auth)
- Rate limiting on OAuth endpoints (inherited from auth middleware)

---

## How OAuth Flow Works

### Step-by-Step Flow

```
1. User clicks "Sign In with Google/GitHub" in AuthModal
   ↓
2. Browser redirects to GET /api/auth/google (or /github)
   ↓
3. Passport redirects to provider (Google/GitHub OAuth page)
   ↓
4. User authenticates with provider
   ↓
5. Provider redirects back to GET /api/auth/google/callback
   ↓
6. Passport strategy validates and extracts user profile
   ↓
7. Backend checks if user exists:
   - If exists: Update OAuth data
   - If not: Create new user with OAuth profile
   ↓
8. Backend generates JWT token
   ↓
9. Backend redirects to /auth-callback?token=xxx&username=yyy&email=zzz
   ↓
10. AuthCallback component processes redirect:
    - Extracts token and user data from URL
    - Stores in localStorage
    - Redirects to home page
   ↓
11. App recognizes authenticated user and shows dashboard
```

---

## Testing Locally

### Prerequisites
1. ✅ Have Google OAuth credentials (see OAUTH_SETUP_GUIDE.md)
2. ✅ Have GitHub OAuth credentials (see OAUTH_SETUP_GUIDE.md)
3. ✅ Create `.env` file in `/server` with credentials

### Test Steps

1. **Start backend:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start frontend (in new terminal):**
   ```bash
   cd client
   npm run dev
   ```

3. **Test in browser:**
   - Open `http://localhost:5173`
   - Click "Sign In with Google" or "Sign In with GitHub"
   - Should redirect to provider login
   - Should redirect back and log you in
   - Check localStorage for `codeunity_token`

---

## What Still Needs to Be Done

### Before Production
1. **Get OAuth Credentials:**
   - Create Google Cloud project and get Client ID/Secret
   - Create GitHub OAuth app and get Client ID/Secret
   - Follow OAUTH_SETUP_GUIDE.md for detailed instructions

2. **Add to .env Files:**
   - Create `.env` in `/server` for development
   - Create `.env.production` in `/server` for production
   - Add all OAuth credentials and URLs

3. **Update OAuth App Settings:**
   - Google: Add production callback URL to authorized redirect URIs
   - GitHub: Add production callback URL to authorization callback URL

4. **Deploy & Test:**
   - Deploy backend to Render.com or similar
   - Deploy frontend to Vercel or similar
   - Update environment variables on platforms
   - Test OAuth flow in production

---

## Environment Variable Reference

### Required for OAuth (Development)
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL=http://localhost:8080/api/auth/github/callback
CLIENT_URL=http://localhost:5173
```

### Required for OAuth (Production)
```
GOOGLE_CLIENT_ID=production_value
GOOGLE_CLIENT_SECRET=production_value
GOOGLE_CALLBACK_URL=https://your-server.com/api/auth/google/callback
GITHUB_CLIENT_ID=production_value
GITHUB_CLIENT_SECRET=production_value
GITHUB_CALLBACK_URL=https://your-server.com/api/auth/github/callback
CLIENT_URL=https://your-frontend.com
```

---

## Database Schema

### User Model Changes
No database schema changes needed! The User model already had OAuth support:

```javascript
oauth: {
  google: { id, email, name, picture },
  github: { id, username, email, avatar_url },
  discord: { id, username, email, avatar }
}
```

---

## Troubleshooting Common Issues

### Issue: "Redirect URI mismatch"
**Solution:** Ensure callback URL in OAuth app settings exactly matches `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL`

### Issue: "Invalid Client ID"
**Solution:** Verify credentials were copied correctly from Google/GitHub with no extra spaces

### Issue: User not being created
**Solution:** Check MongoDB connection and verify User model is loading correctly

### Issue: Token not working after OAuth
**Solution:** Verify `JWT_SECRET` is set in .env and same on backend

### Issue: OAuth works locally but not in production
**Solution:** Verify environment variables are set on deployment platform and use production URLs

---

## Security Checklist

- ✅ Passport.js used for OAuth (battle-tested library)
- ✅ No sessions (stateless JWT authentication)
- ✅ User credentials never exposed in frontend
- ✅ Tokens expire after 30 days
- ✅ Rate limiting on auth endpoints
- ✅ Environment variables keep secrets secure
- ✅ HTTPS enforced in production (on deployment platform)

---

## Concept Proof for Capstone

This implementation demonstrates:
- ✅ **Authentication (3rd Party OAuth)** - Fully implemented with Google and GitHub
- ✅ **Database Integration** - User model stores OAuth data
- ✅ **Frontend Integration** - OAuth buttons and callback handling
- ✅ **Backend API** - OAuth routes and JWT generation
- ✅ **Security** - Passport.js, JWT tokens, rate limiting
- ✅ **Production Ready** - Environment variables, fallback URLs
- ✅ **Error Handling** - User creation, token generation, redirects

---

## Next Steps

1. Follow OAUTH_SETUP_GUIDE.md to get OAuth credentials
2. Create `.env` file and add credentials
3. Test OAuth locally
4. When ready for production, create environment variables on deployment platform
5. Commit this implementation to GitHub
6. Create pull request
7. Request code review

