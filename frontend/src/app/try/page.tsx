'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Header from '@/components/Header';
import PageViewTracker from '@/components/PageViewTracker';
import TrackedLink from '@/components/TrackedLink';
import { trackEvent } from '@/lib/consent';

export default function TryCalculatorPage() {
  const t = useTranslations('tryCalculator');

  const [distance, setDistance] = useState<number>(315);
  const [hours, setHours] = useState<number>(12);
  const [minutes, setMinutes] = useState<number>(0);
  const [stopMinutes, setStopMinutes] = useState<number>(30);
  const [startTime, setStartTime] = useState<string>('22:00');

  const [showResults, setShowResults] = useState(false);

  // Calculate results
  const totalMinutes = hours * 60 + minutes;
  const movingMinutes = totalMinutes - stopMinutes;
  const movingHours = movingMinutes / 60;

  const avgSpeed = movingHours > 0 ? distance / movingHours : 0;

  // Calculate finish time
  const calculateFinishTime = () => {
    if (!startTime) return '--:--';

    const [startHour, startMin] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0, 0);

    const finishDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);

    const finishHour = finishDate.getHours().toString().padStart(2, '0');
    const finishMin = finishDate.getMinutes().toString().padStart(2, '0');

    return `${finishHour}:${finishMin}`;
  };

  // Check if riding during darkness (23:00-03:00)
  const isRidingInDarkness = () => {
    if (!startTime) return false;

    const [startHour, startMin] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMin, 0, 0);

    const finishDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);
    const finishHour = finishDate.getHours();

    // Check if finish time is between 23:00 and 03:00
    if (finishHour >= 23 || finishHour <= 3) {
      return true;
    }

    // Check if start time is between 23:00 and 03:00
    if (startHour >= 23 || startHour <= 3) {
      return true;
    }

    // Check if the ride spans through the night
    // If total duration is long enough that it must pass through darkness
    if (totalMinutes >= 360) { // 6+ hours
      // Create a timeline check - if we start before 23:00 and finish after 03:00 next day
      const hoursDifference = finishHour - startHour;
      if (hoursDifference < 0) { // Spans midnight
        return true;
      }
    }

    return false;
  };

  const presetRaces = [
    { name: 'Vätternrundan', distance: 315, startTime: '04:00', hours: 12, minutes: 0, stopMinutes: 60 },
    { name: 'Halvvättern', distance: 150, startTime: '10:00', hours: 6, minutes: 30, stopMinutes: 30 },
    { name: 'Tjejvättern 100', distance: 100, startTime: '08:00', hours: 4, minutes: 10, stopMinutes: 20 }
  ];

  const handleCalculate = () => {
    // Find which preset race matches the current distance
    const selectedRace = presetRaces.find(race => race.distance === distance);
    const raceName = selectedRace ? selectedRace.name : 'Custom';

    // Track the calculation event
    trackEvent('try_calculator_calculated', {
      race_name: raceName,
      distance_km: distance,
      start_time: startTime,
      duration_hours: hours,
      duration_minutes: minutes,
      stop_minutes: stopMinutes,
      total_duration_minutes: totalMinutes,
      required_avg_speed: avgSpeed.toFixed(1),
      finish_time: calculateFinishTime(),
      riding_in_darkness: isRidingInDarkness(),
    });

    setShowResults(true);
  };

  const handlePresetRaceClick = (race: typeof presetRaces[0]) => {
    setDistance(race.distance);
    setStartTime(race.startTime);
    setHours(race.hours);
    setMinutes(race.minutes);
    setStopMinutes(race.stopMinutes);
    setShowResults(false); // Hide results when changing race
  };

  return (
    <div className="min-h-screen bg-surface-background">
      <PageViewTracker pageName="Try Calculator Page" />
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary-subtle to-surface-background pt-8 pb-6 md:pt-12 md:pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-5xl mb-3">🧮</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-primary mb-3 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-surface-1 rounded-lg p-6 border border-border">

              {/* Preset Races */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  {t('form.presetRace')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {presetRaces.map((race) => (
                    <button
                      key={race.name}
                      onClick={() => handlePresetRaceClick(race)}
                      className={`p-3 rounded-lg border transition-colors text-sm font-medium ${
                        distance === race.distance
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-surface-background text-text-secondary border-border hover:border-primary'
                      }`}
                    >
                      {race.name}
                      <div className="text-xs opacity-75 mt-1">{race.distance} km</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {/* Distance and Start Time - Same Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Distance (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      {t('form.distance')} (km)
                    </label>
                    <input
                      type="text"
                      value={distance}
                      readOnly
                      className="w-full px-3 py-2.5 bg-surface-2 border border-border rounded-lg text-sm text-text-primary cursor-not-allowed"
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-text-secondary mb-2">
                      {t('form.startTime')}
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-surface-background border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-sm text-text-primary"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('form.estimatedDuration')}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="hours" className="block text-xs text-text-muted mb-1">
                        {t('form.hours')}
                      </label>
                      <input
                        type="number"
                        id="hours"
                        value={hours}
                        onChange={(e) => setHours(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-surface-background border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-sm text-text-primary"
                        min="0"
                      />
                    </div>
                    <div>
                      <label htmlFor="minutes" className="block text-xs text-text-muted mb-1">
                        {t('form.minutes')}
                      </label>
                      <input
                        type="number"
                        id="minutes"
                        value={minutes}
                        onChange={(e) => setMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-surface-background border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-sm text-text-primary"
                        min="0"
                        max="59"
                      />
                    </div>
                  </div>
                </div>

                {/* Stop Time */}
                <div>
                  <label htmlFor="stopMinutes" className="block text-sm font-medium text-text-secondary mb-2">
                    {t('form.totalStopTime')} ({t('form.minutes')})
                  </label>
                  <input
                    type="number"
                    id="stopMinutes"
                    value={stopMinutes}
                    onChange={(e) => setStopMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-surface-background border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-sm text-text-primary"
                    min="0"
                    step="5"
                  />
                  <p className="text-xs text-text-muted mt-1">
                    {t('form.stopTimeHelper')}
                  </p>
                </div>
              </div>

              {/* Calculate Button */}
              <button
                onClick={handleCalculate}
                className="w-full mt-6 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors text-base font-semibold focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                {t('form.calculate')}
              </button>

              {/* Results */}
              {showResults && (
                <div className="mt-6 p-5 bg-success-subtle border border-success rounded-lg">
                  <h3 className="text-lg font-bold text-text-primary mb-4">
                    {t('results.title')}
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-text-muted mb-1">
                        {t('results.finishTime')}
                      </div>
                      <div className="text-2xl font-bold text-text-primary">
                        {calculateFinishTime()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-text-muted mb-1">
                        {t('results.avgSpeed')}
                      </div>
                      <div className="text-2xl font-bold text-text-primary">
                        {avgSpeed.toFixed(1)} km/h
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-text-muted mb-1">
                        {t('results.totalTime')}
                      </div>
                      <div className="text-lg font-semibold text-text-primary">
                        {hours}h {minutes}min
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-text-muted mb-1">
                        {t('results.movingTime')}
                      </div>
                      <div className="text-lg font-semibold text-text-primary">
                        {Math.floor(movingMinutes / 60)}h {movingMinutes % 60}min
                      </div>
                    </div>
                  </div>

                  {/* Darkness Warning */}
                  {isRidingInDarkness() && (
                    <div className="mt-4 p-3 bg-warning-subtle border border-warning rounded-lg flex items-start gap-2">
                      <span className="text-xl flex-shrink-0">🌙</span>
                      <p className="text-sm text-text-primary font-medium">
                        {t('results.darknessWarning')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-primary-subtle to-surface-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
              {t('cta.title')}
            </h2>
            <p className="text-base text-text-secondary mb-6 leading-relaxed">
              {t('cta.description')}
            </p>

            <div className="bg-surface-1 rounded-lg p-5 mb-6 border border-border">
              <h3 className="text-lg font-semibold text-text-primary mb-3">
                {t('cta.featuresTitle')}
              </h3>
              <ul className="grid md:grid-cols-2 gap-2.5 text-left text-sm">
                <li className="flex items-start">
                  <span className="text-success mr-2 flex-shrink-0">✓</span>
                  <span className="text-text-secondary">{t('cta.feature1')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success mr-2 flex-shrink-0">✓</span>
                  <span className="text-text-secondary">{t('cta.feature2')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success mr-2 flex-shrink-0">✓</span>
                  <span className="text-text-secondary">{t('cta.feature3')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success mr-2 flex-shrink-0">✓</span>
                  <span className="text-text-secondary">{t('cta.feature4')}</span>
                </li>
                <li className="flex items-start">
                  <span className="text-success mr-2 flex-shrink-0">✓</span>
                  <span className="text-text-secondary">{t('cta.feature5')}</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <TrackedLink
                href="/signup"
                eventName="cta_signup_from_try_calculator"
                eventLocation="try_calculator_cta"
                eventData={{ cta_type: 'primary', destination: 'signup' }}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors text-base font-semibold focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                {t('cta.signup')}
              </TrackedLink>

              <Link
                href="/login"
                className="bg-surface-2 text-text-primary px-6 py-3 rounded-lg hover:bg-surface-3 transition-colors text-base font-semibold border border-border focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                {t('cta.login')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Learn More Section */}
      <section className="bg-surface-1 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-text-primary mb-6 text-center">
              {t('learnMore.title')}
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <TrackedLink
                href="/vatternrundan"
                eventName="link_vatternrundan_from_try"
                eventLocation="try_calculator_footer"
                eventData={{ destination: 'vatternrundan' }}
                className="bg-surface-background p-6 rounded-lg border border-border hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-3xl mb-2">🚴</div>
                <div className="font-semibold text-text-primary">{t('learnMore.vatternrundan')}</div>
              </TrackedLink>
              <TrackedLink
                href="/vatternrundan-guide"
                eventName="link_guide_from_try"
                eventLocation="try_calculator_footer"
                eventData={{ destination: 'guide' }}
                className="bg-surface-background p-6 rounded-lg border border-border hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-3xl mb-2">📚</div>
                <div className="font-semibold text-text-primary">{t('learnMore.guide')}</div>
              </TrackedLink>
              <TrackedLink
                href="/vattern-checklist"
                eventName="link_checklist_from_try"
                eventLocation="try_calculator_footer"
                eventData={{ destination: 'checklist' }}
                className="bg-surface-background p-6 rounded-lg border border-border hover:shadow-lg transition-shadow text-center"
              >
                <div className="text-3xl mb-2">✅</div>
                <div className="font-semibold text-text-primary">{t('learnMore.checklist')}</div>
              </TrackedLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
