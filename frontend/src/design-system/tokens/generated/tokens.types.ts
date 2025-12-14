/**
 * Design Token Types
 *
 * Auto-generated from tokens.json
 * Do not edit manually - run 'npm run tokens:generate' to regenerate
 *
 * @generated
 */

// Primitive color scales
export type PrimitiveColorScale = 'sky' | 'slate' | 'emerald' | 'amber' | 'rose' | 'blue';

export type ColorShade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

// Semantic color categories
export type SemanticColorCategory = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'surface' | 'text' | 'border';

// Semantic color variants
export type PrimaryColorVariant = 'DEFAULT' | 'hover' | 'active' | 'subtle' | 'subtleHover' | 'foreground';
export type SecondaryColorVariant = 'DEFAULT' | 'hover' | 'active' | 'subtle' | 'subtleHover' | 'foreground';
export type SuccessColorVariant = 'DEFAULT' | 'hover' | 'subtle' | 'subtleHover' | 'foreground' | 'foregroundOnColor';
export type WarningColorVariant = 'DEFAULT' | 'hover' | 'subtle' | 'subtleHover' | 'foreground' | 'foregroundOnColor';
export type ErrorColorVariant = 'DEFAULT' | 'hover' | 'subtle' | 'subtleHover' | 'foreground' | 'foregroundOnColor';
export type InfoColorVariant = 'DEFAULT' | 'hover' | 'subtle' | 'subtleHover' | 'foreground' | 'foregroundOnColor';
export type SurfaceColorVariant = '1' | '2' | '3' | 'background' | 'inverse';
export type TextColorVariant = 'primary' | 'secondary' | 'muted' | 'inverse' | 'link' | 'linkHover';
export type BorderColorVariant = 'DEFAULT' | 'subtle' | 'strong' | 'focus' | 'error';

// Typography tokens
export type FontFamily = 'sans' | 'mono';
export type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
export type FontWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type LetterSpacing = 'tighter' | 'tight' | 'normal' | 'wide' | 'wider' | 'widest';
export type LineHeight = 'none' | 'tight' | 'snug' | 'normal' | 'relaxed' | 'loose';

// Spacing tokens
export type SpacingScale = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '14' | '16' | '20' | '24' | '28' | '32' | '36' | '40' | '44' | '48' | '52' | '56' | '60' | '64' | '72' | '80' | '96' | 'px' | '0.5' | '1.5' | '2.5' | '3.5';

// Border tokens
export type BorderRadius = 'none' | 'sm' | 'DEFAULT' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
export type BorderWidth = '0' | '2' | '4' | '8' | 'DEFAULT';

// Shadow tokens
export type Shadow = 'none' | 'sm' | 'DEFAULT' | 'md' | 'lg' | 'xl' | '2xl' | 'inner' | 'focus';

// Animation tokens
export type AnimationDuration = 'instant' | 'fast' | 'normal' | 'slow' | 'slower';
export type AnimationEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring';

// Z-Index tokens
export type ZIndex = 'hide' | 'auto' | 'base' | 'docked' | 'dropdown' | 'sticky' | 'banner' | 'overlay' | 'modal' | 'popover' | 'skipLink' | 'toast' | 'tooltip';

// Theme type
export type Theme = 'light' | 'dark';

// Token file structure type
export interface DesignTokens {
  version: string;
  metadata: {
    name: string;
    description: string;
  };
  colors: {
    primitive: Record<string, string | Record<string, string>>;
    semantic: {
      light: Record<string, Record<string, string>>;
      dark: Record<string, Record<string, string>>;
    };
  };
  typography: {
    fontFamily: Record<FontFamily, string>;
    fontSize: Record<FontSize, { size: string; lineHeight: string }>;
    fontWeight: Record<FontWeight, string>;
    letterSpacing: Record<LetterSpacing, string>;
    lineHeight: Record<LineHeight, string>;
  };
  spacing: Record<SpacingScale, string>;
  borders: {
    radius: Record<BorderRadius, string>;
    width: Record<BorderWidth, string>;
  };
  shadows: {
    light: Record<Shadow, string>;
    dark: Record<Shadow, string>;
  };
  animation: {
    duration: Record<AnimationDuration, string>;
    easing: Record<AnimationEasing, string>;
  };
  zIndex: Record<ZIndex, string>;
}
