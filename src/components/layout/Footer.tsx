import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Portal</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/" className="hover:text-amber-600">Inicio</Link></li>
              <li><Link href="/apps" className="hover:text-amber-600">Aplicaciones</Link></li>
              <li><Link href="/news" className="hover:text-amber-600">Noticias</Link></li>
              <li><Link href="/events" className="hover:text-amber-600">Eventos</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Comunidad</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/directory" className="hover:text-amber-600">Directorio de negocios</Link></li>
              <li><Link href="/about" className="hover:text-amber-600">Sobre nosotros</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link href="/privacy" className="hover:text-amber-600">Privacidad</Link></li>
              <li><Link href="/terms" className="hover:text-amber-600">Términos de uso</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Aplicaciones</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a
                  href={process.env.NEXT_PUBLIC_CURICAUERI_URL || '/apps/curicaueri'}
                  className="hover:text-amber-600"
                >
                  Curicaueri - Aprende P&apos;urhépecha
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Portal Comunitario P&apos;urhépecha. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
