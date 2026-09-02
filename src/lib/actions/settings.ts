'use server'

import { revalidatePath } from 'next/cache'

import { requireAdmin } from '@/lib/auth'
import {
  SETTING_KEYS,
  deleteSetting,
  formatWhatsapp,
  normalizeWhatsapp,
  putSetting,
  whatsappLink,
} from '@/lib/settings'

export type SupportContactState = {
  ok?: boolean
  message?: string
  error?: string
  /** Echoed back so the panel can show exactly where members will be sent. */
  preview?: { pretty: string; href: string } | null
}

/**
 * Saves who a locked-out member should message.
 *
 * Clearing the number is a supported outcome, not an error: if nobody is
 * covering WhatsApp this week, the button should fall back to Instagram rather
 * than point at a phone nobody is reading.
 */
export async function saveSupportContactAction(
  _prev: SupportContactState,
  formData: FormData,
): Promise<SupportContactState> {
  const admin = await requireAdmin()

  const rawNumber = String(formData.get('whatsapp') ?? '').trim()
  const name = String(formData.get('name') ?? '')
    .trim()
    .slice(0, 60)

  if (!rawNumber) {
    await deleteSetting(SETTING_KEYS.supportWhatsapp)
    if (name) await putSetting(SETTING_KEYS.supportName, name, admin.id)
    else await deleteSetting(SETTING_KEYS.supportName)

    revalidatePath('/login')
    revalidatePath('/admin/settings')
    return {
      ok: true,
      message: 'WhatsApp contact cleared — members will be pointed at Instagram instead.',
      preview: null,
    }
  }

  const parsed = normalizeWhatsapp(rawNumber)
  if ('error' in parsed) return { error: parsed.error }

  await putSetting(SETTING_KEYS.supportWhatsapp, parsed.digits, admin.id)
  if (name) await putSetting(SETTING_KEYS.supportName, name, admin.id)
  else await deleteSetting(SETTING_KEYS.supportName)

  // The login page reads this, and it is statically cached between requests.
  revalidatePath('/login')
  revalidatePath('/admin/settings')

  return {
    ok: true,
    message: 'Saved. The "forgot password" button now opens WhatsApp.',
    preview: { pretty: formatWhatsapp(parsed.digits), href: whatsappLink(parsed.digits) },
  }
}
