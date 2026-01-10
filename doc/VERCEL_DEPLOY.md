Vercel deployment checklist for SmartHome Admin

Follow these steps to deploy and verify the app on Vercel.

1) Environment variables (Production)
- `NEXT_PUBLIC_API_URL` = the backend base URL, e.g. `https://smarthomeapiv3vps.twilightparadox.com/api`
- `NEXT_PUBLIC_API_USE_PROXY` = `true` (if you want to route FE calls through Next.js proxy `/api/proxy`)
- `NEXT_PUBLIC_PROXY_DEBUG` = `true` (optional, forwards backend status/body for debug)

2) Build & Output
- Build command: `npm run build`
- Output directory: (Vercel detects Next.js automatically)

3) Mixed content & CORS
- If your backend only exposes HTTP (insecure), enable proxy routing via `NEXT_PUBLIC_API_USE_PROXY=true`. The proxy runs server-side and avoids browser mixed-content/CORS.
- Ensure `src/app/api/proxy/[...path]/route.ts` points to a correct backend host (it normalizes env vars).

4) DNS / ENOTFOUND troubleshooting
- If proxy reports ENOTFOUND, confirm `NEXT_PUBLIC_API_URL` contains a valid hostname and protocol (`http` or `https`).
- Avoid trailing characters or quotes in env value.

5) Testing in Production
- After deploy, open browser console (F12) and check network calls to `/api/...` — proxy calls should appear as same-origin.
- If you see HTML error pages returned from proxy, enable `NEXT_PUBLIC_PROXY_DEBUG=true` to surface backend body.

6) Rollbacks
- Use Vercel's deployments UI to roll back to previous working deployment.

7) Additional tips
- Use secrets in Vercel dashboard (not in repo).
- If the backend requires CORS origin, add `https://your-vercel-domain.vercel.app` as allowed origin.


