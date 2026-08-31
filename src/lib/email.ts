import 'server-only'

/**
 * Sending email, without committing the site to one provider.
 *
 * Everything that wants to send an email calls `sendMail`. Which service
 * actually delivers it is decided here, from environment variables, so
 * switching provider later is a dashboard change and one new function in this
 * file — not a change anywhere else in the app.
 *
 * Providers are plain `fetch` calls against documented HTTP APIs. No SDK, no
 * dependency, nothing to keep up to date, and it works on any runtime.
 *
 * Order of preference when several are configured: Brevo, then Resend. With
 * none configured the console driver takes over, which prints the message
 * instead of sending it — so the whole password-reset flow can be developed and
 * tested locally without an email account anywhere.
 */

export type Mail = {
  to: string
  toName?: string
  subject: string
  html: string
  /** Always provide one. A message with no plain-text part scores as spam. */
  text: string
}

export type SendResult = { ok: true; provider: string } | { ok: false; error: string }

export type ProviderName = 'brevo' | 'resend' | 'console'

/* -------------------------------------------------------------------------- */
/*  Configuration                                                              */
/* -------------------------------------------------------------------------- */

export function emailFrom(): { address: string; name: string } {
  return {
    address: process.env.EMAIL_FROM?.trim() || 'no-reply@tibid.local',
    name: process.env.EMAIL_FROM_NAME?.trim() || 'TIBID Community',
  }
}

/** Which provider a send would use right now. Also drives the admin status panel. */
export function activeProvider(): ProviderName {
  if (process.env.BREVO_API_KEY) return 'brevo'
  if (process.env.RESEND_API_KEY) return 'resend'
  return 'console'
}

/**
 * Whether a member who asks for an email will actually end up with one.
 *
 * A real provider always counts. The console driver counts in two other cases,
 * because in both of them somebody is deliberately watching where the message
 * goes: outside production, where it is printed to the terminal a developer is
 * already reading, and whenever `EMAIL_OUTBOX_DIR` is set, which is an explicit
 * "capture messages to disk instead of sending them" — the seam the end-to-end
 * tests read the reset link through.
 *
 * False therefore means exactly one thing: this is production, nobody
 * configured a provider, and a member asking for a reset link would wait
 * forever. That is worth saying out loud rather than pretending.
 */
export function emailConfigured(): boolean {
  if (activeProvider() !== 'console') return true
  if (process.env.EMAIL_OUTBOX_DIR) return true
  return process.env.NODE_ENV !== 'production'
}

/* -------------------------------------------------------------------------- */
/*  Providers                                                                  */
/* -------------------------------------------------------------------------- */

/** Brevo: https://developers.brevo.com/reference/sendtransacemail */
async function sendViaBrevo(mail: Mail, signal: AbortSignal): Promise<SendResult> {
  const from = emailFrom()
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    signal,
    headers: {
      'api-key': process.env.BREVO_API_KEY as string,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: from.address, name: from.name },
      to: [{ email: mail.to, ...(mail.toName ? { name: mail.toName } : {}) }],
      subject: mail.subject,
      htmlContent: mail.html,
      textContent: mail.text,
    }),
  })

  if (response.ok) return { ok: true, provider: 'brevo' }
  return { ok: false, error: await describeFailure(response) }
}

/** Resend: https://resend.com/docs/api-reference/emails/send-email */
async function sendViaResend(mail: Mail, signal: AbortSignal): Promise<SendResult> {
  const from = emailFrom()
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal,
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY as string}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: `${from.name} <${from.address}>`,
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  })

  if (response.ok) return { ok: true, provider: 'resend' }
  return { ok: false, error: await describeFailure(response) }
}

/**
 * No provider configured. Prints the message so a developer can follow the link
 * straight out of the terminal.
 *
 * `EMAIL_OUTBOX_DIR` additionally writes each message to a file, which is how
 * the end-to-end tests read the reset link without a mail account. It is opt-in
 * and best-effort: a serverless filesystem is read-only, and a message that
 * could not be filed is still a message that was "sent".
 */
async function sendViaConsole(mail: Mail): Promise<SendResult> {
  console.log(
    ['', '─── email (no provider configured, not sent) ───', `to:      ${mail.to}`, `subject: ${mail.subject}`, '', mail.text, '───────────────────────────────────────────────', ''].join(
      '\n',
    ),
  )

  const dir = process.env.EMAIL_OUTBOX_DIR
  if (dir) {
    try {
      const { mkdir, writeFile } = await import('node:fs/promises')
      const { join } = await import('node:path')
      await mkdir(dir, { recursive: true })
      await writeFile(
        join(dir, `${Date.now()}-${Math.random().toString(16).slice(2)}.json`),
        JSON.stringify({ ...mail, sentAt: new Date().toISOString() }, null, 2),
      )
    } catch {
      // Best effort only.
    }
  }

  return { ok: true, provider: 'console' }
}

/* -------------------------------------------------------------------------- */

/**
 * Turns a failed API response into something an admin can act on, without
 * letting a provider's error body run to hundreds of lines in a log.
 */
async function describeFailure(response: Response): Promise<string> {
  let detail = ''
  try {
    const body = await response.text()
    const parsed: unknown = body ? JSON.parse(body) : null
    detail =
      parsed && typeof parsed === 'object'
        ? String(
            (parsed as { message?: unknown; error?: unknown }).message ??
              (parsed as { error?: unknown }).error ??
              body,
          )
        : body
  } catch {
    detail = ''
  }
  return `${response.status} ${response.statusText}${detail ? ` — ${detail.slice(0, 300)}` : ''}`
}

/**
 * Sends one message. Never throws.
 *
 * Callers are usually in the middle of something more important than the email
 * — a password reset, a registration — and a provider outage must not turn into
 * a 500 for the member. The result says what happened; deciding what the member
 * sees is the caller's job.
 */
export async function sendMail(mail: Mail): Promise<SendResult> {
  const provider = activeProvider()

  // A hung provider must not hold a serverless function open to its timeout.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    switch (provider) {
      case 'brevo':
        return await sendViaBrevo(mail, controller.signal)
      case 'resend':
        return await sendViaResend(mail, controller.signal)
      default:
        return await sendViaConsole(mail)
    }
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'the email provider did not respond within 10 seconds'
        : error instanceof Error
          ? error.message
          : String(error)
    return { ok: false, error: message }
  } finally {
    clearTimeout(timeout)
  }
}
