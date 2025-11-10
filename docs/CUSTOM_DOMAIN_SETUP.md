# Setting Up orca.lumyn.global Custom Domain

**Goal**: Point `orca.lumyn.global` to your Lumen-Orca deployment on Lovable Cloud

---

## 📋 Prerequisites

- [ ] Access to `lumyn.global` DNS settings (your domain registrar)
- [ ] Access to [Lovable Dashboard](https://lovable.dev/projects/fa2a1b8a-9faa-4f5f-9a09-960a15bc6bf6)
- [ ] Current deployment is live on Lovable

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Lovable Hosting Details

1. Open [Lovable Project Settings](https://lovable.dev/projects/fa2a1b8a-9faa-4f5f-9a09-960a15bc6bf6)
2. Navigate to **Settings → Domains**
3. Click **"Connect Domain"**
4. Enter: `orca.lumyn.global`
5. Lovable will show you DNS records to add (something like):

```
Type: CNAME
Name: orca
Value: <your-lovable-project>.lovable.app
TTL: 3600 (or Auto)
```

**Don't close this page yet** - you'll need these values for Step 2!

---

### Step 2: Configure DNS at Your Registrar

#### Where is lumyn.global hosted?

**Common Registrars**:
- Cloudflare
- Namecheap
- GoDaddy
- Google Domains
- Route 53 (AWS)

I'll show you how for each:

---

#### Option A: **Cloudflare** (Most Common)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select the `lumyn.global` domain
3. Go to **DNS → Records**
4. Click **"Add record"**
5. Configure:
   ```
   Type: CNAME
   Name: orca
   Target: <from-lovable-dashboard>.lovable.app
   Proxy status: DNS only (gray cloud, not orange)
   TTL: Auto
   ```
6. Click **"Save"**

**Important**: Make sure proxy is **OFF** (gray cloud ☁️, not orange 🟠) for initial setup!

---

#### Option B: **Namecheap**

1. Log in to [Namecheap](https://www.namecheap.com/myaccount/login/)
2. Go to **Domain List → Manage** for `lumyn.global`
3. Click **Advanced DNS** tab
4. Click **"Add New Record"**
5. Configure:
   ```
   Type: CNAME Record
   Host: orca
   Value: <from-lovable-dashboard>.lovable.app
   TTL: Automatic
   ```
6. Click ✓ to save

---

#### Option C: **GoDaddy**

1. Log in to [GoDaddy](https://www.godaddy.com/)
2. Go to **My Products → DNS**
3. Find `lumyn.global` and click **DNS**
4. Scroll to **Records** section
5. Click **"Add"**
6. Configure:
   ```
   Type: CNAME
   Name: orca
   Value: <from-lovable-dashboard>.lovable.app
   TTL: 1 Hour
   ```
7. Click **"Save"**

---

#### Option D: **Google Domains**

1. Log in to [Google Domains](https://domains.google.com/)
2. Select `lumyn.global`
3. Click **DNS** in left menu
4. Scroll to **Custom resource records**
5. Add:
   ```
   Name: orca
   Type: CNAME
   TTL: 1h
   Data: <from-lovable-dashboard>.lovable.app
   ```
6. Click **"Add"**

---

#### Option E: **AWS Route 53**

1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Go to **Route 53 → Hosted zones**
3. Select `lumyn.global`
4. Click **"Create record"**
5. Configure:
   ```
   Record name: orca
   Record type: CNAME
   Value: <from-lovable-dashboard>.lovable.app
   TTL: 300
   Routing policy: Simple routing
   ```
6. Click **"Create records"**

---

### Step 3: Verify in Lovable Dashboard

1. Go back to Lovable Dashboard → Settings → Domains
2. You should see `orca.lumyn.global` with status **"Verifying..."**
3. Wait 5-10 minutes for DNS propagation
4. Lovable will automatically verify and provision SSL certificate
5. Status will change to **"Active"** ✅

---

## 🔍 Verify DNS is Working

### Method 1: Command Line (Fastest)

```bash
# Check if DNS is propagated
dig orca.lumyn.global

# Should show CNAME record pointing to Lovable
# Look for a line like:
# orca.lumyn.global. 3600 IN CNAME xyz123.lovable.app.
```

Or on Windows:
```cmd
nslookup orca.lumyn.global
```

### Method 2: Online Tools

Use [DNS Checker](https://dnschecker.org/):
1. Enter: `orca.lumyn.global`
2. Select: CNAME
3. Click **"Search"**
4. Should show your Lovable CNAME globally

---

## ⏱️ How Long Does It Take?

| Step | Time |
|------|------|
| Add DNS record | Immediate |
| DNS propagation | 5 min - 2 hours (typically 10-15 min) |
| Lovable verification | Automatic once DNS propagates |
| SSL certificate | Automatic (1-5 min after verification) |
| **Total** | **15-30 minutes typically** |

---

## 🔐 SSL Certificate (Automatic)

Lovable automatically provisions a **free SSL certificate** via Let's Encrypt:
- ✅ HTTPS enabled automatically
- ✅ Auto-renewal every 90 days
- ✅ No action needed from you

After setup, your site will be accessible at:
- ✅ `https://orca.lumyn.global` (secure)
- ✅ `http://orca.lumyn.global` (redirects to HTTPS)

---

## 🎯 Testing Your Custom Domain

Once DNS propagates and SSL is provisioned:

### 1. Test the Homepage
```bash
curl -I https://orca.lumyn.global
# Should return: HTTP/2 200
```

### 2. Test in Browser
Visit: https://orca.lumyn.global
- ✅ Should load Lumen-Orca dashboard
- ✅ Green padlock in address bar (SSL working)
- ✅ No certificate warnings

### 3. Test Health Endpoint
```bash
curl https://orca.lumyn.global/health
# Should return system health status
```

### 4. Test API
```bash
curl -I https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/health
# Backend API should still work
```

---

## 🐛 Troubleshooting

### Problem: DNS not propagating after 30 minutes

**Solution**:
```bash
# Clear local DNS cache

# macOS:
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Windows:
ipconfig /flushdns

# Linux:
sudo systemd-resolve --flush-caches
```

### Problem: "DNS_PROBE_FINISHED_NXDOMAIN" error

**Causes**:
1. DNS record not added correctly
2. Typo in subdomain name
3. DNS hasn't propagated yet

**Solution**:
- Double-check DNS record in registrar
- Wait 15 more minutes
- Try `dig orca.lumyn.global` to verify

### Problem: Certificate error in browser

**Causes**:
1. Lovable hasn't verified domain yet
2. SSL provisioning in progress

**Solution**:
- Check Lovable Dashboard → Domains for status
- Wait 5 more minutes for SSL provisioning
- If stuck, click "Re-verify" in Lovable dashboard

### Problem: 404 Not Found after domain works

**Causes**:
- Domain verified but app not deployed

**Solution**:
```bash
# Trigger a new deployment
git commit --allow-empty -m "chore: trigger deployment"
git push origin claude/launch-ready-today-011CUztATSam7wwbDYjfB5FY
```

---

## 📊 Verification Checklist

After setup, verify everything works:

- [ ] `https://orca.lumyn.global` loads dashboard
- [ ] SSL certificate is valid (green padlock)
- [ ] No mixed content warnings
- [ ] Authentication works (login/signup)
- [ ] API endpoints work
- [ ] Health check returns 200 OK
- [ ] Old Lovable URL still works (for testing)

---

## 🔄 Updating DNS Later

If you need to change hosting:

1. Update CNAME record to point to new host
2. Wait for DNS propagation (15-60 min)
3. Update SSL certificate if needed

**Note**: Keep old CNAME for 24 hours during migration to prevent downtime!

---

## 🌐 Multiple Domains (Optional)

Want both domains to work?
- Primary: `orca.lumyn.global`
- Alias: `lumenorca.app`

Configure both in Lovable:
1. Add `orca.lumyn.global` as primary
2. Add `lumenorca.app` as alias
3. Set one as default for redirects

---

## 📧 Email Setup (Optional)

If you want `support@orca.lumyn.global`:

### Option 1: Google Workspace / Gmail
1. Add MX records in DNS:
   ```
   Type: MX
   Name: @
   Priority: 1
   Value: smtp.google.com
   ```

### Option 2: Cloudflare Email Routing (Free!)
1. In Cloudflare: Email → Email Routing
2. Add destination: your-email@gmail.com
3. Add custom address: support@orca.lumyn.global
4. Cloudflare provides MX records to add

---

## 🚀 Going Live Checklist

Before announcing the new domain:

- [ ] DNS fully propagated (check globally with dnschecker.org)
- [ ] SSL certificate active and valid
- [ ] All pages load correctly
- [ ] Authentication flows work
- [ ] API endpoints accessible
- [ ] Health check returns healthy status
- [ ] No console errors in browser
- [ ] Mobile version works
- [ ] Test from different locations/networks
- [ ] Update documentation with new URL
- [ ] Update social media links
- [ ] Update README.md with new domain
- [ ] Set up redirects from old URL (if applicable)

---

## 📝 Update Your Docs

After domain is live, update:

### 1. README.md
```markdown
🌐 **Production**: https://orca.lumyn.global
📖 **User Guide**: https://orca.lumyn.global/guide
🔌 **API**: https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1
```

### 2. API Documentation
Update base URLs:
```typescript
// Old
const APP_URL = 'https://lovable.dev/projects/...'

// New
const APP_URL = 'https://orca.lumyn.global'
```

### 3. Environment Variables
If using custom domain in code:
```env
VITE_APP_URL=https://orca.lumyn.global
```

---

## 🎉 Success!

Once everything is working:

**Your Lumen-Orca installation will be live at:**
- 🌐 **Main App**: https://orca.lumyn.global
- 📖 **User Guide**: https://orca.lumyn.global/guide
- 🎬 **Demo**: https://orca.lumyn.global/demo
- 📊 **Dashboard**: https://orca.lumyn.global/dashboard
- ⚕️ **Health Check**: https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/health

**Share it with the world!** 🚀

---

## 💡 Pro Tips

1. **Use Cloudflare** (if not already): Free CDN, DDoS protection, analytics
2. **Enable Cloudflare Proxy** (orange cloud) AFTER initial setup for:
   - Faster load times (global CDN)
   - Better security (DDoS protection)
   - Free analytics
3. **Set up monitoring**: Use UptimeRobot to monitor `orca.lumyn.global`
4. **Configure alerts**: Get notified if site goes down

---

**Need help?** Drop the error message and I'll help debug! 🛠️

---

*Last Updated: 2025-11-10*
