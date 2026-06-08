# Task 6: Update PublicProfilePage for Privacy System

## Summary
Updated `/home/z/my-project/src/components/profile/PublicProfilePage.tsx` to respect the privacy system by conditionally rendering UI based on `privacyLevel` from the API response.

## Changes Made

### New State Variables
- `privacyLevel`: 'full' | 'shared' | 'limited' — extracted from API response
- `canRequestAccess`: boolean — extracted from API response
- `accessRequestOpen`: boolean — dialog state
- `submittingAccessRequest`: boolean — loading state

### New Component
- `PrivacyProtectedIndicator` — circular dashed border with Lock icon and "গোপনীয় সুরক্ষিত" text, accepts size prop

### New Icons
- `Lock`, `ShieldCheck`, `EyeOff`, `Share2` from lucide-react

### Conditional Rendering

**Limited (general public):**
- Quick Stats: "—" placeholders, PrivacyProtectedIndicator instead of TrustScoreRing
- Trust Panel: PrivacyProtectedIndicator, trust indicator badges, "রেটিং তথ্য গোপনীয়" and "পরিসংখ্যান গোপনীয়" messages
- Detailed Stats: Privacy card with Lock icon and rating indicator badges
- Reviews: "রিভিউ দেখার অনুমতি নেই" with Request Access button
- Header badges: "সীমিত দৃশ্যমানতা", trust/rating indicator badges

**Shared (granted visibility):**
- Quick Stats: Available data shown, PrivacyProtectedIndicator for hidden trust score
- Trust Panel: "শেয়ার করা অ্যাক্সেস" badge, available progress bars, limited stats
- Detailed Stats: Available stats shown, in-progress/disputed hidden
- Reviews: Shared reviews with "শেয়ার করা রিভিউ দেখছেন" badge
- Header badges: "শেয়ার করা অ্যাক্সেস"

**Full (owner/admin):**
- All existing behavior preserved unchanged

### Request Access Dialog
- Shows when `canRequestAccess` is true and privacyLevel is "limited"
- Bengali text: "এই ব্যবহারকারীর রিভিউ ও রেটিং দেখতে অনুমতি চান?"
- Toast on submit: "অনুরোধ পাঠানো হয়েছে"

### Safe Accessors
All optional profile fields use nullish coalescing (??) to handle undefined values gracefully.

## Verification
- Lint passes with no errors
- Dev server compiles successfully
