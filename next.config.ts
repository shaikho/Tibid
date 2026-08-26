import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Don't write AGENTS.md / CLAUDE.md into the repo on `next dev`.
  agentRules: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    // Keeps server actions safe behind the deployment origin.
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
}

export default nextConfig
