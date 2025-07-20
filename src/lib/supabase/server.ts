// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createServerComponentClient = () =>
  createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookies()).getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(async ({ name, value, options }) => {
            (await cookies()).set(name, value, options)
          })
        },
      },
    }
  )