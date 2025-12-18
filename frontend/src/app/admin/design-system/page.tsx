'use client';

import { useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export default function DesignSystemPage() {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Design System</h1>
            <p className="text-text-secondary mt-2">
              Visual reference for all design tokens and components
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
          >
            {isDark ? (
              <>
                <SunIcon className="w-5 h-5" />
                Light Mode
              </>
            ) : (
              <>
                <MoonIcon className="w-5 h-5" />
                Dark Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* Colors Section */}
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Colors</h2>

        {/* Primary Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Primary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ColorSwatch name="primary" label="Primary" />
            <ColorSwatch name="primary-hover" label="Hover" />
            <ColorSwatch name="primary-active" label="Active" />
            <ColorSwatch name="primary-subtle" label="Subtle" textDark />
            <ColorSwatch name="primary-subtle-hover" label="Subtle Hover" textDark />
            <ColorSwatch name="primary-foreground" label="Foreground" />
          </div>
        </div>

        {/* Secondary Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Secondary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ColorSwatch name="secondary" label="Secondary" />
            <ColorSwatch name="secondary-hover" label="Hover" />
            <ColorSwatch name="secondary-active" label="Active" />
            <ColorSwatch name="secondary-subtle" label="Subtle" textDark />
            <ColorSwatch name="secondary-subtle-hover" label="Subtle Hover" textDark />
            <ColorSwatch name="secondary-foreground" label="Foreground" />
          </div>
        </div>

        {/* Semantic Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Semantic Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch name="success" label="Success" />
            <ColorSwatch name="warning" label="Warning" />
            <ColorSwatch name="error" label="Error" />
            <ColorSwatch name="info" label="Info" />
          </div>
        </div>

        {/* Surface Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Surface</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <ColorSwatch name="surface-background" label="Background" textDark />
            <ColorSwatch name="surface-1" label="Surface 1" textDark />
            <ColorSwatch name="surface-2" label="Surface 2" textDark />
            <ColorSwatch name="surface-3" label="Surface 3" textDark />
            <ColorSwatch name="surface-inverse" label="Inverse" />
          </div>
        </div>

        {/* Text Colors */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Text</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-1 rounded-lg border border-border">
              <p className="text-text-primary font-medium mb-1">Primary</p>
              <p className="text-xs text-text-muted">text-text-primary</p>
            </div>
            <div className="p-4 bg-surface-1 rounded-lg border border-border">
              <p className="text-text-secondary font-medium mb-1">Secondary</p>
              <p className="text-xs text-text-muted">text-text-secondary</p>
            </div>
            <div className="p-4 bg-surface-1 rounded-lg border border-border">
              <p className="text-text-muted font-medium mb-1">Muted</p>
              <p className="text-xs text-text-muted">text-text-muted</p>
            </div>
          </div>
        </div>

        {/* Border Colors */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Borders</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-surface-1 rounded-lg border-2 border-border">
              <p className="text-sm font-medium text-text-primary">Default</p>
              <p className="text-xs text-text-muted">border-border</p>
            </div>
            <div className="p-4 bg-surface-1 rounded-lg border-2 border-border-subtle">
              <p className="text-sm font-medium text-text-primary">Subtle</p>
              <p className="text-xs text-text-muted">border-subtle</p>
            </div>
            <div className="p-4 bg-surface-1 rounded-lg border-2 border-border-strong">
              <p className="text-sm font-medium text-text-primary">Strong</p>
              <p className="text-xs text-text-muted">border-strong</p>
            </div>
            <div className="p-4 bg-surface-1 rounded-lg border-2 border-border-focus">
              <p className="text-sm font-medium text-text-primary">Focus</p>
              <p className="text-xs text-text-muted">border-focus</p>
            </div>
            <div className="p-4 bg-surface-1 rounded-lg border-2 border-border-error">
              <p className="text-sm font-medium text-text-primary">Error</p>
              <p className="text-xs text-text-muted">border-error</p>
            </div>
          </div>
        </div>
      </div>

      {/* Typography */}
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Typography</h2>

        <div className="space-y-4">
          <div className="flex items-baseline gap-4 border-b border-border pb-2">
            <span className="text-xs text-text-muted w-16">text-xs</span>
            <p className="text-xs text-text-primary">The quick brown fox jumps over the lazy dog</p>
          </div>
          <div className="flex items-baseline gap-4 border-b border-border pb-2">
            <span className="text-xs text-text-muted w-16">text-sm</span>
            <p className="text-sm text-text-primary">The quick brown fox jumps over the lazy dog</p>
          </div>
          <div className="flex items-baseline gap-4 border-b border-border pb-2">
            <span className="text-xs text-text-muted w-16">text-base</span>
            <p className="text-base text-text-primary">The quick brown fox jumps over the lazy dog</p>
          </div>
          <div className="flex items-baseline gap-4 border-b border-border pb-2">
            <span className="text-xs text-text-muted w-16">text-lg</span>
            <p className="text-lg text-text-primary">The quick brown fox jumps over the lazy dog</p>
          </div>
          <div className="flex items-baseline gap-4 border-b border-border pb-2">
            <span className="text-xs text-text-muted w-16">text-xl</span>
            <p className="text-xl text-text-primary">The quick brown fox jumps over the lazy dog</p>
          </div>
          <div className="flex items-baseline gap-4 border-b border-border pb-2">
            <span className="text-xs text-text-muted w-16">text-2xl</span>
            <p className="text-2xl text-text-primary">The quick brown fox</p>
          </div>
          <div className="flex items-baseline gap-4 border-b border-border pb-2">
            <span className="text-xs text-text-muted w-16">text-3xl</span>
            <p className="text-3xl text-text-primary">The quick brown fox</p>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-xs text-text-muted w-16">text-4xl</span>
            <p className="text-4xl text-text-primary">The quick brown</p>
          </div>
        </div>
      </div>

      {/* Component Examples */}
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Components</h2>

        {/* Buttons */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Buttons</h3>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors">
              Primary
            </button>
            <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary-hover transition-colors">
              Secondary
            </button>
            <button className="px-4 py-2 bg-success text-success-foreground-on-color rounded-lg hover:bg-success-hover transition-colors">
              Success
            </button>
            <button className="px-4 py-2 bg-warning text-warning-foreground-on-color rounded-lg hover:bg-warning-hover transition-colors">
              Warning
            </button>
            <button className="px-4 py-2 bg-error text-error-foreground-on-color rounded-lg hover:bg-error-hover transition-colors">
              Error
            </button>
            <button className="px-4 py-2 bg-surface-background border border-border text-text-primary rounded-lg hover:bg-surface-1 transition-colors">
              Outline
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Cards</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-surface-1 border border-border rounded-lg p-4">
              <h4 className="font-semibold text-text-primary mb-2">Default Card</h4>
              <p className="text-sm text-text-secondary">Surface 1 with border</p>
            </div>
            <div className="bg-surface-background border border-border rounded-lg p-4 shadow-md">
              <h4 className="font-semibold text-text-primary mb-2">Elevated Card</h4>
              <p className="text-sm text-text-secondary">With shadow</p>
            </div>
            <div className="bg-primary-subtle border border-primary rounded-lg p-4">
              <h4 className="font-semibold text-primary mb-2">Subtle Card</h4>
              <p className="text-sm text-text-secondary">Primary subtle</p>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Form Inputs</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Text Input
              </label>
              <input
                type="text"
                placeholder="Enter text..."
                className="w-full px-4 py-2 bg-surface-background border border-border rounded-lg focus:ring-2 focus:ring-border-focus focus:border-border-focus text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Select
              </label>
              <select className="w-full px-4 py-2 bg-surface-background border border-border rounded-lg focus:ring-2 focus:ring-border-focus text-text-primary">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Disabled Input
              </label>
              <input
                type="text"
                disabled
                value="Disabled state"
                className="w-full px-4 py-2 bg-surface-2 border border-border rounded-lg text-text-muted cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-4">Alerts</h3>
          <div className="space-y-3">
            <div className="bg-success-subtle border border-success rounded-lg p-4">
              <p className="text-sm font-medium text-success-foreground">Success alert</p>
              <p className="text-sm text-success-foreground mt-1">Operation completed successfully!</p>
            </div>
            <div className="bg-warning-subtle border border-warning rounded-lg p-4">
              <p className="text-sm font-medium text-warning-foreground">Warning alert</p>
              <p className="text-sm text-warning-foreground mt-1">Please review your settings.</p>
            </div>
            <div className="bg-error-subtle border border-error rounded-lg p-4">
              <p className="text-sm font-medium text-error-foreground">Error alert</p>
              <p className="text-sm text-error-foreground mt-1">Something went wrong!</p>
            </div>
            <div className="bg-info-subtle border border-info rounded-lg p-4">
              <p className="text-sm font-medium text-info-foreground">Info alert</p>
              <p className="text-sm text-info-foreground mt-1">Here's some useful information.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shadows */}
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Shadows</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-surface-background rounded-lg p-4 shadow-sm border border-border">
            <p className="text-sm font-medium text-text-primary">shadow-sm</p>
          </div>
          <div className="bg-surface-background rounded-lg p-4 shadow border border-border">
            <p className="text-sm font-medium text-text-primary">shadow</p>
          </div>
          <div className="bg-surface-background rounded-lg p-4 shadow-md border border-border">
            <p className="text-sm font-medium text-text-primary">shadow-md</p>
          </div>
          <div className="bg-surface-background rounded-lg p-4 shadow-lg border border-border">
            <p className="text-sm font-medium text-text-primary">shadow-lg</p>
          </div>
          <div className="bg-surface-background rounded-lg p-4 shadow-xl border border-border">
            <p className="text-sm font-medium text-text-primary">shadow-xl</p>
          </div>
          <div className="bg-surface-background rounded-lg p-4 shadow-2xl border border-border">
            <p className="text-sm font-medium text-text-primary">shadow-2xl</p>
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div className="bg-surface-background rounded-lg shadow-sm p-6 border border-border">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Border Radius</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-surface-1 rounded-sm p-4 border border-border">
            <p className="text-sm font-medium text-text-primary">rounded-sm</p>
          </div>
          <div className="bg-surface-1 rounded p-4 border border-border">
            <p className="text-sm font-medium text-text-primary">rounded</p>
          </div>
          <div className="bg-surface-1 rounded-md p-4 border border-border">
            <p className="text-sm font-medium text-text-primary">rounded-md</p>
          </div>
          <div className="bg-surface-1 rounded-lg p-4 border border-border">
            <p className="text-sm font-medium text-text-primary">rounded-lg</p>
          </div>
          <div className="bg-surface-1 rounded-xl p-4 border border-border">
            <p className="text-sm font-medium text-text-primary">rounded-xl</p>
          </div>
          <div className="bg-surface-1 rounded-2xl p-4 border border-border">
            <p className="text-sm font-medium text-text-primary">rounded-2xl</p>
          </div>
          <div className="bg-surface-1 rounded-3xl p-4 border border-border">
            <p className="text-sm font-medium text-text-primary">rounded-3xl</p>
          </div>
          <div className="bg-surface-1 rounded-full p-4 border border-border">
            <p className="text-sm font-medium text-text-primary">rounded-full</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({ name, label, textDark = false }: { name: string; label: string; textDark?: boolean }) {
  return (
    <div className={`bg-${name} rounded-lg p-4 border border-border`}>
      <p className={`text-sm font-medium ${textDark ? 'text-text-primary' : 'text-white'}`}>{label}</p>
      <p className={`text-xs ${textDark ? 'text-text-muted' : 'text-white opacity-80'}`}>{name}</p>
    </div>
  );
}
