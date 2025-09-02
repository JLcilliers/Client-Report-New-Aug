export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/lib/db/prisma';

export default async function LogsPage() {
  // Optional: short-circuit if logging disabled
  if (process.env.DEBUG_DB_LOGS !== 'true') {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Recent Logs</h1>
        <p>DB logging is disabled.</p>
      </div>
    );
  }

  try {
    const rows = await prisma.log.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Recent Logs</h1>
        <table className="w-full text-sm">
          <thead><tr><th>Time</th><th>Level</th><th>Source</th><th>Msg</th><th>User</th><th>Account</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
                <td>{r.level}</td>
                <td>{r.source}</td>
                <td>{r.message}</td>
                <td>{r.userId ?? ''}</td>
                <td>{r.accountId ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } catch (e: any) {
    // If the table's missing, render a helpful message instead of throwing
    if (e.code === 'P2021') {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-4">Recent Logs</h1>
          <p>Log table not found. See admin notes to create it.</p>
        </div>
      );
    }
    throw e;
  }
}