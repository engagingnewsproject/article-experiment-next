# Deployment Guide for Research Dashboard

## Netlify Deployment

### Current Authentication System

The research dashboard uses a simple client-side authentication system that will work on Netlify, but has some security considerations:

✅ **What Works:**
- Client-side password and email validation
- Session management with localStorage
- No server-side dependencies
- Works with static site generation

⚠️ **Security Considerations:**
- Credentials are visible in client-side code
- No server-side validation
- Anyone can inspect the source code

### Option 1: Deploy as-is (Simple)

The current system will work on Netlify without any changes:

1. **Push to GitHub**
2. **Connect to Netlify**
3. **Deploy** - authentication will work immediately

### Option 2: Use Environment Variables (Recommended)

For better security, use environment variables to hide credentials:

#### Step 1: Create Environment Variables in Netlify

In your Netlify dashboard, go to **Site settings > Environment variables** and add:

```
NEXT_PUBLIC_RESEARCH_DASHBOARD_PASSWORD=your-secure-password-here
NEXT_PUBLIC_RESEARCH_DASHBOARD_EMAILS=email1@example.com,email2@example.com,email3@example.com
```

#### Step 2: Update Your Code

The code is already set up to use environment variables. If you want to change the credentials:

1. **Edit `src/lib/auth.ts`** to update the default values
2. **Set environment variables** in Netlify
3. **Redeploy** the site

#### Step 3: Local Development

Create a `.env.local` file in your project root:

```bash
# .env.local
NEXT_PUBLIC_RESEARCH_DASHBOARD_PASSWORD=your-dev-password
NEXT_PUBLIC_RESEARCH_DASHBOARD_EMAILS=your-email@example.com,other-email@example.com
```

### Option 3: Server-Side Authentication (Most Secure)

For maximum security, consider implementing server-side authentication:

1. **Use Netlify Functions** for authentication
2. **Implement JWT tokens**
3. **Store credentials server-side**
4. **Add rate limiting**

## Current Default Credentials

- **Password**: `research2025!`
- **Allowed Emails**: 
  - `davlungu3@gmail.com`
  - `luke@lukecarlhartman.com`
  - `researcher@research2025.com`

## Deployment Steps

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Test locally**:
   ```bash
   npm start
   ```

3. **Deploy to Netlify**:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add environment variables if using Option 2

4. **Configure custom domain** (optional)

## Security Recommendations

1. **Use strong passwords** (12+ characters, mix of types)
2. **Limit email access** to only necessary researchers
3. **Regularly rotate credentials**
4. **Monitor access logs** if available
5. **Consider IP restrictions** for additional security

## Troubleshooting

### Authentication Not Working
- Check environment variables are set correctly
- Verify email addresses are comma-separated
- Clear browser localStorage and try again

### Build Errors
- Ensure all dependencies are installed
- Check for TypeScript errors
- Verify environment variable names start with `NEXT_PUBLIC_`

### Deployment Issues
- Check Netlify build logs
- Verify build command and publish directory
- Ensure environment variables are set in Netlify dashboard 