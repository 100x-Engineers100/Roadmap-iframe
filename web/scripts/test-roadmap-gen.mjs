/**
 * Phase 1 compatibility wrapper.
 * The old live LLM test copied production prompt text. Generation tests move to
 * the blueprint + structured-output path in Phase 7.
 */

import { main } from './test-validation.mjs';

await main();
