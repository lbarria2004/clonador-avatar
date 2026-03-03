import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Descomentar "output: standalone" solo para deployments self-hosted/Docker
  // Para Vercel, dejar comentado ya que Vercel maneja el build automáticamente
  // output: "standalone",
  
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Configuración para Vercel
  experimental: {
    // Optimizaciones para serverless
    serverComponentsExternalPackages: [],
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
