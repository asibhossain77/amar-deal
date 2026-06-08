# Task 3+5 - Backend Agent

## Task: Update reviews API with privacy controls and create admin review moderation API

## Summary

### Part A: Updated `/src/app/api/users/[id]/reviews/route.ts`

**GET endpoint changes:**
- Added authentication requirement (401 if not logged in)
- Self access: owner sees ALL reviews including hidden, privacyLevel: "full"
- Admin access: admin sees ALL reviews including hidden, privacyLevel: "full"
- ReviewVisibility check for non-owner/non-admin:
  - "public" → non-hidden public reviews, privacyLevel: "limited"
  - "shared" → only reviews with accepted ReviewVisibilityGrant, privacyLevel: "shared"
  - "private" → 403 with Bengali message
- Never returns isHidden reviews to non-admin/non-owner viewers
- Response includes `privacyLevel` field

**POST endpoint changes:**
- Added rate limiting: max 5 reviews per day (429 if exceeded)
- isPublic defaults based on target user's reviewVisibility (false if "private")
- Allows explicit isPublic override in request body

### Part A: Created `/src/app/api/admin/reviews/route.ts`

**GET endpoint:**
- Admin-only, lists all reviews with filters (status, userId, page, limit)
- Includes fromUser and toUser details
- Paginated results

**PUT endpoint:**
- Admin-only, moderates reviews
- Actions: hide, show, delete, note
- Delete recalculates target user's ratings
- All actions logged to AdminLog

## Files Modified
- `/src/app/api/users/[id]/reviews/route.ts` - Complete rewrite with privacy controls
- `/src/app/api/admin/reviews/route.ts` - New file for admin review moderation

## Verification
- ESLint passes with no errors
- Dev server compiles successfully
