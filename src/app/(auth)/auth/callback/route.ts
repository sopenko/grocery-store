import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user profile exists, create if not
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingProfile) {
          // Create profile for OAuth users
          const username = user.email?.split('@')[0] || `user_${Date.now()}`
          await supabase.from('users').insert({
            id: user.id,
            email: user.email!,
            username,
            full_name: user.user_metadata?.full_name || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            role: 'learner',
          })
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`)
    }
  }

  // Auth error - redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
