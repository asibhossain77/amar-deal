---
Task ID: 1
Agent: Main Agent
Task: Fix all bugs in Bangla Escrow Website

Work Log:
- Identified root cause of "Submit Payment" button not working: seed data had inconsistent state (t1 transaction was in `pending_payment` status but already had a pending payment, so new submissions were rejected)
- Fixed seed data: removed inconsistent pending payment, added new `pending_verification` transaction with proper payment, added `SiteSetting` records for bKash/Nagad/Rocket/Bank payment accounts
- Enhanced PaymentSubmitPage: added toast notifications for success/error, improved account info display with larger fonts and better layout, added loading state for account info, added fallback message when account info is not configured
- Added toast notifications to AdminUsersPage for status change success/failure
- Added Zustand persist middleware for session persistence (persists user, isAuthenticated, currentPage to localStorage)
- Improved page.tsx session check: only shows loading when no persisted auth state exists, doesn't logout on network errors, only clears user on definitive 401 response
- Improved api.ts: removed forced redirect on 401, lets page router handle it naturally
- Re-seeded database with fixed data
- Verified all APIs work correctly: homepage, login, user data, transactions, payment settings, payment submission

Stage Summary:
- All 4 bugs fixed: Payment submit button, account number display, admin status change feedback, session persistence
- Payment account settings now seeded: bKash (01712345678), Nagad (01812345678), Rocket (01912345678), Bank (ডাচ বাংলা ব্যাংক)
- Payment submission API verified working (returns 201 with payment data)
- Lint passes with no errors
