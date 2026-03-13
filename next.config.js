/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.020417.xyz"
      }
    ]
  }
};

module.exports = nextConfig;
