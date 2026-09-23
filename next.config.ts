import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Deliberately narrow: only the Cloudinary *cloud name* is forwarded to
  // the client bundle here — never CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.
  // The cloud name is a public identifier (Cloudinary's own docs put it
  // directly in asset URLs and widget config), unlike the key/secret pair,
  // which stay server-only and are only ever read by
  // scripts/setup-cloudinary.ts. See src/lib/cloudinary/builder-plugin.tsx
  // for where this reaches the browser (the Cloudinary Upload Widget
  // config) and .env.example for the full safe-to-expose explanation.
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  },
};

export default nextConfig;
