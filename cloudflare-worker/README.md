# Cloudflare Worker Proxy for Whop App

This Cloudflare Worker acts as a proxy to enable Whop authentication by:
1. Intercepting `/whop-auth` requests and forwarding them to your Supabase edge function
2. Preserving the `x-whop-user-token` header that Whop injects
3. Proxying all other traffic to your Lovable app

## Setup Instructions

### 1. Install Wrangler (Cloudflare CLI)
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Deploy the Worker
```bash
cd cloudflare-worker
wrangler deploy
```

This will output a URL like: `https://whop-app-proxy.your-account.workers.dev`

### 4. Configure Whop App Dashboard

In your Whop app dashboard (https://whop.com/apps), navigate to your app settings:

1. **Important**: Set the **Base URL** to your Cloudflare Worker URL:
   - Example: `https://whop-app-proxy.your-account.workers.dev`
   - This tells Whop to load your app through the proxy instead of directly
   
2. Configure the paths:
   - **Experience Path**: `/` (or your preferred path)
   - **Dashboard Path**: `/dashboard` (optional)
   - **Discover Path**: `/discover` (optional)

**Why this works**: When users access your app in Whop at `lrjz4kj7viy298e9gbl3.apps.whop.com`, Whop will internally proxy to your base_url (the Cloudflare Worker), which then forwards the `x-whop-user-token` header to authenticate users.

### 5. Test Authentication

Once deployed:
1. Open your app in the Whop iframe
2. Check browser console for authentication logs
3. You should see "Whop user via same-origin endpoint" if successful

## Custom Domain (Optional)

To use your own domain:

1. Add your domain to Cloudflare
2. Update `wrangler.toml`:
   ```toml
   route = "yourdomain.com/*"
   ```
3. Redeploy: `wrangler deploy`
4. Update Whop base_url to your domain

## Troubleshooting

- **No token received**: Verify Whop app configuration has correct base_url
- **CORS errors**: Check that worker is deployed and accessible
- **Authentication fails**: Check Cloudflare Worker logs: `wrangler tail`
