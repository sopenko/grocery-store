'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Mail, Phone, MapPin, Save, AlertCircle, CheckCircle, Flame, Star } from 'lucide-react'

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setAddress(profile.address || '')
      setBio(profile.bio || '')
    }
  }, [profile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        full_name: fullName || null,
        phone: phone || null,
        address: address || null,
        bio: bio || null,
      })
      .eq('id', user!.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    await refreshProfile()
    setSuccess(true)
    setSaving(false)

    setTimeout(() => setSuccess(false), 3000)
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-2xl">
                      {getInitials(profile.full_name || profile.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.full_name || profile.username}
                    </h1>
                    <p className="text-gray-500">@{profile.username}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{profile.points}</span>
                        <span className="text-gray-500">puntos</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">{profile.streak_days}</span>
                        <span className="text-gray-500">días</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Edit Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>Editar perfil</CardTitle>
                <CardDescription>
                  Actualiza tu información personal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Perfil actualizado correctamente</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="username">Nombre de usuario</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="username"
                        value={profile.username}
                        className="pl-10 bg-gray-100 dark:bg-gray-800"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-gray-500">El nombre de usuario no se puede cambiar</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="email"
                        value={profile.email}
                        className="pl-10 bg-gray-100 dark:bg-gray-800"
                        disabled
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nombre completo</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Tu nombre completo"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+52 123 456 7890"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Tu dirección"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Biografía</Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuéntanos sobre ti..."
                      className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    disabled={saving}
                  >
                    {saving ? (
                      'Guardando...'
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Guardar cambios
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
