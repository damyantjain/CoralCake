// src/lib/evaluation/custom.ts

/**
 * Custom evaluation script interface
 */
export type CustomEvaluationScript = {
  name: string;
  description: string;
  evaluate: (prompt: string, response: string) => Promise<CustomEvaluationResult> | CustomEvaluationResult;
};

/**
 * Result from a custom evaluation script
 */
export type CustomEvaluationResult = {
  score: number;           // 0-100
  metrics?: Record<string, number | string | boolean>;
  notes?: string;
};

/**
 * Built-in custom evaluation scripts
 */
export const builtInScripts: Record<string, CustomEvaluationScript> = {
  lengthCheck: {
    name: 'Response Length Check',
    description: 'Checks if response length is appropriate (not too short or too long)',
    evaluate: (prompt: string, response: string): CustomEvaluationResult => {
      const wordCount = response.split(/\s+/).filter(w => w.length > 0).length;
      const promptWords = prompt.split(/\s+/).filter(w => w.length > 0).length;
      
      // Ideal response: 2-10x the prompt length
      const ratio = wordCount / Math.max(promptWords, 1);
      let score = 100;
      
      if (ratio < 2) {
        score = 50; // Too short
      } else if (ratio > 10) {
        score = 70; // Too long
      }
      
      return {
        score,
        metrics: {
          responseWords: wordCount,
          promptWords: promptWords,
          ratio: ratio.toFixed(2),
        },
        notes: ratio < 2 ? 'Response may be too brief' : ratio > 10 ? 'Response may be too verbose' : 'Length is appropriate',
      };
    },
  },
  
  sentimentPositivity: {
    name: 'Sentiment Positivity',
    description: 'Checks if response uses positive language',
    evaluate: (prompt: string, response: string): CustomEvaluationResult => {
      const positiveWords = ['excellent', 'great', 'good', 'beneficial', 'advantage', 'improve', 'better', 'helpful', 'positive', 'success', 'effective', 'efficient'];
      const negativeWords = ['bad', 'poor', 'worse', 'problem', 'issue', 'difficult', 'negative', 'fail', 'unsuccessful', 'ineffective'];
      
      const lowerResponse = response.toLowerCase();
      const positiveCount = positiveWords.filter(word => lowerResponse.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerResponse.includes(word)).length;
      
      // Score based on positive/negative ratio
      const totalSentiment = positiveCount + negativeCount;
      const score = totalSentiment === 0 ? 50 : Math.min(100, (positiveCount / totalSentiment) * 100);
      
      return {
        score: Math.round(score),
        metrics: {
          positiveWords: positiveCount,
          negativeWords: negativeCount,
          sentiment: positiveCount > negativeCount ? 'positive' : negativeCount > positiveCount ? 'negative' : 'neutral',
        },
      };
    },
  },
  
  codePresence: {
    name: 'Code Presence Detector',
    description: 'Detects if response contains code snippets',
    evaluate: (prompt: string, response: string): CustomEvaluationResult => {
      // Check for code patterns
      const hasBackticks = /```[\s\S]*```/.test(response);
      const hasInlineCode = /`[^`]+`/.test(response);
      const hasCodeKeywords = /\b(function|class|def|const|let|var|import|export|return)\b/.test(response);
      const hasIndentation = /^[ \t]{2,}/m.test(response);
      
      const codeIndicators = [hasBackticks, hasInlineCode, hasCodeKeywords, hasIndentation].filter(Boolean).length;
      const score = codeIndicators > 0 ? 100 : 0;
      
      return {
        score,
        metrics: {
          hasCodeBlock: hasBackticks,
          hasInlineCode: hasInlineCode,
          hasCodeKeywords: hasCodeKeywords,
          hasIndentation: hasIndentation,
        },
        notes: codeIndicators > 0 ? 'Response contains code' : 'No code detected',
      };
    },
  },
};

/**
 * Run a custom evaluation script
 */
export async function runCustomEvaluation(
  scriptName: string,
  prompt: string,
  response: string
): Promise<CustomEvaluationResult> {
  const script = builtInScripts[scriptName];
  if (!script) {
    throw new Error(`Unknown evaluation script: ${scriptName}`);
  }
  
  return await script.evaluate(prompt, response);
}

/**
 * Run all built-in custom evaluations
 */
export async function runAllCustomEvaluations(
  prompt: string,
  response: string
): Promise<Record<string, CustomEvaluationResult>> {
  const results: Record<string, CustomEvaluationResult> = {};
  
  for (const [name, script] of Object.entries(builtInScripts)) {
    try {
      results[name] = await script.evaluate(prompt, response);
    } catch (err) {
      results[name] = {
        score: 0,
        notes: `Error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
  
  return results;
}
