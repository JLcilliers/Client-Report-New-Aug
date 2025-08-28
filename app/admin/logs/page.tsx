import prisma from '@/lib/prisma';

export default async function LogsPage() {
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
}