import { prisma } from '@/lib/db/prisma';

const enabled = process.env.DEBUG_DB_LOGS === 'true';

export async function writeLog(
  entry: { level: 'debug'|'info'|'warn'|'error'; source: string; message: string;
           userId?: string; accountId?: string; requestId?: string; meta?: any }
) {
  // Always echo to console for Vercel logs
  if (!enabled) return;
  try { await prisma.log.create({ data: { ...entry } }); } catch (_) { /* swallow */ }
}

export const log = {
  debug: (e: Omit<Parameters<typeof writeLog>[0], 'level'>) => writeLog({ level: 'debug', ...e }),
  info:  (e: Omit<Parameters<typeof writeLog>[0], 'level'>) => writeLog({ level: 'info',  ...e }),
  warn:  (e: Omit<Parameters<typeof writeLog>[0], 'level'>) => writeLog({ level: 'warn',  ...e }),
  error: (e: Omit<Parameters<typeof writeLog>[0], 'level'>) => writeLog({ level: 'error', ...e }),
};