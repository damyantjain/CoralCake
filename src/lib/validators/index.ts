// src/lib/validators/index.ts

/**
 * Third-party validator integration hub
 * 
 * This module provides a unified interface for integrating external
 * LLM evaluation frameworks like RAGAS and TruLens.
 */

export * from './types';
export * from './ragas';
export * from './trulens';

import { evaluateWithRAGAS, checkRAGASAvailability } from './ragas';
import { evaluateWithTruLens, checkTruLensAvailability } from './trulens';
import type { ValidatorRegistry, ValidatorResult } from './types';

/**
 * Registry of available validators
 */
export const validators: ValidatorRegistry = {
  ragas: evaluateWithRAGAS,
  trulens: evaluateWithTruLens,
};

/**
 * List all available validators
 */
export function listValidators(): string[] {
  return Object.keys(validators);
}

/**
 * Get validator by name
 */
export function getValidator(name: string) {
  return validators[name];
}

/**
 * Check availability of all validators
 */
export async function checkValidatorsAvailability(): Promise<Record<string, boolean>> {
  const [ragasAvailable, trulensAvailable] = await Promise.all([
    checkRAGASAvailability(),
    checkTruLensAvailability(),
  ]);
  
  return {
    ragas: ragasAvailable,
    trulens: trulensAvailable,
  };
}

/**
 * Run validation with a specific validator
 */
export async function runValidation(
  validatorName: string,
  prompt: string,
  response: string,
  context?: string | string[],
  config?: Record<string, unknown>
): Promise<ValidatorResult> {
  const validator = validators[validatorName];
  
  if (!validator) {
    throw new Error(`Unknown validator: ${validatorName}`);
  }
  
  return await validator(prompt, response, context, config);
}

/**
 * Run validation with all available validators
 */
export async function runAllValidations(
  prompt: string,
  response: string,
  context?: string | string[]
): Promise<Record<string, ValidatorResult>> {
  const results: Record<string, ValidatorResult> = {};
  
  for (const [name, validator] of Object.entries(validators)) {
    if (validator) {
      try {
        results[name] = await validator(prompt, response, context);
      } catch (err) {
        console.error(`Validator ${name} failed:`, err);
        // Continue with other validators
      }
    }
  }
  
  return results;
}
