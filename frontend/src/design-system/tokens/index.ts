// Export generated types
export * from './generated/tokens.types';

// Import tokens JSON for runtime access if needed
import tokensJson from './tokens.json';

export const tokens = tokensJson;
