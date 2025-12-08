# Google Analytics Integration Guide

## Overview

The app uses Google Analytics 4 (GA4) to track user interactions and behavior. All tracking respects user cookie consent and GDPR/CCPA compliance.

## Configuration

### Environment Variable

The GA4 Measurement ID is configured via environment variable:

- **Environment Variable**: `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- **Location**: `frontend/.env`
- **Example Value**: `G-83ZSZHNKMB`

**Important**: The `NEXT_PUBLIC_` prefix is required for Next.js to expose the variable to the browser.

### Setup

1. Add to your `.env` file:
   ```
   NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-83ZSZHNKMB
   ```

2. For production, add the same variable to your deployment environment (Vercel, Netlify, etc.)

3. The tracking code is in: `src/lib/consent.ts`

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
2. Select your app property
3. Navigate to:
   - **Reports > Engagement > Events** - View all tracked events
   - **Reports > Engagement > Conversions** - Track conversion goals
   - **Configure > Events** - See event parameters
   - **Explore > Free Form** - Create custom reports

## Tracking Individual Users (Beta Users)

The app now tracks individual user activity using GA4's User ID feature. This allows you to see exactly when specific users (like your beta testers) last logged in or viewed pages.

### User Properties Tracked

Each logged-in user has the following properties set:
- **user_id**: The Supabase user ID (automatically tracked by GA4)
- **beta_user**: "yes" or "no" - indicates if the user is a beta tester
- **user_email_domain**: The domain of the user's email (e.g., "gmail.com")

#### Setting Up Custom Dimensions (One-Time Setup)

To see user properties in GA4 reports, you need to register them as custom dimensions:

1. Go to **Admin > Data Display > Custom Definitions**
2. Click **Create custom dimension**
3. Create the following dimensions:
   - **Dimension name**: Beta User
   - **Scope**: User
   - **User property**: beta_user
   - Click **Save**
4. Repeat for:
   - **Dimension name**: User Email Domain
   - **Scope**: User
   - **User property**: user_email_domain
   - Click **Save**

Note: It may take 24-48 hours for custom dimensions to start populating in reports.

### How to View User Activity in GA4

#### Option 1: User Explorer Report

1. Go to **Reports > User > User Explorer**
2. You'll see a list of all users with their User IDs
3. Click on any User ID to see:
   - Last login time
   - Last page viewed
   - All events for that user
   - Session history

#### Option 2: Create a Custom Report for Beta Users

1. Go to **Explore** in GA4
2. Click **Create a new exploration**
3. Choose **Free form** exploration
4. In **Dimensions**, add:
   - User ID
   - Event name
   - Page location
   - beta_user (custom user property)
5. In **Metrics**, add:
   - Event count
   - Active users
6. In **Settings**:
   - Drag "beta_user" to **Filters**
   - Set filter to "beta_user = yes"
   - Drag "User ID" and "Event name" to Rows
   - Drag "Event count" to Values
7. Save the exploration as "Beta User Activity"

#### Option 3: Real-Time View for Beta Users

1. Go to **Reports > Realtime**
2. Look for the "User properties" card
3. Click on "beta_user" to filter by beta users
4. See which beta users are currently active

#### Option 4: Create an Audience for Beta Users

1. Go to **Admin > Data Display > Audiences**
2. Click **New Audience**
3. Click **Create a custom audience**
4. Set condition: `beta_user = yes`
5. Name it "Beta Users"
6. Save

Now you can filter any report by the "Beta Users" audience to see only beta user activity.

### Quick Query: Last Activity for Each Beta User

To quickly see when each beta user was last active:

1. Go to **Explore > Create a new exploration**
2. Choose **Free form**
3. Add dimensions:
   - User ID
   - User email domain
   - beta_user
4. Add metrics:
   - Sessions
   - Event count
5. Add filters:
   - beta_user = yes
6. Sort by "Sessions" descending

This will show you all beta users and their session counts, helping you identify who's most/least active.

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
Add to browser console (replace with your GA4 ID):
```javascript
window['ga-disable-YOUR-GA4-ID'] = false;
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
**GA4 Configuration**: Set via `NEXT_PUBLIC_GA4_MEASUREMENT_ID` environment variable
