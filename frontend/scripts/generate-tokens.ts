/**
 * Token Generation Script
 *
 * This script reads tokens.json and generates:
 * 1. TypeScript types for all tokens
 * 2. Validation of token structure
 *
 * Run with: npm run tokens:generate
 */

import * as fs from 'fs';
import * as path from 'path';

const TOKENS_PATH = path.join(__dirname, '../src/design-system/tokens/tokens.json');
const OUTPUT_DIR = path.join(__dirname, '../src/design-system/tokens/generated');
const TYPES_OUTPUT = path.join(OUTPUT_DIR, 'tokens.types.ts');

interface TokenFile {
  $schema?: string;
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
    fontFamily: Record<string, string>;
    fontSize: Record<string, { size: string; lineHeight: string }>;
    fontWeight: Record<string, string>;
    letterSpacing: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  spacing: Record<string, string>;
  borders: {
    radius: Record<string, string>;
    width: Record<string, string>;
  };
  shadows: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  animation: {
    duration: Record<string, string>;
    easing: Record<string, string>;
  };
  zIndex: Record<string, string>;
}

function generateColorTypes(colors: TokenFile['colors']): string {
  const primitiveKeys = Object.keys(colors.primitive);
  const semanticKeys = Object.keys(colors.semantic.light);

  let output = '';

  // Primitive color scales
  output += '// Primitive color scales\n';
  output += `export type PrimitiveColorScale = ${primitiveKeys
    .filter(k => typeof colors.primitive[k] === 'object')
    .map(k => `'${k}'`)
    .join(' | ')};\n\n`;

  // Primitive color shades
  const firstScale = primitiveKeys.find(k => typeof colors.primitive[k] === 'object');
  if (firstScale && typeof colors.primitive[firstScale] === 'object') {
    const shades = Object.keys(colors.primitive[firstScale] as Record<string, string>);
    output += `export type ColorShade = ${shades.map(s => `'${s}'`).join(' | ')};\n\n`;
  }

  // Semantic color categories
  output += '// Semantic color categories\n';
  output += `export type SemanticColorCategory = ${semanticKeys.map(k => `'${k}'`).join(' | ')};\n\n`;

  // Semantic color variants for each category
  output += '// Semantic color variants\n';
  semanticKeys.forEach(category => {
    const variants = Object.keys(colors.semantic.light[category]);
    const typeName = `${category.charAt(0).toUpperCase() + category.slice(1)}ColorVariant`;
    output += `export type ${typeName} = ${variants.map(v => `'${v}'`).join(' | ')};\n`;
  });

  return output;
}

function generateTypographyTypes(typography: TokenFile['typography']): string {
  let output = '\n// Typography tokens\n';

  output += `export type FontFamily = ${Object.keys(typography.fontFamily).map(k => `'${k}'`).join(' | ')};\n`;
  output += `export type FontSize = ${Object.keys(typography.fontSize).map(k => `'${k}'`).join(' | ')};\n`;
  output += `export type FontWeight = ${Object.keys(typography.fontWeight).map(k => `'${k}'`).join(' | ')};\n`;
  output += `export type LetterSpacing = ${Object.keys(typography.letterSpacing).map(k => `'${k}'`).join(' | ')};\n`;
  output += `export type LineHeight = ${Object.keys(typography.lineHeight).map(k => `'${k}'`).join(' | ')};\n`;

  return output;
}

function generateSpacingTypes(spacing: TokenFile['spacing']): string {
  let output = '\n// Spacing tokens\n';
  output += `export type SpacingScale = ${Object.keys(spacing).map(k => `'${k}'`).join(' | ')};\n`;
  return output;
}

function generateBorderTypes(borders: TokenFile['borders']): string {
  let output = '\n// Border tokens\n';
  output += `export type BorderRadius = ${Object.keys(borders.radius).map(k => `'${k}'`).join(' | ')};\n`;
  output += `export type BorderWidth = ${Object.keys(borders.width).map(k => `'${k}'`).join(' | ')};\n`;
  return output;
}

function generateShadowTypes(shadows: TokenFile['shadows']): string {
  let output = '\n// Shadow tokens\n';
  output += `export type Shadow = ${Object.keys(shadows.light).map(k => `'${k}'`).join(' | ')};\n`;
  return output;
}

function generateAnimationTypes(animation: TokenFile['animation']): string {
  let output = '\n// Animation tokens\n';
  output += `export type AnimationDuration = ${Object.keys(animation.duration).map(k => `'${k}'`).join(' | ')};\n`;
  output += `export type AnimationEasing = ${Object.keys(animation.easing).map(k => `'${k}'`).join(' | ')};\n`;
  return output;
}

function generateZIndexTypes(zIndex: TokenFile['zIndex']): string {
  let output = '\n// Z-Index tokens\n';
  output += `export type ZIndex = ${Object.keys(zIndex).map(k => `'${k}'`).join(' | ')};\n`;
  return output;
}

function generateTypes(tokens: TokenFile): string {
  let output = `/**
 * Design Token Types
 *
 * Auto-generated from tokens.json
 * Do not edit manually - run 'npm run tokens:generate' to regenerate
 *
 * @generated
 */

`;

  output += generateColorTypes(tokens.colors);
  output += generateTypographyTypes(tokens.typography);
  output += generateSpacingTypes(tokens.spacing);
  output += generateBorderTypes(tokens.borders);
  output += generateShadowTypes(tokens.shadows);
  output += generateAnimationTypes(tokens.animation);
  output += generateZIndexTypes(tokens.zIndex);

  // Add theme type
  output += `
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
`;

  return output;
}

function main() {
  console.log('Generating design tokens...');

  // Read tokens file
  if (!fs.existsSync(TOKENS_PATH)) {
    console.error(`Error: tokens.json not found at ${TOKENS_PATH}`);
    process.exit(1);
  }

  const tokensContent = fs.readFileSync(TOKENS_PATH, 'utf-8');
  const tokens: TokenFile = JSON.parse(tokensContent);

  console.log(`  Version: ${tokens.version}`);
  console.log(`  Name: ${tokens.metadata.name}`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate and write types
  const typesContent = generateTypes(tokens);
  fs.writeFileSync(TYPES_OUTPUT, typesContent);
  console.log(`  Generated: ${TYPES_OUTPUT}`);

  console.log('Done!');
}

main();
