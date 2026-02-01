'use client'

import { useAuth } from '@/hooks/useAuth'
import { Flame, Star } from 'lucide-react'

export function WelcomeBanner() {
  const { profile, isAuthenticated } = useAuth()

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-8 text-white">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="w-6 h-6" />
          <span className="text-amber-100 text-sm font-medium">Portal Comunitario P&apos;urhépecha</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          {isAuthenticated
            ? `¡Juchari Uinapekua, ${profile?.full_name || profile?.username}!`
            : '¡Bienvenido al Portal Comunitario!'
          }
        </h1>

        <p className="text-lg text-amber-100 max-w-2xl">
          Tu centro para conectar con la comunidad, aprender la lengua P&apos;urhépecha,
          descubrir eventos locales y acceder a servicios comunitarios.
        </p>

        {isAuthenticated && profile && (
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-4 py-2">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="font-semibold">{profile.points} puntos</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur rounded-lg px-4 py-2">
              <Flame className="w-5 h-5 text-orange-300" />
              <span className="font-semibold">{profile.streak_days} días de racha</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
