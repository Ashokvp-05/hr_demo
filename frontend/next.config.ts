import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Output ──────────────────────────────────────────────────────────────────
  output: 'standalone', // Required for Docker — copies only necessary files
  compress: true,       // Gzip compression at Next.js level

  // ── Images ──────────────────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'], // avif first — better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 3600,   // Cache optimized images for 1 hour (was 60s)
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },

  // ── Production Flags ─────────────────────────────────────────────────────────
  reactStrictMode: true,
  poweredByHeader: false,  // Don't leak "X-Powered-By: Next.js"
  devIndicators: false,

  // ── Compiler ─────────────────────────────────────────────────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Strip console.* in prod build
  },

  // ── Tree-shaking: only import used components from large packages ─────────────
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      '@radix-ui/react-icons',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'date-fns',
      'recharts',
      'clsx',
      'tailwind-merge',
      'zod',
    ],
  },

  skipProxyUrlNormalize: true,
  skipTrailingSlashRedirect: true,

  // ── HTTP Response Headers ────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Aggressive caching for immutable static assets (_next/static is content-hashed)
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Public assets (icons, images)
        source: '/:path*.(png|jpg|jpeg|webp|avif|svg|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' },
        ],
      },
      {
        // Security headers on ALL routes
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control',    value: 'on' },
        ],
      },
    ];
  },

  // ── API Proxy Rewrites ────────────────────────────────────────────────────────
  async rewrites() {
    // NOTE: rewrites() is compiled at BUILD TIME in Next.js standalone mode.
    // INTERNAL_BACKEND_URL is set at runtime by docker-compose, but NOT available
    // at build time. So we default to 'http://backend:4000' (Docker internal DNS).
    // Local dev: .env.local sets INTERNAL_BACKEND_URL=http://localhost:4000 ✅
    // Docker:    falls back to http://backend:4000 ✅
    const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://backend:4000';
    return {
      beforeFiles: [
        {
          source: '/ws',
          destination: `${backendUrl}/ws`,
        },
        {
          source: '/api/auth/request-otp',
          destination: `${backendUrl}/api/auth/request-otp`,
        },
        {
          source: '/api/auth/verify-otp',
          destination: `${backendUrl}/api/auth/verify-otp`,
        },
        {
          source: '/api/auth/request-access',
          destination: `${backendUrl}/api/auth/request-access`,
        },
        {
          source: '/api/auth/update-role',
          destination: `${backendUrl}/api/auth/update-role`,
        },
      ],
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
// Cache invalidated
