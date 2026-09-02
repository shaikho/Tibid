import { ResetLinkButton } from '@/components/admin/reset-link-button'
import { requireAdmin } from '@/lib/auth'
import { getAllMembers } from '@/lib/queries'
import { GENDERS } from '@/lib/constants'
import { formatDate, instagramUrl, normalizeInstagram } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminMembersPage() {
  // Needed to mark your own row: a link for yourself works, but using it signs
  // out your other devices, so it is worth flagging before you click.
  const [admin, members] = await Promise.all([requireAdmin(), getAllMembers().catch(() => [])])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-deep">Community profiles</h2>
          <p className="mt-1 text-sm leading-relaxed text-tide">
            Everyone who has created an account. Guests who signed up without one appear under
            Registrations instead.
          </p>
        </div>
        <a href="/api/admin/export?type=members" className="btn btn-outline !py-2 !text-xs" download>
          ⬇ Export CSV
        </a>
      </div>

      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foam p-10 text-center text-sm text-tide">
          No profiles yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-foam">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[58rem] border-collapse text-sm">
              <thead>
                <tr className="bg-mist/70 text-left text-xs font-bold uppercase tracking-wide text-tide">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Instagram</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">Sign-ups</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Password</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-t border-foam/70 bg-white hover:bg-mist/40">
                    <td className="px-4 py-3 font-semibold text-deep">
                      {m.firstName} {m.lastName}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <a href={`mailto:${m.email}`} className="block text-brand hover:underline">
                        {m.email}
                      </a>
                      {m.phone && <span className="block text-tide">{m.phone}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {m.instagram ? (
                        <a
                          href={instagramUrl(m.instagram) ?? '#'}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-brand hover:underline"
                        >
                          {normalizeInstagram(m.instagram)}
                        </a>
                      ) : (
                        <span className="text-tide/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-tide">
                      {m.gender ? GENDERS[m.gender] : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-deep">{m.signupCount}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-tide">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {m.role === 'admin' ? (
                        <span className="chip bg-brand text-white">Admin</span>
                      ) : (
                        <span className="chip bg-mist text-tide">Member</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ResetLinkButton
                        email={m.email}
                        name={`${m.firstName} ${m.lastName}`.trim()}
                        isSelf={m.id === admin.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="rounded-2xl border border-foam bg-mist/40 p-4 text-xs leading-relaxed text-tide">
        <strong className="text-deep">Resetting a password:</strong> press{' '}
        <strong className="text-deep">Reset password</strong> on their row and send them the link
        that appears — WhatsApp, Instagram, however you already talk to them. Opening it lets them
        choose a new password without needing the old one, and signs them out everywhere else. The
        link works once and expires after an hour; generating a new one retires the previous link.
        Check you are talking to the right person before you send it — the link is the only thing
        standing between someone and that account.
      </p>

      <p className="rounded-2xl border border-foam bg-mist/40 p-4 text-xs leading-relaxed text-tide">
        <strong className="text-deep">Making someone an admin:</strong> add their email to the{' '}
        <code className="rounded bg-white px-1.5 py-0.5">ADMIN_EMAILS</code> environment variable in
        Vercel (comma-separated) before they sign up, or promote an existing account by running{' '}
        <code className="rounded bg-white px-1.5 py-0.5">
          UPDATE users SET role = &apos;admin&apos; WHERE email = &apos;…&apos;;
        </code>{' '}
        in the Neon SQL editor.
      </p>
    </div>
  )
}
