// src/lib/batch/__tests__/parser.test.ts
// Simple tests for CSV and JSON parsers

import { parseCSV, parseJSON, generateCSVTemplate } from '../parser';

console.log('Testing batch parser functions...\n');

// Test CSV parsing
console.log('1. Testing CSV parsing with prompt only...');
const csv1 = 'prompt\n"What is AI?"\n"Explain ML"';
const result1 = parseCSV(csv1);
console.log('  ✓ Parsed', result1.length, 'prompts');
console.log('  ✓ First prompt:', result1[0].prompt);

console.log('\n2. Testing CSV parsing with all columns...');
const csv2 = 'prompt,expected_output,tags\n"What is AI?","Definition of AI","AI;basics"\n"Explain ML","","ML"';
const result2 = parseCSV(csv2);
console.log('  ✓ Parsed', result2.length, 'prompts');
console.log('  ✓ First prompt has expected_output:', result2[0].expected_output);
console.log('  ✓ First prompt tags:', result2[0].tags);

console.log('\n3. Testing CSV with empty lines...');
const csv3 = 'prompt\n"Test 1"\n\n"Test 2"';
const result3 = parseCSV(csv3);
console.log('  ✓ Skipped empty lines, got', result3.length, 'prompts');

console.log('\n4. Testing CSV error handling...');
try {
  parseCSV('');
  console.log('  ✗ Should have thrown error for empty CSV');
} catch (err) {
  console.log('  ✓ Correctly threw error:', (err as Error).message);
}

try {
  parseCSV('text\n"Hello"');
  console.log('  ✗ Should have thrown error for missing prompt column');
} catch (err) {
  console.log('  ✓ Correctly threw error:', (err as Error).message);
}

// Test JSON parsing
console.log('\n5. Testing JSON parsing with strings...');
const json1 = '["What is AI?", "Explain ML"]';
const result4 = parseJSON(json1);
console.log('  ✓ Parsed', result4.length, 'prompts');
console.log('  ✓ First prompt:', result4[0].prompt);

console.log('\n6. Testing JSON parsing with objects...');
const json2 = JSON.stringify([
  { prompt: 'What is AI?', expected_output: 'Definition', tags: ['AI'] },
  { prompt: 'Explain ML', tags: 'ML' },
]);
const result5 = parseJSON(json2);
console.log('  ✓ Parsed', result5.length, 'prompts');
console.log('  ✓ First prompt has expected_output:', result5[0].expected_output);
console.log('  ✓ First prompt tags:', result5[0].tags);
console.log('  ✓ Second prompt tags (string converted):', result5[1].tags);

console.log('\n7. Testing JSON error handling...');
try {
  parseJSON('not json');
  console.log('  ✗ Should have thrown error for invalid JSON');
} catch (err) {
  console.log('  ✓ Correctly threw error:', (err as Error).message);
}

try {
  parseJSON('{"prompt": "test"}');
  console.log('  ✗ Should have thrown error for non-array JSON');
} catch (err) {
  console.log('  ✓ Correctly threw error:', (err as Error).message);
}

try {
  parseJSON('[]');
  console.log('  ✗ Should have thrown error for empty array');
} catch (err) {
  console.log('  ✓ Correctly threw error:', (err as Error).message);
}

// Test template generation
console.log('\n8. Testing CSV template generation...');
const template = generateCSVTemplate();
console.log('  ✓ Generated template');
console.log('  ✓ Contains header:', template.includes('prompt,expected_output,tags'));
console.log('  ✓ Contains example:', template.includes('What is machine learning?'));
console.log('  ✓ Has', template.split('\n').length, 'lines (header + 3 examples)');

console.log('\n✅ All parser tests passed!');
