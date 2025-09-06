# Search Insights Hub - Restart Checklist

## ✅ Environment Setup Requirements

### Prerequisites
- [ ] Node.js 18+ installed
- [ ] npm or yarn package manager
- [ ] Git configured
- [ ] VS Code or preferred IDE
- [ ] Windows Terminal or Command Prompt

### Required Files
- [ ] `.env.local` file configured (check if exists)
- [ ] `prisma/dev.db` database file (will be created if missing)
- [ ] All npm dependencies installed

## 🚀 Quick Restart Commands

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Generate Prisma client
npm run prisma:generate

# 3. Run database migrations (if needed)
npm run prisma:migrate

# 4. Start development server
npm run dev

# 5. (Optional) Open Prisma Studio in new terminal
npm run prisma:studio
```

## 📍 Current Git State

- **Branch**: main
- **Latest Commit**: b0da2dd - Fix token refresh handling and change login redirect to /admin
- **Working Directory**: Clean (except PROJECT_DOCUMENTATION.md - untracked)
- **Remote**: https://github.com/JLcilliers/Client-Report-New-Aug.git

## 🎬 Production Deployment

| Component | Details |
|-----------|----------|
| **Live URL** | https://searchsignal.online |
| **Platform** | Vercel (auto-deploys) |
| **Repository** | GitHub → Vercel pipeline |
| **Database** | PostgreSQL (production) |
| **Deploy Command** | `git push origin main` |

## 🏃 Optional Local Testing Services

| Service | Command | Port | Purpose |
|---------|---------|------|----------|
| Next.js Dev | `npm run dev` | 3000 | Local testing only |
| Prisma Studio | `npm run prisma:studio` | 5555 | Database GUI |
| Database | SQLite (local) | - | Local dev only |

## 🎛️ Active Feature Flags

All feature flags are currently **ENABLED** in `.env.local`:
- ✅ ENABLE_GA4=true
- ✅ ENABLE_GSC=true
- ✅ ENABLE_PAGESPEED=true
- ✅ ENABLE_AUTO_REFRESH=true
- ✅ ENABLE_CLIENT_REPORTS=true

## 🧪 Test Suite Status

- **Automated Tests**: `npm run test:auto`
- **Production Scanner**: `npm run production:scan`
- **Type Checking**: `npm run typecheck`
- **Linting**: `npm run lint`

## ⚙️ Environment Variables Check

Verify these critical variables in `.env.local`:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=[your_client_id]
GOOGLE_CLIENT_SECRET=[your_client_secret]
PAGESPEED_API_KEY=[your_api_key]
```

## 🔍 Quick Health Checks

After starting the dev server:
1. Navigate to http://localhost:3000 - Should show login page
2. Check console for any errors
3. Try "Quick Admin Access" button
4. Verify /admin dashboard loads

## ⚠️ Known Issues to Watch For

1. **Port 3000 in use**: Kill existing process with:
   ```bash
   netstat -ano | findstr :3000
   taskkill //PID [PID] //F
   ```

2. **Token refresh errors**: Accounts may need re-authentication if missing refresh tokens

3. **Simple admin OAuth**: Needs redirect URI added to Google Cloud Console

## 📝 Last Session Summary

- **Stopped At**: Token refresh handling and login redirect fixes
- **Completed**: Error handling improvements, documentation updates
- **Next Priority**: Add redirect URI to Google Cloud Console
- **Files Modified**: 
  - app/page.tsx (login redirect)
  - app/api/admin/google-accounts/[id]/refresh/route.ts (token refresh)
  - app/admin/google-accounts/page.tsx (error handling)

## 🚦 Ready to Resume Checklist

- [ ] Development server running on port 3000
- [ ] No TypeScript errors in console
- [ ] Can access http://localhost:3000
- [ ] Git status shows expected state
- [ ] Environment variables loaded correctly

---

*Generated: September 6, 2025*
*Project: Search Insights Hub*