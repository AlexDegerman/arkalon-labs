'use server'

import 'server-only'
import { cookies } from 'next/headers'
import pool from '@/lib/db'

const CORE_ID_COOKIE = 'arkalon_core_id'
const SESSION_COOKIE = 'arkalon_session'
const ONE_YEAR = 31_536_000
const THIRTY_DAYS = 60 * 60 * 24 * 30

function cookieDomain(): string | undefined {
  if (process.env.NODE_ENV === 'development') return undefined
  return process.env.COOKIE_DOMAIN ?? '.rpsleague.fi'
}

export async function getOrCreateLabsPlayer() {
  const cookieStore = await cookies()
  let coreId = cookieStore.get(CORE_ID_COOKIE)?.value
  let sessionToken = cookieStore.get(SESSION_COOKIE)?.value
  let nickname: string | undefined
  let networkShortId: string | undefined

  // Local development: use a mock player because Arkalon Network is not running
  const isLocalMock =
    process.env.NODE_ENV === 'development' && !process.env.INTERNAL_NETWORK_URL

  if (isLocalMock) {
    coreId = '11111111-1111-4111-8111-111111111111'
    sessionToken = 'mock-dev-session-token'
    nickname = 'LocalDevDirector'

    cookieStore.set(CORE_ID_COOKIE, coreId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: ONE_YEAR
    })
    cookieStore.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: THIRTY_DAYS
    })
  }

  // 1. If no root cookie, request identity from Network Hub API
  const networkUrl =
    process.env.INTERNAL_NETWORK_URL ?? 'http://arkalon-network:3000'

  if (isLocalMock) {
    // Skip Network Hub lookup when running locally without Arkalon Network
  } else if (!coreId || !sessionToken) {
    const res = await fetch(`${networkUrl}/api/identity/provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET || ''
      },
      ...(coreId ? { body: JSON.stringify({ coreId }) } : {}),
      signal: AbortSignal.timeout(5000)
    })

    if (!res.ok) {
      throw new Error('Failed to bootstrap identity from Arkalon Network')
    }

    const data = await res.json()
    coreId = coreId ?? data.coreId
    sessionToken = data.sessionToken
    nickname = data.nickname
    networkShortId = data.shortId

    // Set root cookies across .rpsleague.fi
    const domain = cookieDomain()
    cookieStore.set(CORE_ID_COOKIE, coreId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      ...(domain ? { domain } : {}),
      path: '/',
      maxAge: ONE_YEAR
    })
    cookieStore.set(SESSION_COOKIE, sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      ...(domain ? { domain } : {}),
      path: '/',
      maxAge: THIRTY_DAYS
    })
  } else {
    try {
      const res = await fetch(`${networkUrl}/api/identity/provision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_SERVICE_SECRET || ''
        },
        body: JSON.stringify({ coreId }),
        signal: AbortSignal.timeout(3000)
      })
      if (res.ok) {
        const data = await res.json()
        nickname = data.nickname || data.displayName
        networkShortId = data.shortId
      }
    } catch {}
  }

  // 2. Ensure player exists in Labs's local database
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'development') {
    return {
      coreId: coreId!,
      displayName: nickname ?? 'Director'
    }
  }

  const client = await pool.connect()
  try {
    const existing = await client.query(
      'SELECT id, display_name FROM players WHERE id = $1',
      [coreId]
    )

    if (existing.rows.length === 0) {
      const fallbackShortId = Math.random().toString(36).substring(2, 10)
      const assignedShortId = networkShortId ?? fallbackShortId

      await client.query(
        `INSERT INTO players (id, short_id, display_name, created_at, last_seen_at)
          VALUES ($1, $2, $3, now(), now())
          ON CONFLICT (id) DO UPDATE SET
            short_id = COALESCE(players.short_id, EXCLUDED.short_id),
            display_name = EXCLUDED.display_name`,
        [coreId, assignedShortId, nickname ?? 'Director']
      )
    } else if (nickname && existing.rows[0]?.display_name !== nickname) {
      await client.query(
        'UPDATE players SET display_name = $1, last_seen_at = now() WHERE id = $2',
        [nickname, coreId]
      )
    }

    return {
      coreId: coreId!,
      displayName: nickname ?? existing.rows[0]?.display_name ?? 'Director'
    }
  } finally {
    client.release()
  }
}
