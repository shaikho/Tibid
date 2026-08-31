import { SITE } from '@/lib/constants'

/**
 * The password-reset email.
 *
 * Written as a table-based HTML document on purpose. Email clients are not
 * browsers: Outlook renders with Word's engine, Gmail strips <style> blocks in
 * some contexts, and flexbox and grid are unreliable across all of them. Tables
 * with inline styles are the format that actually arrives looking right.
 *
 * Every message also carries a plain-text part. It is what plain-text readers
 * and screen readers get, and a message with no text part is scored as spam by
 * most filters — which matters here more than usual, since TIBID sends from a
 * free webmail address that cannot be DKIM-signed.
 */

const BRAND = '#006BD4'
const DEEP = '#02101F'
const TIDE = '#5A7183'

export function passwordResetEmail({
  firstName,
  resetUrl,
  expiresInMinutes,
}: {
  firstName: string
  resetUrl: string
  expiresInMinutes: number
}): { subject: string; html: string; text: string } {
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi,'
  const url = escapeHtml(resetUrl)

  const subject = `Reset your ${SITE.shortName} password`

  const text = [
    firstName ? `Hi ${firstName},` : 'Hi,',
    '',
    `Someone asked to reset the password for your ${SITE.name} account.`,
    'Open this link to choose a new one:',
    '',
    resetUrl,
    '',
    `The link works once and expires in ${expiresInMinutes} minutes.`,
    '',
    'If this was not you, you can ignore this email — nothing has changed and',
    'your current password still works.',
    '',
    `— ${SITE.name}`,
    SITE.url,
  ].join('\n')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F2F6FA;">
<!-- Shown in the inbox list under the subject, so the first thing people read is not a raw URL. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Choose a new password — this link expires in ${expiresInMinutes} minutes.</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F2F6FA;">
  <tr>
    <td align="center" style="padding:32px 16px;">

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;overflow:hidden;">

        <tr>
          <td style="background:${BRAND};padding:28px 32px;">
            <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:20px;font-weight:bold;letter-spacing:0.14em;color:#FFFFFF;">${escapeHtml(SITE.shortName)}</p>
            <p style="margin:6px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#D7EAFF;">${escapeHtml(SITE.tagline)}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:${DEEP};">${greeting}</p>

            <p style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:${TIDE};">
              Someone asked to reset the password for your ${escapeHtml(SITE.name)} account. Choose a new one here:
            </p>

            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
              <tr>
                <td style="border-radius:999px;background:${BRAND};">
                  <a href="${url}" style="display:inline-block;padding:14px 32px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:999px;">Choose a new password</a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:${TIDE};">
              The link works once and expires in ${expiresInMinutes} minutes. If the button does not work, copy this into your browser:<br>
              <a href="${url}" style="color:${BRAND};word-break:break-all;">${url}</a>
            </p>

            <hr style="border:none;border-top:1px solid #E3EBF2;margin:0 0 20px;">

            <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:${TIDE};">
              If this was not you, ignore this email. Nothing has changed and your current password still works.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid #E3EBF2;">
            <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${TIDE};">
              ${escapeHtml(SITE.name)} · ${escapeHtml(SITE.region)}<br>
              <a href="${escapeHtml(SITE.url)}" style="color:${BRAND};text-decoration:none;">${escapeHtml(SITE.url.replace(/^https?:\/\//, ''))}</a>
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>`

  return { subject, html, text }
}

/**
 * The name comes from a member's profile and the URL contains a token, so both
 * are escaped before they go anywhere near the markup.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
