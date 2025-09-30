import type { Metadata } from "next"
import { Karla } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "sonner"
import { Providers } from "./providers"

const karla = Karla({ subsets: ["latin"], weight: ['300', '400', '500', '600', '700', '800'] })

export const metadata: Metadata = {
  title: "SEO Reporting Platform",
  description: "Comprehensive SEO reporting and analytics platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={karla.className}>
        <Providers>
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  )
}