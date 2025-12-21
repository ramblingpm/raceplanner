/**
 * Google Analytics tracking utilities
 * Pre-configured event trackers for Race Planner
 */

import { trackEvent } from './consent';

// Re-export user tracking functions for convenience
export { setUserId, setUserProperties, setUserIdentity, clearUserTracking } from './consent';

/**
 * Track when a user selects a race
 */
export function trackRaceSelected(raceName: string, raceId: string) {
  trackEvent('race_selected', {
    race_name: raceName,
    race_id: raceId,
  });
}

/**
 * Track when a user creates a new plan
 */
export function trackPlanCreated(raceName: string, planLabel: string, durationMinutes: number) {
  trackEvent('plan_created', {
    race_name: raceName,
    plan_label: planLabel,
    duration_minutes: durationMinutes,
  });
}

/**
 * Track when a user updates an existing plan
 */
export function trackPlanUpdated(planId: string, planLabel: string) {
  trackEvent('plan_updated', {
    plan_id: planId,
    plan_label: planLabel,
  });
}

/**
 * Track when a user deletes a plan
 */
export function trackPlanDeleted(planId: string, planLabel: string) {
  trackEvent('plan_deleted', {
    plan_id: planId,
    plan_label: planLabel,
  });
}

/**
 * Track when a user copies a plan
 */
export function trackPlanCopied(planId: string, planLabel: string) {
  trackEvent('plan_copied', {
    plan_id: planId,
    plan_label: planLabel,
  });
}

/**
 * Track when a user opens the Add Plan modal
 */
export function trackAddPlanModalOpened(location: string) {
  trackEvent('add_plan_modal_opened', {
    location, // e.g., 'dashboard_header', 'empty_state'
  });
}

/**
 * Track when a user closes the modal without saving
 */
export function trackModalCancelled(modalType: string) {
  trackEvent('modal_cancelled', {
    modal_type: modalType, // e.g., 'add_plan', 'edit_plan'
  });
}

/**
 * Track when a user adds a feed zone
 */
export function trackFeedZoneAdded(feedZoneName: string, raceName: string) {
  trackEvent('feed_zone_added', {
    feed_zone_name: feedZoneName,
    race_name: raceName,
  });
}

/**
 * Track when a user removes a feed zone
 */
export function trackFeedZoneRemoved(feedZoneName: string, raceName: string) {
  trackEvent('feed_zone_removed', {
    feed_zone_name: feedZoneName,
    race_name: raceName,
  });
}

/**
 * Track when a user changes language
 */
export function trackLanguageChanged(fromLanguage: string, toLanguage: string) {
  trackEvent('language_changed', {
    from_language: fromLanguage,
    to_language: toLanguage,
  });
}

/**
 * Track logout event
 */
export function trackLogout() {
  trackEvent('logout');
}

/**
 * Track when a user views the map
 */
export function trackMapViewed(raceName: string) {
  trackEvent('map_viewed', {
    race_name: raceName,
  });
}

/**
 * Track generic button clicks with context
 * Use this for buttons that don't have specific trackers above
 */
export function trackButtonClick(buttonName: string, location: string, additionalData?: Record<string, any>) {
  trackEvent('button_click', {
    button_name: buttonName,
    location,
    ...additionalData,
  });
}

/**
 * Track navigation events
 */
export function trackNavigation(destination: string, source: string) {
  trackEvent('navigation', {
    destination,
    source,
  });
}

/**
 * Track form submissions with specific form names
 */
export function trackFormSubmit(formName: string, additionalData?: Record<string, any>) {
  trackEvent('form_submit', {
    form_name: formName,
    ...additionalData,
  });
}

/**
 * Track when a user starts filling out a form
 */
export function trackFormStart(formName: string, additionalData?: Record<string, any>) {
  trackEvent('form_start', {
    form_name: formName,
    ...additionalData,
  });
}

/**
 * Wizard Analytics
 */
export function trackWizardOpened(source: 'dashboard' | 'race_page') {
  trackEvent('wizard_opened', {
    source,
  });
}

export function trackWizardStepViewed(step: number) {
  trackEvent('wizard_step_viewed', {
    step,
  });
}

export function trackWizardStepCompleted(step: number) {
  trackEvent('wizard_step_completed', {
    step,
  });
}

export function trackWizardRaceSelected(raceName: string, raceId: string) {
  trackEvent('wizard_race_selected', {
    race_name: raceName,
    race_id: raceId,
  });
}

export function trackWizardAbandoned(step: number, reason: 'cancelled' | 'closed') {
  trackEvent('wizard_abandoned', {
    step,
    reason,
  });
}

export function trackWizardCompleted(totalTimeSeconds: number, raceName: string) {
  trackEvent('wizard_completed', {
    total_time_seconds: totalTimeSeconds,
    race_name: raceName,
  });
}

export function trackWizardEditClicked(section: 'race' | 'time' | 'feed_zones') {
  trackEvent('wizard_edit_clicked', {
    section,
  });
}
