'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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

export async function loginAction(email: string, password: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[FinZen] loginAction error:', error.message, error.code)
    return { error: error.message }
  }
  if (!data.session) {
    console.error('[FinZen] loginAction: no session returned')
    return { error: 'session_not_created' }
  }

  console.log('[FinZen] loginAction: session OK, redirecting to /dashboard')
  redirect('/dashboard')
}

export async function signupAction(
  email: string,
  password: string,
  name: string
): Promise<{ error?: string; needsConfirmation?: boolean }> {
  const supabase = await createSupabaseServer()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })

  if (error) {
    console.error('[FinZen] signupAction error:', error.message, error.code)
    return { error: error.message }
  }

  if (data.session) {
    console.log('[FinZen] signupAction: session OK, redirecting to /dashboard')
    redirect('/dashboard')
  }

  // Email confirmation required
  return { needsConfirmation: true }
}
