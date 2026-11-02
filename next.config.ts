import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.137.250", "192.168.137.69", "10.42.0.220"],
};

export default nextConfig;
