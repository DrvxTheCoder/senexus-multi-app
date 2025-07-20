// // src/utils/supabase/client.ts
// 'use client'

// import { createBrowserClient } from '@supabase/ssr'
// import { useAuth } from '@clerk/nextjs'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// // Hook for client-side usage with Clerk authentication
// export function useSupabase() {
//   const { getToken } = useAuth()

//   const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
//     global: {
//       fetch: async (input, init = {}) => {
//         const token = await getToken({ template: 'supabase' })
//         const headers = {
//           ...(init.headers || {}),
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         }
//         return fetch(input, { ...init, headers })
//       },
//     },
//   })

//   return supabase
// }

// // Legacy export for backward compatibility (without Clerk auth)
// export const createClient = () =>
//   createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//   )