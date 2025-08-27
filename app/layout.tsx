import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import QueryProvider from "@/components/providers/QueryProvider"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <Providers>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </Providers>
      </body>
    </html>
  )
}