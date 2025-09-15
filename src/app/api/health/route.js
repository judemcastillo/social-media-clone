// src/app/api/health/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'YapSpace', time: new Date().toISOString() });
}
