// src/app/api/batch/template/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { generateCSVTemplate } from '@/lib/batch/parser';

/**
 * GET /api/batch/template
 * Download CSV template for batch prompt upload
 */
export async function GET() {
  const template = generateCSVTemplate();
  
  return new NextResponse(template, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="batch-prompts-template.csv"',
    },
  });
}
