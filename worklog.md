---
Task ID: 1-7
Agent: Main Agent
Task: Implement dynamic per-gateway payment theming system

Work Log:
- Updated Prisma schema: added themeEnabled, primaryColor, buttonColor, borderColor, backgroundColor to PaymentGateway model
- Removed PaymentGatewayTheme singleton model from schema
- Ran db:push to sync database schema
- Updated existing gateway data with per-gateway theme colors (bKash Pink, Nagad Orange, Rocket Purple, Bank Blue)
- Updated backend API routes (gateways POST and PUT) to accept and persist theme fields
- Deleted old /api/gateway-theme route
- Updated TypeScript types (PaymentGateway with theme fields, removed PaymentGatewayTheme)
- Updated API client (added theme fields to createGateway, removed getGatewayTheme/updateGatewayTheme)
- Rewrote AdminGatewayThemePage with per-gateway color pickers, live preview, theme toggle
- Updated PaymentSubmitPage to use per-gateway theme colors dynamically
- Updated payment-gateway.css with dark mode adaptation and smooth transitions
- Updated AdminGatewaysPage with theme fields in create/edit dialog and theme badges
- Updated seed.ts with per-gateway default theme colors
- Lint passes clean

Stage Summary:
- All backend and frontend code changes are complete
- API returns per-gateway theme colors correctly
- Gateways API tested: bKash=#E2136E, Nagad=#F6921E, Rocket=#8B2F8B, Bank=#1E5AA8
- Server keeps dying intermittently (sandbox resource issue, not code issue)

