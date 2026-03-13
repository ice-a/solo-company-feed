/** @type {import('next').NextConfig} */
const nextConfig = {
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
