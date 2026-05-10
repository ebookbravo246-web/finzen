'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          })
        },
      },
    }
  )
}

export async function loginAction(email: string, password: string): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  if (!data.session) return { error: 'session_not_created' }
  return { ok: true }
}

export async function signupAction(
  email: string,
  password: string,
  name: string
): Promise<{ error?: string; ok?: boolean; needsConfirmation?: boolean }> {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })

  if (error) return { error: error.message }

  // Email confirmation disabled — session returned immediately
  if (data.session) return { ok: true }

  // Email confirmation required
  return { needsConfirmation: true }
}
