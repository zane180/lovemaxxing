import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Lovemaxxing — Find Your Perfect Match',
  description: 'AI-powered dating based on your personality, interests, and genuine attraction. Match with people who truly get you.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Lovemaxxing',
    description: 'AI-powered dating based on who you really are.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#722F37',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-cream-100 text-burgundy-950 antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#722F37',
              color: '#FAF7F2',
              borderRadius: '1rem',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: {
                primary: '#C9A96E',
                secondary: '#FAF7F2',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
