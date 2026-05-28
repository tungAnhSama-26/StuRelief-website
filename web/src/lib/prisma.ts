import { Prisma, PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type DatabaseHealthState = {
  available: boolean
  checkedAt: number
  inFlight: Promise<boolean> | null
}

declare global {
  var prismaGlobal2: undefined | ReturnType<typeof prismaClientSingleton>
  var prismaHealthGlobal: undefined | DatabaseHealthState
}

const prisma = globalThis.prismaGlobal2 ?? prismaClientSingleton()
const DATABASE_HEALTH_TTL_MS = 10_000
const prismaHealthState =
  globalThis.prismaHealthGlobal ??
  ({
    available: true,
    checkedAt: 0,
    inFlight: null,
  } satisfies DatabaseHealthState)

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal2 = prisma
if (process.env.NODE_ENV !== 'production') globalThis.prismaHealthGlobal = prismaHealthState

const resolveFallback = <T>(fallback: T | (() => T)): T => {
  return typeof fallback === 'function' ? (fallback as () => T)() : fallback
}

export const isDatabaseConnectionError = (error: unknown) => {
  if (error instanceof Prisma.PrismaClientInitializationError) return true
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P1001') return true
  return error instanceof Error && error.message.includes("Can't reach database server")
}

export async function isDatabaseAvailable(force = false): Promise<boolean> {
  const now = Date.now()

  if (!force && prismaHealthState.inFlight) {
    return prismaHealthState.inFlight
  }

  if (!force && now - prismaHealthState.checkedAt < DATABASE_HEALTH_TTL_MS) {
    return prismaHealthState.available
  }

  prismaHealthState.inFlight = (async () => {
    try {
      await prisma.$queryRawUnsafe('SELECT 1')
      prismaHealthState.available = true
      prismaHealthState.checkedAt = Date.now()
      return true
    } catch (error) {
      if (isDatabaseConnectionError(error)) {
        prismaHealthState.available = false
        prismaHealthState.checkedAt = Date.now()
        return false
      }

      throw error
    } finally {
      prismaHealthState.inFlight = null
    }
  })()

  return prismaHealthState.inFlight
}

export async function runWithDatabase<T>(
  operation: () => Promise<T>,
  fallback: T | (() => T),
  context: string
): Promise<T> {
  if (!(await isDatabaseAvailable())) {
    return resolveFallback(fallback)
  }

  try {
    return await operation()
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      prismaHealthState.available = false
      prismaHealthState.checkedAt = Date.now()
      console.warn(`${context}: database unavailable, serving fallback`)
      return resolveFallback(fallback)
    }

    throw error
  }
}
