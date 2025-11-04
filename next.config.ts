import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination:
          "https://smarthome-bnauatedb7bucncy.eastasia-01.azurewebsites.net/api/:path*",
      },
    ];
  },
  // Disable SSL verification for development
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
