---
Task ID: 1
Agent: Main Agent
Task: Fix session getting lost intermittently and admin panel status change not working

Work Log:
- Investigated the project structure and identified key auth/session components
- Found root causes for both issues:
  1. Session loss: No 401/403 handling in API client, no periodic session check, no proper NextAuth session config
  2. Status change not working: Dispute resolution API mismatch (frontend sends `status`, backend expects `outcome`)
  3. TransactionDetailPage crash: `isDisputed` and `isCancelled` variables defined inside `.map()` callback but used outside of it
- Fixed API client (`src/lib/api.ts`): Added auto-logout on 401/403 responses, added `logout()` method
- Fixed dispute resolution API mismatch (`src/lib/api.ts` and `src/components/disputes/DisputeDetailPage.tsx`): Changed `status` to `outcome`
- Improved session persistence (`src/components/auth/AuthProvider.tsx`): Added NextAuth `useSession` integration, periodic session checks (5 min), window focus re-check
- Added proper JWT/session config (`src/lib/auth.ts`): Added `maxAge` for session and JWT, added `trigger` support in jwt callback
- Fixed Header logout to call NextAuth `signOut` (`src/components/shared/Header.tsx`)
- Added toast error feedback to AdminPaymentsPage and DisputeDetailPage
- Fixed TransactionDetailPage crash: Moved `isDisputed` and `isCancelled` to component level
- Added ErrorBoundary to page.tsx wrapping all dashboard pages

Stage Summary:
- Session persistence significantly improved with periodic checks, window focus re-check, and NextAuth refetchInterval
- Admin status change now works - verified transaction status change and payment approval in browser
- Dispute resolution API mismatch fixed (status → outcome)
- TransactionDetailPage crash fixed (isDisputed/isCancelled scope issue)
- Error boundary added for graceful error handling
- All changes pass lint check
