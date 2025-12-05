# 🔧 Smart Home Frontend Debug Guide

## 🚨 Current Issue: SSL Certificate Error

Your backend is running on **HTTPS** (`https://localhost:7140`) with a self-signed certificate. Browsers block these connections for security.

## 🔍 Quick Diagnosis

1. **Test SSL Connection**: Visit `/ssl-test` page
2. **Check Browser Console**: Look for SSL/certificate errors
3. **Test Backend Directly**: Open `https://localhost:7140/swagger/index.html`

## ✅ Solution Steps

### Step 1: Accept SSL Certificate

1. Open `https://localhost:7140` in your browser
2. Click **"Advanced"** button
3. Click **"Proceed to localhost (unsafe)"**
4. Accept the certificate warning

### Step 2: Test Connection

1. Visit `/ssl-test` page in your app
2. Click "Test HTTPS Health" button
3. Should see ✅ SUCCESS message

### Step 3: Test Login

1. Click "Test HTTPS Login" button
2. Should see login success or proper error message

## 🔧 Alternative Solutions

### Option 1: Use HTTP Instead

If SSL issues persist, configure backend to use HTTP:

```bash
# In backend startup
dotnet run --urls="http://localhost:7140"
```

### Option 2: Browser Flags (Chrome)

```bash
chrome.exe --ignore-certificate-errors --ignore-ssl-errors --allow-running-insecure-content
```

### Option 3: Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://localhost:7140/api
```

## 🐛 Common Errors & Solutions

### Error: "certificate verify failed"

**Solution**: Accept certificate in browser first

### Error: "CORS policy"

**Solution**: Backend needs CORS configuration for `http://localhost:3000`

### Error: "500 Internal Server Error"

**Solution**: Check backend logs, ensure API endpoints are working

### Error: "Network Error"

**Solution**: Ensure backend is running on correct port

## 🧪 Testing Tools

### 1. SSL Test Page

- Visit: `http://localhost:3000/ssl-test`
- Tests HTTPS connection and SSL certificate

### 2. Simple Test Page

- Visit: `http://localhost:3000/simple-test`
- Tests basic API connection

### 3. Browser Developer Tools

- F12 → Console tab
- Look for network errors and SSL warnings

## 📋 Backend Requirements

Your backend should have:

1. **CORS enabled** for `http://localhost:3000`
2. **HTTPS endpoint** working on `https://localhost:7140`
3. **API endpoints** responding correctly
4. **Authentication** working properly

## 🔄 Testing Sequence

1. **Backend Health**: `https://localhost:7140/api/health/live`
2. **SSL Certificate**: Accept in browser
3. **Frontend Connection**: Test via `/ssl-test`
4. **Authentication**: Test login functionality
5. **Full App**: Try logging in normally

## 📞 Need Help?

If issues persist:

1. Check backend console logs
2. Verify backend is running on correct port
3. Test backend endpoints directly in browser
4. Check CORS configuration in backend
5. Try different browser or incognito mode
