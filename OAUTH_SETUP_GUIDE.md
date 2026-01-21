# OAuth Setup Guide - Connecting Social Media & Google Accounts

This guide will walk you through setting up OAuth credentials to enable live connections for social media platforms (Facebook, Instagram) and Google services (Gmail, YouTube, Google Business Profile).

## Prerequisites

- Your backend server should be running on `http://localhost:8080` (default)
- You have admin access to create OAuth apps on Google Cloud Console and Meta for Developers

---

## Step 1: Create Environment Variables File

Create a `.env` file in the `server/` directory with the following structure:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_OAUTH_REDIRECT_BASE=http://localhost:8080

# Meta (Facebook/Instagram) OAuth Configuration
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here
META_OAUTH_REDIRECT_BASE=http://localhost:8080
```

**Important:** Replace the placeholder values with your actual credentials from the steps below.

---

## Step 2: Set Up Google OAuth

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Gmail API** (for Gmail integration)
   - **YouTube Data API v3** (for YouTube integration)
   - **Google My Business API** (for Google Business Profile)

### 2.2 Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for testing) or **Internal** (for Google Workspace)
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add the following:
     - `openid`
     - `email`
     - `profile`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/youtube.force-ssl`
     - `https://www.googleapis.com/auth/business.manage`
   - Test users: Add your email address (for testing)
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Hostess OAuth Client"
   - **Authorized redirect URIs**: Add:
     ```
     http://localhost:8080/api/oauth/google/callback
     ```
   - Click **Create**
5. Copy the **Client ID** and **Client Secret**

### 2.3 Update .env File

Add the Google credentials to your `server/.env` file:
```env
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
GOOGLE_OAUTH_REDIRECT_BASE=http://localhost:8080
```

---

## Step 3: Set Up Meta (Facebook/Instagram) OAuth

### 3.1 Create Facebook App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Business** as the app type
4. Fill in app details:
   - App name: Your app name
   - App contact email: Your email
   - Business account: Select or create one
5. Click **Create App**

### 3.2 Configure Facebook App

1. In your app dashboard, go to **Settings** → **Basic**
2. Note your **App ID** and **App Secret** (click "Show" to reveal secret)
3. Add **App Domains**: `localhost`
4. Add **Website** platform:
   - Site URL: `http://localhost:8080`
5. Go to **Products** → **Facebook Login** → **Settings**
6. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:8080/api/oauth/meta/callback
   ```
7. Go to **App Review** → **Permissions and Features**
8. Request the following permissions (for production, you'll need to submit for review):
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `instagram_basic`
   - `instagram_content_publish`
   - `business_management`

### 3.3 Update .env File

Add the Meta credentials to your `server/.env` file:
```env
META_APP_ID=paste_your_app_id_here
META_APP_SECRET=paste_your_app_secret_here
META_OAUTH_REDIRECT_BASE=http://localhost:8080
```

---

## Step 4: Restart Your Server

After creating/updating the `.env` file, restart your backend server:

```bash
cd server
npm run dev
```

Or if running in production mode:
```bash
npm start
```

The server will automatically load the environment variables from the `.env` file.

---

## Step 5: Test the Connection

### 5.1 Test Google Connection

1. Open your app in the browser
2. Navigate to the **Accounts** page
3. Click **Connect Google Workspace** (for Gmail) or **Connect YouTube** (for YouTube)
4. You should see a Google OAuth consent screen
5. After approving, the connection should appear in your accounts list

### 5.2 Test Meta Connection

1. Navigate to the **Accounts** page
2. Click **Connect Facebook** or **Connect Instagram**
3. You should see a Facebook OAuth consent screen
4. After approving, select the Page/Account you want to connect
5. The connection should appear in your accounts list

---

## Troubleshooting

### Issue: "OAuth is not configured" error

**Solution:** 
- Verify your `.env` file exists in the `server/` directory
- Check that all environment variables are set correctly
- Restart your server after updating `.env`

### Issue: "Redirect URI mismatch" error

**Solution:**
- Verify the redirect URI in your OAuth app settings matches exactly:
  - Google: `http://localhost:8080/api/oauth/google/callback`
  - Meta: `http://localhost:8080/api/oauth/meta/callback`
- Make sure there are no trailing slashes or typos

### Issue: "Invalid client" or "Invalid app" error

**Solution:**
- Double-check that you copied the Client ID and Client Secret correctly
- For Google: Make sure the OAuth consent screen is configured
- For Meta: Make sure your app is in "Development" mode (for testing)

### Issue: Popup blocked

**Solution:**
- Allow popups for `localhost:8080` in your browser settings
- Try using a different browser if the issue persists

### Issue: Token refresh fails

**Solution:**
- For Google: Make sure `access_type=offline` and `prompt=consent` are set (already configured in the code)
- For Meta: Long-lived tokens are automatically requested (60-day expiration)

---

## Production Deployment

When deploying to production, you'll need to:

1. **Update redirect URIs** in both Google and Meta OAuth apps:
   - Replace `localhost:8080` with your production domain
   - Example: `https://yourdomain.com/api/oauth/google/callback`

2. **Update `.env` file** with production values:
   ```env
   GOOGLE_OAUTH_REDIRECT_BASE=https://yourdomain.com
   META_OAUTH_REDIRECT_BASE=https://yourdomain.com
   ```

3. **Submit for review** (Meta):
   - Go through Meta's App Review process to get permissions approved for production use

4. **Configure OAuth consent screen** (Google):
   - Complete the OAuth consent screen verification for production
   - Add your production domain to authorized domains

5. **Use secure storage** for tokens:
   - Currently tokens are stored in-memory (resets on server restart)
   - For production, implement database storage with encryption

---

## Current Implementation Status

✅ **Implemented:**
- Google OAuth for Gmail, YouTube, and Google Business Profile
- Meta OAuth for Facebook Pages and Instagram Business Accounts
- Token refresh logic (automatic for Google, long-lived for Meta)
- Brand-scoped connections
- Popup-based OAuth flow with postMessage

⚠️ **Limitations:**
- Tokens stored in-memory (will reset on server restart)
- No database persistence yet
- Development mode only for Meta (needs App Review for production)

---

## Next Steps

After setting up OAuth:

1. Test connecting each platform (Gmail, YouTube, Facebook, Instagram)
2. Verify accounts appear in the Accounts page
3. Test posting functionality (if implemented)
4. Set up database storage for production use

For questions or issues, refer to:
- `OAUTH_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `GOOGLE_WORKSPACE_IMPLEMENTATION.md` - Google-specific details
