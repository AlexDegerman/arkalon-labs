import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

interface HealthStatus {
  status: 'ok' | 'degraded'
  timestamp: string
  version: string
  db: 'ok' | 'error'
  uptime: number
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'
  const uptime = process.uptime()

  let dbStatus: 'ok' | 'error' = 'error'
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    dbStatus = 'ok'
  } catch {
    // Database connection failed or unavailable
  }

  const status: HealthStatus = {
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version,
    db: dbStatus,
    uptime: Math.floor(uptime)
  }

  return NextResponse.json(status, {
    status: status.status === 'ok' ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache'
    }
  })
}
