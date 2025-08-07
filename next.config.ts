import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist']
};

const sentryOptions = {
  org: 'senexus-group',
  project: 'senexus-multiapp',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true
  },
  tunnelRoute: '/monitoring',
  disableLogger: true,
  telemetry: false,
  automaticVercelMonitors: true
};

const nextConfig = withSentryConfig(baseConfig, sentryOptions);

export default nextConfig;
