/**
 * Steward AI Gateway — brand context (delegates to Brand Intelligence service).
 */

export {
  getStewardBrandContext,
  compileAIContextForOperation,
  saveAiContextSnapshot,
  stewardContextToCompactSummary,
  brandContextToPromptBlockFromSteward as brandContextToPromptBlock,
  gatherBrandContextLegacy as gatherBrandContext,
} from '../services/brand-intelligence.js';

export type { StewardBrandContext, StewardBrandContextInput } from '../types/brand-intelligence.js';
