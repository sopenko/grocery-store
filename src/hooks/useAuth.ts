'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['users']['Row']

const PROFILE_CACHE_KEY = 'town-portal-profile'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    // Check cache first
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed.id === userId) {
          setProfile(parsed)
        }
      } catch {
        localStorage.removeItem(PROFILE_CACHE_KEY)
      }
    }

    // Fetch fresh profile
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    if (data) {
      setProfile(data)
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(data))
    }

    return data
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await fetchProfile(user.id)
      }

      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          localStorage.removeItem(PROFILE_CACHE_KEY)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem(PROFILE_CACHE_KEY)
    setUser(null)
    setProfile(null)
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isModerator: profile?.role === 'moderator' || profile?.role === 'admin',
    signOut,
    refreshProfile,
  }
}
