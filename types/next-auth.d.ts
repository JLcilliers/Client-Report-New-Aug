import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    user?: {
      id?: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }
  
  interface User {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    userId?: string
    email?: string | null
  }
}