import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },

  devIndicators: {
    allowedDevOrigins: [
      'https://9004-firebase-studio-1749695125322.cluster-hf4yr35cmnbd4vhbxvfvc6cp5q.cloudworkstations.dev',
    ],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        dns: false,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;