# Vercel Edge Function Proxy for Whop App

This Vercel Edge Function acts as a proxy to enable Whop authentication by:
1. Intercepting `/whop-auth` requests and forwarding them to your Supabase edge function
2. Preserving the `x-whop-user-token` header that Whop injects
3. Proxying all other traffic to your Lovable app

## Setup Instructions

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy to Vercel

From your project root directory:

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Choose your account
- **Link to existing project?** No
- **Project name?** whop-app-proxy (or your preferred name)
- **Directory?** ./ (current directory)
- **Override settings?** No

This will output a URL like: `https://whop-app-proxy.vercel.app`

### 4. Configure Whop App Dashboard

In your Whop app dashboard (https://whop.com/apps), navigate to your app settings:

1. **Important**: Set the **Base URL** to your Vercel deployment URL:
   - Example: `https://whop-app-proxy.vercel.app`
   - This tells Whop to load your app through the proxy
   
2. Configure the paths:
   - **Experience Path**: `/` (or your preferred path)
   - **Dashboard Path**: `/dashboard` (optional)
   - **Discover Path**: `/discover` (optional)

**How it works**: When users access your app at `lrjz4kj7viy298e9gbl3.apps.whop.com`, Whop internally proxies to your base_url (the Vercel deployment), which captures the `x-whop-user-token` header and forwards it to authenticate users.

### 5. Test Authentication

Once deployed:
1. Open your app in the Whop iframe at `lrjz4kj7viy298e9gbl3.apps.whop.com`
2. Check browser console for authentication logs
3. You should see "Whop user via same-origin endpoint" if successful

### 6. Deploy Updates

To deploy changes:
```bash
vercel --prod
```

## Custom Domain (Optional)

To use your own domain with Vercel:

1. Go to your Vercel project dashboard
2. Click **Settings** → **Domains**
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions
5. Update Whop base_url to your custom domain

## Troubleshooting

- **No token received**: Verify Whop app configuration has correct base_url
- **CORS errors**: Check that Vercel function is deployed and accessible
- **Authentication fails**: Check Vercel function logs: `vercel logs`
- **404 errors**: Ensure `vercel.json` rewrites are configured correctly

## Vercel Logs

View real-time logs:
```bash
vercel logs --follow
```

View logs for a specific deployment:
```bash
vercel logs [deployment-url]
```
