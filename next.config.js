/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // We need this to make sure 3D libraries work
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'], 
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig