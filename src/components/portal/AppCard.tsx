import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExternalLink, BookOpen, ShoppingCart, Users, Megaphone } from 'lucide-react'
import type { Database } from '@/types/database'

type TownApp = Database['public']['Tables']['town_apps']['Row']

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  curicaueri: BookOpen,
  grocery: ShoppingCart,
  community: Users,
  announcements: Megaphone,
}

interface AppCardProps {
  app: TownApp
}

export function AppCard({ app }: AppCardProps) {
  const IconComponent = iconMap[app.slug] || ExternalLink
  const isExternal = app.app_url.startsWith('http')

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (isExternal) {
      return (
        <a href={app.app_url} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    }
    return <Link href={app.app_url}>{children}</Link>
  }

  return (
    <CardWrapper>
      <Card className="h-full hover:shadow-lg hover:border-amber-300 transition-all duration-200 cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            {isExternal && (
              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-amber-500" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-lg mb-2 group-hover:text-amber-600 transition-colors">
            {app.name}
          </CardTitle>
          <CardDescription className="text-sm">
            {app.description}
          </CardDescription>
        </CardContent>
      </Card>
    </CardWrapper>
  )
}
