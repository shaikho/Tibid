import { GalleryManager } from '@/components/admin/gallery-manager'
import { blobConfigured } from '@/lib/blob'
import { getGallery } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function AdminGalleryPage() {
  const items = await getGallery(200).catch(() => [])
  const blobReady = blobConfigured()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-lg font-bold text-deep">Moments</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-tide">
          The photo strip on the home page. Upload straight from your phone or laptop, or paste a
          link to something already online. Drag order with the arrows — the first photo is the one
          people see first.
        </p>
      </div>

      <GalleryManager items={items} blobReady={blobReady} />
    </div>
  )
}
