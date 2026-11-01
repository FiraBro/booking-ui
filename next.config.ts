import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.137.250", "10.42.0.220"],
};

export default nextConfig;
