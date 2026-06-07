# Task 6 - Styling Agent: DashboardLayout Green Theme Update

## Summary
Updated `/home/z/my-project/src/components/dashboard/DashboardLayout.tsx` to use the soft green (#6BBF59) semantic color palette instead of hardcoded blue/gray classes.

## Changes Made

### Color Class Replacements (20 total mappings applied)
| Old Class | New Class | Occurrences |
|-----------|-----------|-------------|
| `bg-blue-600` | `bg-primary` | 1 (sidebar logo icon) |
| `text-white` | `text-primary-foreground` | 1 (text on primary bg) |
| `text-blue-600` | `text-primary` | 3 (active nav icons ×2, mobile header icon) |
| `text-blue-700` | `text-primary` | 3 (active nav text ×2, avatar fallback, role badge) |
| `bg-blue-50` | `bg-primary/10` | 3 (active nav bg ×2, role badge bg) |
| `bg-blue-100` | `bg-primary/10` | 1 (avatar fallback bg) |
| `text-gray-900` | `text-foreground` | 3 (headings, user name, mobile header title) |
| `text-gray-600` | `text-muted-foreground` | 2 (inactive nav text ×2) |
| `text-gray-500` | `text-muted-foreground` | 2 (subtitle, user email) |
| `text-gray-400` | `text-muted-foreground` | 4 (section labels ×2, inactive nav icons ×2) |
| `bg-gray-50` | `bg-background` | 1 (main layout bg) |
| `bg-white` | `bg-card` | 2 (sidebar container, mobile header) |
| `border-gray-100` | `border-border` | 2 (sidebar header, user info section) |
| `border-gray-200` | `border-border` | 2 (desktop sidebar border, mobile header border) |
| `hover:bg-gray-50` | `hover:bg-accent` | 2 (nav hover states ×2) |
| `hover:text-gray-900` | `hover:text-foreground` | 2 (nav hover text ×2) |

### Cleanup
- Removed unused `X` import from lucide-react

### Preserved
- All Bangla text unchanged
- All component structure and functionality unchanged
- Logout button red styling intentionally preserved (destructive action convention)

## Verification
- `grep` for `blue-\d+` and `gray-\d+` patterns: **0 matches** — all hardcoded colors removed
- `bun run lint`: **passes with no errors**
- CSS variables in `globals.css` already configured with `--primary: #6BBF59` and matching green palette
