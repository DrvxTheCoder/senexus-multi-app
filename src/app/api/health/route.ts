// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0'
    };

    // You can add additional checks here:
    // - Database connectivity
    // - External service checks
    // - Memory usage checks
    // - etc.

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}

// Optional: Add other HTTP methods if needed
export async function HEAD() {
  // Simple HEAD request for basic availability check
  return new Response(null, { status: 200 });
}
