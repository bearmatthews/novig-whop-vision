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

In your Whop app dashboard (https://whop.com/apps), set:

- **Base URL**: `https://whop-app-proxy.your-account.workers.dev`
- **Experience Path**: `/experience` (or your preferred path)
- **Dashboard Path**: `/dashboard` (or your preferred path)
- **Discover Path**: `/discover` (or your preferred path)

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
