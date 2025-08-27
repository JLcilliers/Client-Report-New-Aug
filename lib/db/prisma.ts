import { PrismaClient } from "@prisma/client"

let prisma: PrismaClient | undefined

export function getPrisma() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}

// For backwards compatibility and ease of migration
export { getPrisma as prisma }

// Cleanup function for testing
export function disconnectPrisma() {
  if (prisma) {
    prisma.$disconnect()
    prisma = undefined
  }
}