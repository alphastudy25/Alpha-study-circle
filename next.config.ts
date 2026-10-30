import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok tunnels (and any other external dev tunnels) to access the
  // Next.js HMR websocket and dev resources without being blocked by the
  // cross-origin dev protection introduced in Next.js 15.
  // Add your ngrok subdomain here if it changes. Wildcards are supported.
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.ngrok.app",
  ],
};

export default nextConfig;
