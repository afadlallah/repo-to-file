import type { Metadata } from 'next'
import { Poppins, Ubuntu_Mono } from 'next/font/google'
import { Providers } from '@/app/providers'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})

const ubuntuMono = Ubuntu_Mono({
  subsets: ['latin'],
  variable: '--font-ubuntu-mono',
  weight: '400'
})

export const metadata: Metadata = {
  title: 'Repo to File',
  description: 'Convert your GitHub repository to a file for use with LLMs'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className={`${poppins.variable} ${ubuntuMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
