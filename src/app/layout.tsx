import './globals.css'

export const metadata = {
  title: 'OCASA Warehouse Platform',
  description: 'AI-Powered Warehouse Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-background text-foreground antialiased min-h-screen selection:bg-primary/30">
        {children}
      </body>
    </html>
  )
}
