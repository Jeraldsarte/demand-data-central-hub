import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.8'],
  // Tell Next.js to leave Google APIs alone
  serverExternalPackages: ['googleapis']
};

export default nextConfig;