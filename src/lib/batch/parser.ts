// src/lib/batch/parser.ts
// CSV and JSON parsers for batch prompt upload

import type { BatchPromptItem } from './types';

/**
 * Parse CSV content into batch prompt items
 * Expected format: prompt, expected_output (optional), tags (optional, comma-separated)
 */
export function parseCSV(content: string): BatchPromptItem[] {
  const lines = content.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('Empty CSV file');
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const promptIdx = header.indexOf('prompt');
  
  if (promptIdx === -1) {
    throw new Error('CSV must have a "prompt" column');
  }

  const expectedIdx = header.indexOf('expected_output');
  const tagsIdx = header.indexOf('tags');

  const items: BatchPromptItem[] = [];

  // Parse rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const parts = parseCSVLine(line);
    
    if (parts.length <= promptIdx) {
      throw new Error(`Row ${i + 1}: Missing prompt value`);
    }

    const prompt = parts[promptIdx].trim();
    if (!prompt) {
      throw new Error(`Row ${i + 1}: Empty prompt`);
    }

    const item: BatchPromptItem = { prompt };

    if (expectedIdx !== -1 && parts.length > expectedIdx) {
      const expected = parts[expectedIdx].trim();
      if (expected) {
        item.expected_output = expected;
      }
    }

    if (tagsIdx !== -1 && parts.length > tagsIdx) {
      const tagsStr = parts[tagsIdx].trim();
      if (tagsStr) {
        item.tags = tagsStr.split(';').map(t => t.trim()).filter(Boolean);
      }
    }

    items.push(item);
  }

  if (items.length === 0) {
    throw new Error('No valid prompts found in CSV');
  }

  return items;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Parse JSON content into batch prompt items
 * Accepts either array of BatchPromptItem or array of strings (just prompts)
 */
export function parseJSON(content: string): BatchPromptItem[] {
  let parsed: unknown;
  
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON format');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('JSON must be an array');
  }

  if (parsed.length === 0) {
    throw new Error('Empty JSON array');
  }

  const items: BatchPromptItem[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];

    // Support both object format and simple string format
    if (typeof item === 'string') {
      const prompt = item.trim();
      if (!prompt) {
        throw new Error(`Item ${i + 1}: Empty prompt`);
      }
      items.push({ prompt });
    } else if (typeof item === 'object' && item !== null) {
      if (!('prompt' in item) || typeof item.prompt !== 'string') {
        throw new Error(`Item ${i + 1}: Missing or invalid "prompt" field`);
      }

      const prompt = item.prompt.trim();
      if (!prompt) {
        throw new Error(`Item ${i + 1}: Empty prompt`);
      }

      const batchItem: BatchPromptItem = { prompt };

      if ('expected_output' in item && typeof item.expected_output === 'string') {
        batchItem.expected_output = item.expected_output;
      }

      if ('tags' in item) {
        if (Array.isArray(item.tags)) {
          batchItem.tags = item.tags.filter((t: unknown) => typeof t === 'string');
        } else if (typeof item.tags === 'string') {
          batchItem.tags = [item.tags];
        }
      }

      items.push(batchItem);
    } else {
      throw new Error(`Item ${i + 1}: Invalid item type`);
    }
  }

  return items;
}

/**
 * Generate a sample CSV template
 */
export function generateCSVTemplate(): string {
  const header = 'prompt,expected_output,tags';
  const example1 = '"What is machine learning?","A detailed explanation of ML","AI;ML;basics"';
  const example2 = '"Explain quantum computing","","quantum;physics"';
  const example3 = '"Write a haiku about spring","A 5-7-5 syllable poem","poetry;creative"';
  
  return [header, example1, example2, example3].join('\n');
}
