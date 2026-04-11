/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'images.unsplash.com', 'api.dicebear.com'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
