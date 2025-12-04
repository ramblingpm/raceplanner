# Google Analytics Integration Guide

## Overview

The Race Planner app uses Google Analytics 4 (GA4) to track user interactions and behavior. All tracking respects user cookie consent and GDPR/CCPA compliance.

## Tracking ID

- **GA4 Measurement ID**: `G-83ZSZHNKMB`
- Configured in: `src/lib/consent.ts`

## How It Works

1. **Cookie Consent**: Users must accept cookies before GA is initialized
2. **Auto-consent for Logged-in Users**: Users who sign up automatically consent
3. **Event Tracking**: Only sends events if consent is given

## Available Tracking Functions

### Core Functions (`src/lib/consent.ts`)

#### `trackEvent(eventName, eventParams?)`
Track any custom event with optional parameters.

```typescript
import { trackEvent } from '@/lib/consent';

trackEvent('custom_action', {
  action_type: 'example',
  value: 123
});
```

#### `trackPageView(path, title?)`
Track page views for SPA navigation.

```typescript
import { trackPageView } from '@/lib/consent';

trackPageView('/dashboard', 'Dashboard');
```

### Pre-configured Event Trackers (`src/lib/analytics.ts`)

#### Race Selection
```typescript
import { trackRaceSelected } from '@/lib/analytics';

trackRaceSelected('Vätternrundan 315', 'race-id-123');
```

#### Plan Management
```typescript
import {
  trackPlanCreated,
  trackPlanUpdated,
  trackPlanDeleted,
  trackPlanCopied
} from '@/lib/analytics';

// When creating a plan
trackPlanCreated('Vätternrundan 315', 'Conservative Plan', 600);

// When updating a plan
trackPlanUpdated('plan-id-123', 'Updated Plan');

// When deleting a plan
trackPlanDeleted('plan-id-123', 'Old Plan');

// When copying a plan
trackPlanCopied('plan-id-123', 'Plan to Copy');
```

#### Modal Interactions
```typescript
import {
  trackAddPlanModalOpened,
  trackModalCancelled
} from '@/lib/analytics';

// When opening the Add Plan modal
trackAddPlanModalOpened('dashboard_header');

// When user closes modal without saving
trackModalCancelled('add_plan');
```

#### Feed Zone Tracking
```typescript
import {
  trackFeedZoneAdded,
  trackFeedZoneRemoved
} from '@/lib/analytics';

trackFeedZoneAdded('Motala', 'Vätternrundan 315');
trackFeedZoneRemoved('Motala', 'Vätternrundan 315');
```

#### Authentication Events
```typescript
import { trackSignup, trackLogin, trackLogout } from '@/lib/analytics';

trackSignup('email'); // or 'google', 'github', etc.
trackLogin('email');
trackLogout();
```

#### Navigation
```typescript
import { trackNavigation } from '@/lib/analytics';

trackNavigation('/dashboard', '/home');
```

#### Generic Button Clicks
```typescript
import { trackButtonClick } from '@/lib/analytics';

trackButtonClick('submit_form', 'dashboard', {
  form_type: 'plan_creation'
});
```

## Current Implementation

Events are currently tracked in:

### Dashboard (`src/app/dashboard/page.tsx`)
- ✅ Race selection
- ✅ Add Plan button click
- ✅ Edit plan button click
- ✅ Copy plan button click
- ✅ Delete plan button click
- ✅ Modal open/close events

### Race Calculator (`src/components/RaceCalculator.tsx`)
- ✅ Plan creation
- ✅ Plan updates

### Feed Zone Selector (`src/components/FeedZoneSelector.tsx`)
- ✅ Feed zone added
- ✅ Feed zone removed

## How to Add New Event Tracking

### Step 1: Choose or Create a Tracking Function

**Option A**: Use existing function from `src/lib/analytics.ts`

**Option B**: Create a new function in `src/lib/analytics.ts`:

```typescript
export function trackNewFeature(param1: string, param2: number) {
  trackEvent('new_feature_used', {
    parameter_1: param1,
    parameter_2: param2,
  });
}
```

### Step 2: Import and Use in Your Component

```typescript
import { trackNewFeature } from '@/lib/analytics';

function MyComponent() {
  const handleClick = () => {
    // Your logic here

    // Track the event
    trackNewFeature('example', 42);
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

## Viewing Analytics Data

1. Log in to [Google Analytics](https://analytics.google.com/)
2. Select your Race Planner property
3. Navigate to:
   - **Reports > Engagement > Events** - View all tracked events
   - **Reports > Engagement > Conversions** - Track conversion goals
   - **Configure > Events** - See event parameters
   - **Explore > Free Form** - Create custom reports

## Event Naming Conventions

Follow these conventions for consistent tracking:

- Use **snake_case** for event names: `plan_created`, `button_click`
- Use descriptive names: `add_plan_modal_opened` instead of `modal_open`
- Group related events with prefixes: `plan_created`, `plan_updated`, `plan_deleted`
- Parameter names should also use **snake_case**: `race_name`, `plan_label`

## Debugging

### Check if GA is loaded:
```javascript
// In browser console
console.log(window.gtag);
```

### Check if consent is given:
```javascript
// In browser console
import { hasConsent } from '@/lib/consent';
console.log(hasConsent());
```

### View events in real-time:
1. Open Google Analytics
2. Go to **Reports > Realtime**
3. Perform actions in your app
4. Watch events appear in real-time

### Enable GA Debug Mode:
Add to browser console:
```javascript
window['ga-disable-G-83ZSZHNKMB'] = false;
```

## Privacy & Compliance

- ✅ Cookie consent banner implemented
- ✅ GDPR compliant (requires user consent)
- ✅ No tracking without consent
- ✅ Logged-in users auto-consent (agreed during signup)
- ✅ No personally identifiable information (PII) tracked
- ✅ User can revoke consent anytime

## Best Practices

1. **Don't track PII**: Never send emails, passwords, or personal data
2. **Be consistent**: Use the pre-defined functions in `analytics.ts`
3. **Track important actions**: Focus on user journeys and conversions
4. **Use meaningful parameters**: Make events easy to analyze later
5. **Test locally**: Verify events work before deploying
6. **Document new events**: Update this file when adding new tracking

## Common Events to Track

Consider tracking these additional events:

- [ ] Map interactions (zoom, pan, marker clicks)
- [ ] Language changes
- [ ] Export/share functionality
- [ ] Error messages shown to users
- [ ] Search queries
- [ ] Filter applications
- [ ] Tutorial/onboarding completion
- [ ] Settings changes

## Support

For issues or questions:
- Check browser console for errors
- Verify consent is given
- Check GA real-time reports
- Review this documentation

---

**Last Updated**: December 2025
**GA4 Property ID**: G-83ZSZHNKMB
