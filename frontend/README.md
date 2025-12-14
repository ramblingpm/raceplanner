# Race Planner Frontend

A Next.js application for planning race times, speeds, and strategies.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Design System

This project uses a token-based design system with full dark mode support. All design decisions are centralized in a single source of truth.

### Architecture

```
src/design-system/
├── tokens/
│   └── tokens.json          # Source of truth for all design tokens
├── theme/
│   ├── ThemeProvider.tsx    # React context for theme management
│   ├── useTheme.ts          # Hook for accessing theme state
│   └── index.ts
├── styles/
│   └── base.css             # CSS custom properties (light/dark)
├── components/
│   └── ThemeToggle.tsx      # Theme toggle button component
└── index.ts
```

### Semantic Color Tokens

The design system uses semantic color tokens that automatically adapt to light/dark mode:

#### Surface Colors
| Token | Usage |
|-------|-------|
| `bg-surface-background` | Main page background (white/dark) |
| `bg-surface-1` | Slightly elevated surfaces |
| `bg-surface-2` | Secondary backgrounds |
| `bg-surface-3` | Tertiary backgrounds |
| `bg-surface-inverse` | Inverted background (dark on light, light on dark) |

#### Text Colors
| Token | Usage |
|-------|-------|
| `text-text-primary` | Primary text content |
| `text-text-secondary` | Secondary/supporting text |
| `text-text-muted` | Muted/subtle text |
| `text-text-inverse` | Text on inverse backgrounds |
| `text-text-link` | Link text |
| `text-text-link-hover` | Link hover state |

#### Primary Colors
| Token | Usage |
|-------|-------|
| `bg-primary` | Primary buttons, accents |
| `bg-primary-hover` | Primary hover state |
| `text-primary` | Primary colored text |
| `text-primary-foreground` | Text on primary backgrounds |
| `bg-primary-subtle` | Subtle primary backgrounds |

#### Semantic Colors (Success, Error, Warning, Info)
Each semantic color has these variants:
- `[color]` - Base color (e.g., `text-success`)
- `[color]-subtle` - Subtle background (e.g., `bg-success-subtle`)
- `[color]-subtle-hover` - Subtle hover state
- `[color]-foreground` - Text on subtle backgrounds

| Category | Example Usage |
|----------|---------------|
| Success | Success messages, confirmations |
| Error | Error states, destructive actions |
| Warning | Warning messages, pending states |
| Info | Informational messages, links |

#### Border Colors
| Token | Usage |
|-------|-------|
| `border-border` | Default borders |
| `border-border-focus` | Focus ring color |

### Migration Reference

When updating components, use these mappings:

| Old Pattern | New Semantic Pattern |
|-------------|---------------------|
| `bg-white` | `bg-surface-background` |
| `bg-gray-50` | `bg-surface-1` |
| `bg-gray-100` | `bg-surface-2` |
| `bg-gray-900` (buttons) | `bg-surface-inverse` |
| `text-gray-900` | `text-text-primary` |
| `text-gray-600/700` | `text-text-secondary` |
| `text-gray-400/500` | `text-text-muted` |
| `border-gray-200/300` | `border-border` |
| `bg-primary-600` | `bg-primary` |
| `hover:bg-primary-700` | `hover:bg-primary-hover` |
| `text-primary-600` | `text-text-link` |
| `hover:text-primary-700` | `hover:text-text-link-hover` |
| `bg-red-50` | `bg-error-subtle` |
| `text-red-600/700` | `text-error-foreground` |
| `bg-green-50` | `bg-success-subtle` |
| `text-green-600/700` | `text-success-foreground` |
| `bg-blue-50` | `bg-info-subtle` |
| `text-blue-600/700` | `text-info-foreground` |
| `bg-yellow-100` | `bg-warning-subtle` |
| `text-yellow-800` | `text-warning-foreground` |
| `focus:ring-primary-500` | `focus:ring-border-focus` |

### Theme Usage

#### Using the Theme Hook

```tsx
import { useTheme } from '@/design-system';

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // theme: 'light' | 'dark' | 'system'
  // resolvedTheme: 'light' | 'dark' (actual applied theme)

  return (
    <button onClick={() => setTheme('dark')}>
      Switch to Dark Mode
    </button>
  );
}
```

#### Theme Toggle Component

```tsx
import { ThemeToggle } from '@/design-system';

// Add to your header/nav
<ThemeToggle />
```

### Adding New Components

When creating new components, follow these guidelines:

1. **Use semantic tokens** - Never use raw color values like `gray-500` or `blue-600`
2. **Support both themes** - All colors should work in light and dark mode
3. **Use consistent patterns**:
   - Cards: `bg-surface-background border border-border rounded-lg`
   - Buttons (primary): `bg-primary text-primary-foreground hover:bg-primary-hover`
   - Buttons (secondary): `bg-surface-2 text-text-secondary hover:bg-surface-3`
   - Inputs: `border-border focus:ring-border-focus text-text-primary bg-surface-background`
   - Error states: `bg-error-subtle text-error-foreground`
   - Success states: `bg-success-subtle text-success-foreground`

### Migrated Pages

All pages have been migrated to use semantic tokens:

- `src/app/page.tsx` - Home page
- `src/app/dashboard/page.tsx` - Dashboard
- `src/app/login/page.tsx` - Login
- `src/app/signup/page.tsx` - Signup
- `src/app/forgot-password/page.tsx` - Forgot password
- `src/app/reset-password/page.tsx` - Reset password
- `src/app/beta-signup/page.tsx` - Beta signup
- `src/app/beta-invite-action/page.tsx` - Beta invite action
- `src/app/admin/page.tsx` - Admin dashboard
- `src/app/admin/beta-invites/page.tsx` - Admin beta invites
- `src/app/terms/page.tsx` - Terms of service
- `src/app/privacy-policy/page.tsx` - Privacy policy
- `src/app/[raceSlug]/page.tsx` - Individual race page

### Migrated Components

Key components using semantic tokens:

- `src/components/Header.tsx` - Includes ThemeToggle
- `src/components/wizard/steps/ReviewStep.tsx`
- `src/components/wizard/steps/SaveStep.tsx`

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS custom properties
- **Database**: Supabase
- **Authentication**: Supabase Auth
- **Internationalization**: next-intl
- **Analytics**: Google Analytics (with consent)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── design-system/          # Design tokens and theme
├── lib/                    # Utility functions and API clients
├── types/                  # TypeScript type definitions
└── messages/               # i18n translation files
```
